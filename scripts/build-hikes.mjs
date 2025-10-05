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

// --- utils ---
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  // Normalize common GPX arrays
  isArray: (name, jpath) => {
    return ["gpx.trk", "gpx.rte", "gpx.wpt", "trk.trkseg", "trkseg.trkpt", "rte.rtept"]
      .includes(jpath.replace(/\[\d+\]/g, ""));
  },
});

function toArray(v) {
  return Array.isArray(v) ? v : (v == null ? [] : [v]);
}

function haversineMeters(lat1, lon1, lat2, lon2) {
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
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t; // ms since epoch
}

function summarizeTrackPoints(allPts) {
  // allPts: [{lat, lon, ele?, timeMs?}, ...] across all segments in order
  let totalDistM = 0;
  let firstTime = null;
  let lastTime = null;

  // Track max elevation (rounded at the end)
  let maxEle = -Infinity;

  for (let i = 0; i < allPts.length; i++) {
    const p = allPts[i];
    if (typeof p.ele === "number" && p.ele > maxEle) maxEle = p.ele;

    if (i > 0) {
      const p0 = allPts[i - 1];
      const p1 = p;
      totalDistM += haversineMeters(p0.lat, p0.lon, p1.lat, p1.lon);
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
  };

  if (Number.isFinite(maxEle)) {
    result.max_ele_m = Math.round(maxEle);
  }

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
          typeof eleRaw === "number" ? eleRaw :
          eleRaw != null ? Number(eleRaw) : undefined;

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
      if (pts.length === 0) {
        console.warn(`⚠️ No track points in ${file} — skipping distance/alt/time.`);
      }
      const stats = summarizeTrackPoints(pts);

      const entry = {
        title: name,
        file,
        url: `/hikes/${file}`,
        distance_km: stats.distance_km ?? 0,
        ...(stats.max_ele_m != null ? { max_ele_m: stats.max_ele_m } : {}),
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
