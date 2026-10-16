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
 if(typeof ExcelJS==='undefined')throw Error('ExcelJS kon niet worden geladen');
 const wb=new ExcelJS.Workbook();wb.creator='DeBruggeniers';wb.calcProperties.fullCalcOnLoad=true;
 const make=(name,rows)=>{const sh=wb.addWorksheet(name);rows.forEach(row=>sh.addRow(row));sh.views=[{state:'frozen',ySplit:1}];sh.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sh.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF234A84'}};sh.getRow(1).height=30;return sh};
 const labels={3:['Klein','Matig','Ernstig'],4:['Verwaarloosbaar','Klein','Behoorlijk','Ernstig'],5:['Verwaarloosbaar','Klein','Matig','Behoorlijk','Ernstig'],6:['Verwaarloosbaar','Klein','Matig','Behoorlijk','Ernstig','Zeer ernstig'],7:['Zeer klein','Klein','Beperkt','Matig','Behoorlijk','Ernstig','Catastrofaal']};
 const labelSheet=wb.addWorksheet('Klassenlabels');labelSheet.state='veryHidden';
 [3,4,5,6,7].forEach((n,col)=>{labelSheet.getCell(1,col+1).value=n;labels[n].forEach((v,row)=>labelSheet.getCell(row+2,col+1).value=v)});
 const effectName=(number)=>'IF('+number+'>Algemeen!$B$5,"",INDEX(Klassenlabels!$A$2:$E$8,'+number+',MATCH(Algemeen!$B$5,Klassenlabels!$A$1:$E$1,0)))';
 const inactive=(sh,range,expr)=>sh.addConditionalFormatting({ref:range,rules:[{type:'expression',formulae:[expr],style:{font:{color:{argb:'FFB4BAC3'}}}}]});
 const colors=[['very-low','FF2E7D32','FFFFFFFF'],['low','FF8BC34A','FF102A12'],['medium','FFFFCA28','FF3D3200'],['high','FFFB8C00','FF311700'],['very-high','FFD32F2F','FFFFFFFF']];
 const paint=(sh,range,anchor)=>colors.forEach(([name,bg,fg])=>sh.addConditionalFormatting({ref:range,rules:[{type:'expression',formulae:[anchor+'="'+name+'"'],style:{fill:{type:'pattern',pattern:'solid',fgColor:{argb:bg},bgColor:{argb:bg}},font:{bold:true,color:{argb:fg}}}}]}));
 const general=make('Algemeen',[['Sleutel','Waarde'],['formaat','risicomatrix-excel'],['schemaVersion',3],['valueCount',c.valueCount],['effectCount',c.effectCount],['chanceCount',c.chanceCount]]);
 general.getColumn(1).width=24;general.getColumn(2).width=30;
 for(const row of [4,5,6]){general.getCell('B'+row).dataValidation={type:'list',allowBlank:false,formulae:[row===4?'"1,2,3,4,5,6,7,8,9,10"':'"3,4,5,6,7"'],showErrorMessage:true,error:'Kies een getal uit de lijst'};general.getCell('B'+row).font={bold:true,color:{argb:'FF1454A4'}}}
 const values=make('Waarden',[['Nummer','Waarde'],...c.values.map((v,i)=>[i+1,v])]);values.getColumn(1).width=15;values.getColumn(2).width=36;
 const effects=make('Effectcriteria',[['Waarde','Effectklasse','Beschrijving','Effectnummer'],...c.values.flatMap(v=>Array.from({length:7},(_,i)=>[v,{formula:effectName(i+1)},c.effectDescriptions[v][i]??'',i+1]))]);
 effects.getColumn(1).width=30;effects.getColumn(2).width=25;effects.getColumn(3).width=80;effects.getColumn(4).hidden=true;
 for(let i=2;i<=1+c.values.length*7;i++)inactive(effects,'A'+i+':C'+i,'$D'+i+'>Algemeen!$B$5');
 const chances=make('Kansklassen',[['Kansklasse','Beschrijving'],...Array.from({length:7},(_,i)=>[i+1,c.chanceDescriptions[i]??''])]);
 chances.getColumn(1).width=19;chances.getColumn(2).width=75;
 for(let i=2;i<=8;i++)inactive(chances,'A'+i+':B'+i,'$A'+i+'>Algemeen!$B$6');
 const risk=make('Risicohouding',[['Effectklasse','Kansklasse','Risicoklasse','Effectnummer','Kansnummer'],...Array.from({length:7},(_,i)=>Array.from({length:7},(_,j)=>[{formula:effectName(i+1)},{formula:'IF('+(j+1)+'>Algemeen!$B$6,"",Kansklassen!B'+(j+2)+')'},c.riskMatrix[i]?.[j]??'',i+1,j+1])).flat()]);
 risk.getColumn(1).width=25;risk.getColumn(2).width=65;risk.getColumn(3).width=25;risk.getColumn(4).hidden=true;risk.getColumn(5).hidden=true;
 for(let i=2;i<=50;i++){risk.getCell('C'+i).dataValidation={type:'list',allowBlank:true,formulae:['"very-low,low,medium,high,very-high"'],showErrorMessage:true,error:'Kies een geldige risicoklasse'};inactive(risk,'A'+i+':C'+i,'OR($D'+i+'>Algemeen!$B$5,$E'+i+'>Algemeen!$B$6)')}
 const matrix=make('Matrix',[['Effect / Kans',...Array.from({length:7},(_,j)=>({formula:'IF('+(j+1)+'<=Algemeen!$B$6,Kansklassen!B'+(j+2)+',"")'}))]]);
 matrix.getColumn(1).width=26;matrix.getColumn(10).hidden=true;matrix.getRow(1).height=65;
 for(let j=2;j<=8;j++){matrix.getColumn(j).width=36;matrix.getCell(1,j).alignment={wrapText:true,vertical:'middle',horizontal:'center'}}
 for(let i=2;i<=8;i++){
  matrix.getCell(i,10).value={formula:'IF('+(i-1)+'<=Algemeen!$B$5,Algemeen!$B$5-'+(i-2)+',"")'};
  matrix.getCell(i,1).value={formula:'IF(J'+i+'="","",INDEX(Klassenlabels!$A$2:$E$8,J'+i+',MATCH(Algemeen!$B$5,Klassenlabels!$A$1:$E$1,0)))'};
  matrix.getRow(i).height=40;
  for(let j=2;j<=8;j++){
   const letter=String.fromCharCode(64+j);
   matrix.getCell(i,j).value={formula:'IF(OR($J'+i+'="",'+letter+'$1=""),"",IFERROR(INDEX(Risicohouding!$C$2:$C$50,($J'+i+'-1)*7+'+(j-1)+'),""))'};
   matrix.getCell(i,j).alignment={horizontal:'center',vertical:'middle'};
  }
 }
 paint(matrix,'B2:H8','B2');matrix.protect('',{selectLockedCells:true,selectUnlockedCells:true}).catch(()=>{});
 const overview=make('Overzicht PDF',[['Effectklasse',...c.values,...Array.from({length:7},(_,j)=>({formula:'Matrix!'+String.fromCharCode(66+j)+'1'}))]]);
 overview.getColumn(1).width=25;overview.getRow(1).height=75;
 for(let col=2;col<=1+c.values.length;col++)overview.getColumn(col).width=56;
 for(let col=2+c.values.length;col<=8+c.values.length;col++)overview.getColumn(col).width=26;
 for(let j=2+c.values.length;j<=8+c.values.length;j++)overview.getCell(1,j).alignment={wrapText:true,vertical:'middle'};
 for(let i=2;i<=8;i++){
  overview.getRow(i).height=94;overview.getCell(i,1).value={formula:'Matrix!A'+i};
  c.values.forEach((v,k)=>{overview.getCell(i,k+2).value={formula:'IF(Matrix!$J'+i+'="","",INDEX(Effectcriteria!$C$2:$C$'+(1+c.values.length*7)+','+(k*7)+'+Matrix!$J'+i+'))'};overview.getCell(i,k+2).alignment={wrapText:true,vertical:'middle'}});
  for(let j=0;j<7;j++){const col=2+c.values.length+j;overview.getCell(i,col).value={formula:'Matrix!'+String.fromCharCode(66+j)+i};overview.getCell(i,col).alignment={horizontal:'center',vertical:'middle',wrapText:true}}
 }
 for(let j=0;j<7;j++){const letter=overview.getColumn(2+c.values.length+j).letter;paint(overview,letter+'2:'+letter+'8',letter+'2')}
 overview.pageSetup={paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:1};
 const tech=make('Technisch',[['Sleutel','Waarde'],['format','risicomatrix-excel'],['schemaVersion',3],['effectPresetCount',c.effectPresetCount??''],['chancePresetCount',c.chancePresetCount??''],['_publicationId',c._publicationId||'']]);tech.getColumn(1).width=26;tech.getColumn(2).width=32;
 return wb.xlsx.writeBuffer().then(buf=>download('risicomatrix-'+new Date().toISOString().slice(0,10)+'.xlsx',buf,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
}
function parseExcel(buffer){
 if(typeof XLSX==='undefined')throw Error('Excelbibliotheek kon niet worden geladen');
 const wb=XLSX.read(buffer,{type:'array'});
 const required=['Algemeen','Waarden','Effectcriteria','Kansklassen','Risicohouding','Technisch'];
 if(required.some(x=>!wb.Sheets[x]))throw Error('Verplichte tabbladen ontbreken');
 const rows=name=>XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:''});
 const meta=Object.fromEntries(rows('Algemeen').slice(1));
 if(meta.formaat!=='risicomatrix-excel'||![1,2,3].includes(Number(meta.schemaVersion)))throw Error('Onbekende Excelversie');
 const version=Number(meta.schemaVersion),tech=Object.fromEntries(rows('Technisch').slice(1));
 const ec=Number(meta.effectCount),cc=Number(meta.chanceCount),vc=Number(meta.valueCount);
 if(!Number.isInteger(ec)||ec<3||ec>7||!Number.isInteger(cc)||cc<3||cc>7)throw Error('Effect- en kansklassen moeten tussen 3 en 7 liggen');
 const values=rows('Waarden').slice(1).filter(r=>r[1]!=='').map(r=>String(r[1]));
 if(values.length!==vc)throw Error('Aantal waarden op Algemeen komt niet overeen met Waarden');
 const effects=Object.fromEntries(values.map(v=>[v,Array(ec).fill(null)]));
 for(const r of rows('Effectcriteria').slice(1)){
  if(r.every(x=>x===''))continue;
  const v=String(r[0]),i=Number(version>=3?r[3]:r[1])-1,d=String(r[2]??'');
  if(!(v in effects)||!Number.isInteger(i)||i<0||i>=7)throw Error('Ongeldige effectregel');
  if(i>=ec){if(d.trim())throw Error('Effectklasse '+(i+1)+' bevat gegevens buiten het ingestelde aantal; verwijder deze bewust');continue;}
  if(effects[v][i]!==null)throw Error('Dubbele effectregel');
  effects[v][i]=d;
 }
 const chances=Array(cc).fill(null);
 for(const r of rows('Kansklassen').slice(1)){
  if(r.every(x=>x===''))continue;
  const i=Number(r[0])-1,d=String(r[1]??'');
  if(!Number.isInteger(i)||i<0||i>=7)throw Error('Ongeldige kansregel');
  if(i>=cc){if(d.trim())throw Error('Kansklasse '+(i+1)+' bevat gegevens buiten het ingestelde aantal; verwijder deze bewust');continue;}
  if(chances[i]!==null)throw Error('Dubbele kansregel');chances[i]=d;
 }
 const matrix=Array.from({length:ec},()=>Array(cc).fill(null));
 for(const r of rows('Risicohouding').slice(1)){
  if(r.every(x=>x===''))continue;
  const i=Number(version>=3?r[3]:r[0])-1,j=Number(version>=3?r[4]:r[1])-1,d=String(r[2]??'');
  if(!Number.isInteger(i)||!Number.isInteger(j)||i<0||i>=7||j<0||j>=7)throw Error('Ongeldige matrixcel');
  if(i>=ec||j>=cc){if(d.trim())throw Error('Risicohouding bevat gegevens buiten de gekozen matrixafmeting');continue;}
  if(matrix[i][j]!==null)throw Error('Dubbele matrixcel');matrix[i][j]=d;
 }
 if(Object.values(effects).some(v=>v.some(x=>x===null||!x.trim()))||chances.some(x=>x===null||!x.trim())||matrix.some(row=>row.some(x=>x===null||!x.trim())))throw Error('Niet alle actieve effectcriteria, kansklassen en risicocellen zijn ingevuld');
 return {valueCount:vc,values,effectCount:ec,effectDescriptions:effects,chanceCount:cc,chanceDescriptions:chances,riskMatrix:matrix,effectPresetCount:ec,chancePresetCount:cc};
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
   const n=compare(config,incoming);const structureChanged=config.effectCount!==incoming.effectCount||config.chanceCount!==incoming.chanceCount;
   if(!confirm((structureChanged?'LET OP: matrixafmeting verandert van '+config.effectCount+'×'+config.chanceCount+' naar '+incoming.effectCount+'×'+incoming.chanceCount+'. Controleer mogelijke verwijdering van gegevens.\n\n':'')+'Import controleren: '+n+' configuratieonderdelen gewijzigd.\nEen lokaal herstelpunt wordt gemaakt.\nDe gepubliceerde versie verandert niet.\n\nImporteren?'))return;
   snapshot(config,'Voor import '+file.name,incoming);const previous=clone(config);try{config=clone(incoming);saveConfig();}catch(err){config=previous;throw err;}showBuilder(1);say('Import geslaagd. Controleer de werkversie vóór publicatie.');
  }catch(e){say('Import geweigerd: '+e.message);}
 };
}
document.addEventListener('DOMContentLoaded',init);
window.RiskConfigManager={snapshot,validate};
})();
