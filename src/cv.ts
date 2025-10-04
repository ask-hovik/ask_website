// src/cv.ts
import './style.css';
import resumeHtml from './resume.html?raw';
import customThemeCss from '../themes/caffeine-custom/public/styles/main.css?raw';
import profilePicUrl from './profile_pic.jpg';

/** Fetch CSS text and rewrite relative url(...) to absolute based on the css file URL */
async function fetchAndResolveCss(cssUrl: string): Promise<string> {
  const res = await fetch(cssUrl);
  const text = await res.text();
  const base = new URL(cssUrl);
  // Rewrite all url(...) occurrences
  return text.replace(/url\(([^)]+)\)/g, (_, raw) => {
    const url = raw.trim().replace(/^['"]|['"]$/g, ''); // strip quotes
    // data URLs or absolute URLs stay as-is
    if (/^(data:|https?:|\/\/)/i.test(url)) return `url(${url})`;
    // otherwise resolve relative to the CSS file URL
    return `url(${new URL(url, base).href})`;
  });
}

async function mountCV() {
  const host = document.getElementById('cv-shadow-host');
  if (!host) return;

  // 1) Load FA4 CSS text from CDN and make all font URLs absolute
  const faCss = await fetchAndResolveCss(
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css'
  );

  const root = host.attachShadow({ mode: 'open' });

  // 2) Style block: lock light mode + fonts, THEN FA CSS, THEN your theme CSS
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    /* Lock resume to light + its own font stack so site theme doesn't bleed in */
    :host { color-scheme: light; }
    .cv-root {
      background: #ffffff !important;
      color: #39424B !important;
    }
    .cv-root, .cv-root * {
      font-family: "Josefin Sans", "Lato", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Remove any card effect */
    .cv-root, .cv-root * {
      box-shadow: none !important;
    }

    /* === Font Awesome 4 (inlined so it styles inside the shadow) === */
    ${faCss}

    /* === Your custom theme CSS (already tweaked) === */
    ${customThemeCss}
  `;

  const wrapper = document.createElement('div');
  wrapper.className = 'cv-root';
  wrapper.innerHTML = resumeHtml;

  // Fix local assets referenced by relative path
  const img = wrapper.querySelector('img[src="profile_pic.jpg"]') as HTMLImageElement | null;
  if (img) img.src = profilePicUrl;

  root.appendChild(styleTag);
  root.appendChild(wrapper);
}

mountCV();
