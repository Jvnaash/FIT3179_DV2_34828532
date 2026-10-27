// Render charts independently so a failure in one does not hide the others.
const charts = [
  ['map1', 'map1_waste_diversion.vl.json'],
  ['map2', 'map2_garbage_no_overlap.vega.json'],
  ['map3', 'map3_satisfaction_dorling.vega.json'],
  ['chart5', 'chart5_waste_diversion_slope.vl.json'],
  ['chart6', 'chart6_library_membership.vl.json'],
  ['chart8', 'chart8_aquatic_utilisation.vl.json'],
  ['chart9', 'chart9_library_service_cost.vl.json'],
  ['chart10', 'chart10_garbage_violin.vl.json'],
  ['chart11', 'chart11_satisfaction_beeswarm.vl.json'],
  ['chart12', 'chart12_services_parallel.vl.json']
];

async function loadChart(id, url) {
  const target = document.getElementById(id);
  try {
    return await vegaEmbed(`#${id}`, url, {actions:false, renderer:'svg'});
  } catch (error) {
    console.error(`Error loading ${id} (${url})`, error);
    if (target) target.innerHTML = `<p class="chart-error" role="alert">Could not load ${id}. Open Developer Tools (F12) → Console for details.</p>`;
    return null;
  }
}

for (const [id, url] of charts) {
  loadChart(id, url).then(result => {
    if (id !== 'chart12' || !result) return;
    // Strong, always-visible legend colours; line and point colours use the same palette.
    const chartContainer = document.getElementById('chart12');
    if (chartContainer && !chartContainer.querySelector('.chart12-legend')) {
      const names = ['Metro','Interface','Regional City','Large Shire','Small Shire'];
      const colors = ['#176e88','#55a9b6','#8579b2','#da8a5f','#719584'];
      const legend = document.createElement('div');
      legend.className = 'chart12-legend';
      legend.setAttribute('aria-label','Council group colour legend');
      const heading = document.createElement('strong'); heading.textContent = 'Council group'; legend.appendChild(heading);
      names.forEach((name, i) => {
        const item = document.createElement('div'); item.className = 'chart12-legend-item';
        const swatch = document.createElement('span'); swatch.className = 'chart12-legend-swatch';
        swatch.style.backgroundColor = colors[i];
        const text = document.createElement('span'); text.textContent = name;
        item.append(swatch,text); legend.appendChild(item);
      });
      chartContainer.parentElement.appendChild(legend);
    }
    const selector = document.getElementById('council-choice');
    if (!selector) return;
    fetch('council_parallel_coordinates_2024_25.csv')
      .then(response => {if(!response.ok) throw new Error(`HTTP ${response.status}`);return response.text()})
      .then(csv => {
        const rows = csv.trim().split(/\r?\n/).slice(1).map(line => {
          const [council, council_group, indicator, indicator_code, order, raw_value, normalized, unit] = line.split(',');
          return {council, council_group, indicator, raw_value: Number(raw_value), unit};
        });
        const byCouncil = new Map();
        for (const row of rows) {
          if (!byCouncil.has(row.council)) byCouncil.set(row.council, []);
          byCouncil.get(row.council).push(row);
        }
        for (const name of [...byCouncil.keys()].sort()) {
          const option = document.createElement('option'); option.value = name; option.textContent = name; selector.appendChild(option);
        }
        const profile = document.getElementById('selected-council-profile');
        const renderProfile = () => {
          if (!profile) return;
          const values = byCouncil.get(selector.value);
          profile.replaceChildren();
          if (!values) {profile.textContent='Select a council to see its four original reported values (2024–25).';return;}
          const title=document.createElement('strong');title.textContent=selector.value+' · 2024–25';profile.appendChild(title);
          const grid=document.createElement('div');grid.className='profile-measures';
          const fmt={'Waste diversion':v=>v.toFixed(2)+'%', 'Library membership':v=>v.toFixed(2)+'%', 'Aquatic visits':v=>v.toFixed(2)+' visits/resident', 'Consultation satisfaction':v=>v.toFixed(0)+' / 100'};
          for (const label of ['Waste diversion','Library membership','Aquatic visits','Consultation satisfaction']) {
            const item=values.find(v=>v.indicator===label);if(!item)continue;
            const cell=document.createElement('div'), heading=document.createElement('span'), value=document.createElement('b');
            heading.textContent=label;value.textContent=fmt[label](item.raw_value);cell.append(heading,value);grid.appendChild(cell);
          }
          profile.appendChild(grid);
        };
        selector.addEventListener('change', renderProfile);
        renderProfile();
      }).catch(console.error);
    selector.addEventListener('change', () => result.view.signal('selectedCouncil', selector.value).runAsync());
  });
}

