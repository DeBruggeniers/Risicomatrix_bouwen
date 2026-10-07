const RISK_LEVELS=[
{id:'very-low',name:'Zeer laag',css:'risk-very-low',rank:1},
{id:'low',name:'Laag',css:'risk-low',rank:2},
{id:'medium',name:'Middel',css:'risk-medium',rank:3},
{id:'high',name:'Hoog',css:'risk-high',rank:4},
{id:'very-high',name:'Zeer hoog',css:'risk-very-high',rank:5}
];
const EFFECT_CODES=['A','B','C','D','E','F','G'];
function effectLabel(i){return (EFFECT_PRESETS[config.effectCount]?.[i]||EFFECT_CODES[i]).split('\n')[0]}
const CHANCE_CODES=['1','2','3','4','5','6','7'];

const EFFECT_PRESETS={
  3:[
    'Klein\nGeen of beperkt negatief effect',
    'Matig\nDuidelijk negatief effect, merkbare gevolgen',
    'Ernstig\nGroot negatief effect, ernstige gevolgen'
  ],
  4:[
    'Verwaarloosbaar\nGeen of nauwelijks merkbaar negatief effect',
    'Klein\nLicht negatief effect, beperkte gevolgen',
    'Behoorlijk\nGroot negatief effect, serieuze gevolgen',
    'Ernstig\nZeer groot negatief effect, ernstige gevolgen'
  ],
  5:[
    'Verwaarloosbaar\nGeen of nauwelijks merkbaar negatief effect',
    'Klein\nLicht negatief effect, beperkte gevolgen',
    'Matig\nDuidelijk negatief effect, merkbare gevolgen',
    'Behoorlijk\nGroot negatief effect, serieuze gevolgen',
    'Ernstig\nZeer groot negatief effect, ernstige gevolgen'
  ],
  6:[
    'Verwaarloosbaar\nGeen of nauwelijks merkbaar negatief effect',
    'Klein\nLicht negatief effect, beperkte gevolgen',
    'Matig\nDuidelijk negatief effect, merkbare gevolgen',
    'Behoorlijk\nGroot negatief effect, serieuze gevolgen',
    'Ernstig\nZeer groot negatief effect, ernstige gevolgen',
    'Zeer ernstig\nZeer ernstige of mogelijk onomkeerbare gevolgen'
  ],
  7:[
    'Zeer klein\nGeen of nauwelijks merkbaar negatief effect',
    'Klein\nLicht negatief effect, beperkte gevolgen',
    'Beperkt\nDuidelijk negatief effect, maar goed beheersbare gevolgen',
    'Matig\nDuidelijk negatief effect, merkbare gevolgen',
    'Behoorlijk\nGroot negatief effect, serieuze gevolgen',
    'Ernstig\nZeer groot negatief effect, ernstige gevolgen',
    'Catastrofaal\nExtreme en/of onomkeerbare gevolgen'
  ]
};
const STORAGE_KEY='risicomatrix-builder-v2';
const STEP_TITLES=['Waarden','Effectklassen','Effectbeschrijvingen','Kansklassen','Kansbeschrijvingen','Risicohouding'];
const $=id=>document.getElementById(id);
let currentStep=1;
let config=window.PUBLISHED_RISK_CONFIG?JSON.parse(JSON.stringify(window.PUBLISHED_RISK_CONFIG)):{
  "valueCount": 5,
  "values": [
    "Veiligheid",
    "Leefbaarheid",
    "Bereikbaarheid",
    "Financieel",
    "Imago"
  ],
  "effectCount": 5,
  "effectDescriptions": {
    "Veiligheid": [
      "Geen letsel",
      "Licht letsel",
      "Letsel met verzuim",
      "Ernstig letsel",
      "Fataal of blijvend letsel"
    ],
    "Leefbaarheid": [
      "Geen merkbare hinder",
      "Beperkte tijdelijke hinder",
      "Merkbare hinder",
      "Langdurige hinder",
      "Grote structurele aantasting"
    ],
    "Bereikbaarheid": [
      "Geen noemenswaardige hinder",
      "Korte lokale hinder",
      "Merkbare vertraging",
      "Langdurige stremming",
      "Volledige langdurige uitval"
    ],
    "Financieel": [
      "< EUR 1.000",
      "EUR 1.000 - 10.000",
      "EUR 10.000 - 100.000",
      "EUR 100.000 - 1.000.000",
      "> EUR 1.000.000"
    ],
    "Imago": [
      "Geen externe aandacht",
      "Lokale aandacht",
      "Regionale aandacht",
      "Landelijke aandacht",
      "Langdurige reputatieschade"
    ]
  },
  "chanceCount": 5,
  "chanceDescriptions": [
    "Zeer onwaarschijnlijk",
    "Onwaarschijnlijk",
    "Mogelijk",
    "Waarschijnlijk",
    "Zeer waarschijnlijk"
  ],
  "riskMatrix": [
    [
      "very-low",
      "very-low",
      "low",
      "low",
      "medium"
    ],
    [
      "very-low",
      "low",
      "low",
      "medium",
      "high"
    ],
    [
      "low",
      "low",
      "medium",
      "high",
      "high"
    ],
    [
      "low",
      "medium",
      "high",
      "high",
      "very-high"
    ],
    [
      "medium",
      "high",
      "high",
      "very-high",
      "very-high"
    ]
  ]
};

