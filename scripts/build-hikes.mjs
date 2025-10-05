// scripts/build-hikes.mjs
// Build an index for GPX hikes in public/hikes -> public/hikes/index.json
// Usage: node scripts/build-hikes.mjs
// Requires: npm i -D fast-xml-parser

import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

// --- config ---
const HIKES_DIR = path.resolve("public", "hikes");
const OUT_FILE = path.join(HIKES_DIR, "index.json");
// Ignore tiny vertical noise (in meters) when summing ascent/descent:
const ELEV_THRESHOLD_M = 1.0;

// --- utils ---
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  // GPX often repeats elements that should be arrays; this helps normalize:
  isArray: (name, jpath, isLeafNode, isAttribute) => {
    // Treat these as arrays regardless:
    return ["gpx.trk", "gpx.rte", "gpx.wpt", "trk.trkseg", "trkseg.trkpt", "rte.rtept"].includes(
      jpath.replace(/\[\d+\]/g, "")
    );
  },
});

function toArray(v) {
  return Array.isArray(v) ? v : (v == null ? [] : [v]);
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  // All args as numbers (degrees)
  const R = 6371000; // meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseTimeISO(s) {
  // Some exporters use Z, some use timezone offsets; Date can parse ISO 8601.
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t; // ms since epoch
}

function summarizeTrackPoints(allPts) {
  // allPts: [{lat, lon, ele?, timeMs?}, ...] across all segments in time order
  let totalDistM = 0;
  let ascentM = 0;
  let descentM = 0;

  let firstTime = null;
  let lastTime = null;

  for (let i = 1; i < allPts.length; i++) {
    const p0 = allPts[i - 1];
    const p1 = allPts[i];

    // distance
    totalDistM += haversineMeters(p0.lat, p0.lon, p1.lat, p1.lon);

    // elevation gain/drop (with small threshold to suppress noise)
    if (typeof p0.ele === "number" && typeof p1.ele === "number") {
      const dz = p1.ele - p0.ele;
      if (dz >= ELEV_THRESHOLD_M) ascentM += dz;
      else if (dz <= -ELEV_THRESHOLD_M) descentM += -dz;
    }
  }

  // elapsed time (from earliest to latest timestamp where present)
  const times = allPts.map((p) => p.timeMs).filter((t) => typeof t === "number");
  if (times.length > 0) {
    firstTime = Math.min(...times);
    lastTime = Math.max(...times);
  }

  const result = {
    distance_km: +(totalDistM / 1000).toFixed(2),
    ascent_m: Math.round(ascentM),
    descent_m: Math.round(descentM),
  };

  if (firstTime != null && lastTime != null) {
    const elapsedS = Math.max(0, Math.round((lastTime - firstTime) / 1000));
    if (elapsedS > 0) result.total_time_s = elapsedS; // include ONLY if non-zero
  }

  return result;
}

function extractName(g) {
  // Priority: metadata.name -> first trk.name -> filename fallback handled by caller
  const metaName = g?.gpx?.metadata?.name;
  if (typeof metaName === "string" && metaName.trim()) return metaName.trim();

  const trks = toArray(g?.gpx?.trk);
  for (const trk of trks) {
    const n = trk?.name;
    if (typeof n === "string" && n.trim()) return n.trim();
  }
  return null;
}

function collectTrackPoints(g) {
  // Gather all trk -> trkseg -> trkpt points, preserving per-segment order.
  const trks = toArray(g?.gpx?.trk);
  const pts = [];

  for (const trk of trks) {
    const segs = toArray(trk?.trkseg);
    for (const seg of segs) {
      const segPts = toArray(seg?.trkpt);
      for (const p of segPts) {
        const lat = Number(p?.lat);
        const lon = Number(p?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

        const eleRaw = p?.ele;
        const ele =
          typeof eleRaw === "number"
            ? eleRaw
            : eleRaw != null
            ? Number(eleRaw)
            : undefined;
        const timeMs = p?.time ? parseTimeISO(p.time) : undefined;

        pts.push({
          lat,
          lon,
          ele: Number.isFinite(ele) ? ele : undefined,
          timeMs: typeof timeMs === "number" ? timeMs : undefined,
        });
      }
    }
  }

  return pts;
}

function readGpxFile(filePath) {
  const xml = fs.readFileSync(filePath, "utf8");
  return parser.parse(xml);
}

function buildIndex() {
  if (!fs.existsSync(HIKES_DIR)) {
    console.error(`❌ Hikes folder not found: ${HIKES_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(HIKES_DIR)
    .filter((f) => f.toLowerCase().endsWith(".gpx"))
    .sort((a, b) => a.localeCompare(b));

  const items = [];

  for (const file of files) {
    const abs = path.join(HIKES_DIR, file);
    try {
      const g = readGpxFile(abs);
      const name =
        extractName(g) ||
        path.basename(file, path.extname(file)).replace(/[_-]+/g, " ");

      const pts = collectTrackPoints(g);
      const stats = summarizeTrackPoints(pts);

      const entry = {
        title: name,
        file,
        url: `/hikes/${file}`,
        distance_km: stats.distance_km,
        ascent_m: stats.ascent_m,
        descent_m: stats.descent_m,
        // Only include total_time_s if present (non-zero)
        ...(stats.total_time_s ? { total_time_s: stats.total_time_s } : {}),
      };

      items.push(entry);
    } catch (err) {
      console.error(`⚠️ Failed to process ${file}:`, err.message);
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 2) + "\n", "utf8");
  console.log(`✅ Wrote ${OUT_FILE} with ${items.length} hikes.`);
}

buildIndex();
