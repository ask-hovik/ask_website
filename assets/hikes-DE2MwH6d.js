import"./style-B32uoe-j.js";var e=document.querySelector(`#app`),t=new URL(`/`,window.location.origin),n=(e=>new URL(e,t).toString())(`hikes/index.json`),r=`https://raw.githubusercontent.com/ask-hovik/ask_website/main/public/hikes/`;function i(e){let t=`${r}${e}`;return`https://gpx.studio/app?files=${encodeURIComponent(JSON.stringify([t]))}`}function a(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function o(e){let t=e<10?e.toFixed(2):e.toFixed(1);return`${Number(t)} km`}function s(e){return e==null?``:`max ${e} m`}function c(e){if(!e||e<=0)return``;let t=Math.floor(e/3600),n=Math.round(e%3600/60);if(t===0)return`${n} min`;let r=n.toString().padStart(2,`0`);return`${t} h ${r} min`}function l(t){e.innerHTML=`
    <h1>Hikes</h1>
    <p>
    A collection of hikes I have enjoyed throughout the years.
    </p>
    <ul class="recipe-list">
      ${t.map(e=>{let t=i(e.file),n=[o(e.distance_km),s(e.max_ele_m),...e.total_time_s?[c(e.total_time_s)]:[]].filter(Boolean).join(` · `);return`
      <li>
        <a class="recipe-link" href="${t}" target="_blank" rel="noopener">
          ${a(e.title)}
        </a>
        <div class="muted small">${n}</div>
      </li>
    `}).join(``)||`<li class='muted'>No hikes found.</li>`}
    </ul>
  `}async function u(){try{let e=await fetch(n,{cache:`no-cache`});if(!e.ok)throw Error(`${e.status} ${e.statusText}`);let t=(await e.json()).filter(e=>typeof e.title==`string`&&typeof e.file==`string`&&Number.isFinite(e.distance_km));l(t)}catch(t){e.innerHTML=`<div class="card"><strong>Failed to load hikes.</strong><br><span class="muted">${String(t)}</span></div>`}}u();