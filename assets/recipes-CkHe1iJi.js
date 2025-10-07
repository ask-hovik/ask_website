import"./style-CQnfL4Ia.js";var e=document.querySelector(`#app`),t=`/`,n=new URL(t,window.location.origin),r=(e=>new URL(e,n).toString())(`recipes/index.json`),i=[],a=new Set;function o(){let t=Array.from(new Set(i.flatMap(e=>e.tags))).sort().map(e=>`<button class="chip ${a.has(e)?`chip--active`:``}" data-tag="${e}">${e}</button>`).join(``),n=[...i].filter(e=>a.size===0||Array.from(a).every(t=>e.tags.includes(t))).map(e=>`
      <li>
        <a class="recipe-link" href="#/${e.slug}">${e.title}</a>
        <div class="muted small">
          ~${e.time_minutes} min · serves ${e.serves} · ${e.tags.join(`, `)}
        </div>
      </li>`).join(``);e.innerHTML=`
    <h1>Recipes</h1>
    <div class="card" style="margin: 0.8rem 0 1rem;">
      <strong>Filter by tags:</strong>
      <div class="chip-row" style="margin-top: .5rem;">${t||`<span class='muted'>No tags yet</span>`}</div>
      ${a.size>0?`<div style="margin-top:.5rem"><button class="btn btn--small" id="clear-tags">Clear filters</button></div>`:``}
    </div>
    <ul class="recipe-list">
      ${n||`<li class='muted'>No recipes match the selected tags.</li>`}
    </ul>
  `,e.querySelectorAll(`.chip`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.tag;a.has(t)?a.delete(t):a.add(t),o()})});let r=e.querySelector(`#clear-tags`);r&&r.addEventListener(`click`,()=>{a.clear(),o()})}function s(e){return e.split(/\n+/).map(e=>`<p>${c(e)}</p>`).join(``)}function c(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}async function l(n){let r=`${t}recipes/${n}.json`,i;try{let e=await fetch(r);if(!e.ok)throw Error(`${e.status} ${e.statusText}`);i=await e.json()}catch(t){e.innerHTML=`
      <a href="#" class="btn recipe-back">← All recipes</a>
      <div class="card"><strong>Could not load recipe.</strong><br><span class="muted">${String(t)}</span></div>`,u();return}let a=i.ingredients.map(e=>`
      <tr><td>${e.item}</td><td>${e.amount}</td><td>${e.unit}</td></tr>
  `).join(``);e.innerHTML=`
    <a href="#" class="btn recipe-back">← All recipes</a>

    <h1>${c(i.title)}</h1>
    <div class="muted small">~${i.time_minutes} min · serves ${i.serves} · ${i.tags.map(c).join(`, `)}</div>

    <div class="card" style="margin-top: 1rem;">
      <h3>Ingredients</h3>
      <table>
        <thead><tr><th>Item</th><th>Amount</th><th>Unit</th></tr></thead>
        <tbody>${a}</tbody>
      </table>
    </div>

    <div class="card" style="margin-top: 1rem;">
      <h3>Method</h3>
      ${s(i.steps)}
    </div>
  `,u()}function u(){let t=e.querySelector(`a[href="#"]`);t&&t.addEventListener(`click`,e=>{e.preventDefault(),location.hash=``})}function d(){let e=location.hash.match(/^#\/([^#/?]+)/);if(e){let t=decodeURIComponent(e[1]);l(t)}else o()}async function f(){try{let e=await fetch(r);if(!e.ok)throw Error(`${e.status} ${e.statusText}`);i=await e.json()}catch(t){e.innerHTML=`<div class="card"><strong>Failed to load recipe index.</strong><br><span class="muted">${String(t)}</span></div>`;return}window.addEventListener(`hashchange`,d),d()}f();