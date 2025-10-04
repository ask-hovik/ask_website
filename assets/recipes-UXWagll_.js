import"./nav-CsD91_X-.js";var e=document.querySelector(`#app`),t=`/ask_website/`,n=`${t}recipes/index.json`,r=[],i=new Set;function a(){let t=Array.from(new Set(r.flatMap(e=>e.tags))).sort().map(e=>`<button class="chip ${i.has(e)?`chip--active`:``}" data-tag="${e}">${e}</button>`).join(``),n=[...r].filter(e=>i.size===0||Array.from(i).every(t=>e.tags.includes(t))).map(e=>`
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
      ${i.size>0?`<div style="margin-top:.5rem"><button class="btn btn--small" id="clear-tags">Clear filters</button></div>`:``}
    </div>
    <ul class="recipe-list">
      ${n||`<li class='muted'>No recipes match the selected tags.</li>`}
    </ul>
  `,e.querySelectorAll(`.chip`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.tag;i.has(t)?i.delete(t):i.add(t),a()})});let o=e.querySelector(`#clear-tags`);o&&o.addEventListener(`click`,()=>{i.clear(),a()})}function o(e){return e.split(/\n+/).map(e=>`<p>${s(e)}</p>`).join(``)}function s(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}async function c(n){let r=`${t}recipes/${n}.json`,i;try{let e=await fetch(r);if(!e.ok)throw Error(`${e.status} ${e.statusText}`);i=await e.json()}catch(t){e.innerHTML=`
      <a href="#" class="btn" style="margin-bottom: .8rem;">← All recipes</a>
      <div class="card"><strong>Could not load recipe.</strong><br><span class="muted">${String(t)}</span></div>`,l();return}let a=i.ingredients.map(e=>`
      <tr><td>${e.item}</td><td>${e.amount}</td><td>${e.unit}</td></tr>
  `).join(``);e.innerHTML=`
    <a href="#" class="btn" style="margin-bottom: .8rem;">← All recipes</a>

    <h1>${s(i.title)}</h1>
    <div class="muted small">~${i.time_minutes} min · serves ${i.serves} · ${i.tags.map(s).join(`, `)}</div>

    <div class="card" style="margin-top: 1rem;">
      <h3>Ingredients</h3>
      <table>
        <thead><tr><th>Item</th><th>Amount</th><th>Unit</th></tr></thead>
        <tbody>${a}</tbody>
      </table>
    </div>

    <div class="card" style="margin-top: 1rem;">
      <h3>Method</h3>
      ${o(i.steps)}
    </div>
  `,l()}function l(){let t=e.querySelector(`a[href="#"]`);t&&t.addEventListener(`click`,e=>{e.preventDefault(),location.hash=``})}function u(){let e=location.hash.match(/^#\/([^#/?]+)/);if(e){let t=decodeURIComponent(e[1]);c(t)}else a()}async function d(){try{let e=await fetch(n);if(!e.ok)throw Error(`${e.status} ${e.statusText}`);r=await e.json()}catch(t){e.innerHTML=`<div class="card"><strong>Failed to load recipe index.</strong><br><span class="muted">${String(t)}</span></div>`;return}window.addEventListener(`hashchange`,u),u()}d();