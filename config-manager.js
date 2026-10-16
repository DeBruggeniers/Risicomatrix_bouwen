(function(){
'use strict';
const LEVELS=['very-low','low','medium','high','very-high'];
const VERSION=1, HISTORY_KEY='risicomatrix-builder-history-v1';
const $=id=>document.getElementById(id);
const clone=o=>JSON.parse(JSON.stringify(o));
function validate(c){
 const errors=[];
 if(!c||typeof c!=='object'||Array.isArray(c))return ['Geen geldige configuratie'];
 if(!Number.isInteger(c.valueCount)||c.valueCount<1||c.valueCount>10)errors.push('Aantal waarden ongeldig');
 if(!Array.isArray(c.values)||c.values.length!==c.valueCount||c.values.some(v=>typeof v!=='string'||!v.trim())||new Set((c.values||[]).map(v=>String(v).toLowerCase())).size!==c.valueCount)errors.push('Waarden ontbreken of zijn dubbel');
 if(!Number.isInteger(c.effectCount)||c.effectCount<3||c.effectCount>7)errors.push('Aantal effectklassen ongeldig');
 if(!Number.isInteger(c.chanceCount)||c.chanceCount<3||c.chanceCount>7)errors.push('Aantal kansklassen ongeldig');
 if(!c.effectDescriptions||typeof c.effectDescriptions!=='object'||(c.values||[]).some(v=>!Array.isArray(c.effectDescriptions[v])||c.effectDescriptions[v].length!==c.effectCount||c.effectDescriptions[v].some(x=>typeof x!=='string')))errors.push('Effectbeschrijvingen ongeldig');
 if(!Array.isArray(c.chanceDescriptions)||c.chanceDescriptions.length!==c.chanceCount||c.chanceDescriptions.some(x=>typeof x!=='string'))errors.push('Kansbeschrijvingen ongeldig');
 if(!Array.isArray(c.riskMatrix)||c.riskMatrix.length!==c.effectCount||c.riskMatrix.some(row=>!Array.isArray(row)||row.length!==c.chanceCount||row.some(x=>!LEVELS.includes(x))))errors.push('Risicomatrix ongeldig');
 return errors;
}
const MAX_HISTORY=25;
function differences(before,after){
 const out=[];
 const a=before.values||[],b=after.values||[];
 for(const v of b.filter(x=>!a.includes(x)))out.push('Waarde toegevoegd: '+v);
 for(const v of a.filter(x=>!b.includes(x)))out.push('Waarde verwijderd: '+v);
 if(before.effectCount!==after.effectCount)out.push('Aantal effectklassen aangepast: '+before.effectCount+' → '+after.effectCount);
 if(before.chanceCount!==after.chanceCount)out.push('Aantal kansklassen aangepast: '+before.chanceCount+' → '+after.chanceCount);
 for(const v of b.filter(x=>a.includes(x))){
  const old=before.effectDescriptions?.[v]||[],now=after.effectDescriptions?.[v]||[];
  const count=now.filter((x,i)=>x!==old[i]).length;
  if(count)out.push('Effectcriteria '+v+' aangepast ('+count+')');
 }
 const chances=(after.chanceDescriptions||[]).filter((x,i)=>x!==(before.chanceDescriptions||[])[i]).length;
 if(chances)out.push('Kansklassen aangepast ('+chances+')');
 let risk=0;for(let i=0;i<(after.riskMatrix||[]).length;i++)for(let j=0;j<(after.riskMatrix[i]||[]).length;j++)if(after.riskMatrix[i][j]!==before.riskMatrix?.[i]?.[j])risk++;
 if(risk)out.push('Risicohouding aangepast ('+risk+' cellen)');
 return out;
}
function historyRead(){const h=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(h)?h:[];}
function snapshot(c,label,next){
 const history=historyRead();
 history.unshift({date:new Date().toISOString(),label,changes:next?differences(c,next):null,config:clone(c)});
 localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,MAX_HISTORY)));
}
function showHistory(status,say){
 const old=$('restoreHistoryDialog');if(old)old.remove();
 const history=historyRead();if(!history.length)return say('Er zijn nog geen lokale herstelpunten.');
 const overlay=document.createElement('div');overlay.id='restoreHistoryDialog';
 overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px';
 const panel=document.createElement('div');panel.style.cssText='background:white;color:#172b4d;border-radius:14px;padding:22px;width:min(650px,100%);max-height:85vh;overflow:auto;box-shadow:0 12px 35px #0003';
 const title=document.createElement('h2');title.textContent='Herstelpunten (maximaal '+MAX_HISTORY+')';panel.appendChild(title);
 const hint=document.createElement('p');hint.textContent='Een herstelpunt bewaart de toestand vóór de vermelde wijziging. Oudere herstelpunten zonder wijzigingsinformatie blijven beschikbaar.';panel.appendChild(hint);
 history.forEach((item,i)=>{
  const card=document.createElement('div');card.style.cssText='border:1px solid #dbe2ea;border-radius:10px;padding:12px;margin:10px 0';
  const head=document.createElement('strong');head.textContent=new Date(item.date).toLocaleString('nl-NL')+' — '+item.label;card.appendChild(head);
  const summary=document.createElement('p');summary.style.margin='8px 0';summary.textContent=Array.isArray(item.changes)?(item.changes.length?item.changes.join(' · '):'Geen inhoudelijke verschillen vastgesteld'):'Wijzigingen bij dit oudere herstelpunt niet vastgelegd';card.appendChild(summary);
  const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='Deze versie herstellen';button.onclick=()=>{
   if(!confirm('Deze oudere werkversie herstellen? De huidige werkversie wordt eerst als herstelpunt opgeslagen. Publicatie gebeurt niet automatisch.'))return;
   try{
    snapshot(config,'Voor herstel',item.config);
    const previous=clone(config);try{config=clone(item.config);saveConfig()}catch(err){config=previous;throw err}
    overlay.remove();showBuilder(1);say('Herstelpunt geladen. Controleer de werkversie vóór publicatie.');
   }catch(err){say('Herstel mislukt: '+err.message)}
  };card.appendChild(button);panel.appendChild(card);
 });
 const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='Sluiten';close.onclick=()=>overlay.remove();panel.appendChild(close);overlay.appendChild(panel);document.body.appendChild(overlay);
}
function download(name,content,type){
 const u=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);
}
function backup(c){download('risicomatrix-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({format:'risicomatrix-backup',schemaVersion:VERSION,exportedAt:new Date().toISOString(),configuration:c},null,2),'application/json');}
function excel(c){
 if(typeof XLSX==='undefined')throw Error('Excelbibliotheek kon niet worden geladen');const w=XLSX.utils.book_new();
 const add=(name,rows)=>XLSX.utils.book_append_sheet(w,XLSX.utils.aoa_to_sheet(rows),name);
 add('Algemeen',[['Sleutel','Waarde'],['formaat','risicomatrix-excel'],['schemaVersion',VERSION],['valueCount',c.valueCount],['effectCount',c.effectCount],['chanceCount',c.chanceCount]]);
 add('Waarden',[['Nummer','Waarde'],...c.values.map((v,i)=>[i+1,v])]);
 add('Effectcriteria',[['Waarde','Effectklasse','Beschrijving'],...c.values.flatMap(v=>c.effectDescriptions[v].map((d,i)=>[v,i+1,d]))]);
 add('Kansklassen',[['Kansklasse','Beschrijving'],...c.chanceDescriptions.map((d,i)=>[i+1,d])]);
 add('Risicohouding',[['Effectklasse','Kansklasse','Risicoklasse'],...c.riskMatrix.flatMap((row,i)=>row.map((r,j)=>[i+1,j+1,r]))]);
 add('Matrix',[['Effect / Kans',...c.chanceDescriptions.map((_,i)=>i+1)],...c.riskMatrix.map((row,i)=>[i+1,...row]).reverse()]);
 add('Technisch',[['Sleutel','Waarde'],['format','risicomatrix-excel'],['schemaVersion',VERSION],['effectPresetCount',c.effectPresetCount??''],['chancePresetCount',c.chancePresetCount??''],['_publicationId',c._publicationId||'']]);
 XLSX.writeFile(w,'risicomatrix-'+new Date().toISOString().slice(0,10)+'.xlsx');
}
function parseExcel(buffer){
 if(typeof XLSX==='undefined')throw Error('Excelbibliotheek kon niet worden geladen');const w=XLSX.read(buffer,{type:'array'});const required=['Algemeen','Waarden','Effectcriteria','Kansklassen','Risicohouding','Technisch'];
 if(required.some(s=>!w.Sheets[s]))throw Error('Verplichte tabbladen ontbreken');
 const rows=s=>XLSX.utils.sheet_to_json(w.Sheets[s],{header:1,defval:''});
 const meta=Object.fromEntries(rows('Algemeen').slice(1));if(meta.formaat!=='risicomatrix-excel'||Number(meta.schemaVersion)!==VERSION)throw Error('Onbekende Excelversie');
 const tech=Object.fromEntries(rows('Technisch').slice(1));
 const values=rows('Waarden').slice(1).filter(r=>r[1]!== '').map(r=>String(r[1]));
 const ec=Number(meta.effectCount),cc=Number(meta.chanceCount);
 const effects=Object.fromEntries(values.map(v=>[v,Array(ec).fill(null)]));
 for(const r of rows('Effectcriteria').slice(1)){const v=String(r[0]),i=Number(r[1])-1;if(!(v in effects)||!Number.isInteger(i)||i<0||i>=ec||effects[v][i]!==null)throw Error('Ongeldige of dubbele effectregel');effects[v][i]=String(r[2]);}
 const chances=Array(cc).fill(null);
 for(const r of rows('Kansklassen').slice(1)){const i=Number(r[0])-1;if(!Number.isInteger(i)||i<0||i>=cc||chances[i]!==null)throw Error('Ongeldige kansregel');chances[i]=String(r[1]);}
 const matrix=Array.from({length:ec},()=>Array(cc).fill(null));
 for(const r of rows('Risicohouding').slice(1)){const i=Number(r[0])-1,j=Number(r[1])-1;if(!Number.isInteger(i)||!Number.isInteger(j)||i<0||i>=ec||j<0||j>=cc||matrix[i][j]!==null)throw Error('Ongeldige of dubbele matrixcel');matrix[i][j]=String(r[2]);}
 if(Object.values(effects).some(a=>a.includes(null))||chances.includes(null)||matrix.some(a=>a.includes(null)))throw Error('Excelbestand is onvolledig');
 return {valueCount:Number(meta.valueCount),values,effectCount:ec,effectDescriptions:effects,chanceCount:cc,chanceDescriptions:chances,riskMatrix:matrix,effectPresetCount:tech.effectPresetCount===''?null:Number(tech.effectPresetCount),chancePresetCount:tech.chancePresetCount===''?null:Number(tech.chancePresetCount)};
}
function compare(a,b){let changed=0;for(const k of ['values','effectDescriptions','chanceDescriptions','riskMatrix','valueCount','effectCount','chanceCount'])if(JSON.stringify(a[k])!==JSON.stringify(b[k]))changed++;return changed;}
function init(){
 const status=$('configStatus'),input=$('importConfigFile');
 const say=t=>{status.textContent=t;status.classList.remove('hidden');};
 $('exportExcelBtn').onclick=()=>{try{excel(config)}catch(e){say(e.message)}};
 $('exportJsonBtn').onclick=()=>backup(config);
 $('importConfigBtn').onclick=()=>input.click();
 $('restoreConfigBtn').onclick=()=>showHistory(status,say);
 input.onchange=async()=>{
  const file=input.files[0];input.value='';if(!file)return;
  try{
   let incoming;
   if(/\.xlsx$/i.test(file.name)){incoming=parseExcel(await file.arrayBuffer());}
   else if(/\.json$/i.test(file.name)){const obj=JSON.parse(await file.text());incoming=obj.format==='risicomatrix-backup'&&obj.schemaVersion===VERSION?obj.configuration:obj;}
   else throw Error('Gebruik een .xlsx- of .json-bestand');
   const errors=validate(incoming);if(errors.length)throw Error(errors.join('; '));
   const n=compare(config,incoming);
   if(!confirm('Import controleren: '+n+' configuratieonderdelen gewijzigd.\nEen lokaal herstelpunt wordt gemaakt.\nDe gepubliceerde versie verandert niet.\n\nImporteren?'))return;
   snapshot(config,'Voor import '+file.name,incoming);const previous=clone(config);try{config=clone(incoming);saveConfig();}catch(err){config=previous;throw err;}showBuilder(1);say('Import geslaagd. Controleer de werkversie vóór publicatie.');
  }catch(e){say('Import geweigerd: '+e.message);}
 };
}
document.addEventListener('DOMContentLoaded',init);
window.RiskConfigManager={snapshot,validate};
})();
