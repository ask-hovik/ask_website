import"./style-B32uoe-j.js";var e=document.querySelector(`#app`),t=new URL(`/`,window.location.origin),n=e=>new URL(e,t).toString(),r=n(`hikes/index.json`);function i(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function a(e){let t=e<10?e.toFixed(2):e.toFixed(1);return`${Number(t)} km`}function o(e,t){return`+${e} m / -${t} m`}function s(e){if(!e||e<=0)return``;let t=Math.floor(e/3600),n=Math.round(e%3600/60);if(t===0)return`${n} min`;let r=n.toString().padStart(2,`0`);return`${t} h ${r} min`}function c(e){let t=`https://raw.githubusercontent.com/ask-hovik/ask_website/main/public/hikes/${e}`;return`https://gpx.studio/app?url=${encodeURIComponent(t)}`}function l(t){e.innerHTML=`
    <h1>Hikes</h1>
    <p class="muted">Click a hike to open it in GPX Studio.</p>
    <ul class="recipe-list">
      ${t.map(e=>{let t=n(e.url.replace(/^\//,``)),r=c(t),l=[a(e.distance_km),o(e.ascent_m,e.descent_m),...e.total_time_s?[s(e.total_time_s)]:[]].join(` · `);return`
      <li>
        <a class="recipe-link" href="${r}" target="_blank" rel="noopener">
          ${i(e.title)}
        </a>
        <div class="muted small">${l}</div>
      </li>
    `}).join(``)||`<li class='muted'>No hikes found.</li>`}
    </ul>
  `}async function u(){try{let e=await fetch(r,{cache:`no-cache`});if(!e.ok)throw Error(`${e.status} ${e.statusText}`);let t=(await e.json()).filter(e=>typeof e.title==`string`&&typeof e.url==`string`&&Number.isFinite(e.distance_km)&&Number.isFinite(e.ascent_m)&&Number.isFinite(e.descent_m));l(t)}catch(t){e.innerHTML=`<div class="card"><strong>Failed to load hikes.</strong><br><span class="muted">${String(t)}</span></div>`}}u();