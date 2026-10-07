const RISK_LEVELS = [
  {id:'very-low', name:'Zeer laag', css:'risk-very-low', rank:1},
  {id:'low', name:'Laag', css:'risk-low', rank:2},
  {id:'medium', name:'Middel', css:'risk-medium', rank:3},
  {id:'high', name:'Hoog', css:'risk-high', rank:4},
  {id:'very-high', name:'Zeer hoog', css:'risk-very-high', rank:5}
];
const EFFECT_CODES = ['A','B','C','D','E','F','G'];
const CHANCE_CODES = ['1','2','3','4','5','6','7'];
const STORAGE_KEY = 'risicomatrix-builder-v1';
const STEP_TITLES = ['Waarden','Effectklassen','Effectbeschrijvingen','Kansklassen','Kansbeschrijvingen','Risicohouding'];

let currentStep = 1;
let config = {
  valueCount:5,
  values:['Veiligheid','Leefbaarheid','Bereikbaarheid','Financieel','Imago'],
  effectCount:5,
  effectDescriptions:{},
  chanceCount:5,
  chanceDescriptions:[],
  riskMatrix:[]
};
let assessment = {chance:null,effects:{}};

const $ = id => document.getElementById(id);

function escapeHtml(v=''){
  return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function riskById(id){return RISK_LEVELS.find(r=>r.id===id) || RISK_LEVELS[0]}
function makeDefaultMatrix(){
  const rows=[];
  for(let e=0;e<config.effectCount;e++){
    const row=[];
    for(let c=0;c<config.chanceCount;c++){
      const normalized=(e+c)/(Math.max(1,config.effectCount+config.chanceCount-2));
      const idx=Math.min(4,Math.floor(normalized*5));
      row.push(RISK_LEVELS[idx].id);
    }
    rows.push(row);
  }
  config.riskMatrix=rows;
}
function ensureConfigShape(){
  config.valueCount=Math.max(1,Math.min(10,Number(config.valueCount)||1));
  config.values=Array.from({length:config.valueCount},(_,i)=>config.values?.[i] || `Waarde ${i+1}`);
  config.effectCount=Math.max(3,Math.min(7,Number(config.effectCount)||5));
  config.chanceCount=Math.max(3,Math.min(7,Number(config.chanceCount)||5));
  config.effectDescriptions=config.effectDescriptions||{};
  config.values.forEach(v=>{
    if(!config.effectDescriptions[v]) config.effectDescriptions[v]=[];
    config.effectDescriptions[v]=Array.from({length:config.effectCount},(_,i)=>config.effectDescriptions[v][i]||'');
  });
  config.chanceDescriptions=Array.from({length:config.chanceCount},(_,i)=>config.chanceDescriptions?.[i]||'');
  if(!Array.isArray(config.riskMatrix) || config.riskMatrix.length!==config.effectCount || config.riskMatrix.some(r=>!Array.isArray(r)||r.length!==config.chanceCount)) makeDefaultMatrix();
}
function saveConfig(){localStorage.setItem(STORAGE_KEY,JSON.stringify(config))}
function loadConfig(){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){config=JSON.parse(raw);ensureConfigShape();return true}}catch(e){}
  ensureConfigShape();return false;
}
function renderStepper(){
  $('stepper').innerHTML=STEP_TITLES.map((t,i)=>`<div class="step ${i+1===currentStep?'active':i+1<currentStep?'done':''}">${i+1}. ${t}</div>`).join('');
}
function renderStep(){
  renderStepper();
  document.querySelectorAll('.step-panel').forEach((el,i)=>el.classList.toggle('hidden',i+1!==currentStep));
  ({1:renderStep1,2:renderStep2,3:renderStep3,4:renderStep4,5:renderStep5,6:renderStep6})[currentStep]();
}
function navButtons(nextText='Volgende'){
  return `<div class="actions"><div>${currentStep>1?'<button class="secondary" type="button" id="prevBtn">Vorige</button>':''}</div><div class="actions-right"><button class="primary" type="button" id="nextBtn">${nextText}</button></div></div>`;
}
function bindNav(onNext){
  $('prevBtn')?.addEventListener('click',()=>{currentStep--;renderStep();window.scrollTo({top:0,behavior:'smooth'})});
  $('nextBtn')?.addEventListener('click',()=>{if(onNext()!==false){saveConfig();if(currentStep<6){currentStep++;renderStep();window.scrollTo({top:0,behavior:'smooth'})}}});
}
function renderStep1(){
  $('step1').innerHTML=`<h2>Stap 1. Organisatiewaarden bepalen</h2><p class="hint">Kies hoeveel waarden je in de risicomatrix wilt opnemen en geef iedere waarde een naam.</p><div class="row"><div class="field small"><label>Aantal waarden</label><select id="valueCount">${Array.from({length:10},(_,i)=>`<option value="${i+1}" ${config.valueCount===i+1?'selected':''}>${i+1}</option>`).join('')}</select></div></div><div class="value-list" id="valueInputs"></div>${navButtons()}`;
  const renderInputs=()=>{$('valueInputs').innerHTML=Array.from({length:config.valueCount},(_,i)=>`<div class="input-card"><strong>Waarde ${i+1}</strong><div class="field"><label>Naam</label><input class="value-name" data-i="${i}" value="${escapeHtml(config.values[i]||'')}" placeholder="Bijvoorbeeld Veiligheid"></div></div>`).join('')};
  $('valueCount').addEventListener('change',e=>{config.valueCount=Number(e.target.value);config.values=Array.from({length:config.valueCount},(_,i)=>config.values[i]||'');renderInputs()});renderInputs();
  bindNav(()=>{const names=[...document.querySelectorAll('.value-name')].map(x=>x.value.trim());if(names.some(x=>!x)){alert('Vul voor iedere waarde een naam in.');return false}if(new Set(names.map(x=>x.toLowerCase())).size!==names.length){alert('Gebruik iedere waarde maar één keer.');return false}const old=config.effectDescriptions;config.values=names;config.effectDescriptions={};names.forEach(v=>config.effectDescriptions[v]=old[v]||Array(config.effectCount).fill(''));ensureConfigShape();return true});
}
function renderStep2(){
  $('step2').innerHTML=`<h2>Stap 2. Aantal effectklassen</h2><p class="hint">Kies hoeveel effectklassen je wilt gebruiken. De klassen worden aangeduid met A t/m G.</p><div class="field small"><label>Aantal effectklassen</label><select id="effectCount">${[3,4,5,6,7].map(n=>`<option value="${n}" ${config.effectCount===n?'selected':''}>${n}</option>`).join('')}</select></div><div class="notice" id="effectCountNotice">Bij ${config.effectCount} klassen gebruik je: ${EFFECT_CODES.slice(0,config.effectCount).join(', ')}.</div>${navButtons()}`;
  $('effectCount').addEventListener('change',e=>{
    config.effectCount=Number(e.target.value);
    ensureConfigShape();
    $('effectCountNotice').textContent=`Bij ${config.effectCount} klassen gebruik je: ${EFFECT_CODES.slice(0,config.effectCount).join(', ')}.`;
  });
  bindNav(()=>{ensureConfigShape();return true});
}
function renderStep3(){
  $('step3').innerHTML=`<h2>Stap 3. Effectbeschrijvingen per waarde</h2><p class="hint">Beschrijf per organisatiewaarde wat iedere effectklasse betekent. Deze teksten worden later bij de risicobeoordeling getoond.</p>${config.values.map(v=>`<h3>${escapeHtml(v)}</h3><div class="class-list">${Array.from({length:config.effectCount},(_,i)=>`<div class="input-card"><strong>Effect ${EFFECT_CODES[i]}</strong><div class="field"><label>Beschrijving</label><textarea class="effect-desc" data-value="${escapeHtml(v)}" data-i="${i}" placeholder="Beschrijf het effect voor ${escapeHtml(v)} bij klasse ${EFFECT_CODES[i]}">${escapeHtml(config.effectDescriptions[v]?.[i]||'')}</textarea></div></div>`).join('')}</div>`).join('')}${navButtons()}`;
  bindNav(()=>{document.querySelectorAll('.effect-desc').forEach(x=>{config.effectDescriptions[x.dataset.value][Number(x.dataset.i)]=x.value.trim()});return true});
}
function renderStep4(){
  $('step4').innerHTML=`<h2>Stap 4. Aantal kansklassen</h2><p class="hint">Kies hoeveel kansklassen je wilt gebruiken. De klassen worden genummerd van 1 t/m 7.</p><div class="field small"><label>Aantal kansklassen</label><select id="chanceCount">${[3,4,5,6,7].map(n=>`<option value="${n}" ${config.chanceCount===n?'selected':''}>${n}</option>`).join('')}</select></div><div class="notice" id="chanceCountNotice">Bij ${config.chanceCount} klassen gebruik je: ${CHANCE_CODES.slice(0,config.chanceCount).join(', ')}.</div>${navButtons()}`;
  $('chanceCount').addEventListener('change',e=>{
    config.chanceCount=Number(e.target.value);
    ensureConfigShape();
    $('chanceCountNotice').textContent=`Bij ${config.chanceCount} klassen gebruik je: ${CHANCE_CODES.slice(0,config.chanceCount).join(', ')}.`;
  });
  bindNav(()=>{ensureConfigShape();return true});
}
function renderStep5(){
  $('step5').innerHTML=`<h2>Stap 5. Kansklassen beschrijven</h2><p class="hint">Beschrijf wat iedere kansklasse betekent, bijvoorbeeld met een frequentie of periode.</p><div class="class-list">${Array.from({length:config.chanceCount},(_,i)=>`<div class="input-card"><strong>Kansklasse ${i+1}</strong><div class="field"><label>Beschrijving</label><textarea class="chance-desc" data-i="${i}" placeholder="Bijvoorbeeld: minder dan 1 keer per 30 jaar">${escapeHtml(config.chanceDescriptions[i]||'')}</textarea></div></div>`).join('')}</div>${navButtons()}`;
  bindNav(()=>{document.querySelectorAll('.chance-desc').forEach(x=>config.chanceDescriptions[Number(x.dataset.i)]=x.value.trim());return true});
}
function renderStep6(){
  ensureConfigShape();
  $('step6').innerHTML=`<h2>Stap 6. Risicohouding bepalen</h2><p class="hint">Geef voor iedere combinatie van effect en kans aan welke risicoklasse geldt. Dit bepaalt de kleuren en uitkomsten van de uiteindelijke risicomatrix.</p><div class="matrix-scroll"><table class="matrix"><thead><tr><th class="effect-head">Effect / Kans</th>${Array.from({length:config.chanceCount},(_,c)=>`<th>${c+1}<br><span style="font-weight:400">${escapeHtml(config.chanceDescriptions[c]||'')}</span></th>`).join('')}</tr></thead><tbody>${Array.from({length:config.effectCount},(_,e)=>`<tr><th class="effect-head">${EFFECT_CODES[e]}</th>${Array.from({length:config.chanceCount},(_,c)=>`<td><select class="risk-select" data-e="${e}" data-c="${c}">${RISK_LEVELS.map(r=>`<option value="${r.id}" ${config.riskMatrix[e][c]===r.id?'selected':''}>${r.name}</option>`).join('')}</select></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="legend">${RISK_LEVELS.map(r=>`<span class="${r.css}">${r.name}</span>`).join('')}</div>${navButtons('Risicomatrix maken')}`;
  document.querySelectorAll('.risk-select').forEach(s=>{const paint=()=>{s.className='risk-select '+riskById(s.value).css};paint();s.addEventListener('change',()=>{config.riskMatrix[Number(s.dataset.e)][Number(s.dataset.c)]=s.value;paint()})});
  bindNav(()=>{document.querySelectorAll('.risk-select').forEach(s=>config.riskMatrix[Number(s.dataset.e)][Number(s.dataset.c)]=s.value);saveConfig();showFinal();return false});
}
function showFinal(){
  $('builderPanel').classList.add('hidden');$('stepper').classList.add('hidden');$('finalPanel').classList.remove('hidden');renderFinalMatrix();renderAssessment();window.scrollTo({top:0,behavior:'smooth'});
}
function showBuilder(step=1){currentStep=step;$('finalPanel').classList.add('hidden');$('builderPanel').classList.remove('hidden');$('stepper').classList.remove('hidden');renderStep();window.scrollTo({top:0,behavior:'smooth'});}
function renderFinalMatrix(){
  $('finalMatrix').innerHTML=`<div class="config-summary"><div class="summary-card"><span>Waarden</span><strong>${config.valueCount}</strong></div><div class="summary-card"><span>Effectklassen</span><strong>${config.effectCount}</strong></div><div class="summary-card"><span>Kansklassen</span><strong>${config.chanceCount}</strong></div></div><div class="matrix-scroll" style="margin-top:14px"><table class="matrix"><thead><tr><th class="effect-head">Effect / Kans</th>${Array.from({length:config.chanceCount},(_,c)=>`<th>${c+1}<br><span style="font-weight:400">${escapeHtml(config.chanceDescriptions[c]||'')}</span></th>`).join('')}</tr></thead><tbody>${Array.from({length:config.effectCount},(_,e)=>`<tr><th class="effect-head">${EFFECT_CODES[e]}</th>${Array.from({length:config.chanceCount},(_,c)=>{const r=riskById(config.riskMatrix[e][c]);return `<td class="${r.css}"><strong>${r.name}</strong></td>`}).join('')}</tr>`).join('')}</tbody></table></div><div class="legend">${RISK_LEVELS.map(r=>`<span class="${r.css}">${r.name}</span>`).join('')}</div>`;
}
function renderAssessment(){
  assessment={chance:null,effects:{}};
  $('assessmentChances').innerHTML=Array.from({length:config.chanceCount},(_,i)=>`<div class="choice"><input type="radio" name="assessmentChance" id="chance${i}" value="${i}"><label for="chance${i}"><div><span class="code">${i+1}</span><span class="desc">${escapeHtml(config.chanceDescriptions[i]||'Geen beschrijving')}</span></div></label></div>`).join('');
  document.querySelectorAll('input[name="assessmentChance"]').forEach(x=>x.addEventListener('change',()=>{assessment.chance=Number(x.value);updateAssessment()}));
  $('assessmentRows').innerHTML=config.values.map(v=>`<div class="assessment-row" data-value="${escapeHtml(v)}"><div class="business">${escapeHtml(v)}</div><div class="effect-buttons">${Array.from({length:config.effectCount},(_,i)=>`<button type="button" data-i="${i}" title="${escapeHtml(config.effectDescriptions[v]?.[i]||'')}">${EFFECT_CODES[i]}</button>`).join('')}</div><div class="result-cell"><span class="empty">Nog niet beoordeeld</span></div><div class="effect-detail hidden"></div></div>`).join('');
  document.querySelectorAll('.assessment-row').forEach(row=>row.querySelectorAll('.effect-buttons button').forEach(btn=>btn.addEventListener('click',()=>{const v=row.dataset.value;assessment.effects[v]=Number(btn.dataset.i);row.querySelectorAll('button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const d=row.querySelector('.effect-detail');d.innerHTML=`<strong>Effect ${EFFECT_CODES[Number(btn.dataset.i)]}</strong><br>${escapeHtml(config.effectDescriptions[v]?.[Number(btn.dataset.i)]||'Geen beschrijving ingevuld.')}`;d.classList.remove('hidden');updateAssessment()})));
  updateAssessment();
}
function updateAssessment(){
  let completed=0;let highest=null;const missing=[];
  document.querySelectorAll('.assessment-row').forEach(row=>{const v=row.dataset.value;const e=assessment.effects[v];const cell=row.querySelector('.result-cell');if(assessment.chance===null || e===undefined){cell.innerHTML='<span class="empty">Nog niet beoordeeld</span>';if(e===undefined)missing.push(v);return}const r=riskById(config.riskMatrix[e][assessment.chance]);completed++;if(!highest||r.rank>highest.rank)highest=r;cell.innerHTML=`<span class="risk-badge ${r.css}">${r.name}</span>`});
  $('completedValues').textContent=`${completed} van ${config.values.length}`;$('highestRisk').innerHTML=highest?`<span class="risk-badge ${highest.css}">${highest.name}</span>`:'–';
  const w=$('assessmentWarning');if(assessment.chance===null){w.textContent='Kies eerst een kansklasse.';w.classList.remove('hidden')}else if(missing.length){w.innerHTML=`Nog niet ingevuld: <strong>${missing.map(escapeHtml).join(', ')}</strong>.`;w.classList.remove('hidden')}else{w.classList.add('hidden')}
}
function exportConfig(){
  const blob=new Blob([JSON.stringify(config,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='risicomatrix-configuratie.json';a.click();URL.revokeObjectURL(a.href);
}
$('editMatrixBtn').addEventListener('click',()=>showBuilder(1));$('exportBtn').addEventListener('click',exportConfig);
$('resetAssessmentBtn').addEventListener('click',renderAssessment);
$('clearConfigBtn').addEventListener('click',()=>{if(confirm('Weet je zeker dat je de volledige configuratie wilt wissen?')){localStorage.removeItem(STORAGE_KEY);location.reload()}});
$('importInput').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{config=JSON.parse(await file.text());ensureConfigShape();saveConfig();renderFinalMatrix();renderAssessment();alert('Configuratie geïmporteerd.')}catch(err){alert('Dit bestand bevat geen geldige configuratie.')}e.target.value=''});

const hadSaved=loadConfig();
if(hadSaved){showFinal()}else{renderStep()}
