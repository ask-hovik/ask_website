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
    }
    :host { overflow-x: hidden; }

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

    // Available width is the host’s content width
    const available = host.getBoundingClientRect().width;

    // The resume "paper" has a fixed intrinsic width (~210mm ≈ 794px @96dpi).
    // Use scrollWidth to avoid current transform effects.
    const pageWidth = page.scrollWidth || page.getBoundingClientRect().width || 794;

    // Scale to fit, but don't enlarge above 1, and keep a lower bound to avoid zero/NaN
    const s = Math.max(0.1, Math.min(1, (available - 2) / pageWidth));

    page.style.transform = `scale(${s})`;

    // Set the scaler’s size to the scaled page so layout/scroll height is correct
    const pageHeight = page.scrollHeight || page.getBoundingClientRect().height;
    scaler.style.width = `${pageWidth * s}px`;
    scaler.style.height = `${pageHeight * s}px`;
  }

  // Run on mount and on size/orientation changes
  applyScale();
  const ro = new ResizeObserver(applyScale);
  ro.observe(host);
  window.addEventListener('resize', applyScale);
}

mountCV();
