/* ---------- TRUST: alarms you can count on, a backup you can't lose, the pilot's numbers, and the language ---------- */
const TAPI='https://api.nrg-egypt.com/webhook/';
const tDev=()=>{try{return localStorage.getItem(DK+'dev')||''}catch(e){return ''}};
const tGet=k=>{try{return localStorage.getItem(DK+k)}catch(e){return null}};
const tSet=(k,v)=>{try{v==null?localStorage.removeItem(DK+k):localStorage.setItem(DK+k,v)}catch(e){}};
const IS_LIVE=!DEMO&&PFX===DK;

/* 1) alarm health check + test ring + calendar backup */
ALARM_EXTRA.push((from,end)=>{const t=store.get('atest',0);return t&&t>=from&&t<=end?[{k:'test'+t,iid:'life',at:t,text:'🔔 دي رنة تجربة من '+BRAND+'. لو سمعتها يبقى المنبّه شغال ✓'}]:[]});
async function alarmHealth(){const r={perm:'Notification' in window?Notification.permission:'none',push:pushOn(),sub:false,installed:matchMedia('(display-mode: standalone)').matches||!!navigator.standalone,android:/Android/i.test(navigator.userAgent),ios:/iPhone|iPad/i.test(navigator.userAgent)};
 try{const g=await Promise.race([navigator.serviceWorker.getRegistration(),new Promise(z=>setTimeout(()=>z(null),1500))]);r.sub=!!(g&&g.pushManager&&await g.pushManager.getSubscription())}catch(e){}return r}
async function alarmSheet(){const h=await alarmHealth();const ok=h.perm==='granted'&&h.push&&h.sub;const row=(good,t,fix)=>`<div class="wtask"><div class="tx"><b>${good?'✅':'⚠️'} ${t}</b>${!good&&fix?`<small class="note">${fix}</small>`:''}</div></div>`;
 openSheet(`<h2>🔔 المنبّه شغال؟</h2><p class="note">${ok?'كله تمام. اعمل رنة تجربة عشان تتأكد بودانك.':'فيه حاجة محتاجة تتظبط عشان المنبّه يرن والتطبيق مقفول.'}</p>
 ${row(h.perm==='granted','مسموح بالإشعارات','دوس «شغّل المنبّه» ووافق.')}${row(h.push&&h.sub,'المنبّه متوصل بالسيرفر','دوس «شغّل المنبّه».')}
 ${row(h.installed,'متنزّل على الشاشة الرئيسية',h.ios?'على الآيفون لازم: زرار المشاركة ← Add to Home Screen.':'من قايمة كروم ← Install app (أو نزّل ملف التطبيق).')}
 ${h.android?row(store.get('battOk',false),'الموبايل مش بيقفل التطبيق عشان البطارية','الإعدادات ← التطبيقات ← '+BRAND+' (أو كروم) ← البطارية ← «بدون قيود». في شاومي وسامسونج كمان: اقفل «توفير البطارية» للتطبيق.'):''}
 <div class="stack" style="margin-top:10px">${ok?'':'<button class="btn" id="ahOn">شغّل المنبّه</button>'}<button class="btn ${ok?'':'ghost'}" id="ahTest">جرّب رنة بعد دقيقة</button>
 ${h.android?'<button class="btn ghost" id="ahBatt">ظبطت البطارية ✓</button>':''}<button class="btn ghost" id="ahCal">📅 حط الدوا والمواعيد في الكالندر كمان (احتياطي)</button></div>
 <p class="note">الكالندر بتاع الموبايل بيرن لوحده حتى لو النت قاطع، فخليه احتياطي للحاجات المهمة.</p>`);
 const on=$('ahOn');if(on)on.onclick=async()=>{await enablePush();alarmSheet()};
 $('ahTest').onclick=async()=>{store.set('atest',nowMs()+65e3);await writeAlarms();await pushSync(true);toast('هرن بعد دقيقة. اقفل التطبيق لو عايز تتأكد إنه بيرن وهو مقفول ⏱️',6000)};
 const b=$('ahBatt');if(b)b.onclick=()=>{store.set('battOk',true);alarmSheet()};
 $('ahCal').onclick=()=>{const imp=items.filter(i=>!i.done&&i.due&&(i.type==='med'||i.type==='appt'||i.type==='bill')&&parseL(i.due)>nowMs());if(!imp.length){toast('مفيش دوا ولا مواعيد جاية');return}icsSave(imp.map(icsEvent),'sanady-important.ics');toast('افتح الملف عشان يتضاف للكالندر')}}