function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function riskById(id){return RISK_LEVELS.find(r=>r.id===id)||RISK_LEVELS[0]}
function makeDefaultMatrix(){
 const rows=[];for(let e=0;e<config.effectCount;e++){const row=[];for(let c=0;c<config.chanceCount;c++){const normalized=(e+c)/Math.max(1,config.effectCount+config.chanceCount-2);row.push(RISK_LEVELS[Math.min(4,Math.floor(normalized*5))].id)}rows.push(row)}config.riskMatrix=rows;
}
function ensureConfigShape(){
 config.valueCount=Math.max(1,Math.min(10,Number(config.valueCount)||1));
 config.values=Array.from({length:config.valueCount},(_,i)=>config.values?.[i]||`Waarde ${i+1}`);
 config.effectCount=Math.max(3,Math.min(7,Number(config.effectCount)||5));
 config.chanceCount=Math.max(3,Math.min(7,Number(config.chanceCount)||5));
 config.effectDescriptions=config.effectDescriptions||{};
 config.values.forEach(v=>{if(!config.effectDescriptions[v])config.effectDescriptions[v]=[];config.effectDescriptions[v]=Array.from({length:config.effectCount},(_,i)=>config.effectDescriptions[v][i]||'')});
 config.chanceDescriptions=Array.from({length:config.chanceCount},(_,i)=>config.chanceDescriptions?.[i]||'');
 if(!Array.isArray(config.riskMatrix)||config.riskMatrix.length!==config.effectCount||config.riskMatrix.some(r=>!Array.isArray(r)||r.length!==config.chanceCount))makeDefaultMatrix();
}
function applyEffectPreset(){
  const preset=EFFECT_PRESETS[config.effectCount]||[];
  config.values.forEach(v=>{
    config.effectDescriptions[v]=Array.from(
      {length:config.effectCount},
      (_,i)=>preset[i]||''
    );
  });
  config.effectPresetCount=config.effectCount;
}

