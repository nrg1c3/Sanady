/* Sayvo (سايفو): the app shell offline, and alarms that ring while the app is closed */
const P='sayvo-',MAIN=true,BRAND='سايفو';
const SHELL=P+'shell-v2',RT=P+'rt-v1',KEEP=[SHELL,RT,P+'demo-v1'];
const FILES=['./','index.html','manifest.webmanifest','app.css','i18n.js','i18n-en.js','i18n-fr.js','i18n-es.js','i18n-de.js','app.js','family.js','life.js','sync.js','work.js','agent.js','adhd.js','trust.js','doit.js','coach.js','sounds.js','demo.js','privacy.html','icon-192.png','icon-512.png'];
const ICON='icon-192.png';
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith(P)||k.startsWith('sanady-')||k.startsWith('mudabbir-'))&&!KEEP.includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.origin===location.origin){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(SHELL).then(x=>x.put(r,c));return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))));return}
 if(/fonts\.(googleapis|gstatic)\.com/.test(u.host)){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(RT).then(x=>x.put(r,c));return res})))}});

/* ---------- alarms while the app is closed ----------
   The server sends an empty push at the alarm time. The reminder text never leaves the phone:
   the app keeps the alarm list here (IndexedDB) and the worker shows it. */
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open('sayvo-sw',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function kvGet(k){try{const db=await idb();return await new Promise(res=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)})}catch(e){return null}}
async function kvSet(k,v){try{const db=await idb();await new Promise(res=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=res})}catch(e){}}
/* the alarm words in the person's language (the page saves it as 'lang') */
const SWT={en:{r:' is reminding you',c:'You have a reminder now. Open {b} to see it',s:'Remind me in 10 minutes',o:'OK ✓'},
 fr:{r:' te rappelle',c:'Tu as un rappel maintenant. Ouvre {b} pour le voir',s:'Rappelle-moi dans 10 minutes',o:'OK ✓'},
 es:{r:' te recuerda',c:'Tienes un recordatorio ahora. Abre {b} para verlo',s:'Recuérdamelo en 10 minutos',o:'Listo ✓'},
 de:{r:' erinnert dich',c:'Du hast jetzt eine Erinnerung. Öffne {b}, um sie zu sehen',s:'In 10 Minuten erinnern',o:'Okay ✓'}};
let LG=null;const lg=async()=>{if(LG==null)LG=(await kvGet('lang'))||'ar';return LG};
const BR=l=>l==='ar'?BRAND:'Sayvo';
const VIB=[600,250,600,250,900,400,600,250,600];
async function ringNote(a){const l=await lg(),W=SWT[l];return self.registration.showNotification('⏰ '+BR(l)+(W?W.r:' بيفكّرك'),{body:a.text,icon:ICON,badge:ICON,tag:a.k,renotify:true,requireInteraction:true,vibrate:VIB,lang:W?l:'ar',dir:W?'ltr':'rtl',timestamp:a.at,data:{k:a.k,iid:a.iid,text:a.text},
 actions:[{action:'snooze',title:W?W.s:'فكّرني بعد 10 دقايق'},{action:'ok',title:W?W.o:'تمام ✓'}]})}
self.addEventListener('push',e=>{e.waitUntil((async()=>{
 const data=(await kvGet('alarms'))||{},list=data.list||[],shown=(await kvGet('shown'))||{},now=Date.now();
 const due=list.filter(a=>a.at<=now+90e3&&a.at>now-3*3600e3&&!shown[a.k]);
 const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 if(due.length&&cs.some(c=>c.visibilityState==='visible')){cs.forEach(c=>c.postMessage({t:'alarm'}));return}
 if(!due.length){const l=await lg(),W=SWT[l];await self.registration.showNotification(BR(l),{body:W?W.c.replace('{b}',BR(l)):'عندك تذكير دلوقتي. افتح '+BRAND+' تشوفه',icon:ICON,badge:ICON,tag:'sanady-check',vibrate:VIB,lang:W?l:'ar',dir:W?'ltr':'rtl'});return}
 for(const a of due.slice(0,4)){shown[a.k]=now;await ringNote(a)}
 Object.keys(shown).forEach(k=>{if(now-shown[k]>3*864e5)delete shown[k]});await kvSet('shown',shown)})())});
self.addEventListener('notificationclick',e=>{e.notification.close();const d=e.notification.data||{};e.waitUntil((async()=>{
 if(e.action==='snooze'&&d.iid){const at=Date.now()+10*60e3,k=(d.iid+'@'+at).replace(/[^A-Za-z0-9@._:-]/g,'');
  const q=(await kvGet('pending'))||[];q.push({iid:d.iid,snooze:at});await kvSet('pending',q);
  const s=(await kvGet('alarms'))||{};s.list=(s.list||[]).concat([{k,iid:d.iid,at,text:d.text||'تذكير'}]);await kvSet('alarms',s);
  if(s.dev&&s.sub&&s.url){try{await fetch(s.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k:'wasl-nrg-2026',d:s.dev,t:s.tok||'',mode:'add',sub:s.sub,times:[{k,at}]})})}catch(err){}}
  return}
 if(e.action==='ok')return;
 const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 if(cs.length){await cs[0].focus();cs[0].postMessage({t:'open',iid:d.iid})}else await self.clients.openWindow('./'+(d.iid&&/^🧾/.test(d.text||'')?'#pay='+d.iid:''))})())});