NUDGE_EXTRA.push((t,hard)=>{if(!IS_LIVE||pushOn()||store.get('ahNag','')===dayKey())return[];const need=items.some(i=>!i.done&&(i.type==='med'||i.type==='appt')&&i.due&&parseL(i.due)>t);if(!need)return[];
 return[{id:'ah'+dayKey(),pr:72,i:'🔔',p:'عندك دوا أو مواعيد، والمنبّه لسه مقفول. لو التطبيق اتقفل مش هقدر أفكّرك.',acts:[['شغّله',()=>{store.set('ahNag',dayKey());alarmSheet()}],['بعدين',()=>{store.set('ahNag',dayKey());render()}]]}]});

/* iPhone: Safari only rings alarms and keeps data safe once the app is on the home screen (iOS 16.4+) */
const IOS_TAB=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)&&!(matchMedia('(display-mode: standalone)').matches||navigator.standalone);
function iosSheet(){openSheet(`<h2>📲 حط ${BRAND} على الشاشة الرئيسية</h2><div class="stack"><p>على الآيفون، المنبّه مش بيرن والتطبيق مقفول غير لما يتحط على الشاشة الرئيسية. خطوتين بس:</p>
 <div class="wtask"><div class="tx"><b>1. دوس زرار المشاركة</b><small class="note">المربع اللي طالع منه سهم ⬆️، تحت في سفاري</small></div></div>
 <div class="wtask"><div class="tx"><b>2. اختار «Add to Home Screen»</b><small class="note">أو «إضافة إلى الشاشة الرئيسية»، وبعدين «Add»</small></div></div>
 <p class="note">افتح ${BRAND} من الأيقونة الجديدة، ودوس «شغّل المنبّه». محتاج iOS 16.4 أو أحدث. الآيفون بيفصل بيانات سفاري عن الأيقونة، فلو سجلت حاجات هنا اعمل نسخة احتياطية من الإعدادات الأول، وارجّعها في الأيقونة.</p>
 <button class="btn" id="iosOk">تمام</button></div>`);$('iosOk').onclick=()=>{store.set('iosNag',dayKey());closeSheet();render()}}
NUDGE_EXTRA.push((t,hard)=>{if(!IS_LIVE||!IOS_TAB()||store.get('iosNag','')===dayKey())return[];
 return[{id:'ios'+dayKey(),pr:74,i:'📲',p:'على الآيفون لازم تحطني على الشاشة الرئيسية عشان أرن عليك والتطبيق مقفول. خطوتين بس.',acts:[['وريني إزاي',iosSheet],['بعدين',()=>{store.set('iosNag',dayKey());render()}]]}]});