// Chart 4: concise story-first view, with one-click access to all 79 council rows.
(async function setupHeatmapToggle(){
  const btn = document.getElementById('chart4-toggle');
  const info = document.getElementById('heatmap-mode');
  if (!btn || !info) return;
  try {
    const response = await fetch('chart4_waste_diversion_heatmap.vl.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const baseline = await response.json();
    const councilOrder = baseline.encoding.y.sort;
    let showAll = false;
    async function renderHeatmap() {
      const spec = JSON.parse(JSON.stringify(baseline));
      // Fit the heatmap to its available width (including room for council labels).
      // This removes the unused desktop gap without creating document-level horizontal scrolling.
      const card = document.getElementById('chart4').closest('.chart-card');
      const available = card ? card.clientWidth - 60 : 900;
      spec.width = Math.max(215, Math.min(830, available - 190));
      if (!showAll) {
        spec.transform = [...(spec.transform || []), {filter: {field: 'council', oneOf: councilOrder.slice(0,25)}}];
      }
      await vegaEmbed('#chart4', spec, {actions:false, renderer:'svg'});
      btn.textContent = showAll ? 'Show top 25 councils' : 'Show all 79 councils';
      btn.setAttribute('aria-expanded', String(showAll));
      info.textContent = showAll
        ? 'Showing all 79 councils, ordered by their 2024–25 diversion rate.'
        : 'Showing the 25 highest-ranked councils in 2024–25. All five years remain visible.';
    }
    await renderHeatmap();
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      showAll = !showAll;
      try { await renderHeatmap(); }
      catch(error) { console.error('Heatmap update failed', error); info.textContent = 'Could not update heatmap. Check the browser console.'; }
      finally { btn.disabled = false; }
    });
  } catch(error) {
    console.error('Chart 4 could not load', error);
    document.getElementById('chart4').textContent = 'Could not load heatmap. Check the browser console.';
  }
})();

// Chart 8 in the story: stable council highlighting via re-embedding a verified
// Vega-Lite specification. No nested Vega selections or invalid facet signals.
(async function setupLibraryRankSelector(){
  const picker=document.getElementById('rank-council');
  const status=document.getElementById('rank-status');
  if(!picker) return;
  try {
    const [specResponse,csvResponse]=await Promise.all([
      fetch('chart7_library_rank_bump.vl.json'),fetch('library_visits_rank_2023_2025.csv')
    ]);
    if(!specResponse.ok||!csvResponse.ok) throw Error('Missing chart spec or source data');
    const base=await specResponse.json();
    const rows=(await csvResponse.text()).trim().split(/\r?\n/).slice(1);
    const councils=[...new Set(rows.map(line=>line.split(',')[0]))].sort((a,b)=>a.localeCompare(b));
    councils.forEach(name=>{const opt=document.createElement('option');opt.value=name;opt.textContent=name;picker.appendChild(opt)});
    async function render(){
      const selected=picker.value;
      const spec=JSON.parse(JSON.stringify(base));
      // Highlights only actual council rows; rank coordinates remain unchanged.
      if(selected){
        const literal=JSON.stringify(selected);
        const test='datum.council === '+literal;
        spec.layer[0].encoding={...spec.layer[0].encoding,opacity:{condition:{test,value:1},value:0.14},size:{condition:{test,value:3.8},value:1.5}};
        spec.layer[1].encoding={...spec.layer[1].encoding,opacity:{condition:{test,value:1},value:0.18},size:{condition:{test,value:125},value:55}};
      }
      spec.height=420;
      // Use the card's actual laid-out width, rather than the initially empty
      // chart element's intrinsic width (which could measure ~390px).
      const card=document.getElementById('chart7').closest('.chart-card');
      const available=card.getBoundingClientRect().width;
      const horizontalRoom=Math.max(300,available-140);
      spec.width=Math.min(850,horizontalRoom);
      await vegaEmbed('#chart7',spec,{actions:false,renderer:'svg'});
      status.textContent=selected ? selected+' highlighted; ranks remain statewide.' : 'Ranks are among all 79 Victorian councils.';
    }
    await render();
    picker.addEventListener('change',async()=>{picker.disabled=true;try{await render()}catch(e){console.error(e);status.textContent='Could not update highlight.'}finally{picker.disabled=false}});
  }catch(error){console.error('Library rank chart failed',error);document.getElementById('chart7').innerHTML='<p class="chart-error">Could not load ranking chart.</p>';}
})();
