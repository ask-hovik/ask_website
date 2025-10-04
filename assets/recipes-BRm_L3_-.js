import"./nav-CsD91_X-.js";var e=document.querySelector(`#app`),t=`/ask_website/recipes/index.json`,n=[],r=new Set;function i(){let t=Array.from(new Set(n.flatMap(e=>e.tags))).sort().map(e=>`<button class="chip ${r.has(e)?`chip--active`:``}" data-tag="${e}">${e}</button>`).join(``),a=[...n].filter(e=>r.size===0||Array.from(r).every(t=>e.tags.includes(t))).map(e=>`
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
      ${r.size>0?`<div style="margin-top:.5rem"><button class="btn btn--small" id="clear-tags">Clear filters</button></div>`:``}
    </div>
    <ul class="recipe-list">
      ${a||`<li class='muted'>No recipes match the selected tags.</li>`}
    </ul>
  `,e.querySelectorAll(`.chip`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.tag;r.has(t)?r.delete(t):r.add(t),i()})});let o=e.querySelector(`#clear-tags`);o&&o.addEventListener(`click`,()=>{r.clear(),i()})}function a(e){return e.split(/\n+/).map(e=>`<p>${o(e)}</p>`).join(``)}function o(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}async function s(t){let n=`/recipes/${t}.json`,r;try{let e=await fetch(n);if(!e.ok)throw Error(`${e.status} ${e.statusText}`);r=await e.json()}catch(t){e.innerHTML=`
      <a href="#" class="btn" style="margin-bottom: .8rem;">← All recipes</a>
      <div class="card"><strong>Could not load recipe.</strong><br><span class="muted">${String(t)}</span></div>`,c();return}let i=r.ingredients.map(e=>`
      <tr><td>${e.item}</td><td>${e.amount}</td><td>${e.unit}</td></tr>
  `).join(``);e.innerHTML=`
    <a href="#" class="btn" style="margin-bottom: .8rem;">← All recipes</a>

    <h1>${o(r.title)}</h1>
    <div class="muted small">~${r.time_minutes} min · serves ${r.serves} · ${r.tags.map(o).join(`, `)}</div>

    <div class="card" style="margin-top: 1rem;">
      <h3>Ingredients</h3>
      <table>
        <thead><tr><th>Item</th><th>Amount</th><th>Unit</th></tr></thead>
        <tbody>${i}</tbody>
      </table>
    </div>

    <div class="card" style="margin-top: 1rem;">
      <h3>Method</h3>
      ${a(r.steps)}
    </div>
  `,c()}function c(){let t=e.querySelector(`a[href="#"]`);t&&t.addEventListener(`click`,e=>{e.preventDefault(),location.hash=``})}function l(){let e=location.hash.match(/^#\/([^#/?]+)/);if(e){let t=decodeURIComponent(e[1]);s(t)}else i()}async function u(){try{let e=await fetch(t);if(!e.ok)throw Error(`${e.status} ${e.statusText}`);n=await e.json()}catch(t){e.innerHTML=`<div class="card"><strong>Failed to load recipe index.</strong><br><span class="muted">${String(t)}</span></div>`;return}window.addEventListener(`hashchange`,l),l()}u();