/* 2) encrypted backup in the cloud, opened only with your recovery code */
const BKA='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const bkNewCode=()=>{const a=crypto.getRandomValues(new Uint8Array(20));return Array.from(a,x=>BKA[x%BKA.length]).join('').replace(/(.{5})(?=.)/g,'$1-')};
const bkNorm=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
async function bkKeys(code){const c=bkNorm(code),enc=new TextEncoder();const h=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode('sanady-backup:'+c)));
 const bid=Array.from(h.slice(0,16)).map(x=>('0'+x.toString(16)).slice(-2)).join('');const base=await crypto.subtle.importKey('raw',enc.encode(c),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:enc.encode('sanady-backup-v1'),iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);return{bid,key}}
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const BKC_SKIP=/^(dev|tok|tok_at|bk_code|bk_at|bk_sig|hs_snap|home_code|pilot)$/;
function bkPayload(){const o={};Object.keys(localStorage).forEach(k=>{if(!k.startsWith(PFX))return;const s=k.slice(PFX.length);if(BKC_SKIP.test(s))return;o[s]=localStorage.getItem(k)});return JSON.stringify({v:1,ed:ED,at:nowMs(),d:o})}
async function bkCall(body){const r=await fetch(TAPI+'sanady-backup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({k:'wasl-nrg-2026',d:tDev()},body))});const j=await r.json().catch(()=>null);if(!r.ok||!j||!j.ok)throw new Error((j&&j.why)||'server');return j}
async function backupNow(quiet){const code=tGet('bk_code');if(!code||!IS_LIVE||!crypto.subtle)return false;
 try{const p=bkPayload();const sig=p.length+':'+p.slice(-200);if(quiet&&sig===tGet('bk_sig')&&nowMs()-(+tGet('bk_at')||0)<7*864e5)return true;
  const {bid,key}=await bkKeys(code);const iv=crypto.getRandomValues(new Uint8Array(12));const c=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(p));
  const data=b64(iv)+'.'+b64(c);if(data.length>600000){if(!quiet)toast('البيانات كبيرة قوي على النسخة السحابية، اعمل نسخة ملف');return false}
  await bkCall({b:bid,op:'put',data});tSet('bk_at',String(nowMs()));tSet('bk_sig',sig);if(!quiet)toast('☁️ اتعملت نسخة');return true}catch(e){if(!quiet)toast('مقدرتش أعمل النسخة دلوقتي، هحاول تاني لوحدي');return false}}
async function backupRestore(code){const {bid,key}=await bkKeys(code);const j=await bkCall({b:bid,op:'get'});if(!j.data)throw new Error('none');
 const [a,c]=j.data.split('.');const p=JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(a)},key,unb64(c))));
 if(!p||!p.d)throw new Error('bad');Object.entries(p.d).forEach(([k,v])=>{try{localStorage.setItem(PFX+k,v)}catch(e){}});tSet('bk_code',bkNorm(code).replace(/(.{5})(?=.)/g,'$1-'));return p}
function backupCloudSheet(){const code=tGet('bk_code');const at=+tGet('bk_at')||0;
 if(!code){openSheet(`<h2>☁️ نسخة احتياطية تلقائية</h2><p>كل يوم ${esc(BRAND)} يعمل نسخة من بياناتك على السيرفر، مقفولة بكود سري إنت بس اللي معاك. لو الموبايل ضاع أو اتمسح، ترجّع كل حاجة بالكود.</p>
  <p class="note">🔒 النسخة بتتقفل على موبايلك قبل ما تطلع، والسيرفر مبيقدرش يفتحها. لو الكود ضاع، محدش يقدر يرجّعها، ولا إحنا.</p>
  <button class="btn" id="bcOn">شغّل النسخة التلقائية</button><hr><label class="form">عندك كود من موبايل قديم؟<input id="bcIn" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" dir="ltr"></label><button class="btn ghost" id="bcGet">رجّع بياناتي</button>`);
  $('bcOn').onclick=async()=>{const c=bkNewCode();tSet('bk_code',c);const ok=await backupNow(false);
   openSheet(`<h2>اكتب الكود ده في مكان آمن</h2><div class="kbig" dir="ltr" style="font-size:24px;letter-spacing:1px">${c}</div><p class="note">ابعته لنفسك واتساب أو اكتبه في ورقة. من غيره مفيش رجوع للنسخة.</p>${draftBox('كود نسخة '+BRAND+' الاحتياطية (متشاركهوش): '+c)}${ok?'':'<p class="note">النسخة الأولى هتتعمل أول ما النت يرجع.</p>'}`)};
  $('bcGet').onclick=async()=>{const c=$('bcIn').value;if(bkNorm(c).length!==20){toast('الكود 20 حرف');return}$('bcGet').disabled=true;
   try{await backupRestore(c);toast('رجعت بياناتك ✓');setTimeout(()=>location.reload(),900)}catch(e){$('bcGet').disabled=false;toast(e.message==='none'?'مفيش نسخة بالكود ده':'الكود غلط أو مفيش نت')}};return}
 openSheet(`<h2>☁️ النسخة التلقائية شغالة</h2><p>آخر نسخة: ${at?esc(fmtWhen(toLocal(new Date(at)))):'لسه'}</p><p class="note">الكود بتاعك: <b dir="ltr">${esc(code)}</b></p>
  <div class="stack"><button class="btn" id="bcNow">اعمل نسخة دلوقتي</button><button class="btn ghost" id="bcOff" style="color:var(--red)">اقفل النسخة التلقائية</button></div>`);
 $('bcNow').onclick=async()=>{await backupNow(false);backupCloudSheet()};$('bcOff').onclick=()=>{tSet('bk_code',null);tSet('bk_at',null);toast('اتقفلت');closeSheet()}}

