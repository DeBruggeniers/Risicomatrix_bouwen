(function(){
'use strict';
const endpoint=(window.PUBLISH_API_URL||'').replace(/[/]+$/, '')+'/history';
const $=id=>document.getElementById(id);
const clone=x=>JSON.parse(JSON.stringify(x));
const say=message=>{const el=$('configStatus');el.textContent=message;el.classList.remove('hidden');};
let key='';
function getKey(){
 if(key)return key;
 const supplied=window.prompt('Voer het bestaande publicatiewachtwoord in om centrale herstelpunten te beheren:');
 if(supplied===null)return null;
 key=supplied.trim();
 return key||null;
}
async function api(method,body){
 if(!window.PUBLISH_API_URL)throw Error('Publicatie-API is niet ingesteld.');
 const password=getKey();
 if(!password)throw Error('Geen beheerderswachtwoord ingevoerd.');
 const response=await fetch(endpoint,{method,headers:{'X-Admin-Key':password,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}) ,cache:'no-store'});
 const result=await response.json().catch(()=>({}));
 if(response.status===401)key='';
 if(!response.ok)throw Error(result.error||('Serverfout '+response.status));
 return result;
}
async function saveCentral(){
 const btn=$('saveCentralHistoryBtn');btn.disabled=true;
 try{
  const errors=window.RiskConfigManager.validate(config);
  if(errors.length)throw Error(errors.join('; '));
  const label=window.prompt('Omschrijving voor dit herstelpunt:', 'Handmatig opgeslagen werkversie');
  if(label===null)return;
  const result=await api('POST',{config:clone(config),label:label.trim()||'Handmatig opgeslagen werkversie'});
  say('Centraal herstelpunt opgeslagen ('+new Date(result.item.date).toLocaleString('nl-NL')+'). Het publiceren van de risicomatrix is niet gewijzigd.');
 }catch(err){say('Centraal opslaan mislukt: '+err.message);}
 finally{btn.disabled=false;}
}
async function showCentral(){
 const btn=$('loadCentralHistoryBtn');btn.disabled=true;
 try{
  const result=await api('GET');
  const items=result.history||[];
  if(!items.length){say('Er zijn nog geen centrale herstelpunten. Sla eerst een werkversie centraal op.');return;}
  const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:#0009;display:flex;align-items:center;justify-content:center;padding:16px';
  const panel=document.createElement('div');panel.style.cssText='background:white;color:#172b4d;border-radius:14px;padding:22px;width:min(680px,100%);max-height:85vh;overflow:auto';
  const title=document.createElement('h2');title.textContent='Centrale herstelpunten ('+items.length+'/25)';panel.appendChild(title);
  const hint=document.createElement('p');hint.textContent='Herstellen laadt de gekozen versie als lokale werkversie. De gepubliceerde matrix verandert niet.';panel.appendChild(hint);
  for(const item of items){
   const card=document.createElement('div');card.style.cssText='border:1px solid #dbe2ea;border-radius:10px;padding:12px;margin:10px 0';
   const head=document.createElement('strong');head.textContent=new Date(item.date).toLocaleString('nl-NL')+' — '+(item.label||'Herstelpunt');card.appendChild(head);
   const restore=document.createElement('button');restore.type='button';restore.className='secondary';restore.textContent='Deze versie herstellen';restore.style.margin='10px 0 0';restore.onclick=()=>{
    const errors=window.RiskConfigManager.validate(item.config);
    if(errors.length){say('Herstelpunt ongeldig: '+errors.join('; '));return;}
    if(!confirm('Deze centrale versie lokaal herstellen? De huidige lokale werkversie wordt eerst als lokaal herstelpunt opgeslagen. Er wordt niets gepubliceerd.'))return;
    try{
     window.RiskConfigManager.snapshot(config,'Voor centraal herstel',item.config);
     const previous=clone(config);
     try{config=clone(item.config);saveConfig();}catch(err){config=previous;throw err;}
     overlay.remove();showBuilder(1);
     say('Centraal herstelpunt geladen als lokale werkversie. Controleer deze vóór publicatie.');
    }catch(err){say('Herstellen mislukt: '+err.message);}
   };card.appendChild(restore);panel.appendChild(card);
  }
  const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='Sluiten';close.onclick=()=>overlay.remove();panel.appendChild(close);
  overlay.appendChild(panel);document.body.appendChild(overlay);
 }catch(err){say('Centrale herstelpunten ophalen mislukt: '+err.message);}
 finally{btn.disabled=false;}
}
document.addEventListener('DOMContentLoaded',()=>{
 $('saveCentralHistoryBtn')?.addEventListener('click',saveCentral);
 $('loadCentralHistoryBtn')?.addEventListener('click',showCentral);
});
})();