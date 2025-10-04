// src/cv.ts
import './style.css';
import resumeHtml from './resume.html?raw';
import customThemeCss from '../themes/caffeine-custom/public/styles/main.css?raw';
import profilePicUrl from './profile_pic.jpg';

/** Font Awesome 4 stylesheet we’ll use for the shadow-font workaround */
const FA4_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';

/** Fetch a CSS file, and rewrite relative url(...) to absolute URLs based on the CSS file URL. */
async function fetchAndResolveCss(cssUrl: string): Promise<string> {
  const res = await fetch(cssUrl);
  if (!res.ok) throw new Error(`Failed to fetch CSS: ${cssUrl}`);
  const text = await res.text();
  const base = new URL(cssUrl);
  return text.replace(/url\(([^)]+)\)/g, (_, raw) => {
    const url = raw.trim().replace(/^['"]|['"]$/g, '');
    if (/^(data:|https?:|\/\/)/i.test(url)) return `url(${url})`;
    return `url(${new URL(url, base).href})`;
  });
}

/** Ensure a <link rel="stylesheet"> exists in the document head (light DOM). */
function ensureHeadStylesheet(url: string, id: string) {
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.id = id;
    document.head.appendChild(link);
  }
}

async function mountCV() {
  const host = document.getElementById('cv-shadow-host');
  if (!host) return;

  // Shadow-font workaround: have @font-face in BOTH light DOM and shadow
  ensureHeadStylesheet(FA4_URL, 'fa4-head');
  const faCss = await fetchAndResolveCss(FA4_URL);

  // Shadow root
  const root = host.attachShadow({ mode: 'open' });

  // ---- Shadow styles: base lock, FA4 inlined, then your custom theme CSS ----
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    /* Lock the CV to a light "paper" look, independent of site theme */
    :host { color-scheme: light; }
    .cv-root {
      background: #ffffff;
      color: #39424B;
      overflow-x: hidden;  /* avoid horizontal scroll revealing site background */
      margin: 0;                /* new */
      padding: 0;               /* new */
    }
    :host { overflow-x: hidden; }

    .cv-root .page {
      margin: 0 auto !important;     /* already mostly 0; enforce */
      padding-bottom: 0 !important;  /* don’t add bottom padding on mobile */
  }
    /* Remove card shadows/borders inside the CV (visual seams) */
    .cv-root, .cv-root * { box-shadow: none !important; }

    /* Scaler container for mobile fit-to-width */
    .cv-scaler { position: relative; }
    .cv-scaler .page { transform-origin: top left; }

    /* Disable scaling and allow normal layout when printing */
    @media print {
      .cv-scaler { width: auto !important; height: auto !important; }
      .cv-scaler .page { transform: none !important; }
    }

    /* === Font Awesome 4 inlined into the shadow (icons render inside shadow) === */
    ${faCss}

    /* === Your custom theme CSS (with your border/print fixes) === */
    ${customThemeCss}
  `;

  // Wrapper + resume HTML
  const wrapper = document.createElement('div');
  wrapper.className = 'cv-root';
  wrapper.innerHTML = resumeHtml;

  // Patch local asset(s) referenced relatively in the resume
  const img = wrapper.querySelector('img[src="profile_pic.jpg"]') as HTMLImageElement | null;
  if (img) img.src = profilePicUrl;

  // Wrap the .page element in a scaler so we can transform scale on mobile
  const page = wrapper.querySelector('.page') as HTMLElement | null;
  let scaler: HTMLDivElement | null = null;
  if (page) {
    scaler = document.createElement('div');
    scaler.className = 'cv-scaler';
    page.parentElement!.insertBefore(scaler, page);
    scaler.appendChild(page);
  }

  root.appendChild(styleTag);
  root.appendChild(wrapper);

  // --- Responsive fit-to-width scaling for mobile / narrow viewports ---
  function applyScale() {
    if (!host || !page || !scaler) return;

    // Measure the page BEFORE applying transform
    const prev = page.style.transform;
    page.style.transform = 'none';

    // Intrinsic layout size (unscaled)
    const naturalWidth  = page.offsetWidth  || 794;  // ~210mm @96dpi
    const naturalHeight = page.offsetHeight || 1123; // ~297mm @96dpi

    // Available width in the host
    const available = host.getBoundingClientRect().width;

    // Scale to fit width, never enlarge >1
    const s = Math.max(0.1, Math.min(1, (available - 2) / naturalWidth));

    // Apply scale
    page.style.transform = `scale(${s})`;

    // Set the scaler’s box to the scaled page size (tight, no extra whitespace)
    scaler.style.width  = `${naturalWidth  * s}px`;
    scaler.style.height = `${naturalHeight * s}px`; 
  }

  // Run on mount and on size/orientation changes
  applyScale();
  const ro = new ResizeObserver(applyScale);
  ro.observe(host);
  window.addEventListener('resize', applyScale);
}

mountCV();