/* 3) pilot: anonymous daily numbers (counts only) for testers who opt in, and a weekly 3-question check-in */
let PILOT=store.get('pilot',null);const savePilot=()=>store.set('pilot',PILOT);
const _applyTalk=applyTalk;applyTalk=function(r,text){const k='dump_'+dayKey();store.set(k,(store.get(k,0)||0)+1);return _applyTalk.apply(this,arguments)};
function dayStats(k){const inDay=ms=>ms&&dayKey(new Date(ms))===k;const done=items.filter(i=>i.done&&inDay(i.doneAt)&&!i.ghost);
 const due=done.filter(i=>i.due);const ontime=due.filter(i=>i.doneAt<=parseL(i.due).getTime()+30*6e4).length;
 const al=ALOG.filter(e=>inDay(e.at));const rated=(PILOT&&PILOT.r||{})[k]||{};
 return{captured:items.filter(i=>inDay(i.created)).length,done:done.length,done_due:due.length,on_time:ontime,dumps:store.get('dump_'+k,0)||0,
  agent:al.length,agent_undo:al.filter(e=>e.undone).length,replans:al.filter(e=>e.undo&&e.undo.due).length,
  alarms:Object.values(store.get('rung',{})||{}).filter(inDay).length,simple:simpleOn()?1:0,push:pushOn()?1:0,
  ...(rated.s?{r_start:rated.s,r_miss:rated.m,r_calm:rated.c}:{})}}
