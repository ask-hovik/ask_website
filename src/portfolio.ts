// src/portfolio.ts

type ArtItem = {
  src: string;           // image URL (put images under /public/portfolio/…)
  caption?: string;      // optional caption
};

// TODO: Replace with your images (or fetch from /portfolio/index.json if you prefer)
const IMAGES: ArtItem[] = [
  { src: "/portfolio/01.jpg", caption: "test" },
  { src: "/portfolio/02.jpg", caption: "ye" },
  { src: "/portfolio/03.jpeg", caption: "thing" },
];

/* ------------------ Utilities: seeded PRNG by string ------------------ */
function hash32(s: string): number {
  // xorshift-like simple hash for determinism
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rngFromSeed(seed: number) {
  let x = seed || 123456789;
  return () => {
    // xorshift32
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    // convert to [0,1)
    return ((x >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
  };
}
function randRange(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}

/* ------------------ DOM + layout ------------------ */
const wall = document.getElementById("wall") as HTMLDivElement;
const lightbox = document.getElementById("lightbox") as HTMLDivElement;
const lbImg = lightbox.querySelector<HTMLImageElement>(".lb-image")!;
const lbCaption = lightbox.querySelector<HTMLDivElement>(".lb-caption")!;
const lbClose = lightbox.querySelector<HTMLButtonElement>(".lb-close")!;

let cards: HTMLDivElement[] = [];
let sizes: { w: number; h: number }[] = []; // actual rendered sizes per card
let resizeObserver: ResizeObserver | null = null;

function createCard(item: ArtItem): HTMLDivElement {
  const seed = hash32(item.src);
  const rng = rngFromSeed(seed);

  const card = document.createElement("div");
  card.className = "p-card";
  // Deterministic slight rotation and tiny jitter
  const rot = randRange(rng, -4.5, 4.5);             // degrees
  const tx = randRange(rng, -4, 4);                  // px
  const ty = randRange(rng, -6, 6);                  // px
  card.style.setProperty("--rot", rot.toFixed(2) + "deg");
  card.style.setProperty("--tx", tx.toFixed(1) + "px");
  card.style.setProperty("--ty", ty.toFixed(1) + "px");

  // Image
  const img = document.createElement("img");
  img.loading = "lazy";
  img.decoding = "async";
  img.src = item.src;
  img.alt = item.caption || "Artwork";

  // Caption (optional)
  const cap = document.createElement("div");
  cap.className = "p-caption";
  cap.textContent = item.caption || "";

  card.appendChild(img);
  if (item.caption) card.appendChild(cap);

  // Lightbox open
  card.addEventListener("click", () => openLightbox(item.src, item.caption));
  return card;
}

function openLightbox(src: string, caption?: string) {
  lbImg.src = src;
  lbImg.alt = caption || "";
  lbCaption.textContent = caption || "";
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lbImg.src = "";
}
lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

/* Layout algorithm:
   - Choose column count based on container width and target card width.
   - Place each card in the shortest column (masonry-like), but
     jitter left/top slightly and allow small negative overlap.
   - Card width is clamped between --min-card-w and --max-card-w.
*/
function layout() {
  if (!wall) return;

  const wallRect = wall.getBoundingClientRect();
  const maxW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--max-card-w")) || 420;
  const minW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--min-card-w")) || 220;
  const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gutter")) || 18;

  // Target card width based on viewport; clamp for responsiveness
  let targetW = Math.min(maxW, Math.max(minW, Math.floor(wallRect.width / 3) - gutter));
  if (wallRect.width < 700) targetW = Math.min(maxW, Math.max(minW, Math.floor(wallRect.width / 2) - gutter));
  if (wallRect.width < 460) targetW = Math.min(maxW, Math.max(minW, wallRect.width - gutter * 2));

  const colCount = Math.max(1, Math.floor((wallRect.width + gutter) / (targetW + gutter)));
  const colX: number[] = [];
  const colY: number[] = [];

  for (let c = 0; c < colCount; c++) {
    colX[c] = c * (targetW + gutter);
    colY[c] = randRange(rngFromSeed(1234 + c), 0, 8); // tiny stagger start
  }

  // Position cards
  let maxBottom = 0;
  cards.forEach((card, i) => {
    const item = IMAGES[i];
    const seed = hash32(item.src);
    const rng = rngFromSeed(seed);

    // Measure natural image size to estimate height
    const img = card.querySelector("img")!;
    const naturalW = (img as any).naturalWidth || targetW;
    const naturalH = (img as any).naturalHeight || targetW * 0.75;
    const scale = targetW / naturalW;
    const contentH = naturalH * scale;
    const padding = 10 + (item.caption ? 22 : 0);

    const estH = Math.round(contentH + padding * 2);

    // pick the shortest column (with a touch of jitter to avoid perfect stacking)
    const jitterPick = Math.floor(randRange(rng, 0, 1.999)); // sometimes nudge to next column
    let col = shortestColumn(colY);
    if (jitterPick === 1 && col < colCount - 1) col += 1;

    // overlap: allow slight negative margin on y (cards sneak under previous)
    const overlap = Math.round(randRange(rng, -14, 6));
    const x = colX[col] + Math.round(randRange(rng, -8, 8));
    const y = colY[col] + overlap;

    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    card.style.width = `${targetW}px`;
    card.style.zIndex = String(100 + Math.floor(y)); // lower items behind higher ones

    colY[col] = y + estH + gutter;
    maxBottom = Math.max(maxBottom, colY[col]);
  });

  wall.style.height = `${Math.max(400, maxBottom)}px`;
}

function shortestColumn(arr: number[]): number {
  let idx = 0, min = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) { min = arr[i]; idx = i; }
  }
  return idx;
}

function mount() {
  // Build DOM
  const frag = document.createDocumentFragment();
  cards = [];
  sizes = [];

  IMAGES.forEach((item) => {
    const card = createCard(item);
    frag.appendChild(card);
    cards.push(card);
  });

  wall.innerHTML = "";
  wall.appendChild(frag);

  // Wait for images so we get correct sizes, then layout
  const imgs = Array.from(wall.querySelectorAll<HTMLImageElement>("img"));
  let loaded = 0;
  const kick = () => {
    loaded++;
    if (loaded >= imgs.length) layout();
  };
  imgs.forEach((im) => {
    if (im.complete) {
      // Already in cache
      kick();
    } else {
      im.addEventListener("load", kick);
      im.addEventListener("error", kick);
    }
  });

  // Relayout on resize (debounced)
  let t: number | undefined;
  window.addEventListener("resize", () => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(layout, 120);
  });

  // If container width changes due to CSS, observe too
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => layout());
    resizeObserver.observe(wall);
  }
}

mount();
