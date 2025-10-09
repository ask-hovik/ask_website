import "./style.css";

type RecipeIndexItem = {
  slug: string;
  title: string;
  time_minutes: number;
  serves: number;
  tags: string[];
};

type Ingredient = { item: string; amount: number; unit: string };

type RecipeFull = {
  title: string;
  time_minutes: number;
  serves: number;
  ingredients: Ingredient[];
  steps: string;          // newline-separated text
  tags: string[];
};

const app = document.querySelector<HTMLDivElement>("#app")!;
const BASE_URL = import.meta.env.BASE_URL ?? "/";
const BASE_AS_URL = new URL(BASE_URL, window.location.origin);

const resolveRecipeAsset = (path: string) => new URL(path, BASE_AS_URL).toString();
const INDEX_URL = resolveRecipeAsset("recipes/index.json");

let index: RecipeIndexItem[] = [];
let activeTags: Set<string> = new Set();

// --- UI builders ---
function renderList() {
  const uniqueTags = Array.from(new Set(index.flatMap(r => r.tags))).sort();

  // Tag filter toolbar
  const tagChips = uniqueTags.map(tag => {
    const active = activeTags.has(tag);
    return `<button class="chip ${active ? "chip--active" : ""}" data-tag="${tag}">${tag}</button>`;
  }).join("");

  // Apply filter
  const filtered = [...index].filter(r =>
    activeTags.size === 0 || Array.from(activeTags).every(t => r.tags.includes(t))
  );

  // List of recipes
  const items = filtered.map(r => {
    return `
      <li>
        <a class="recipe-link" href="#/${r.slug}">${r.title}</a>
        <div class="muted small">
          ~${r.time_minutes} min · serves ${r.serves} · ${r.tags.join(", ")}
        </div>
      </li>`;
  }).join("");

  app.innerHTML = `
    <h1>Recipes</h1>
    <div class="card" style="margin: 0.8rem 0 1rem;">
      <strong>Filter by tags:</strong>
      <div class="chip-row" style="margin-top: .5rem;">${tagChips || "<span class='muted'>No tags yet</span>"}</div>
      ${activeTags.size > 0 ? `<div style="margin-top:.5rem"><button class="btn btn--small" id="clear-tags">Clear filters</button></div>` : ""}
    </div>
    <ul class="recipe-list">
      ${items || "<li class='muted'>No recipes match the selected tags.</li>"}
    </ul>
  `;

  // Wire up tag toggles
  app.querySelectorAll<HTMLButtonElement>(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag!;
      if (activeTags.has(tag)) activeTags.delete(tag);
      else activeTags.add(tag);
      renderList();
    });
  });

  // Clear filters
  const clear = app.querySelector<HTMLButtonElement>("#clear-tags");
  if (clear) clear.addEventListener("click", () => { activeTags.clear(); renderList(); });
}

function formatSteps(text: string) {
  // allow <a href='#/...'> links while escaping everything else
  return text
    .split(/\n+/)
    .map(p => `<p>${escapeHtml(p).replace(/&lt;a href=&#39;(#[^&#]+)&#39;&gt;(.*?)&lt;\/a&gt;/g, "<a href='$1'>$2</a>")}</p>`)
    .join("");
}


function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]!));
}

async function renderDetail(slug: string) {
    const url = `${BASE_URL}recipes/${slug}.json`;
  let data: RecipeFull;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    data = await res.json();
  } catch (e) {
    app.innerHTML = `
      <a href="#" class="btn recipe-back">← All recipes</a>
      <div class="card"><strong>Could not load recipe.</strong><br><span class="muted">${String(e)}</span></div>`;
    wireBackLink();
    return;
  }

  const ingRows = data.ingredients.map(i => `
      <tr><td>${i.item}</td><td>${i.amount}</td><td>${i.unit}</td></tr>
  `).join("");

  app.innerHTML = `
    <a href="#" class="btn recipe-back">← All recipes</a>

    <h1>${escapeHtml(data.title)}</h1>
    <div class="muted small">~${data.time_minutes} min · serves ${data.serves} · ${data.tags.map(escapeHtml).join(", ")}</div>

    <div class="card" style="margin-top: 1rem;">
      <h3>Ingredients</h3>
      <table>
        <thead><tr><th>Item</th><th>Amount</th><th>Unit</th></tr></thead>
        <tbody>${ingRows}</tbody>
      </table>
    </div>

    <div class="card" style="margin-top: 1rem;">
      <h3>Method</h3>
      ${formatSteps(data.steps)}
    </div>
  `;

  wireBackLink();
}

function wireBackLink() {
  const back = app.querySelector<HTMLAnchorElement>('a[href="#"]');
  if (back) back.addEventListener("click", (e) => {
    e.preventDefault();
    location.hash = "";
  });
}

// --- Routing ---
function handleRoute() {
  const m = location.hash.match(/^#\/([^#/?]+)/);
  if (m) {
    const slug = decodeURIComponent(m[1]);
    renderDetail(slug);
  } else {
    renderList();
  }
}

// --- Boot ---
async function boot() {
  try {
    const res = await fetch(INDEX_URL);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    index = await res.json();
  } catch (e) {
    app.innerHTML = `<div class="card"><strong>Failed to load recipe index.</strong><br><span class="muted">${String(e)}</span></div>`;
    return;
  }

  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}

boot();