async function pilotSend(){if(!PILOT||!PILOT.on||!IS_LIVE)return;const n=NOW();const y=new Date(n);y.setDate(y.getDate()-1);
 for(const d of [y,n]){const k=dayKey(d);if(PILOT.sent&&PILOT.sent[k]&&k!==dayKey())continue;
  try{const r=await fetch(TAPI+'sanady-pilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k:'wasl-nrg-2026',d:tDev(),p:PILOT.pid,day:k,ed:ED,stats:dayStats(k)})});if(r.ok){PILOT.sent=PILOT.sent||{};PILOT.sent[k]=1}}catch(e){}}
 const ks=Object.keys(PILOT.sent||{}).sort().slice(-40);PILOT.sent=Object.fromEntries(ks.map(k=>[k,1]));savePilot()}
function pilotSheet(){if(PILOT&&PILOT.on){const L=[...Array(14)].map((_,i)=>{const d=NOW();d.setDate(d.getDate()-i);return dayStats(dayKey(d))});const s=k=>L.reduce((a,x)=>a+(x[k]||0),0);const dd=s('done_due');
  openSheet(`<h2>🧪 إنت في تجربة ${esc(BRAND)}</h2><p class="note">آخر 14 يوم (الأرقام دي بس اللي بتتبعت، من غير أي كلام ولا أسماء):</p>
  <div class="blocks"><div class="blk"><b class="num">${s('done')}</b><small>حاجات خلصتها</small></div><div class="blk"><b class="num">${dd?Math.round(s('on_time')/dd*100)+'%':'-'}</b><small>اتعملت في ميعادها</small></div><div class="blk"><b class="num">${s('dumps')}</b><small>مرات فرّغت دماغك</small></div><div class="blk"><b class="num">${s('agent')}</b><small>حاجات ${esc(BRAND)} عملها لوحده</small></div></div>
  <div class="stack"><button class="btn" id="plRate">قيّم أسبوعك (3 أسئلة)</button><button class="btn ghost" id="plOff" style="color:var(--red)">اخرج من التجربة</button></div>`);
  $('plRate').onclick=pilotRate;$('plOff').onclick=()=>{PILOT.on=false;savePilot();toast('خرجت من التجربة');closeSheet()};return}
 openSheet(`<h2>🧪 انضم لتجربة ${esc(BRAND)}</h2><p>بنجرب التطبيق مع ناس عندها ADHD عشان نعرف بيفرق ولا لأ. لو وافقت، التطبيق هيبعت كل يوم أرقام بس: كام حاجة سجلت، كام خلصت، كام في ميعادها.</p>
 <p class="note">🔒 من غير أي كلام قولته، ولا أسماء، ولا أرقام تليفونات. كود عشوائي مش مربوط بيك، وتقدر تخرج في أي وقت.</p>
 <label class="form">كود التجربة (من فريقنا)<input id="plCode" dir="ltr" placeholder="SANADY26"></label><button class="btn" id="plJoin">موافق، انضم</button>`);
 $('plJoin').onclick=()=>{const c=$('plCode').value.trim().toUpperCase();if(!/^[A-Z0-9]{4,12}$/.test(c)){toast('اكتب كود التجربة');return}
  const a=crypto.getRandomValues(new Uint8Array(20));PILOT={on:true,code:c,pid:Array.from(a,x=>'abcdefghijkmnpqrstuvwxyz23456789'[x%32]).join(''),since:dayKey(),r:{},sent:{}};savePilot();pilotSend();closeSheet();toast('شكراً إنك معانا 💛')}}
function pilotRate(){const q=[['s','الأسبوع ده قدرت تبدأ الحاجات أسهل؟'],['m','فوّت مواعيد وحاجات أقل من العادي؟'],['c','حاسس إن دماغك أهدى وأوضح؟']];
 openSheet(`<h2>أسبوعك كان عامل إزاي؟</h2>${q.map(([k,t])=>`<p><b>${t}</b></p><div class="seg" data-q="${k}">${[1,2,3,4,5].map(v=>`<button data-v="${v}">${['خالص','شوية','نص نص','آه','جداً'][v-1]}</button>`).join('')}</div>`).join('')}<button class="btn" id="plSave" style="margin-top:12px">احفظ</button>`);
 const ans={};document.querySelectorAll('#sheetBody [data-q]').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{ans[g.dataset.q]=+b.dataset.v;g.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))}));
 $('plSave').onclick=()=>{if(!ans.s||!ans.m||!ans.c){toast('جاوب على التلاتة');return}PILOT.r=PILOT.r||{};PILOT.r[dayKey()]=ans;PILOT.rAt=dayKey();if(PILOT.sent)delete PILOT.sent[dayKey()];savePilot();pilotSend();closeSheet();toast('شكراً 💛')}}
NUDGE_EXTRA.push((t,hard)=>{if(!PILOT||!PILOT.on)return[];const last=PILOT.rAt||PILOT.since;if((new Date(dayKey())-new Date(last))/864e5<7||store.get('plNag','')===dayKey())return[];
 return[{id:'pl'+dayKey(),pr:30,i:'🧪',p:'عدّى أسبوع في التجربة. 3 أسئلة سريعة عن أسبوعك؟',acts:[['يلا',()=>{store.set('plNag',dayKey());pilotRate()}],['بكرة',()=>{store.set('plNag',dayKey());render()}]]}]});

/* 3b) usage numbers for everyone: counts only (never text, names or numbers), so we learn what people really use.
   A random id that isn't tied to the device or the person; off any time in settings. */
function feat(k){if(!/^[a-z_]{1,16}$/.test(k))return;const key='ft_'+dayKey();const f=store.get(key,{})||{};f[k]=(f[k]||0)+1;store.set(key,f)}
function usageStats(k){const born=store.get('born',1);const st=Object.assign({},dayStats(k));delete st.simple;
 st.auto=1;st.focus=IS_ADHD?1:0;st.installed=(matchMedia('(display-mode: standalone)').matches||navigator.standalone)?1:0;
 st.ios=/iPhone|iPad|iPod/i.test(navigator.userAgent)?1:0;st['l_'+(window.UI_LANG||'ar')]=1;if(born>1)st.age=Math.floor((Date.now()-born)/864e5);
 const f=store.get('ft_'+k,{})||{};Object.entries(f).forEach(([x,v])=>{if(Object.keys(st).length<38)st['f_'+x]=v});return st}
