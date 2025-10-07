
// src/portfolio.ts
import "./style.css"; // global + hamburger styles
// import "./portfolio.css"; // optional portfolio wall styling

type ArtItem = {
  src: string;
  caption?: string;
};

// Replace with your actual artworks
// you can add caption   { src: "/portfolio/06.jpg", caption: "thing" },
const IMAGES: ArtItem[] = [
  { src: "/portfolio/01a.jpg"},
  { src: "/portfolio/02.jpg"},
  { src: "/portfolio/03a.jpg"},
//  { src: "/portfolio/04.jpg"},
  { src: "/portfolio/05a.jpg"},
  { src: "/portfolio/06a.jpg"},
  { src: "/portfolio/07.jpg"},
  { src: "/portfolio/08b.jpg"},
  { src: "/portfolio/09.jpeg"},
  { src: "/portfolio/10.jpeg"},
  { src: "/portfolio/11.jpeg"},
  { src: "/portfolio/12.jpeg"},
  { src: "/portfolio/13.jpeg"},
  { src: "/portfolio/14.jpeg"},
  //{ src: "/portfolio/15.jpeg"},
  //{ src: "/portfolio/16.jpeg"},
  { src: "/portfolio/17.jpg"},
  { src: "/portfolio/18.jpg"},
  { src: "/portfolio/19a.jpeg"},
  { src: "/portfolio/20.jpeg"},
  { src: "/portfolio/21.jpg"},
  { src: "/portfolio/22.jpg"},
  { src: "/portfolio/23.jpg"},
  { src: "/portfolio/24.jpg"},
  { src: "/portfolio/25.jpg"},
  { src: "/portfolio/26.jpg"},
  { src: "/portfolio/27.jpg"},
  
];

// --- DOM elements ---
const wall = document.getElementById("wall") as HTMLDivElement;
const lightbox = document.getElementById("lightbox") as HTMLDivElement;
const lbImg = lightbox.querySelector<HTMLImageElement>(".lb-image")!;
const lbCaption = lightbox.querySelector<HTMLDivElement>(".lb-caption")!;
const lbClose = lightbox.querySelector<HTMLButtonElement>(".lb-close")!;

let cards: HTMLDivElement[] = [];
let resizeObserver: ResizeObserver | null = null;

// --- Card creation ---
function createCard(item: ArtItem): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "p-card";

  const img = document.createElement("img");
  img.loading = "lazy";
  img.decoding = "async";
  img.src = item.src;
  img.alt = item.caption || "Artwork";

  const cap = document.createElement("div");
  cap.className = "p-caption";
  cap.textContent = item.caption || "";

  card.appendChild(img);
  if (item.caption) card.appendChild(cap);

  card.addEventListener("click", () => openLightbox(item.src, item.caption));
  return card;
}

// --- Lightbox controls ---
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

// --- Layout ---
function layout() {
  if (!wall) return;

  const wallRect = wall.getBoundingClientRect();
  const maxW =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--max-card-w")
    ) || 420;
  const minW =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--min-card-w")
    ) || 220;
  const gutter =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--gutter")
    ) || 18;

  // Compute target card width and column count
  let targetW = Math.min(
    maxW,
    Math.max(minW, Math.floor(wallRect.width / 3) - gutter)
  );
  if (wallRect.width < 700)
    targetW = Math.min(
      maxW,
      Math.max(minW, Math.floor(wallRect.width / 2) - gutter)
    );
  if (wallRect.width < 460)
    targetW = Math.min(maxW, Math.max(minW, wallRect.width - gutter * 2));

  const colCount = Math.max(
    1,
    Math.floor((wallRect.width + gutter) / (targetW + gutter))
  );
  const colX = Array.from({ length: colCount }, (_, i) => i * (targetW + gutter));
  const colY = Array(colCount).fill(0);

  let maxBottom = 0;

  cards.forEach((card, i) => {
    const img = card.querySelector("img")!;
    const naturalW = (img as any).naturalWidth || targetW;
    const naturalH = (img as any).naturalHeight || targetW * 0.75;
    const scale = targetW / naturalW;
    const contentH = naturalH * scale;
    const padding = 10 + (IMAGES[i].caption ? 22 : 0);
    const estH = Math.round(contentH + padding * 2);

    const col = shortestColumn(colY);
    const x = colX[col];
    const y = colY[col];

    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    card.style.width = `${targetW}px`;
    card.style.zIndex = String(100 + Math.floor(y));

    colY[col] = y + estH + gutter;
    maxBottom = Math.max(maxBottom, colY[col]);
  });

  wall.style.height = `${Math.max(400, maxBottom)}px`;
}

function shortestColumn(arr: number[]): number {
  let idx = 0;
  let min = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      min = arr[i];
      idx = i;
    }
  }
  return idx;
}

// --- Mount gallery ---
function mount() {
  const frag = document.createDocumentFragment();
  cards = [];

  IMAGES.forEach((item) => {
    const card = createCard(item);
    frag.appendChild(card);
    cards.push(card);
  });

  wall.innerHTML = "";
  wall.appendChild(frag);

  // Wait for images to load, then layout
  const imgs = Array.from(wall.querySelectorAll<HTMLImageElement>("img"));
  let loaded = 0;
  const checkLoaded = () => {
    loaded++;
    if (loaded >= imgs.length) layout();
  };
  imgs.forEach((img) => {
    if (img.complete) checkLoaded();
    else {
      img.addEventListener("load", checkLoaded);
      img.addEventListener("error", checkLoaded);
    }
  });

  // Relayout on resize (debounced)
  let t: number | undefined;
  window.addEventListener("resize", () => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(layout, 120);
  });

  // Observe container width changes
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => layout());
    resizeObserver.observe(wall);
  }
}

mount();