function saveConfig(){localStorage.setItem(STORAGE_KEY,JSON.stringify(config))}
function loadDraft(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){config=JSON.parse(raw)}}catch(e){}ensureConfigShape()}
function renderStepper(){$('stepper').innerHTML=STEP_TITLES.map((t,i)=>`<div class="step ${i+1===currentStep?'active':i+1<currentStep?'done':''}">${i+1}. ${t}</div>`).join('')}
function renderStep(){renderStepper();document.querySelectorAll('.step-panel').forEach((el,i)=>el.classList.toggle('hidden',i+1!==currentStep));({1:renderStep1,2:renderStep2,3:renderStep3,4:renderStep4,5:renderStep5,6:renderStep6})[currentStep]()}
function navButtons(nextText='Volgende'){return `<div class="actions"><div>${currentStep>1?'<button class="secondary" type="button" id="prevBtn">Vorige</button>':''}</div><div class="actions-right"><button class="primary" type="button" id="nextBtn">${nextText}</button></div></div>`}
function bindNav(onNext){
 const p=$('step'+currentStep);const prev=p?.querySelector('#prevBtn');const next=p?.querySelector('#nextBtn');
 prev?.addEventListener('click',()=>{currentStep--;renderStep();window.scrollTo({top:0,behavior:'smooth'})});
 next?.addEventListener('click',()=>{if(onNext()!==false){saveConfig();if(currentStep<6){currentStep++;renderStep();window.scrollTo({top:0,behavior:'smooth'})}}});
}
function renderStep1(){
 $('step1').innerHTML=`<h2>Stap 1. Organisatiewaarden bepalen</h2><p class="hint">Kies hoeveel waarden je wilt opnemen en geef iedere waarde een naam.</p><div class="field small"><label>Aantal waarden</label><select id="valueCount">${Array.from({length:10},(_,i)=>`<option value="${i+1}" ${config.valueCount===i+1?'selected':''}>${i+1}</option>`).join('')}</select></div><div class="value-list" id="valueInputs"></div>${navButtons()}`;
 const draw=()=>{$('valueInputs').innerHTML=Array.from({length:config.valueCount},(_,i)=>`<div class="input-card"><strong>Waarde ${i+1}</strong><div class="field"><label>Naam</label><input class="value-name" value="${esc(config.values[i]||'')}" placeholder="Bijvoorbeeld Veiligheid"></div></div>`).join('')};
 $('valueCount').addEventListener('change',e=>{config.valueCount=Number(e.target.value);config.values=Array.from({length:config.valueCount},(_,i)=>config.values[i]||'');draw()});draw();
 bindNav(()=>{const names=[...document.querySelectorAll('.value-name')].map(x=>x.value.trim());if(names.some(x=>!x)){alert('Vul voor iedere waarde een naam in.');return false}if(new Set(names.map(x=>x.toLowerCase())).size!==names.length){alert('Gebruik iedere waarde maar één keer.');return false}const old=config.effectDescriptions||{};config.values=names;config.effectDescriptions={};names.forEach(v=>config.effectDescriptions[v]=old[v]||Array(config.effectCount).fill(''));ensureConfigShape();return true});
}
function renderStep2(){
 $('step2').innerHTML=`<h2>Stap 2. Aantal effectklassen</h2><p class="hint">Kies 3 t/m 7 effectklassen. In stap 3 worden automatisch passende standaardbeschrijvingen ingevuld. Je kunt deze daarna per organisatiewaarde aanpassen.</p><div class="field small"><label>Aantal effectklassen</label><select id="effectCount">${[3,4,5,6,7].map(n=>`<option value="${n}" ${config.effectCount===n?'selected':''}>${n}</option>`).join('')}</select></div><div class="notice" id="effectCountNotice">Bij ${config.effectCount} klassen gebruik je: ${Array.from({length:config.effectCount},(_,i)=>effectLabel(i)).join(', ')}.</div>${navButtons()}`;
 $('effectCount').addEventListener('change',e=>{
   config.effectCount=Number(e.target.value);
   ensureConfigShape();
   config.effectPresetCount=null;
   $('effectCountNotice').textContent=`Bij ${config.effectCount} klassen gebruik je: ${Array.from({length:config.effectCount},(_,i)=>effectLabel(i)).join(', ')}.`;
 });
 bindNav(()=>{
   if(config.effectPresetCount!==config.effectCount) applyEffectPreset();
   return true;
 });
}
function renderStep3(){
 $('step3').innerHTML=`<h2>Stap 3. Effectbeschrijvingen per waarde</h2><p class="hint">Beschrijf per organisatiewaarde wat iedere effectklasse betekent.</p>${config.values.map(v=>`<h3>${esc(v)}</h3><div class="class-list">${Array.from({length:config.effectCount},(_,i)=>`<div class="input-card"><strong>Effect ${effectLabel(i)}</strong><div class="field"><label>Beschrijving</label><textarea class="effect-desc" data-value="${esc(v)}" data-i="${i}">${esc(config.effectDescriptions[v]?.[i]||'')}</textarea></div></div>`).join('')}</div>`).join('')}${navButtons()}`;
 bindNav(()=>{document.querySelectorAll('.effect-desc').forEach(x=>config.effectDescriptions[x.dataset.value][Number(x.dataset.i)]=x.value.trim());return true});
}
function renderStep4(){
 $('step4').innerHTML=`<h2>Stap 4. Aantal kansklassen</h2><p class="hint">Kies 3 t/m 7 kansklassen.</p><div class="field small"><label>Aantal kansklassen</label><select id="chanceCount">${[3,4,5,6,7].map(n=>`<option value="${n}" ${config.chanceCount===n?'selected':''}>${n}</option>`).join('')}</select></div><div class="notice" id="chanceCountNotice">Bij ${config.chanceCount} klassen gebruik je: ${CHANCE_CODES.slice(0,config.chanceCount).join(', ')}.</div>${navButtons()}`;
 $('chanceCount').addEventListener('change',e=>{config.chanceCount=Number(e.target.value);ensureConfigShape();$('chanceCountNotice').textContent=`Bij ${config.chanceCount} klassen gebruik je: ${CHANCE_CODES.slice(0,config.chanceCount).join(', ')}.`});bindNav(()=>true);
}
function renderStep5(){
 $('step5').innerHTML=`<h2>Stap 5. Kansklassen beschrijven</h2><p class="hint">Beschrijf wat iedere kansklasse betekent.</p><div class="class-list">${Array.from({length:config.chanceCount},(_,i)=>`<div class="input-card"><strong>Kansklasse ${i+1}</strong><div class="field"><label>Beschrijving</label><textarea class="chance-desc" data-i="${i}">${esc(config.chanceDescriptions[i]||'')}</textarea></div></div>`).join('')}</div>${navButtons()}`;
 bindNav(()=>{document.querySelectorAll('.chance-desc').forEach(x=>config.chanceDescriptions[Number(x.dataset.i)]=x.value.trim());return true});
}
function renderStep6(){
 ensureConfigShape();$('step6').innerHTML=`<h2>Stap 6. Risicohouding bepalen</h2><p class="hint">Geef per combinatie van effect en kans de risicoklasse aan.</p><div class="matrix-scroll"><table class="matrix"><thead><tr><th class="effect-head">Effect / Kans</th>${Array.from({length:config.chanceCount},(_,c)=>`<th>${c+1}<br><span style="font-weight:400">${esc(config.chanceDescriptions[c]||'')}</span></th>`).join('')}</tr></thead><tbody>${Array.from({length:config.effectCount},(_,row)=>config.effectCount-1-row).map(e=>`<tr><th class="effect-head">${effectLabel(e)}</th>${Array.from({length:config.chanceCount},(_,c)=>`<td><select class="risk-select" data-e="${e}" data-c="${c}">${RISK_LEVELS.map(r=>`<option value="${r.id}" ${config.riskMatrix[e][c]===r.id?'selected':''}>${r.name}</option>`).join('')}</select></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="legend">${RISK_LEVELS.map(r=>`<span class="${r.css}">${r.name}</span>`).join('')}</div>${navButtons('Risicomatrix maken')}`;
 document.querySelectorAll('.risk-select').forEach(s=>{const paint=()=>s.className='risk-select '+riskById(s.value).css;paint();s.addEventListener('change',()=>{config.riskMatrix[Number(s.dataset.e)][Number(s.dataset.c)]=s.value;paint()})});
 bindNav(()=>{document.querySelectorAll('.risk-select').forEach(s=>config.riskMatrix[Number(s.dataset.e)][Number(s.dataset.c)]=s.value);saveConfig();showFinal();return false});
}
function showFinal(){$('builderPanel').classList.add('hidden');$('stepper').classList.add('hidden');$('finalPanel').classList.remove('hidden');renderFinalMatrix();window.scrollTo({top:0,behavior:'smooth'})}
function showBuilder(step=1){currentStep=step;$('finalPanel').classList.add('hidden');$('builderPanel').classList.remove('hidden');$('stepper').classList.remove('hidden');renderStep();window.scrollTo({top:0,behavior:'smooth'})}
function renderFinalMatrix(){$('finalMatrix').innerHTML=`<div class="matrix-scroll"><table class="matrix"><thead><tr><th class="effect-head">Effect / Kans</th>${Array.from({length:config.chanceCount},(_,c)=>`<th>${c+1}<br><span style="font-weight:400">${esc(config.chanceDescriptions[c]||'')}</span></th>`).join('')}</tr></thead><tbody>${Array.from({length:config.effectCount},(_,row)=>config.effectCount-1-row).map(e=>`<tr><th class="effect-head">${effectLabel(e)}</th>${Array.from({length:config.chanceCount},(_,c)=>{const r=riskById(config.riskMatrix[e][c]);return `<td class="${r.css}"><strong>${r.name}</strong></td>`}).join('')}</tr>`).join('')}</tbody></table></div><div class="legend">${RISK_LEVELS.map(r=>`<span class="${r.css}">${r.name}</span>`).join('')}</div>`}
function downloadPublishedConfig(){
  const content = 'window.PUBLISHED_RISK_CONFIG = ' + JSON.stringify(config, null, 2) + ';\\n';
  const blob = new Blob([content], {type:'text/javascript'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'config.js';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}

async function waitUntilLive(publicationId,status){
  const started=Date.now();
  const timeoutMs=60*1000;
  const endpoint=(window.PUBLISH_API_URL||'').replace(/\/$/,'')+'/';

  while(Date.now()-started<timeoutMs){
    const seconds=Math.round((Date.now()-started)/1000);
    status.innerHTML='<strong>Publicatie ontvangen.</strong> Controleren of de nieuwe matrix beschikbaar is... ('+seconds+' sec)';
    try{
      const response=await fetch(endpoint+'?t='+Date.now(),{cache:'no-store'});
      if(response.ok){
        const data=await response.json();
        if(data?.config?._publicationId===publicationId) return true;
      }
    }catch(e){}
    await wait(1000);
  }
  return false;
}

async function publishConfig(){
  const status=$('publishStatus');
  const endpoint=window.PUBLISH_API_URL||'';
  const key=$('publishKey').value.trim();
  status.classList.remove('hidden');

  if(!endpoint){
    status.textContent='De publicatie-API is nog niet gekoppeld. Vul eerst de Worker-URL in publish-config.js in.';
    return;
  }
  if(!key){
    status.textContent='Vul het publicatiewachtwoord in.';
    return;
  }

  $('publishBtn').disabled=true;
  status.textContent='Risicomatrix publiceren...';

  const publicationId='pub-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
  const publishedConfig={...config,_publicationId:publicationId};

  try{
    const res=await fetch(endpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Admin-Key':key},
      body:JSON.stringify({config:publishedConfig})
    });

    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error||('Publiceren mislukt ('+res.status+').'));

    const live=await waitUntilLive(publicationId,status);

    if(live){
      const useUrl=new URL('index.html',window.location.href);
      useUrl.searchParams.set('t',Date.now().toString());
      status.innerHTML='<strong>✓ Nieuwe risicomatrix staat online.</strong> De gebruikspagina en QR-code gebruiken nu de nieuwe matrix. <a href="'+useUrl.toString()+'">Gebruikspagina openen</a>';
    }else{
      status.innerHTML='<strong>GitHub is bijgewerkt, maar de nieuwe configuratie kon binnen 1 minuut nog niet worden bevestigd.</strong> Probeer de gebruikspagina opnieuw te openen.';
    }
  }catch(err){
    status.textContent=err.message||'Publiceren mislukt.';
  }finally{
    $('publishBtn').disabled=false;
  }
}
loadDraft();renderStep();
$('editMatrixBtn').addEventListener('click',()=>showBuilder(1));
$('publishBtn').addEventListener('click',publishConfig);
$('downloadBtn').addEventListener('click',downloadPublishedConfig);
