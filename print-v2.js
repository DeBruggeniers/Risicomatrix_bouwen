const WORKER_URL='https://risicomatrix-publisher.koen-f98.workers.dev/';

const RISK_LEVELS=[
  {id:'very-low',name:'Zeer laag',css:'risk-very-low'},
  {id:'low',name:'Laag',css:'risk-low'},
  {id:'medium',name:'Middel',css:'risk-medium'},
  {id:'high',name:'Hoog',css:'risk-high'},
  {id:'very-high',name:'Zeer hoog',css:'risk-very-high'}
];

const EFFECT_LABELS={
  3:['Klein','Matig','Ernstig'],
  4:['Verwaarloosbaar','Klein','Behoorlijk','Ernstig'],
  5:['Verwaarloosbaar','Klein','Matig','Behoorlijk','Ernstig'],
  6:['Verwaarloosbaar','Klein','Matig','Behoorlijk','Ernstig','Zeer ernstig'],
  7:['Zeer klein','Klein','Beperkt','Matig','Behoorlijk','Ernstig','Catastrofaal']
};

function esc(v=''){
  return String(v).replace(/[&<>'"]/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[c]));
}

function riskById(id){
  return RISK_LEVELS.find(r=>r.id===id)||RISK_LEVELS[0];
}

function effectLabel(config,i){
  return EFFECT_LABELS[config.effectCount]?.[i]||String(i+1);
}

function formatMultiline(value=''){
  return esc(value).replace(/\n/g,'<br>');
}

async function loadConfig(){
  const res=await fetch(WORKER_URL+'?t='+Date.now(),{cache:'no-store'});
  if(!res.ok) throw new Error('De gepubliceerde risicomatrix kon niet worden opgehaald.');
  const data=await res.json();
  if(!data?.config) throw new Error('Geen gepubliceerde configuratie gevonden.');
  return data.config;
}

function renderCriteria(config){
  const effectIndexes=Array.from({length:config.effectCount},(_,row)=>config.effectCount-1-row);

  const head=config.values.map(v=>`<th>${esc(v)}</th>`).join('');
  const body=effectIndexes.map(e=>`
    <tr>
      <th class="effect-label">${esc(effectLabel(config,e))}</th>
      ${config.values.map(v=>`
        <td>${formatMultiline(config.effectDescriptions?.[v]?.[e]||'')}</td>
      `).join('')}
    </tr>
  `).join('');

  document.getElementById('effectCriteria').innerHTML=`
    <table class="criteria-table">
      <thead>
        <tr>
          <th class="effect-label">Effectklasse</th>
          ${head}
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function renderRiskMatrix(config){
  const effectIndexes=Array.from({length:config.effectCount},(_,row)=>config.effectCount-1-row);

  const chanceHead=Array.from({length:config.chanceCount},(_,c)=>`
    <th>
      <span class="chance-number">${c+1}</span>
      <span class="chance-desc">${formatMultiline(config.chanceDescriptions?.[c]||'')}</span>
    </th>
  `).join('');

  const rows=effectIndexes.map(e=>`
    <tr>
      ${Array.from({length:config.chanceCount},(_,c)=>{
        const r=riskById(config.riskMatrix[e][c]);
        return `<td class="${r.css}">${esc(r.name)}</td>`;
      }).join('')}
    </tr>
  `).join('');

  document.getElementById('riskMatrix').innerHTML=`
    <table class="risk-table">
      <thead>
        <tr>
          ${chanceHead}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function syncMatrixRowHeights(){
  const criteriaTable=document.querySelector('.criteria-table');
  const riskTable=document.querySelector('.risk-table');
  if(!criteriaTable||!riskTable) return;

  const criteriaHead=criteriaTable.querySelector('thead tr');
  const riskHead=riskTable.querySelector('thead tr');
  if(criteriaHead&&riskHead){
    criteriaHead.style.height='';
    riskHead.style.height='';
    const headerHeight=Math.max(
      criteriaHead.getBoundingClientRect().height,
      riskHead.getBoundingClientRect().height
    );
    criteriaHead.style.height=headerHeight+'px';
    riskHead.style.height=headerHeight+'px';
  }

  const leftRows=[...criteriaTable.querySelectorAll('tbody tr')];
  const rightRows=[...riskTable.querySelectorAll('tbody tr')];
  leftRows.forEach(r=>r.style.height='');
  rightRows.forEach(r=>r.style.height='');

  const count=Math.min(leftRows.length,rightRows.length);
  for(let i=0;i<count;i++){
    // De effectbeschrijvingen links bepalen de rijhoogte.
    // De overeenkomstige matrixrij rechts krijgt exact dezelfde hoogte.
    const h=leftRows[i].getBoundingClientRect().height;
    leftRows[i].style.height=h+'px';
    rightRows[i].style.height=h+'px';
    rightRows[i].querySelectorAll('td,th').forEach(cell=>cell.style.height=h+'px');
  }
}

async function init(){
  try{
    const config=await loadConfig();
    renderCriteria(config);
    renderRiskMatrix(config);
    document.getElementById('printMeta').textContent=new Date().toLocaleDateString('nl-NL');
    requestAnimationFrame(()=>requestAnimationFrame(syncMatrixRowHeights));
    setTimeout(syncMatrixRowHeights,150);
    setTimeout(syncMatrixRowHeights,500);
  }catch(err){
    document.getElementById('printSheet').innerHTML='<p class="load-error">'+esc(err.message)+'</p>';
  }
}

document.getElementById('printBtn').addEventListener('click',()=>{
  syncMatrixRowHeights();
  window.print();
});
window.addEventListener('resize',()=>requestAnimationFrame(syncMatrixRowHeights));
window.addEventListener('beforeprint',syncMatrixRowHeights);
init();