async function usageSend(){if(!IS_LIVE||store.get('noStats',false)||(PILOT&&PILOT.on))return;
 let aid=store.get('aid','');if(!/^[a-z0-9]{24}$/.test(aid)){const a=crypto.getRandomValues(new Uint8Array(24));aid=Array.from(a,x=>'abcdefghijkmnpqrstuvwxyz23456789'[x%32]).join('');store.set('aid',aid)}
 const sent=store.get('usent',{})||{};const y=NOW();y.setDate(y.getDate()-1);
 for(const d of [y,NOW()]){const k=dayKey(d);if(sent[k]===2||(sent[k]===1&&k===dayKey()))continue;
  try{const r=await fetch(TAPI+'sanady-pilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k:'wasl-nrg-2026',d:tDev(),p:aid,day:k,ed:ED,stats:usageStats(k)})});
   if(r.ok)sent[k]=k===dayKey()?1:2}catch(e){}}
 store.set('usent',Object.fromEntries(Object.keys(sent).sort().slice(-10).map(k=>[k,sent[k]])))}
window.addEventListener('load',()=>{const W=(n,k)=>{const f=window[n];if(typeof f!=='function')return;window[n]=function(){try{feat(typeof k==='function'?k.apply(null,arguments):k)}catch(e){}return f.apply(this,arguments)}};
 W('doSheet','do');W('coachSheet','coach');W('summSheet','summ');W('buddySheet','buddy');W('plansSheet','plans');W('focusSheet','focus');W('alarmSheet','alarm');W('iosSheet','ios');
 W('setMode',m=>'m_'+String(m||'').replace(/[^a-z]/g,''));W('setView',v=>'v_'+String(v||'').replace(/[^a-z]/g,''))});

/* 4) language of the conversation: Egyptian, Gulf, or English */
const LANGS=[['eg','مصري'],['gulf','خليجي'],['en','English'],['fr','Français'],['es','Español'],['de','Deutsch']];

/* settings entries */
function trustSettings(){const box=document.querySelector('#sheetBody .form');if(!box||$('sAlarm'))return;
 const nm=$('sN');nm&&nm.closest('label').insertAdjacentHTML('afterend',`<label>لغة الكلام مع ${esc(BRAND)}<select id="sLang">${LANGS.map(([k,v])=>`<option value="${k}" ${(prof.lang||'eg')===k?'selected':''}>${v}</option>`).join('')}</select></label>`);
 $('sLang').onchange=e=>{const v=e.target.value,was=window.UI_LANG||'ar';prof.lang=v;save();
  const ui=['en','fr','es','de'].includes(v)?v:'ar';if(ui!==was){try{KV.set('lang',ui)}catch(x){}location.reload();return}
  toast(v==='gulf'?'تم، بكلمك خليجي':'تمام، مصري')};
 const k=$('sNot');k&&k.insertAdjacentHTML('afterend',`<button class="btn ghost" id="sAlarm">🩺 اتأكد إن المنبّه شغال</button><button class="btn ghost" id="sCloud">☁️ نسخة احتياطية تلقائية${tGet('bk_code')?' ✓':''}</button>${IS_ADHD?`<button class="btn ghost" id="sPilot">🧪 تجربة ${esc(BRAND)}${PILOT&&PILOT.on?' ✓':''}</button>`:''}`);
 $('sCloud').insertAdjacentHTML('afterend',`<label class="tog"><input type="checkbox" id="sStats" ${store.get('noStats',false)?'':'checked'}> ابعت أرقام استخدام مجهولة (عدد بس، من غير أي كلام) عشان نحسّن ${esc(BRAND)}</label>`);
 $('sStats').onchange=e=>store.set('noStats',!e.target.checked);
 $('sAlarm').onclick=alarmSheet;$('sCloud').onclick=backupCloudSheet;if($('sPilot'))$('sPilot').onclick=pilotSheet}

function trustTick(){if(!IS_LIVE)return;backupNow(true);pilotSend();usageSend()}
setTimeout(trustTick,8000);setInterval(trustTick,30*6e4);
Object.assign(window,{feat,usageStats,usageSend,iosSheet,alarmSheet,backupCloudSheet,backupNow,backupRestore,pilotSheet,pilotRate,dayStats,trustSettings,bkNewCode});
