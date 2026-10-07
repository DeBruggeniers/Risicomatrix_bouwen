const RISK_LEVELS=[{id:'very-low',name:'Zeer laag',css:'risk-very-low',rank:1},{id:'low',name:'Laag',css:'risk-low',rank:2},{id:'medium',name:'Middel',css:'risk-medium',rank:3},{id:'high',name:'Hoog',css:'risk-high',rank:4},{id:'very-high',name:'Zeer hoog',css:'risk-very-high',rank:5}];
const EFFECT_CODES=['A','B','C','D','E','F','G']; const $=id=>document.getElementById(id); const config=window.PUBLISHED_RISK_CONFIG; let assessment={chance:null,effects:{}};
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function riskById(id){return RISK_LEVELS.find(r=>r.id===id)||RISK_LEVELS[0]}
function renderAssessment(){
 assessment={chance:null,effects:{}};
 $('assessmentChances').innerHTML=Array.from({length:config.chanceCount},(_,i)=>`<div class="choice"><input type="radio" name="assessmentChance" id="chance${i}" value="${i}"><label for="chance${i}"><div><span class="code">${i+1}</span><span class="desc">${esc(config.chanceDescriptions[i]||'Geen beschrijving')}</span></div></label></div>`).join('');
 document.querySelectorAll('input[name="assessmentChance"]').forEach(x=>x.addEventListener('change',()=>{assessment.chance=Number(x.value);updateAssessment()}));
 $('assessmentRows').innerHTML=config.values.map(v=>`<div class="assessment-row" data-value="${esc(v)}"><div class="business">${esc(v)}</div><div class="effect-buttons">${Array.from({length:config.effectCount},(_,i)=>`<button type="button" data-i="${i}" title="${esc(config.effectDescriptions[v]?.[i]||'')}">${EFFECT_CODES[i]}</button>`).join('')}</div><div class="result-cell"><span class="empty">Nog niet beoordeeld</span></div><div class="effect-detail hidden"></div></div>`).join('');
 document.querySelectorAll('.assessment-row').forEach(row=>row.querySelectorAll('.effect-buttons button').forEach(btn=>btn.addEventListener('click',()=>{const v=row.dataset.value;assessment.effects[v]=Number(btn.dataset.i);row.querySelectorAll('button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const d=row.querySelector('.effect-detail');d.innerHTML=`<strong>Effect ${EFFECT_CODES[Number(btn.dataset.i)]}</strong><br>${esc(config.effectDescriptions[v]?.[Number(btn.dataset.i)]||'Geen beschrijving ingevuld.')}`;d.classList.remove('hidden');updateAssessment()})));
 updateAssessment();
}
function updateAssessment(){
 let completed=0,highest=null;const missing=[];
 document.querySelectorAll('.assessment-row').forEach(row=>{const v=row.dataset.value,e=assessment.effects[v],cell=row.querySelector('.result-cell');if(assessment.chance===null||e===undefined){cell.innerHTML='<span class="empty">Nog niet beoordeeld</span>';if(e===undefined)missing.push(v);return}const r=riskById(config.riskMatrix[e][assessment.chance]);completed++;if(!highest||r.rank>highest.rank)highest=r;cell.innerHTML=`<span class="risk-badge ${r.css}">${r.name}</span>`});
 $('completedValues').textContent=`${completed} van ${config.values.length}`; $('highestRisk').innerHTML=highest?`<span class="risk-badge ${highest.css}">${highest.name}</span>`:'–';
 const w=$('assessmentWarning');if(assessment.chance===null){w.textContent='Kies eerst een kansklasse.';w.classList.remove('hidden')}else if(missing.length){w.innerHTML=`Nog niet ingevuld: <strong>${missing.map(esc).join(', ')}</strong>.`;w.classList.remove('hidden')}else w.classList.add('hidden');
}
function renderMatrix(){
 $('finalMatrix').innerHTML=`<div class="matrix-scroll"><table class="matrix"><thead><tr><th class="effect-head">Effect / Kans</th>${Array.from({length:config.chanceCount},(_,c)=>`<th>${c+1}<br><span style="font-weight:400">${esc(config.chanceDescriptions[c]||'')}</span></th>`).join('')}</tr></thead><tbody>${Array.from({length:config.effectCount},(_,e)=>`<tr><th class="effect-head">${EFFECT_CODES[e]}</th>${Array.from({length:config.chanceCount},(_,c)=>{const r=riskById(config.riskMatrix[e][c]);return `<td class="${r.css}"><strong>${r.name}</strong></td>`}).join('')}</tr>`).join('')}</tbody></table></div><div class="legend">${RISK_LEVELS.map(r=>`<span class="${r.css}">${r.name}</span>`).join('')}</div>`;
}
if(!config){document.body.innerHTML='<p style="padding:20px">Geen gepubliceerde risicomatrix gevonden.</p>'}else{renderAssessment();renderMatrix();$('resetAssessmentBtn').addEventListener('click',renderAssessment)}
