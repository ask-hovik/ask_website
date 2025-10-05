// src/hikes.ts
import "./style.css";

type HikeIndexItem = {
  title: string;         // from metadata or trk.name
  file: string;          // e.g. "rjukan.gpx"
  url: string;           // e.g. "/hikes/rjukan.gpx" (kept for reference)
  distance_km: number;   // e.g. 12.34
  max_ele_m?: number;    // NEW: highest point (m)
  total_time_s?: number; // include ONLY if > 0
  // ascent_m?: number;   // (no longer used in UI)
  // descent_m?: number;  // (no longer used in UI)
};

const app = document.querySelector<HTMLDivElement>("#app")!;
const BASE_URL = import.meta.env.BASE_URL ?? "/";
const BASE_AS_URL = new URL(BASE_URL, window.location.origin);
const resolveAsset = (p: string) => new URL(p, BASE_AS_URL).toString();

const INDEX_URL = resolveAsset("hikes/index.json");

// ---------- GPX Studio link (raw GitHub avoids CORS headaches) ----------
const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/ask-hovik/ask_website/main/public/hikes/";

function gpxStudioUrlForFile(file: string) {
  const rawUrl = `${GITHUB_RAW_BASE}${file}`;
  const filesParam = encodeURIComponent(JSON.stringify([rawUrl]));
  return `https://gpx.studio/app?files=${filesParam}`;
}
// -----------------------------------------------------------------------

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
  const v = km < 10 ? km.toFixed(2) : km.toFixed(1);
  return `${Number(v)} km`;
}

function fmtMaxEle(m?: number) {
  return m != null ? `max ${m} m` : "";
}

function fmtDuration(totalSec?: number) {
  if (!totalSec || totalSec <= 0) return "";
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  if (h === 0) return `${m} min`;
  const mm = m.toString().padStart(2, "0");
  return `${h} h ${mm} min`;
}

function renderList(items: HikeIndexItem[]) {
  const listHtml = items.map((it) => {
    const studio = gpxStudioUrlForFile(it.file);
    const bits = [
      fmtDistance(it.distance_km),
      fmtMaxEle(it.max_ele_m),
      ...(it.total_time_s ? [fmtDuration(it.total_time_s)] : []),
    ].filter(Boolean);
    const subtitle = bits.join(" · ");

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
    <p>
    A collection of hikes I have enjoyed throughout the years.
    </p>
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

    // sanity filter: require title, file, and distance
    const clean = data.filter(d =>
      typeof d.title === "string" &&
      typeof d.file === "string" &&
      Number.isFinite(d.distance_km)
    );

    renderList(clean);
  } catch (e) {
    app.innerHTML = `<div class="card"><strong>Failed to load hikes.</strong><br><span class="muted">${String(e)}</span></div>`;
  }
}

boot();
