/* shared by both apps: Sanady ADHD (root) and Sanady for everyone (/app/, which imports this file) */
const MAIN=/\/app\/$/.test(self.registration.scope),P=MAIN?'sanady-main-':'sanady-',UP=MAIN?'../':'';
const SHELL=P+'shell-v14',RT=P+'rt-v1',KEEP=[SHELL,RT,P+'demo-v1'];
const FILES=['./','index.html','manifest.webmanifest'].concat(['app.css','app.js','family.js','life.js','sync.js','sounds.js','demo.js','privacy.html','icon-192.png','icon-512.png'].map(f=>UP+f));
const ICON=UP+'icon-192.png';
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(P)&&!k.startsWith('sanady-main-')===!MAIN&&!KEEP.includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.origin===location.origin){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(SHELL).then(x=>x.put(r,c));return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))));return}
 if(/fonts\.(googleapis|gstatic)\.com/.test(u.host)){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(RT).then(x=>x.put(r,c));return res})))}});

/* ---------- alarms while the app is closed ----------
   The server sends an empty push at the alarm time. The reminder text never leaves the phone:
   the app keeps the alarm list here (IndexedDB) and the worker shows it. */
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open(MAIN?'sanady-main-sw':'sanady-sw',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function kvGet(k){try{const db=await idb();return await new Promise(res=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)})}catch(e){return null}}
async function kvSet(k,v){try{const db=await idb();await new Promise(res=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=res})}catch(e){}}
const VIB=[600,250,600,250,900,400,600,250,600];
function ringNote(a){return self.registration.showNotification('⏰ سندي بيفكّرك',{body:a.text,icon:ICON,badge:ICON,tag:a.k,renotify:true,requireInteraction:true,vibrate:VIB,lang:'ar',dir:'rtl',timestamp:a.at,data:{k:a.k,iid:a.iid,text:a.text},
 actions:[{action:'snooze',title:'فكّرني بعد 10 دقايق'},{action:'ok',title:'تمام ✓'}]})}
self.addEventListener('push',e=>{e.waitUntil((async()=>{
 const data=(await kvGet('alarms'))||{},list=data.list||[],shown=(await kvGet('shown'))||{},now=Date.now();
 const due=list.filter(a=>a.at<=now+90e3&&a.at>now-3*3600e3&&!shown[a.k]);
 const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 if(due.length&&cs.some(c=>c.visibilityState==='visible')){cs.forEach(c=>c.postMessage({t:'alarm'}));return}
 if(!due.length){await self.registration.showNotification('سندي',{body:'عندك تذكير دلوقتي. افتح سندي تشوفه',icon:ICON,badge:ICON,tag:'sanady-check',vibrate:VIB,lang:'ar',dir:'rtl'});return}
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
 if(cs.length){await cs[0].focus();cs[0].postMessage({t:'open',iid:d.iid})}else await self.clients.openWindow('./')})())});
