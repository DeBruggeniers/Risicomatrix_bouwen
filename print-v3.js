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
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmt(v=''){return esc(v).replace(/\n/g,'<br>');}
function riskById(id){return RISK_LEVELS.find(r=>r.id===id)||RISK_LEVELS[0];}
function effectLabel(config,i){return EFFECT_LABELS[config.effectCount]?.[i]||String(i+1);}
async function loadConfig(){
  // Local ZIP tests cannot reliably fetch the Worker because file:// has a null origin.
  // Prefer the locally edited draft, otherwise use the bundled published config.js.
  if(location.protocol==='file:'){
    try{const draft=JSON.parse(localStorage.getItem('risicomatrix-builder-v2')||'null');if(draft?.values?.length&&draft?.riskMatrix?.length)return draft;}catch(e){}
    if(window.PUBLISHED_RISK_CONFIG)return window.PUBLISHED_RISK_CONFIG;
    throw new Error('Geen lokale risicomatrix beschikbaar. Open bouwen.html en sla een configuratie op.');
  }
  const res=await fetch(WORKER_URL+'?t='+Date.now(),{cache:'no-store'});
  if(!res.ok) throw new Error('De gepubliceerde risicomatrix kon niet worden opgehaald.');
  const data=await res.json();
  if(!data?.config) throw new Error('Geen gepubliceerde configuratie gevonden.');
  return data.config;
}
function renderCombined(config){
  const effectIndexes=Array.from({length:config.effectCount},(_,row)=>config.effectCount-1-row);
  const valueWidth=56/config.valueCount;
  const chanceWidth=38/config.chanceCount;
  const cols='<col style="width:6%">'+
    config.values.map(()=>'<col style="width:'+valueWidth+'%">').join('')+
    Array.from({length:config.chanceCount},()=>'<col style="width:'+chanceWidth+'%">').join('');
  const valueHeads=config.values.map(v=>'<th class="value-head">'+esc(v)+'</th>').join('');
  const chanceHeads=Array.from({length:config.chanceCount},(_,c)=>'<th class="chance-head"><span class="chance-number">'+(c+1)+'</span><span class="chance-desc">'+fmt(config.chanceDescriptions?.[c]||'')+'</span></th>').join('');
  const rows=effectIndexes.map(e=>'<tr>'+
    '<th class="effect-label">'+esc(effectLabel(config,e))+'</th>'+
    config.values.map(v=>'<td class="effect-desc">'+fmt(config.effectDescriptions?.[v]?.[e]||'')+'</td>').join('')+
    Array.from({length:config.chanceCount},(_,c)=>{const r=riskById(config.riskMatrix[e][c]);return '<td class="risk-cell '+r.css+'">'+esc(r.name)+'</td>';}).join('')+
    '</tr>').join('');
  document.getElementById('effectCriteria').innerHTML='<table class="combined-table"><colgroup>'+cols+'</colgroup><thead><tr><th class="effect-head">Effectklasse</th>'+valueHeads+chanceHeads+'</tr></thead><tbody>'+rows+'</tbody></table>';
  document.getElementById('riskMatrix').innerHTML='';
}
async function init(){
  try{
    const config=await loadConfig();
    renderCombined(config);
    document.getElementById('printMeta').textContent=new Date().toLocaleDateString('nl-NL');
  }catch(err){document.getElementById('printSheet').innerHTML='<p class="load-error">'+esc(err.message)+'</p>';}
}
document.getElementById('printBtn').addEventListener('click',()=>window.print());
init();

function fitPrintToPage(){
 const sheet=document.getElementById('printSheet');
 if(!sheet||!sheet.querySelector('.combined-table'))return;
 // Measure at the actual A4 landscape printable width. Transform does not alter
 // document flow, so the table remains one positioned object during printing.
 sheet.style.setProperty('--print-scale','1');
 const mmToPx=96/25.4;
 const availableWidth=287*mmToPx;
 const availableHeight=190*mmToPx;
 const actualHeight=sheet.scrollHeight;
 const actualWidth=sheet.scrollWidth;
 const scale=Math.min(1,availableWidth/Math.max(1,actualWidth),(availableHeight-24)/Math.max(1,actualHeight));
 sheet.style.setProperty('--print-scale',String(Math.max(0.1,scale*0.97)));
}
window.addEventListener('beforeprint',fitPrintToPage);
