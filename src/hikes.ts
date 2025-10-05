// src/hikes.ts
import "./style.css";

type HikeIndexItem = {
  title: string;         // from metadata or trk.name
  file: string;          // e.g. "rjukan.gpx"
  url: string;           // e.g. "/hikes/rjukan.gpx" (not used for GPX Studio, but kept)
  distance_km: number;   // e.g. 12.34
  ascent_m: number;      // total ascent (m)
  descent_m: number;     // total descent (m)
  total_time_s?: number; // include ONLY if > 0
};

const app = document.querySelector<HTMLDivElement>("#app")!;
const BASE_URL = import.meta.env.BASE_URL ?? "/";
const BASE_AS_URL = new URL(BASE_URL, window.location.origin);
const resolveAsset = (p: string) => new URL(p, BASE_AS_URL).toString();

// Load the generated index.json
const INDEX_URL = resolveAsset("hikes/index.json");

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]!));
}

function fmtDistance(km: number) {
  // 2 decimals under 10 km, 1 decimal otherwise
  const v = km < 10 ? km.toFixed(2) : km.toFixed(1);
  return `${Number(v)} km`;
}

function fmtElev(ascent: number, descent: number) {
  return `+${ascent} m / -${descent} m`;
}

function fmtDuration(totalSec?: number) {
  if (!totalSec || totalSec <= 0) return "";
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  if (h === 0) return `${m} min`;
  const mm = m.toString().padStart(2, "0");
  return `${h} h ${mm} min`;
}

/**
 * Build a GPX Studio link using the working format:
 * https://gpx.studio/app?files=[ "ABSOLUTE_HTTPS_GPX_URL" ]
 * We use the raw GitHub host since it has CORS enabled.
 */
const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/ask-hovik/ask_website/main/public/hikes/";

function gpxStudioUrlForFile(file: string) {
  const rawUrl = `${GITHUB_RAW_BASE}${file}`;
  const filesParam = encodeURIComponent(JSON.stringify([rawUrl]));
  return `https://gpx.studio/app?files=${filesParam}`;
}

function renderList(items: HikeIndexItem[]) {
  const listHtml = items.map((it) => {
    const studio = gpxStudioUrlForFile(it.file);
    const subtitleParts = [
      fmtDistance(it.distance_km),
      fmtElev(it.ascent_m, it.descent_m),
      ...(it.total_time_s ? [fmtDuration(it.total_time_s)] : []),
    ];
    const subtitle = subtitleParts.join(" · ");

    return `
      <li>
        <a class="recipe-link" href="${studio}" target="_blank" rel="noopener">
          ${escapeHtml(it.title)}
        </a>
        <div class="muted small">${subtitle}</div>
      </li>
    `;
  }).join("");

  app.innerHTML = `
    <h1>Hikes</h1>
    <p class="muted">Click a hike to open it in GPX Studio.</p>
    <ul class="recipe-list">
      ${listHtml || "<li class='muted'>No hikes found.</li>"}
    </ul>
  `;
}

async function boot() {
  try {
    const res = await fetch(INDEX_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = (await res.json()) as HikeIndexItem[];
    const clean = data.filter(d =>
      typeof d.title === "string" &&
      typeof d.file === "string" &&
      Number.isFinite(d.distance_km) &&
      Number.isFinite(d.ascent_m) &&
      Number.isFinite(d.descent_m)
    );
    renderList(clean);
  } catch (e) {
    app.innerHTML = `<div class="card"><strong>Failed to load hikes.</strong><br><span class="muted">${String(e)}</span></div>`;
  }
}

boot();
