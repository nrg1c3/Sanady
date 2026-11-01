/* ================= Sanady · سندي ================= */
'use strict';
const BRAIN_URL='https://2.31.109.72.sslip.io/webhook/sanady-brain';
const TTS_URL='https://2.31.109.72.sslip.io/webhook/wasl-tts';
/* every request to our server carries a signed device token (the voice service requires it) */
(()=>{const BASE='https://2.31.109.72.sslip.io/webhook/',K='wasl-nrg-2026',_fetch=window.fetch.bind(window);
 const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}},set=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
 let dev=get('sn_dev');if(!dev||!/^[A-Za-z0-9_-]{8,64}$/.test(dev)){dev=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)).replace(/[^A-Za-z0-9]/g,'').slice(0,32);set('sn_dev',dev)}
 let tok=get('sn_tok')||'',triedAt=+(get('sn_tok_at')||0),pending=null;
 const register=()=>pending||(pending=(async()=>{try{const r=await _fetch(BASE+'wasl-register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k:K,d:dev})});const j=await r.json();tok=(j&&j.t)||'';set('sn_tok',tok)}catch(e){}triedAt=Date.now();set('sn_tok_at',String(triedAt));pending=null})());
 window.fetch=async function(u,o){if(typeof u!=='string'||!u.startsWith(BASE)||u.endsWith('wasl-register')||!o||typeof o.body!=='string')return _fetch(u,o);
  let b;try{b=JSON.parse(o.body)}catch(e){return _fetch(u,o)}if(!b||b.k!==K)return _fetch(u,o);
  if(!tok&&Date.now()-triedAt>6*3600e3)await register();
  const send=()=>_fetch(u,Object.assign({},o,{body:JSON.stringify(Object.assign(b,{t:tok}))}));let r=await send();
  if(r.status===429){const j=await r.clone().json().catch(()=>({}));if(j&&j.why==='token'){tok='';await register();r=await send()}}return r}})();
const $=id=>document.getElementById(id);
const minsAr=m=>m==1?'دقيقة':m==2?'دقيقتين':m<=10?m+' دقايق':m+' دقيقة';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PFX=new URLSearchParams(location.search).has('demo')?'sndemo_':'sn_';
const store={get(k,d){try{const v=JSON.parse(localStorage.getItem(PFX+k));return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(PFX+k,JSON.stringify(v))}catch(e){}}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
let DEMO=null; // set by demo.js
const nowMs=()=>DEMO&&DEMO.t0?DEMO.t0+(Date.now()-DEMO.real0):Date.now();
const NOW=()=>new Date(nowMs());
const pad=n=>String(n).padStart(2,'0');
const toLocal=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
const dayKey=d=>(d||NOW()).toISOString?toLocal(d||NOW()).slice(0,10):'';
const parseL=s=>s?new Date(s):null;
const DAYS=['الحد','الاتنين','التلات','الأربع','الخميس','الجمعة','السبت'];
const MONTHS=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const fmtT=d=>{let h=d.getHours(),m=d.getMinutes();const ap=h<12?'الصبح':h<17?'الضهر':'بالليل';const h12=h%12||12;return h12+(m?':'+pad(m):'')+' '+ap};
function fmtWhen(s){const d=parseL(s);if(!d||isNaN(d))return'';const n=NOW();const dd=Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-new Date(n.getFullYear(),n.getMonth(),n.getDate()))/864e5);
 const t=(d.getHours()||d.getMinutes())?' '+fmtT(d):'';
 if(dd===0)return'النهارده'+t;if(dd===1)return'بكرة'+t;if(dd===-1)return'امبارح'+t;if(dd>1&&dd<7)return DAYS[d.getDay()]+t;return d.getDate()+' '+MONTHS[d.getMonth()]+t}
const money=n=>Math.round(n||0).toLocaleString('en-US');
const daysAgo=ms=>Math.floor((nowMs()-ms)/864e5);
const nDays=n=>n===1?'يوم':n===2?'يومين':(n>=3&&n<=10)?n+' أيام':n+' يوم';

/* ---------- state ---------- */
const SEC={work:['💼','الشغل'],money:['💳','الفلوس'],people:['👨‍👩‍👧','العيلة والناس'],shop:['🛒','المشتريات'],home:['🏠','البيت'],health:['🩺','الصحة'],papers:['📄','الورق والمصالح'],travel:['✈️','السفر'],study:['📚','الدراسة'],me:['🎨','اهتماماتي']};
const TYPE={task:'مهمة',idea:'فكرة',buy:'مشتريات',bill:'فاتورة',appt:'ميعاد',med:'دوا',call:'تواصل'};
let items=store.get('items',[]);
let M=store.get('money',{bal:0,sal:0,pay:1,daily:150,buf:1000,week:500,brake:1500,spends:[],saved:0});
let wish=store.get('wish',[]);
let places=store.get('places',{});
let people=store.get('people',[]);
let prof=store.get('prof',{name:'',sex:'m',voice:true,vg:'f',wake:'07:30',sleep:'23:30',travel:30,prep:'المفاتيح، البطاقة، الشاحن'});
let pts=store.get('pts',{p:0,days:{}});
let travel=store.get('travel',{});
let diary=store.get('diary',[]);
let nsn=store.get('nsn',{});
let docs=store.get('docs',{}); // document name -> expiry date (YYYY-MM-DD)
const save=()=>{store.set('items',items);store.set('money',M);store.set('wish',wish);store.set('places',places);store.set('people',people);store.set('prof',prof);store.set('pts',pts);store.set('travel',travel);store.set('diary',diary);store.set('nsn',nsn);store.set('docs',docs);tgSoon()};
const isOpen=i=>!i.done;
const byId=id=>items.find(i=>i.id===id);

/* ---------- ui helpers ---------- */
function toast(t,ms){const e=$('toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,ms||2600)}
let sheetClose=null;
function openSheet(html,onClose){$('sheetBody').innerHTML=html;$('sheet').hidden=false;sheetClose=onClose||null;$('sheet').querySelector('.sbox').scrollTop=0}
function closeSheet(){$('sheet').hidden=true;$('sheetBody').innerHTML='';const f=sheetClose;sheetClose=null;stopRec();f&&f();render()}
$('sheetX').onclick=closeSheet;$('sheet').onclick=e=>{if(e.target.id==='sheet')closeSheet()};
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
function confetti(){const set=[['⭐','✨','🎉'],['🌟','💜','🎊'],['🔥','💪','⭐'],['🌈','✨','🫶'],['🏆','🎯','✨']][Math.floor(Math.random()*5)];const c=$('confetti');
 for(let i=0;i<18;i++){const e=document.createElement('i');e.textContent=set[i%3];e.style.left=Math.random()*100+'%';e.style.animationDelay=Math.random()*.4+'s';c.appendChild(e);setTimeout(()=>e.remove(),2200)}}

/* ---------- points & rewards (rotating so it never gets boring) ---------- */
const CHEERS=['عاش! 👏','حلو أوي، كده إنت ماشي','خطوة صغيرة بس فرقت','برافو عليك','كده تمام، واحدة واحدة','إنت أشطر مما بتفتكر','ده كان صعب وعملته','يا سلام عليك','كمّل كده','اللي بيبدأ بيخلّص، وإنت بدأت'];
const CHEERS_F=['عاشت! 👏','حلو أوي، كده إنتِ ماشية','خطوة صغيرة بس فرقت','برافو عليكِ','كده تمام، واحدة واحدة','إنتِ أشطر مما بتفتكري','ده كان صعب وعملتيه','يا سلام عليكِ','كمّلي كده','اللي بيبدأ بيخلّص، وإنتِ بدأتي'];
const cheer=()=>{const a=prof.sex==='f'?CHEERS_F:CHEERS;return DEMO?a[0]:a[Math.floor(Math.random()*a.length)]};
function award(n){pts.p+=n;const k=dayKey();pts.days[k]=(pts.days[k]||0)+1;save();const lv=Math.floor(pts.p/100);if(Math.floor((pts.p-n)/100)<lv){confetti();toast('🏆 وصلت مستوى '+(lv+1)+'! '+cheer(),3500)}}
const doneToday=()=>items.filter(i=>i.done&&i.doneAt&&dayKey(new Date(i.doneAt))===dayKey());

/* ---------- item actions ---------- */
function addItem(x){const it={id:uid(),type:x.type||'task',sec:x.sec||'home',title:x.title,due:x.due||'',where:x.where||'',amount:x.amount||0,repeat:x.repeat||'',big:!!x.big,created:nowMs(),done:false,star:false,steps:x.steps||null,from:x.from||''};items.push(it);save();return it}
function rollRepeat(it){const d=parseL(it.due)||NOW();if(it.repeat==='daily')d.setDate(d.getDate()+1);else if(it.repeat==='weekly')d.setDate(d.getDate()+7);else d.setMonth(d.getMonth()+1);it.due=toLocal(d);it.snooze=0;it.notified=0}
function finish(id,silent){const it=byId(id);if(!it)return;
 if(it.type==='bill'&&it.amount){M.bal=(M.bal||0)-it.amount;M.spends.push({a:it.amount,note:it.title,d:nowMs(),bill:1})}
 if(it.repeat){items.push({...it,id:uid(),done:true,doneAt:nowMs(),repeat:'',ghost:1});rollRepeat(it)}
 else{it.done=true;it.doneAt=nowMs()}
 award(it.big?20:10);save();if(!silent){buzz([20,40,20]);confetti();toast(cheer())}render()}
function snooze(id,mins){const it=byId(id);if(!it)return;it.snooze=nowMs()+mins*6e4;it.touched=nowMs();save();render()}
function toTomorrow(id){const it=byId(id);if(!it)return;const d=NOW();d.setDate(d.getDate()+1);d.setHours(10,0,0,0);it.due=toLocal(d);it.touched=nowMs();it.notified=0;save();render()}
function removeItem(id){items=items.filter(i=>i.id!==id);save();render()}

/* ---------- money math ---------- */
function nextPayday(){const n=NOW();const day=Math.min(28,Math.max(1,M.pay||1));let d=new Date(n.getFullYear(),n.getMonth(),day,9);if(d<=n)d=new Date(n.getFullYear(),n.getMonth()+1,day,9);return d}
function billsBefore(end){const n=NOW();const out=[];items.filter(i=>i.type==='bill'&&!i.done).forEach(b=>{let d=parseL(b.due)||n;let k=0;while(d<end&&k<6){out.push({t:b.title,a:b.amount||0,d:new Date(d)});if(!b.repeat)break;const x=new Date(d);if(b.repeat==='weekly')x.setDate(x.getDate()+7);else if(b.repeat==='daily')x.setDate(x.getDate()+1);else x.setMonth(x.getMonth()+1);d=x;k++}});return out}
function availCalc(){const end=nextPayday();const days=Math.max(0,Math.ceil((end-NOW())/864e5));const bills=billsBefore(end);const bsum=bills.reduce((s,b)=>s+b.a,0);const living=(M.daily||0)*days;
 return{bal:M.bal||0,bills,bsum,days,living,buf:M.buf||0,avail:Math.round((M.bal||0)-bsum-living-(M.buf||0)),end}}
function verdict(wants){const A=availCalc();const tot=wants.reduce((s,w)=>s+(w.price||0),0);let room=Math.max(0,A.avail);const now=[],later=[],wait=[];
 wants.slice().sort((a,b)=>a.price-b.price).forEach(w=>{if(w.price<=room){if(M.brake&&w.price>=M.brake){wait.push(w);room-=w.price}else{now.push(w);room-=w.price}}else later.push(w)});
 const ord=a=>wants.filter(w=>a.includes(w));const nowL=ord(now),laterL=ord(later),waitL=ord(wait);
 const need=laterL.reduce((s,w)=>s+w.price,0)-room;const weeks=need>0?Math.ceil(need/Math.max(50,M.week||500)):0;const when=new Date(nowMs()+weeks*7*864e5);
 const color=laterL.length===0?(waitL.length?'y':'g'):(nowL.length+waitL.length?'y':'r');
 const names=a=>a.map(w=>w.name).join(' و');const sum=a=>a.reduce((s,w)=>s+w.price,0);
 const tb=[...new Set(A.bills.slice().sort((a,b)=>b.a-a.a).map(b=>b.t))].slice(0,2);const topB=tb.join(' و');
 let say='الحاجات دي مع بعض بـ '+money(tot)+' جنيه. ';
 if(laterL.length){say+='المتاح للصرف لحد المرتب '+money(Math.max(0,A.avail))+' بس'+(topB?'، عشان '+topB+(tb.length>1?' جايين':' جاي')+' قبل المرتب':'')+'. '}
 if(nowL.length)say+=(color==='g'?'تقدر تشتريهم كلهم من غير ما تأثر على الفواتير. ':names(nowL)+' بـ '+money(sum(nowL))+'، خدهم دلوقتي. ');
 if(waitL.length)say+=names(waitL)+' الفلوس تكفيها، بس استنى 24 ساعة ولو لسه عايزها اشتريها. ';
 if(laterL.length)say+=names(laterL)+(weeks?' لو حوّشت '+money(M.week||500)+' في الأسبوع تشتريهم يوم '+when.getDate()+' '+MONTHS[when.getMonth()]+'. ':'. ')+'أحطهم في قايمة الأمنيات؟';
 return{color,tot,A,nowL,laterL,waitL,weeks,when,say:say.trim()}}

/* ---------- voice out ---------- */
const AUD=new Audio();let audUnlocked=false,speaking=null;
function unlockAudio(){if(audUnlocked)return;audUnlocked=true;try{AUD.src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';AUD.play().catch(()=>{audUnlocked=false})}catch(e){}SND.unlock()}
document.addEventListener('pointerdown',unlockAudio,{capture:true});
async function ttsBlob(t,useCache,signal){const g=prof.vg==='m'?'m':'f';const key='https://sanady.voice/'+encodeURIComponent(g+'|'+t);let c=null;
 if(useCache&&window.caches){try{c=await caches.open('sanady-demo-v1');const m=await c.match(key);if(m)return await m.blob()}catch(e){c=null}}
 const r=await fetch(TTS_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k:'wasl-nrg-2026',text:t,lang:'ar-EG',gender:g}),signal});
 if(!r.ok||!(r.headers.get('content-type')||'').includes('audio'))throw 0;const b=await r.blob();if(c){try{await c.put(key,new Response(b,{headers:{'Content-Type':'audio/mpeg'}}))}catch(e){}}return b}
async function speak(t,done){t=String(t||'').trim();if(!t||!prof.voice){done&&done();return}
 try{speechSynthesis.cancel()}catch(e){}try{AUD.pause()}catch(e){}const me={};speaking=me;
 const fin=()=>{if(speaking===me)speaking=null;done&&done()};
 try{const ac=new AbortController();const to=setTimeout(()=>ac.abort(),12000);const b=await ttsBlob(t,!!DEMO,ac.signal);clearTimeout(to);if(speaking!==me)return;
  const u=URL.createObjectURL(b);AUD.src=u;AUD.onended=()=>{URL.revokeObjectURL(u);fin()};AUD.onerror=fin;await AUD.play();return}catch(e){}
 try{const u=new SpeechSynthesisUtterance(t);u.lang='ar-EG';u.rate=.95;const v=speechSynthesis.getVoices().find(v=>/^ar/i.test(v.lang));if(v)u.voice=v;u.onend=fin;u.onerror=fin;speechSynthesis.speak(u)}catch(e){fin()}}
function hush(){speaking=null;try{AUD.pause()}catch(e){}try{speechSynthesis.cancel()}catch(e){}}

/* ---------- voice in ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,recWant=false,recFinal='';
function startRec(onUpd,onState){if(!SR){onState&&onState('nosr');return false}hush();recWant=true;recFinal='';
 try{rec&&rec.abort()}catch(e){}rec=null;let fails=0,t0=0;
 const go=()=>{const me=new SR();rec=me;me.lang='ar-EG';me.continuous=true;me.interimResults=true;t0=Date.now();
  me.onstart=()=>{if(rec===me)onState&&onState('on')};
  me.onresult=e=>{if(rec!==me)return;let int='';for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)recFinal+=(recFinal?' ':'')+r[0].transcript.trim();else int+=r[0].transcript}onUpd&&onUpd(recFinal,int)};
  me.onerror=ev=>{if(rec!==me)return;if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){recWant=false;onState&&onState('blocked')}};
  me.onend=()=>{if(rec!==me)return;rec=null;if(Date.now()-t0<1500)fails++;if(recWant&&fails<6)setTimeout(()=>{if(recWant&&!rec)try{go()}catch(e){}},fails?400*fails:200);else{recWant=false;onState&&onState('off')}};
  try{me.start()}catch(e){}};go();return true}
function stopRec(){recWant=false;try{rec&&rec.stop()}catch(e){}}

/* ---------- brain (n8n + Claude), with offline fallback ---------- */
function brainCtx(){return{profile:{name:prof.name,sex:prof.sex},now:toLocal(NOW())+' ('+DAYS[NOW().getDay()]+')'}}
async function brain(mode,extra){if(DEMO&&DEMO.brain){const r=DEMO.brain(mode,extra);if(r){await new Promise(z=>setTimeout(z,900));return r}}
 const body={k:'wasl-nrg-2026',mode,...brainCtx(),...extra};
 for(let k=0;k<2;k++){try{const ac=new AbortController();const to=setTimeout(()=>ac.abort(),22000);
  const r=await fetch(BRAIN_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ac.signal});clearTimeout(to);
  if(r.ok){const j=await r.json();if(!j.error)return j}}catch(e){}}
 return null}
/* offline: simple keyword sorting so the brain dump never gets lost */
function localSort(text){const parts=text.split(/[،,.؛\n]+|\s+و(?=(?:أ|ا|إ|ن|لازم|كمان|محتاج|عايز|عايزة|فاتورة|ميعاد))/).map(s=>s.trim()).filter(s=>s.length>2);
 const n=NOW();const out=[];
 parts.forEach(p=>{let type='task',sec='home',due='';const has=r=>r.test(p);
  if(has(/اشتري|أشتري|لبن|جبن|عيش|خضار|سوبر/))type='buy',sec='shop';
  else if(has(/فاتورة|قسط|اشتراك/))type='bill',sec='money';
  else if(has(/أكلم|اكلم|أتصل|اتصل|أرد|ارد|ابعت|أبعت/))type='call',sec='people';
  else if(has(/دكتور|كشف|تحليل/))type='appt',sec='health';
  else if(has(/دوا|دواء|حباية/))type='med',sec='health';
  else if(has(/فكرة|نفسي|حلم|مشروع/))type='idea',sec='me';
  else if(has(/شغل|مدير|تقرير|اجتماع|ايميل|إيميل/))sec='work';
  else if(has(/مذاكرة|امتحان|كلية|محاضرة/))sec='study';
  else if(has(/سفر|سفرية|طيارة|تذكرة|تذاكر|حجز فندق|فيزا|شنطة/))sec='travel';
  else if(has(/بطاقة|رخصة|باسبور|جواز|توكيل/))sec='papers';
  const d=new Date(n);let set=false;if(has(/بكرة|بكره/)){d.setDate(d.getDate()+1);d.setHours(9,0,0,0);set=true}
  const hm=p.match(/الساعة\s*(\d{1,2})/);if(hm){let h=+hm[1];if(has(/بالليل|مساء/)&&h<12)h+=12;else if(!has(/الصبح|صباح/)&&h<8)h+=12;d.setHours(h,0,0,0);set=true}
  else if(has(/بالليل/)){d.setHours(21,0,0,0);set=true}
  if(set)due=toLocal(d);const am=p.match(/(\d{2,6})\s*(?:جنيه|ج)?/);
  out.push({type,sec,title:p.replace(/^(و|كمان|ولازم|لازم)\s*/,''),due,amount:type==='bill'&&am?+am[1]:0})});
 return{reply:'رتبت '+out.length+' حاجات. النت مش شغال دلوقتي، فرتبتهم بنفسي، وتقدر تعدّلهم.',add:out,update:[],spend:[],wants:[],places:[],find:'',crisis:false,offline:true}}

/* ---------- safety: crisis ---------- */
const CRISIS_RX=/(انتحر|أنتحر|انتحار|أموت نفسي|اموت نفسي|عايز أموت|عايز اموت|عايزة أموت|نفسي أموت|مش عايز أعيش|مش عايز اعيش|مش عايزة أعيش|أقتل نفسي|اقتل نفسي|أأذي نفسي|اأذي نفسي|أنهي حياتي|انهي حياتي|kill myself|suicide)/i;
function crisisHTML(){return`<div class="crisis"><b style="font-size:20px">أنا معاك. إنت مش لوحدك.</b><p>فيه ناس متخصصة تقدر تسمعك وتساعدك دلوقتي، والمكالمة مجانية:</p>
 <a class="btn warn" href="tel:08008880700">📞 مصر: الخط الساخن للصحة النفسية 08008880700</a>
 <a class="btn ghost" href="tel:0220816831">📞 مصر (خط تاني): 0220816831</a>
 <a class="btn ghost" href="tel:8004673">📞 الإمارات: 800HOPE (800 4673)</a>
 <p class="note">لو في خطر دلوقتي: إسعاف مصر 123 · طوارئ الإمارات 999. وكلّم حد بتثق فيه وقوله إنك محتاجه جنبك.</p>
 <p class="note">سندي مش علاج ولا بديل عن دكتور، بس هيفضل معاك.</p></div>`}
function showCrisis(){openSheet('<h2>خلّينا نوقف لحظة</h2>'+crisisHTML());speak('أنا معاك. إنت مش لوحدك. فيه ناس متخصصة تقدر تسمعك دلوقتي، وأرقامهم قدامك.')}

/* ---------- BRAIN DUMP ---------- */
$('bigMic').onclick=()=>openDump();
function openDump(prefill,hint){openSheet(`<h2>فرّغ دماغك</h2><div class="stack">
 <p class="note">${esc(hint||'قول كل اللي في دماغك براحتك، حتى لو ملخبط. سندي هيرتبه.')}</p>
 <div class="listening" id="dState"><span class="dot"></span><span>بسمعك...</span></div>
 <div class="heard" id="dHeard"></div>
 <textarea id="dText" placeholder="أو اكتب هنا" hidden></textarea>
 <div class="acts"><button class="btn big" id="dDone">خلصت ✓</button><button class="btn ghost" id="dType">⌨️ اكتب</button></div>
 <div id="dRes"></div></div>`);
 const heard=$('dHeard'),txt=$('dText');let typed=false;
 const showType=()=>{typed=true;txt.hidden=false;heard.hidden=true;$('dState').hidden=true;stopRec();txt.focus()};
 $('dType').onclick=showType;
 if(prefill){showType();txt.value=prefill}
 else if(DEMO&&DEMO.dumpText){$('dState').innerHTML='<span class="dot"></span><span>بسمعك...</span>';DEMO.typeInto(heard,DEMO.dumpText)}
 else{const ok=startRec((f,i)=>{if(!heard.isConnected)return;heard.innerHTML=esc(f)+(i?' <span class="int">'+esc(i)+'</span>':'')},st=>{if(!$('dState'))return;if(st==='blocked'||st==='nosr'){$('dState').innerHTML='<span>الميكروفون مش متاح، اكتب بدل الكلام.</span>';showType()}else if(st==='off'&&!typed)$('dState').innerHTML='<span>وقفت. دوس "خلصت" أو كمّل كتابة.</span>'});if(!ok)showType()}
 $('dDone').onclick=async()=>{stopRec();const text=(typed?txt.value:(DEMO&&DEMO.dumpText&&!recFinal?heard.textContent:(recFinal||heard.textContent))).trim();if(text.length<2){toast('لسه ما قلتش حاجة');return}
  $('dDone').disabled=true;$('dType').hidden=true;$('dState').hidden=false;$('dState').className='listening thinking';$('dState').innerHTML='<span class="dot"></span><span>بيرتب...</span>';
  if(CRISIS_RX.test(text)){closeSheet();showCrisis();return}
  const open=items.filter(i=>!i.done).slice(-50).map(i=>({id:i.id,type:i.type,sec:i.sec,title:i.title,due:i.due}));
  let r=await brain('talk',{text,items:open});if(!r)r=localSort(text);
  if(r.crisis){closeSheet();showCrisis();return}
  applyTalk(r,text)}}
function applyTalk(r,text){const added=[];const lines=[];
 (r.add||[]).forEach(a=>{if(a.type==='idea'&&!a.sec)a.sec='me';const it=addItem({...a,from:'dump'});added.push(it);if(a.type==='call'){const nm=(a.title.match(/(?:أكلم|اكلم|أتصل ب|أرد على|ارد على)\s*(\S+)/)||[])[1];if(nm&&!people.find(p=>p.name===nm))people.push({id:uid(),name:nm,last:nowMs(),every:30})}});
 (r.update||[]).forEach(u=>{const it=byId(u.id);if(!it)return;if(u.remove){removeItem(u.id);lines.push('شلت: '+it.title);return}if(u.done){finish(u.id,true);lines.push('خلصت: '+it.title);return}
  if(u.due){it.due=u.due;it.notified=0;lines.push('غيرت ميعاد: '+it.title)}if(u.urgent===false&&/مش مستعجل|مش ضروري|بعدين/.test(text||'')){it.later=true;it.star=false;lines.push('مش مستعجل: '+it.title)}else if(u.urgent){it.urgent=true;lines.push('مستعجل: '+it.title)}});
 if(r.balance!=null){M.bal=r.balance;lines.push('رصيدك دلوقتي '+money(r.balance))}
 (r.spend||[]).forEach(s=>{if(r.balance==null)M.bal=(M.bal||0)-s.amount;M.spends.push({a:s.amount,note:s.note,d:nowMs()});lines.push('سجلت إنك صرفت '+money(s.amount)+(s.note?' في '+s.note:''))});
 if(r.salary){M.sal=r.salary;lines.push('المرتب '+money(r.salary))}if(r.payday){M.pay=r.payday;lines.push('القبض يوم '+r.payday)}
 (r.places||[]).forEach(p=>{places[p.thing]={w:p.where,d:nowMs()};lines.push('📍 '+p.thing+': '+p.where)});
 (r.docs||[]).forEach(dc=>{const it=docRenew(dc.name,dc.expires);if(!it)return;if(!added.includes(it)&&it.created>=nowMs()-5e3)added.push(it);lines.push('📄 '+dc.name+' بيخلص '+docDate(dc.expires)+'. هفكّرك تجدده قبلها بشهر')});
 save();
 let found='';if(r.find){const k=Object.keys(places).find(k=>k.includes(r.find)||r.find.includes(k));found=k?'📍 '+k+' في '+places[k].w:'مش فاكر إنك قلتلي مكان '+r.find+'. لما تلاقيه قولي "'+r.find+' في ..." وهفتكر.'}
 const groups={};added.forEach(a=>{const k=a.type==='idea'?'idea':a.sec;(groups[k]=groups[k]||[]).push(a)});
 const gHTML=Object.keys(groups).map(k=>{const h=k==='idea'?['💡','خزنة الأفكار']:SEC[k]||['•',k];return`<div class="sec"><div class="sech">${h[0]} ${h[1]} <span>${groups[k].length}</span></div>${groups[k].map(a=>`<div class="item" data-id="${a.id}"><div class="tx"><b>${esc(a.title)}</b><small>${esc([TYPE[a.type],fmtWhen(a.due),a.where,a.amount?money(a.amount)+' جنيه':'',a.big?'هقسّمها لخطوات':''].filter(Boolean).join(' · '))}</small></div><button class="mini-b rm">✕</button></div>`).join('')}</div>`}).join('');
 let wantsHTML='';let V=null;if(r.wants&&r.wants.length){V=verdict(r.wants);wantsHTML=verdictHTML(V,r.wants)}
 const reply=r.reply||('رتبت '+added.length+' حاجات.');
 $('dState').hidden=true;$('dHeard').hidden=true;$('dText').hidden=true;$('dDone').closest('.acts').hidden=true;
 $('dRes').innerHTML=`<div class="stack"><div class="say">${esc(reply)}</div>${r.offline?'<p class="note">⚠️ رتبتهم من غير نت، راجعهم.</p>':''}${found?'<div class="say">'+esc(found)+'</div>':''}
  ${lines.length?'<div class="res">'+lines.map(l=>'<small class="note">'+esc(l)+'</small>').join('')+'</div>':''}<div class="res">${gHTML}</div>${wantsHTML}
  <div class="acts"><button class="btn" id="dOk">تمام</button><button class="btn ghost" id="dMore">🎙️ كمان</button></div></div>`;
 $('dRes').querySelectorAll('.rm').forEach(b=>b.onclick=()=>{const row=b.closest('.item');removeItem(row.dataset.id);row.remove()});
 if(V)bindVerdict(V,r.wants);
 $('dOk').onclick=closeSheet;$('dMore').onclick=()=>openDump();
 speak(reply+(found?' '+found.replace('📍',''):'')+(V?' '+V.say:''));render()}

/* ---------- purchase advisor ---------- */
function verdictHTML(V,wants){const lab={g:'تقدر تشتري ✓',y:'اشتري بعضها',r:'استنى شوية'}[V.color];
 return`<div class="vwrap"><div class="verdict ${V.color}"><b>${lab}</b><span>${esc(V.say)}</span></div>
 <div class="res">${wants.map((w,i)=>`<div class="item"><div class="tx"><b>${esc(w.name)}</b><small>${V.nowL.includes(w)?'✅ دلوقتي':V.waitL.includes(w)?'⏳ استنى 24 ساعة':'🗓️ بعدين'}${w.est?' · سعر تقديري، صححه لو غلط':''}</small></div><input class="pr" data-i="${i}" type="number" inputmode="numeric" value="${w.price}" style="max-width:110px"></div>`).join('')}</div>
 <div class="acts">${V.laterL.length||V.waitL.length?'<button class="btn" id="vWish">حطهم في قايمة الأمنيات</button>':''}${V.nowL.length?'<button class="btn ghost" id="vBuy">اشتريت اللي ينفع</button>':''}</div></div>`}
function bindVerdict(V,wants){const host=document.querySelector('.vwrap');if(!host)return;
 host.querySelectorAll('.pr').forEach(inp=>inp.onchange=()=>{wants[+inp.dataset.i].price=Math.max(0,+inp.value||0);wants[+inp.dataset.i].est=false;const nv=verdict(wants);host.outerHTML=verdictHTML(nv,wants);bindVerdict(nv,wants);speak(nv.say)});
 const w=$('vWish');if(w)w.onclick=()=>{[...V.laterL,...V.waitL].forEach(x=>wish.push({id:uid(),name:x.name,price:x.price,added:nowMs(),wait:V.waitL.includes(x)?nowMs()+864e5:0,plan:V.laterL.includes(x)?V.when.getTime():0}));save();toast('حطيتهم في قايمة الأمنيات، وهقولك أول ما تقدر');w.remove();render()};
 const b=$('vBuy');if(b)b.onclick=()=>{V.nowL.forEach(x=>{M.bal-=x.price;M.spends.push({a:x.price,note:x.name,d:nowMs()})});save();toast('سجلت المصروف 👍');b.remove();render()}}
async function askBuy(text){if(!text.trim())return;openSheet(`<h2>عايز تشتري</h2><div class="stack"><div class="say">${esc(text)}</div><div class="listening thinking"><span class="dot"></span><span>بحسبها...</span></div></div>`);
 let r=await brain('talk',{text:'عايز أشتري '+text,items:[]});let wants=r&&r.wants&&r.wants.length?r.wants:null;
 if(!wants){const nums=text.match(/\d+/g);wants=[{name:text.replace(/\d+/g,'').trim()||'الحاجة',price:nums?+nums[0]:0,est:!nums}]}
 const V=verdict(wants);$('sheetBody').innerHTML=`<h2>تقدر تشتري؟</h2><div class="stack">${verdictHTML(V,wants)}<p class="note">سندي بيحسبها من رصيدك والفواتير الجاية. القرار ليك.</p></div>`;bindVerdict(V,wants);speak(V.say)}
$('buyGo').onclick=()=>{askBuy($('buyIn').value);$('buyIn').value=''};
$('buyIn').onkeydown=e=>{if(e.key==='Enter')$('buyGo').click()};
$('buyMic').onclick=()=>{if(!SR){$('buyIn').focus();return}toast('قول عايز تشتري إيه...');startRec((f,i)=>{$('buyIn').value=f+' '+i},st=>{if(st==='off'&&$('buyIn').value.trim())askBuy($('buyIn').value)});setTimeout(stopRec,7000)};
$('spGo').onclick=()=>{const a=+$('spAmt').value;if(!a)return;M.bal-=a;M.spends.push({a,note:$('spNote').value.trim(),d:nowMs()});$('spAmt').value='';$('spNote').value='';save();toast('سجلت');render()};

/* ---------- START / BREAKDOWN ---------- */
async function startTask(id){const it=byId(id);if(!it)return;
 if(!it.big&&!(it.steps&&it.steps.length)){goFocus(it,5);return}
 openSheet(`<h2>${esc(it.title)}</h2><div class="stack" id="bdBody"><div class="listening thinking"><span class="dot"></span><span>بقسّمها لخطوات صغيرة...</span></div></div>`);
 if(!(it.steps&&it.steps.length)){const r=await brain('breakdown',{text:it.title});it.steps=(r&&r.steps&&r.steps.length?r.steps:[{t:'افتح الحاجة اللي هتشتغل عليها بس',min:2},{t:'اعمل أول جزء صغير',min:10},{t:'كمّل جزء تاني',min:15},{t:'راجع وخلّص',min:10}]).map(s=>({...s,done:false}));it.go=(r&&r.go)||'يلا، 5 دقايق بس';save()}
 drawSteps(it)}
function drawSteps(it){const body=$('bdBody');if(!body)return;const nx=it.steps.findIndex(s=>!s.done);
 body.innerHTML=`<div class="say">${esc(nx<0?'خلصت كل الخطوات! '+cheer():it.go||'يلا، 5 دقايق بس')}</div><div class="res steps">${it.steps.map((s,k)=>`<div class="item ${s.done?'done':''}"><button class="ck ${s.done?'on':''}" data-k="${k}">${s.done?'✓':''}</button><div class="tx"><b>${esc(s.t)}</b><small>${minsAr(s.min)} تقريباً</small></div></div>`).join('')}</div>
 <div class="acts">${nx<0?'<button class="btn ok" id="bdFin">خلصت المهمة كلها 🎉</button>':`<button class="btn big" id="bdGo">ابدأ الخطوة دي (${Math.min(it.steps[nx].min,nx===0?5:it.steps[nx].min)} د)</button>`}</div>`;
 if(nx<0){speak('خلصت كل الخطوات! '+cheer())}else if(!drawSteps.spoken){drawSteps.spoken=1;speak(it.go||'يلا، خمس دقايق بس')}
 body.querySelectorAll('.ck').forEach(b=>b.onclick=()=>{const s=it.steps[+b.dataset.k];s.done=!s.done;if(s.done){award(5);buzz(20)}save();drawSteps(it)});
 const g=$('bdGo');if(g)g.onclick=()=>{drawSteps.spoken=0;closeSheet();goFocus(it,Math.min(it.steps[nx].min,nx===0?5:it.steps[nx].min),nx)};
 const f=$('bdFin');if(f)f.onclick=()=>{closeSheet();finish(it.id)}}

/* ---------- FOCUS ---------- */
let F={mins:25,left:0,timer:null,task:null,step:-1,total:0,chain:0,lastEnd:0};
const RC=2*Math.PI*86;$('rFg').style.strokeDasharray=RC;
function drawRing(){const tot=F.total||F.mins*60;const left=F.timer?F.left:F.mins*60;$('fTime').textContent=Math.floor(left/60)+':'+pad(left%60);$('rFg').style.strokeDashoffset=RC*(1-left/tot)}
$('fPre').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(F.timer)return;F.mins=+b.dataset.m;$('fPre').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));drawRing()});
function goFocus(it,mins,step){show('focus');F.task=it?it.id:null;F.step=step==null?-1:step;F.mins=mins||25;$('fTask').textContent=it?(step>=0&&it.steps?it.steps[step].t:it.title):'جلسة تركيز';
 $('fPre').querySelectorAll('button').forEach(x=>x.classList.toggle('on',+x.dataset.m===F.mins));drawRing();startFocus()}
function startFocus(){if(F.timer)return;F.total=F.mins*60;F.left=F.total;$('fGo').hidden=true;$('fStop').hidden=false;if(SND.cur==='off'&&store.get('lastSnd','brown')!=='off'){}
 if(nowMs()-F.lastEnd>15*6e4)F.chain=0;
 if($('fBuddy').checked)speak(F.mins<=5?'يلا، '+F.mins+' دقايق بس. أنا معاك.':'يلا نبدأ. أنا هنا معاك، ولو سرحت ارجع للحاجة دي بس.');
 F.timer=setInterval(()=>{F.left--;drawRing();
  if($('fBuddy').checked&&F.total>=600&&F.left===Math.floor(F.total/2))speak('نص الوقت عدّى. كمّل، إنت ماشي كويس.');
  if(F.left<=0)endFocus(true)},1000)}
function endFocus(full){clearInterval(F.timer);F.timer=null;$('fGo').hidden=false;$('fStop').hidden=true;F.lastEnd=nowMs();F.chain+=(F.total-F.left);drawRing();
 if(!full)return;SND.chime();award(5);const it=F.task&&byId(F.task);
 if(F.chain>=90*60){F.chain=0;openSheet('<h2>خد بريك</h2><div class="stack"><div class="say">بقالك ساعة ونص مركز. قوم اتحرك 10 دقايق واشرب مية، وارجع تاني.</div><button class="btn" onclick="closeSheet()">ماشي</button></div>');speak('بقالك ساعة ونص مركز. قوم اتحرك عشر دقايق واشرب مية.');return}
 const q=it?(F.step>=0?'خلصت الخطوة؟':'خلصت '+it.title+'؟'):'الجلسة خلصت.';
 openSheet(`<h2>${cheer()}</h2><div class="stack"><div class="say">${esc(q)}</div><div class="acts">${it?'<button class="btn ok" id="feY">أيوه خلصت</button><button class="btn ghost" id="feM">لسه، 5 دقايق كمان</button>':''}<button class="btn ghost" id="feB">بريك 5 دقايق</button></div></div>`);
 speak(cheer()+' '+q);
 const y=$('feY');if(y)y.onclick=()=>{if(F.step>=0&&it.steps){it.steps[F.step].done=true;save();closeSheet();if(it.steps.every(s=>s.done))finish(it.id);else{startTask(it.id)}}else{closeSheet();finish(it.id)}};
 const m=$('feM');if(m)m.onclick=()=>{closeSheet();F.mins=5;startFocus()};
 $('feB').onclick=()=>{closeSheet();F.task=null;F.step=-1;$('fTask').textContent='بريك';F.mins=5;startFocus()}}
$('fGo').onclick=()=>{if(!F.task)$('fTask').textContent='جلسة تركيز';startFocus()};
$('fStop').onclick=()=>endFocus(false);
$('sounds').querySelectorAll('button').forEach(b=>b.onclick=()=>{SND.play(b.dataset.s);store.set('lastSnd',b.dataset.s);$('sounds').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))});
$('vol').oninput=()=>SND.setVol($('vol').value/100*.9);
function setSound(s){const b=$('sounds').querySelector('[data-s="'+s+'"]');b&&b.click()}
$('tSleep').onclick=()=>sleepMode();
function sleepMode(){document.body.classList.add('night');if(SND.cur==='off')setSound('rain');SND.fadeOut(30,()=>{setSound('off')});
 openSheet('<h2>تصبح على خير 🌙</h2><div class="stack"><div class="say">الصوت هيوطى لوحده في نص ساعة ويقف. سيب الموبايل وغمّض عينك.</div><p class="note">بكرة الصحيان '+esc(prof.wake)+'. حاول تصحى في نفس الميعاد حتى في الإجازة.</p><button class="btn ghost" onclick="closeSheet()">تمام</button></div>');speak('تصبح على خير. الصوت هيوطى لوحده ويقف.')}
$('tBreath').onclick=()=>breathe();
function breathe(after){openSheet(`<h2>نتنفس سوا</h2><div class="stack" style="align-items:center;text-align:center"><div class="breath" id="br">شهيق</div><p class="note" id="brT">دقيقتين بس. اتبع الدايرة.</p></div>`);
 let t=0;const br=$('br');const cyc=()=>{if(!$('br'))return;br.textContent='شهيق';br.style.transitionDuration='4s';br.style.transform='scale(1.35)';
  setTimeout(()=>{if(!$('br'))return;br.textContent='اكتم';},4000);setTimeout(()=>{if(!$('br'))return;br.textContent='زفير';br.style.transitionDuration='6s';br.style.transform='scale(.85)'},6000);
  t+=12;if(t<120)setTimeout(cyc,12000);else setTimeout(()=>{if(!$('br'))return;$('brT').textContent='أحسن؟';after?after():feelSheet(true)},12000)};
 speak('خد نفس عميق من مناخيرك، واطلعه براحة من بقك.');setTimeout(cyc,600)}
$('tMove').onclick=()=>{openSheet('<h2>10 دقايق حركة</h2><div class="stack"><div class="say">قوم دلوقتي: اتمشى في البيت أو انزل السلم واطلعه، أو نط 30 مرة. الحركة بتساعد التركيز يرجع.</div><button class="btn" id="mvGo">ابدأ 10 دقايق</button></div>');$('mvGo').onclick=()=>{closeSheet();F.task=null;F.step=-1;$('fTask').textContent='🚶 حركة';F.mins=10;show('focus');startFocus()};speak('قوم اتحرك عشر دقايق. الحركة بتساعد التركيز يرجع.')};
$('tWater').onclick=()=>{store.set('bodyAt',nowMs());toast('💧 اشرب كوباية مية دلوقتي، وكُل حاجة صغيرة لو ما كلتش');award(2);speak('اشرب كوباية مية دلوقتي.')};

/* ---------- feelings ---------- */
$('btnFeel').onclick=()=>feelSheet();
function feelSheet(after){openSheet(`<h2>${after?'حاسس بإيه دلوقتي؟':'مضغوط؟ خلّينا نهدى'}</h2><div class="stack">
 <p class="note">سمّي الإحساس، ده لوحده بيخفف.</p>
 <div class="feel">${['😤 متعصب','😟 قلقان','😩 مرهق','😔 زعلان','😶 مش عارف','🙂 أحسن'].map(f=>`<button class="chip fe">${f}</button>`).join('')}</div>
 ${after?'':`<div class="acts"><button class="btn" id="fbBr">🫁 نتنفس دقيقتين</button><button class="btn ghost" id="fbHard">🫶 يوم صعب</button></div>
 <details><summary><b>هبعت رسالة وأنا متعصب</b></summary><div class="stack" style="margin-top:10px"><textarea id="fbMsg" placeholder="الصق أو اكتب الرسالة هنا"></textarea><div class="acts"><button class="btn" id="fbCalm">هديهالي</button><button class="btn ghost" id="fbHold">استنى 10 دقايق قبل ما أبعتها</button></div><div id="fbOut"></div></div></details>
 <details><summary><b>حد ما ردّش عليا وحاسس إنه متضايق مني</b></summary><div class="say" style="margin-top:10px">غالباً مشغول بس. ناس كتير بتقرا وبتنسى ترد. استنى لبكرة، ولو لسه، ابعتله سلام عادي من غير عتاب.</div></details>
 <button class="link" id="fbCr" style="align-self:flex-start">محتاج أكلم حد دلوقتي</button>`}</div>`);
 document.querySelectorAll('.fe').forEach(b=>b.onclick=()=>{diary.push({d:dayKey(),t:nowMs(),feel:b.textContent.slice(3)});save();toast('سجلتها. شكراً إنك قلت');if(after)closeSheet();else{document.querySelectorAll('.fe').forEach(x=>x.classList.toggle('on',x===b))}});
 if(after)return;
 $('fbBr').onclick=()=>breathe();$('fbHard').onclick=()=>{closeSheet();setHard(true)};$('fbCr').onclick=()=>{closeSheet();showCrisis()};
 $('fbCalm').onclick=async()=>{const t=$('fbMsg').value.trim();if(!t)return;$('fbOut').innerHTML='<p class="note">بهديها...</p>';const r=await brain('draft',{kind:'calm',text:t,to:''});const out=r&&r.text||t;$('fbOut').innerHTML=draftBox(out)};
 $('fbHold').onclick=()=>{const t=$('fbMsg').value.trim();if(!t)return;store.set('hold',{t,until:nowMs()+6e5});toast('هفكّرك بيها بعد 10 دقايق. لو لسه عايز تبعتها، ابعتها');closeSheet()}}
function draftBox(text,phone){const wa='https://wa.me/'+(phone||'')+'?text='+encodeURIComponent(text);return`<div class="stack"><div class="say" dir="auto">${esc(text)}</div><div class="acts"><a class="btn" href="${wa}" target="_blank" rel="noopener">ابعتها واتساب</a><button class="btn ghost" onclick="navigator.clipboard&&navigator.clipboard.writeText(${esc(JSON.stringify(text))});toast('اتنسخت')">انسخ</button></div></div>`}
async function draftFor(kind,to,about,cb){openSheet(`<h2>رسالة جاهزة</h2><div class="stack" id="drB"><div class="listening thinking"><span class="dot"></span><span>بكتبها...</span></div></div>`);
 const r=await brain('draft',{kind,to,text:about});const t=(r&&r.text)||(kind==='late'?'آسف جداً، هتأخر شوية، جاي في السكة.':kind==='hello'?'إزيك؟ وحشتني، قلت أطمن عليك.':'بفكّرك بـ '+about);
 const b=$('drB');if(b){b.innerHTML=draftBox(t)+'<p class="note">إنت اللي بتبعتها، سندي بس كتبها.</p>';b.querySelector('a.btn').addEventListener('click',()=>{cb&&cb();award(5)})}}

/* ---------- hard day & clean slate ---------- */
function setHard(on){store.set('hard',on?dayKey():'');render();if(on){toast('النهارده الضروري بس 🫶');speak('ولا يهمك. النهارده الضروري بس، والباقي مستنيك من غير زعل.')}}
const isHard=()=>store.get('hard','')===dayKey();
$('qHard').onclick=()=>setHard(!isHard());$('hardOff').onclick=()=>setHard(false);
$('qClean').onclick=()=>{const n=NOW();let k=0;items.filter(i=>!i.done&&i.type!=='bill'&&i.type!=='med'&&i.due&&parseL(i.due)<n).forEach(i=>{toTomorrow(i.id);k++});items.forEach(i=>{if(!i.done)i.snooze=0});save();render();
 const msg=k?'ولا يهمك. نقلت '+k+' حاجات لبكرة، والنهارده يبدأ من جديد.':'ولا يهمك، النهارده يبدأ من جديد.';toast(msg,3500);speak(msg+' خلّينا نعمل حاجة واحدة بس.')};
$('qFind').onclick=()=>{openDump('','قول مثلاً: "فين المفاتيح؟" أو "الباسبور في الدولاب الأوضة"')};

/* ---------- NEXT THING ---------- */
function essential(i){const d=parseL(i.due);const n=NOW();if(i.type==='med')return true;if(i.type==='bill'&&d&&d-n<1.5*864e5)return true;if(i.type==='appt'&&d&&d-n<864e5&&d>n-36e5)return true;return!!i.urgent}
function score(i){const n=nowMs();const d=parseL(i.due);let s=10;
 if(d){const h=(d-n)/36e5;if(h<0)s=100+Math.min(30,-h);else if(h<3)s=85;else if(dayKey(d)===dayKey())s=65;else if(h<36)s=30;else s=12}
 else s=15+Math.min(25,daysAgo(i.created||n));
 if(i.star)s+=45;if(i.urgent)s+=35;if(i.later)s-=25;if(i.type==='appt'){if(!d||(d-n)/6e4>leaveMins(i)+60)s=-1}if(d&&(i.type==='call'||i.type==='med')&&(d-n)/36e5>1)s=-1;if(d&&i.type==='task'&&(d-n)/36e5>3&&dayKey(d)===dayKey())s=40;if(i.type==='idea'||i.type==='bill')s=-1;
 return s}
function candidates(){const n=nowMs();return items.filter(i=>!i.done&&!(i.snooze>n)&&(!isHard()||essential(i))).map(i=>({i,s:score(i)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).map(x=>x.i)}
function leaveMins(i){const t=(i.where&&travel[i.where])||prof.travel||30;return t+10}
function ringSVG(it){const d=parseL(it.due);if(!d)return'';const mins=(d-nowMs())/6e4;if(mins<0||mins>240)return'';const frac=Math.max(0,Math.min(1,mins/240));const R=2*Math.PI*26;
 return`<svg class="tring" viewBox="0 0 64 64"><circle class="a" cx="32" cy="32" r="26"/><circle class="b" cx="32" cy="32" r="26" stroke-dasharray="${R}" stroke-dashoffset="${R*(1-frac)}"/><text x="32" y="33">${mins<60?Math.round(mins)+'د':Math.round(mins/60)+'س'}</text></svg>`}
function drawNext(){const c=candidates();const it=c[0];const box=$('nextCard');
 if(!it){box.innerHTML=`<div class="lab">الحاجة الجاية</div><div class="empty">${items.some(i=>!i.done&&i.type!=='idea')?'كل حاجة متأجلة دلوقتي. خد نفسك 🌿':'دماغك فاضية؟ دوس الميكروفون وقول أي حاجة شاغلاك.'}</div><div class="acts"><button class="btn" onclick="openDump()">🎙️ فرّغ دماغك</button></div>`;return}
 const h=SEC[it.sec]||['•',''];const d=parseL(it.due);const late=d&&d<NOW();
 box.innerHTML=`<div class="lab">الحاجة الجاية · واحدة بس</div><div class="nrow"><div style="flex:1"><h2>${esc(it.title)}</h2></div>${ringSVG(it)}</div>
 <div class="meta"><span>${h[0]} ${h[1]}</span>${it.due?`<span>${late?'كان ':''}${esc(fmtWhen(it.due))}</span>`:''}${it.big?'<span>كبيرة، هنقسّمها</span>':''}${it.star?'<span>⭐ من أهم 3</span>':''}</div>
 <div class="acts">${it.type==='call'?'<button class="btn" id="nxMsg">اكتبلي الرسالة</button>':`<button class="btn" id="nxGo">يلا، 5 دقايق بس</button>`}<button class="btn ghost" id="nxDone">خلصت ✓</button><button class="btn ghost" id="nxLater">مش دلوقتي</button></div>`;
 const g=$('nxGo');if(g)g.onclick=()=>startTask(it.id);
 const m=$('nxMsg');if(m)m.onclick=()=>draftFor('remind',it.title,it.title,()=>finish(it.id,true));
 $('nxDone').onclick=()=>finish(it.id);
 $('nxLater').onclick=()=>{openSheet(`<h2>نأجلها لامتى؟</h2><div class="stack"><p class="note">عادي خالص. هرجعلك بيها.</p><div class="acts"><button class="btn ghost" data-m="60">ساعة</button><button class="btn ghost" data-m="180">3 ساعات</button><button class="btn ghost" data-m="tm">بكرة</button><button class="btn ghost" data-m="rm">شيلها خالص</button></div></div>`);
  document.querySelectorAll('#sheetBody [data-m]').forEach(b=>b.onclick=()=>{const v=b.dataset.m;if(v==='tm')toTomorrow(it.id);else if(v==='rm')removeItem(it.id);else snooze(it.id,+v);closeSheet()})}}
function drawTop3(){const s=items.filter(i=>i.star&&!i.done);const d=items.filter(i=>i.star&&i.done&&i.doneAt&&dayKey(new Date(i.doneAt))===dayKey());const all=[...s,...d].slice(0,3);
 $('top3').innerHTML=all.length?all.map(i=>`<div class="item ${i.done?'done':''}"><button class="ck ${i.done?'on':''}" data-id="${i.id}">${i.done?'✓':''}</button><div class="tx"><b>${esc(i.title)}</b><small>${esc(fmtWhen(i.due))}</small></div></div>`).join(''):'<p class="note">مفيش لسه. 3 بس كفاية، مش أكتر.</p>';
 $('top3').querySelectorAll('.ck').forEach(b=>b.onclick=()=>{const it=byId(b.dataset.id);if(it&&!it.done)finish(it.id)})}
function drawMini(){const lv=Math.floor(pts.p/100)+1;const into=pts.p%100;$('ptsCard').innerHTML=`<small>نقطك</small><b class="num">⭐ ${pts.p}</b><div class="bar"><i style="width:${into}%"></i></div><small class="lvl">مستوى ${lv} · فاضل ${100-into} للي بعده</small>`;
 const n=doneToday().length;$('dayCard').innerHTML=`<small>النهارده</small><b>${n} ${n===1?'حاجة':'حاجات'}</b><small>${n?'خلصتهم 👏':'أول حاجة هي الأصعب'}</small>`}

/* ---------- PROACTIVE NUDGES ---------- */
function nudges(){const n=NOW(),t=nowMs(),out=[];const hard=isHard();
 const hold=store.get('hold',null);if(hold&&t>=hold.until)out.push({id:'hold',i:'✉️',p:'عدّت 10 دقايق. لسه عايز تبعت الرسالة دي؟ اقراها تاني الأول.',acts:[['ابعتها',()=>{store.set('hold',null);openSheet('<h2>الرسالة</h2>'+draftBox(hold.t))}],['لأ، خلاص',()=>{store.set('hold',null);toast('قرار حلو 👌');render()}]]});
 items.filter(i=>!i.done).forEach(i=>{const d=parseL(i.due);if(i.snooze>t)return;const mins=d?(d-n)/6e4:null;const W=SEC[i.sec]||['•'];
  if(i.type==='appt'&&d){const lm=leaveMins(i);const leave=new Date(d-lm*6e4);
   if(mins>0&&mins<=lm+20&&!i.left)out.push({id:'ap'+i.id,pr:95,i:'🚗',p:`عندك ${i.title} ${fmtT(d)}${i.where?' في '+i.where:''}. اتحرك ${fmtT(leave)}${t>leave?' (يعني دلوقتي)':''}، وخد ${prof.prep}.`,speak:1,
    acts:[['اتحركت ✓',()=>{i.left=t;save();toast('توصل بالسلامة 🚗');render()}],['هتأخر',()=>draftFor('late',i.title,'هتأخر عن '+i.title+' حوالي 15 دقيقة')],['فكّرني بعد 10',()=>snooze(i.id,10)]]});
   else if(mins<=-20&&mins>-720)out.push({id:'ar'+i.id,pr:40,i:'⏱️',p:`${i.title}: وصلت في ميعادك؟ عشان أتعلم مشوارك بياخد قد إيه.`,acts:[['في الميعاد',()=>learnTravel(i,0)],['اتأخرت 10',()=>learnTravel(i,10)],['اتأخرت 20+',()=>learnTravel(i,25)]]});}
  else if(i.type==='bill'&&d&&mins<2*1440){const low=(M.bal||0)<i.amount;out.push({id:'bl'+i.id,pr:mins<0?90:80,i:'🧾',p:`${i.title} ${i.amount?money(i.amount)+' جنيه ':''}${mins<0?'كانت مطلوبة '+fmtWhen(i.due):fmtWhen(i.due).split(' ')[0]}. ${low?'⚠️ رصيدك مش هيكفيها، ':''}أدفعها دلوقتي؟`,speak:1,
    acts:[['دفعتها ✓',()=>finish(i.id)],['فكّرني بكرة',()=>snooze(i.id,1440)]]})}
  else if(i.type==='med'&&d&&mins<=0&&mins>-240)out.push({id:'md'+i.id,pr:92,i:'💊',p:`ميعاد ${i.title}. خدته؟`,speak:1,acts:[['خدته ✓',()=>{if(!i.repeat)i.repeat='daily';diary.push({d:dayKey(),t,med:i.title});finish(i.id,true);toast('تمام 💊')}],['بعد ربع ساعة',()=>snooze(i.id,15)]]});
  else if(!hard&&d&&mins<=5&&mins>-30&&i.type!=='appt'){out.push({id:'du'+i.id,pr:88,i:W[0],p:mins>0?`كمان ${Math.ceil(mins)} دقايق: ${i.title}. ابدأ تقفل اللي في إيدك.`:`${fmtT(d)}: ${i.title}`,speak:1,
    acts:i.type==='call'?[['اكتبلي الرسالة',()=>draftFor('remind',i.title,i.title,()=>finish(i.id,true))],['خلصت ✓',()=>finish(i.id)],['بعد ساعة',()=>snooze(i.id,60)]]:[['يلا',()=>startTask(i.id)],['خلصت ✓',()=>finish(i.id)],['بعد ساعة',()=>snooze(i.id,60)]]})}
  else if(!hard&&i.type!=='idea'&&!d&&daysAgo(i.touched||i.created)>=7)out.push({id:'fg'+i.id,pr:30,i:'🔁',p:`قلت هت${i.title.replace(/^أ/,'')} من ${nDays(daysAgo(i.created))}. نعملها النهارده ولا نأجلها؟`,acts:[['يلا 5 دقايق',()=>startTask(i.id)],['بكرة',()=>toTomorrow(i.id)],['شيلها',()=>removeItem(i.id)]]});
  else if(!hard&&i.big&&daysAgo(i.created)>=2&&!(i.steps&&i.steps.some(s=>s.done)))out.push({id:'bg'+i.id,pr:55,i:'🧩',p:`${i.title} بقاله ${nDays(daysAgo(i.created))}. يلا نبدأ 5 دقايق بس؟`,speak:1,acts:[['يلا نبدأ',()=>startTask(i.id)],['بعدين',()=>snooze(i.id,180)]]})});
 if(!hard){people.forEach(p=>{const dd=daysAgo(p.last||t);if(dd>=(p.every||30))out.push({id:'pp'+p.id,pr:25,i:'💬',p:`بقالك ${nDays(dd)} ما كلمتش ${p.name}.`,acts:[['اكتبلي رسالة',()=>draftFor('hello',p.name,'سلام وطمأنينة على '+p.name,()=>{p.last=nowMs();save()})],['كلمته ✓',()=>{p.last=nowMs();save();award(5);render()}]]})});
  const A=availCalc();wish.forEach(w=>{if(w.wait&&t>w.wait)out.push({id:'wt'+w.id,pr:35,i:'⏳',p:`عدّى يوم. لسه عايز ${w.name}؟`,acts:[['أيوه، هشتريها',()=>{w.wait=0;buyWish(w)}],['لأ، شيلها',()=>{wish=wish.filter(x=>x!==w);save();toast('وفرت '+money(w.price)+' جنيه 👏');award(10);render()}]]});
   else if(!w.wait&&A.avail>=w.price)out.push({id:'wa'+w.id,pr:45,i:'🎁',p:`دلوقتي تقدر تشتري ${w.name} من غير ما تأثر على الفواتير.`,speak:1,acts:[['اشتريتها',()=>buyWish(w)],['مش دلوقتي',()=>{nsn['wa'+w.id]=t+3*864e5;save();render()}]]})});
  if(A.avail<0&&(M.bal||M.sal))out.push({id:'lo',pr:60,i:'💳',p:'الفلوس لحد المرتب مش هتكفي الفواتير والمصاريف. خلّي بالك من الصرف الأيام دي، وقولي لو اتغير الرصيد.',acts:[['شوف التفاصيل',()=>show('money')]]});
  const ideas=items.filter(i=>i.type==='idea'&&!i.done);if(ideas.length>=5&&t-(store.get('ideaRev',0))>30*864e5)out.push({id:'ir',pr:20,i:'💡',p:`عندك ${ideas.length} أفكار في الخزنة. نختار واحدة تستاهل؟`,acts:[['يلا نختار',()=>{store.set('ideaRev',t);show('all');setSeg('ideas')}],['بعدين',()=>{nsn.ir=t+7*864e5;save();render()}]]})}
 if(!hard&&!DEMO){const wr=store.get('weekRev',0);if((n.getDay()===5||t-wr>8*864e5)&&t-wr>5*864e5&&n.getHours()>=10&&items.filter(i=>!i.done).length>=4)out.push({id:'wk'+dayKey(),pr:42,i:'🗓️',p:'وقت مراجعة الأسبوع: 5 دقايق نرتب اللي فات واللي جاي.',acts:[['يلا',()=>weekSheet()],['بعدين',()=>{nsn['wk'+dayKey()]=t+864e5;save();render()}]]});
  const bk=store.get('bkAt',0),first=items.reduce((m,i)=>Math.min(m,i.created||t),t);if(items.length>=15&&t-first>7*864e5&&t-bk>30*864e5)out.push({id:'bk',pr:18,i:'💾',p:'كل حاجاتك على الموبايل ده بس. احفظ نسخة عشان لو ضاع أو غيرته ما تخسرش حاجة.',acts:[['احفظ نسخة',()=>{backupSave();render()}],['بعدين',()=>{nsn.bk=t+14*864e5;save();render()}]]})}
 if(!DEMO&&!F.timer){const hr=n.getHours()+n.getMinutes()/60,wk=(prof.wake||'07:30').split(':').map(Number),sp=(prof.sleep||'23:30').split(':').map(Number);
  const w0=wk[0]+wk[1]/60+1,s0=sp[0]+sp[1]/60-1,wrap=sp[0]*60+sp[1]<wk[0]*60+wk[1],awake=wrap?(hr>=w0||hr<s0):(hr>=w0&&hr<s0);let bAt=store.get('bodyAt',0);if(!bAt){bAt=t;store.set('bodyAt',t)}
  if(awake&&t-bAt>3*36e5){const slot=Math.floor(t/(3*36e5)),B=[['💧','اشرب كوباية مية دلوقتي. الدماغ بيركز أحسن وهو مش عطشان.','شربت ✓'],['🚶','قوم اتحرك دقيقتين: افرد ضهرك وامشي شوية.','اتحركت ✓'],['🍎','كلت حاجة من بدري؟ خد حاجة صغيرة تاكلها.','كلت ✓']][slot%3];
   out.push({id:'bd'+slot,pr:hard?50:15,i:B[0],p:B[1],acts:[[B[2],()=>{store.set('bodyAt',nowMs());award(2);render()}],['بعدين',()=>{store.set('bodyAt',nowMs()-2*36e5);render()}]]})}}
 const calAt=store.get('icsAt',0);const fresh=items.filter(i=>!i.done&&i.type!=='idea'&&i.due&&parseL(i.due)>t&&(i.created||0)>calAt);
 if(fresh.length>=2&&!DEMO&&!tgOn())out.push({id:'cal',pr:22,i:'📅',p:`عندك ${fresh.length} مواعيد جديدة. ضيفها للكالندر عشان أفكّرك حتى لو التطبيق مقفول.`,acts:[['ضيفهم',()=>{icsAll();render()}],['بعدين',()=>{nsn.cal=t+2*864e5;save();render()}]]});
 const [sh,sm]=(prof.sleep||'23:30').split(':').map(Number);const sl=new Date(n);sl.setHours(sh,sm,0,0);if(sl-n<60*6e4&&sl-n>-180*6e4)out.push({id:'sl'+dayKey(),pr:70,i:'🌙',p:'قرب ميعاد النوم. نشوف عملت إيه النهارده ونفرّغ دماغك لبكرة؟',speak:1,acts:[['ملخص اليوم',()=>nightSheet()],['وضع النوم',()=>sleepMode()]]});
 return out.filter(x=>!(nsn[x.id]>t)).sort((a,b)=>(b.pr||50)-(a.pr||50))}
function learnTravel(i,late){const base=(i.where&&travel[i.where])||prof.travel||30;if(i.where){travel[i.where]=Math.round(base+late*.8)}i.done=true;i.doneAt=nowMs();save();
 toast(late?'اتعلمت: '+(i.where||'المشوار')+' بياخد حوالي '+travel[i.where]+' دقيقة. هحسبها كده المرة الجاية':'عاش! وصلت في ميعادك 👏',3500);if(!late)award(10);render()}
function buyWish(w){M.bal-=w.price;M.spends.push({a:w.price,note:w.name,d:nowMs()});wish=wish.filter(x=>x!==w);save();confetti();toast('مبروك على '+w.name+' 🎁');render()}
let nIdx=0,spoken=store.get('spoken',{});
function drawNudge(){const list=nudges();const box=$('nudge');if(!list.length){box.innerHTML='';return}
 if(nIdx>=list.length)nIdx=0;const x=list[nIdx];
 box.innerHTML=`<div class="nudge"><div class="nt"><i>${x.i}</i><p>${esc(x.p)}</p></div><div class="acts">${x.acts.map((a,k)=>`<button class="btn ${k?'ghost':''}" data-k="${k}">${esc(a[0])}</button>`).join('')}</div>${list.length>1?`<button class="more" id="nMore">+ ${list.length-1} ${list.length-1===1?'حاجة تانية':'حاجات تانية'} سندي عايز يقولهالك ›</button>`:''}</div>`;
 box.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{x.acts[+b.dataset.k][1]();render()});
 const m=$('nMore');if(m)m.onclick=()=>{nIdx++;drawNudge()};
 if(x.speak&&!spoken[x.id]&&document.visibilityState==='visible'&&$('now').classList.contains('on')&&audUnlocked&&!F.timer){spoken[x.id]=nowMs();store.set('spoken',spoken);speak(x.p)}
 if(x.speak&&document.visibilityState!=='visible')notify(x)}
function notify(x){if(spoken['n'+x.id])return;spoken['n'+x.id]=1;store.set('spoken',spoken);try{if(Notification.permission==='granted'&&navigator.serviceWorker)navigator.serviceWorker.ready.then(r=>r.showNotification('سندي',{body:x.p,icon:'icon-192.png',badge:'icon-192.png',tag:x.id,lang:'ar',dir:'rtl'}))}catch(e){}}

/* ---------- ALL (sections, ideas, people, places) ---------- */
let SEG='tasks';
function setSeg(v){SEG=v;$('allSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));drawAll()}
$('allSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>setSeg(b.dataset.v));
function itemRow(i){return`<div class="item ${i.done?'done':''}" data-id="${i.id}"><button class="ck ${i.done?'on':''}">${i.done?'✓':''}</button><div class="tx op"><b>${esc(i.title)}</b><small>${esc([fmtWhen(i.due),i.where,i.amount?money(i.amount)+' ج':'',i.repeat?{daily:'كل يوم',weekly:'كل أسبوع',monthly:'كل شهر'}[i.repeat]:'',i.steps?i.steps.filter(s=>s.done).length+'/'+i.steps.length+' خطوات':''].filter(Boolean).join(' · '))}</small></div><button class="star ${i.star?'on':''}" aria-label="من أهم 3">⭐</button></div>`}
function drawAll(){const b=$('allBody');
 if(SEG==='tasks'){const open=items.filter(i=>!i.done&&i.type!=='idea');const by={};open.forEach(i=>(by[i.sec]=by[i.sec]||[]).push(i));
  const order=Object.keys(SEC).filter(k=>by[k]);
  b.innerHTML=(order.length?order.map(k=>`<div class="card sec"><div class="sech">${SEC[k][0]} ${SEC[k][1]} <span>${by[k].length}</span></div>${by[k].sort((a,c)=>(a.due||'9').localeCompare(c.due||'9')).map(itemRow).join('')}</div>`).join(''):'<div class="card empty">مفيش حاجات مفتوحة. دوس 🎙️ وفرّغ دماغك.</div>')+
  (doneToday().length?`<details class="card"><summary><b>اللي خلص النهارده (${doneToday().length})</b></summary>${doneToday().map(itemRow).join('')}</details>`:'')+
  '<button class="btn ghost" id="addMan">+ ضيف حاجة بإيدك</button>';
  bindRows(b);$('addMan').onclick=()=>editItem(null)}
 else if(SEG==='ideas'){const ideas=items.filter(i=>i.type==='idea'&&!i.done);const proj=items.find(i=>i.project&&!i.done);
  b.innerHTML=`<div class="card"><div class="ch"><h3>💡 خزنة الأفكار</h3><small>أي فكرة تيجي قولها في ثانية وارجع لشغلك. مش لازم تعمل حاجة دلوقتي.</small></div>${proj?`<div class="say">🎯 مشروعك الحالي: ${esc(proj.title)}</div>`:''}
  ${ideas.length?ideas.map(i=>`<div class="item" data-id="${i.id}"><div class="tx"><b>${esc(i.title)}</b><small>من ${daysAgo(i.created)} يوم</small></div><button class="mini-b goal">🎯 حوّلها لهدف</button><button class="mini-b rm">✕</button></div>`).join(''):'<p class="note">الخزنة فاضية. قول "جاتلي فكرة..." في أي وقت.</p>'}</div>
  <div class="card"><div class="inrow"><input id="ideaIn" placeholder="فكرة جديدة"><button class="btn" id="ideaGo">حطها</button></div></div>`;
  b.querySelectorAll('.goal').forEach(x=>x.onclick=()=>{const it=byId(x.closest('.item').dataset.id);const cur=items.find(i=>i.project&&!i.done);
   const doIt=()=>{if(cur)cur.project=false;it.type='task';it.big=true;it.project=true;it.star=true;it.sec=it.sec==='me'?'me':it.sec;save();startTask(it.id)};
   if(cur){openSheet(`<h2>لحظة</h2><div class="stack"><div class="say">إنت شغال على "${esc(cur.title)}". خلّصها الأول، والفكرة دي مستنياك في الخزنة.</div><div class="acts"><button class="btn" onclick="closeSheet()">ماشي، أخلّص الأول</button><button class="btn ghost" id="ovr">لأ، دي أهم</button></div></div>`);$('ovr').onclick=()=>{closeSheet();doIt()}}else doIt()});
  b.querySelectorAll('.rm').forEach(x=>x.onclick=()=>removeItem(x.closest('.item').dataset.id));
  $('ideaGo').onclick=()=>{const v=$('ideaIn').value.trim();if(!v)return;addItem({type:'idea',sec:'me',title:v});toast('في الخزنة 💡');drawAll()}}
 else if(SEG==='people'){b.innerHTML=`<div class="card"><div class="ch"><h3>الناس اللي يهموك</h3><small>سندي يفكّرك لو بقالك فترة ما كلمتهمش</small></div>${people.length?people.map(p=>`<div class="item" data-p="${p.id}"><div class="tx"><b>${esc(p.name)}</b><small>آخر مرة: من ${daysAgo(p.last||nowMs())} يوم · كل ${p.every||30} يوم${p.bday?' · عيد ميلاده '+esc(p.bday):''}</small></div><button class="mini-b hi">💬</button><button class="mini-b ok">كلمته ✓</button><button class="mini-b rm">✕</button></div>`).join(''):'<p class="note">مفيش لسه. ضيف ماما أو صاحبك.</p>'}</div>
  <div class="card form"><input id="pN" placeholder="الاسم (ماما، أحمد...)"><input id="pE" type="number" inputmode="numeric" placeholder="فكّرني كل كام يوم؟ (30)"><input id="pB" placeholder="عيد الميلاد (اختياري، مثلاً 14/3)"><button class="btn" id="pGo">ضيف</button></div>`;
  b.querySelectorAll('[data-p]').forEach(r=>{const p=people.find(x=>x.id===r.dataset.p);r.querySelector('.ok').onclick=()=>{p.last=nowMs();save();award(5);toast(cheer());drawAll()};r.querySelector('.rm').onclick=()=>{people=people.filter(x=>x!==p);save();drawAll()};r.querySelector('.hi').onclick=()=>draftFor('hello',p.name,'سلام وطمأنينة على '+p.name,()=>{p.last=nowMs();save()})});
  $('pGo').onclick=()=>{const n=$('pN').value.trim();if(!n)return;people.push({id:uid(),name:n,every:+$('pE').value||30,bday:$('pB').value.trim(),last:nowMs()});save();drawAll()}}
 else{const ks=Object.keys(places);b.innerHTML=`<div class="card"><div class="ch"><h3>🔑 أماكن الحاجات</h3><small>قول "الباسبور في الدولاب" ولما تنسى اسأل "فين الباسبور؟"</small></div><input id="plS" placeholder="دوّر..."><div id="plL"></div></div>
  <div class="card form"><input id="plT" placeholder="الحاجة"><input id="plW" placeholder="مكانها"><button class="btn" id="plGo">احفظ</button></div>`;
  const drawL=()=>{const q=$('plS').value.trim();$('plL').innerHTML=ks.filter(k=>!q||k.includes(q)||places[k].w.includes(q)).map(k=>`<div class="item"><div class="tx"><b>${esc(k)}</b><small>${esc(places[k].w)} · من ${daysAgo(places[k].d)} يوم</small></div><button class="mini-b" data-k="${esc(k)}">✕</button></div>`).join('')||'<p class="note">مفيش.</p>';$('plL').querySelectorAll('[data-k]').forEach(x=>x.onclick=()=>{delete places[x.dataset.k];save();drawAll()})};
  $('plS').oninput=drawL;drawL();$('plGo').onclick=()=>{const t=$('plT').value.trim(),w=$('plW').value.trim();if(!t||!w)return;places[t]={w,d:nowMs()};save();drawAll()}}}
function bindRows(root){root.querySelectorAll('.item[data-id]').forEach(r=>{const it=byId(r.dataset.id);if(!it)return;
 r.querySelector('.ck').onclick=()=>{if(it.done){it.done=false;save();render()}else finish(it.id)};
 r.querySelector('.star').onclick=()=>{if(!it.star&&items.filter(i=>i.star&&!i.done).length>=3){toast('3 بس كفاية. شيل نجمة الأول');return}it.star=!it.star;save();render()};
 r.querySelector('.op').onclick=()=>editItem(it)})}
function editItem(it,tm){const isNew=!it;it=it||Object.assign({type:'task',sec:'home',title:'',due:'',repeat:''},tm||{});
 openSheet(`<h2>${isNew?'حاجة جديدة':'تعديل'}</h2><div class="form">
 <label>إيه هي؟<input id="eT" value="${esc(it.title)}"></label>
 <label>النوع<select id="eY">${Object.entries(TYPE).map(([k,v])=>`<option value="${k}" ${it.type===k?'selected':''}>${v}</option>`).join('')}</select></label>
 <label>القسم<select id="eS">${Object.entries(SEC).map(([k,v])=>`<option value="${k}" ${it.sec===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select></label>
 <label>الميعاد<input id="eD" type="datetime-local" value="${esc(it.due)}"></label>
 <label>المكان (للمواعيد)<input id="eW" value="${esc(it.where||'')}"></label>
 <label>المبلغ (للفواتير)<input id="eA" type="number" inputmode="numeric" value="${it.amount||''}"></label>
 <label>بيتكرر؟<select id="eR"><option value="">لأ</option><option value="daily" ${it.repeat==='daily'?'selected':''}>كل يوم</option><option value="weekly" ${it.repeat==='weekly'?'selected':''}>كل أسبوع</option><option value="monthly" ${it.repeat==='monthly'?'selected':''}>كل شهر</option></select></label>
 <label class="tog"><input type="checkbox" id="eB" ${it.big?'checked':''}> مهمة كبيرة (تتقسم لخطوات)</label>
 <div class="acts"><button class="btn" id="eSave">احفظ</button>${isNew?'':'<button class="btn ghost" id="eCal">📅 ضيفها للكالندر</button><button class="btn ghost" id="eGo">يلا نبدأ</button><button class="btn ghost" id="eDel">شيلها</button>'}</div></div>`);
 $('eSave').onclick=()=>{const v={title:$('eT').value.trim(),type:$('eY').value,sec:$('eS').value,due:$('eD').value,where:$('eW').value.trim(),amount:+$('eA').value||0,repeat:$('eR').value,big:$('eB').checked};if(!v.title)return;
  if(isNew)addItem(v);else{Object.assign(it,v);it.notified=0;it.touched=nowMs();save()}closeSheet()};
 if(!isNew){$('eDel').onclick=()=>{removeItem(it.id);closeSheet()};$('eGo').onclick=()=>{closeSheet();startTask(it.id)};$('eCal').onclick=()=>ics(it)}}
function icsEvent(it){const d=parseL(it.due)||new Date(nowMs()+36e5);const f=x=>x.toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');const e=new Date(d.getTime()+(it.type==='appt'?60:30)*6e4);
 const rr=it.repeat?'RRULE:FREQ='+{daily:'DAILY',weekly:'WEEKLY',monthly:'MONTHLY'}[it.repeat]+'\r\n':'';const pre=it.type==='appt'?leaveMins(it):10;
 return 'BEGIN:VEVENT\r\nUID:'+it.id+'@sanady\r\nDTSTAMP:'+f(new Date())+'\r\nDTSTART:'+f(d)+'\r\nDTEND:'+f(e)+'\r\n'+rr+'SUMMARY:'+it.title.replace(/[,;\r\n]/g,' ')+'\r\n'+(it.where?'LOCATION:'+it.where.replace(/[,;\r\n]/g,' ')+'\r\n':'')+'BEGIN:VALARM\r\nTRIGGER:-PT'+pre+'M\r\nACTION:DISPLAY\r\nDESCRIPTION:سندي\r\nEND:VALARM\r\nEND:VEVENT\r\n'}
function icsSave(events,name){const s='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Sanady//AR\r\n'+events.join('')+'END:VCALENDAR';
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'text/calendar'}));a.download=name;a.click()}
function ics(it){icsSave([icsEvent(it)],'sanady-'+it.id+'.ics');toast('افتح الملف عشان يتضاف للكالندر وينبّهك حتى لو التطبيق مقفول',4000)}
/* every upcoming dated item in one calendar file, so the phone reminds even when Sanady is closed */
function icsAll(){const n=nowMs();const list=items.filter(i=>!i.done&&i.type!=='idea'&&i.due&&(parseL(i.due)>n||i.repeat));
 if(!list.length){toast('مفيش مواعيد جاية لسه. قول لسندي مواعيدك الأول');return}
 icsSave(list.map(icsEvent),'sanady-all.ics');store.set('icsAt',nowMs());toast('افتح الملف وضيف '+list.length+' مواعيد للكالندر. لما تضيف مواعيد جديدة اعمل ده تاني',5000)}

/* ---------- MONEY screen ---------- */
/* ---------- Telegram reminders: reach the phone even when Sanady is closed ---------- */
const REMIND_URL='https://2.31.109.72.sslip.io/webhook/sanady-remind';
const TG_READY=false; // Telegram reminders are switched off until the Sanady bot exists
function tgOn(){return TG_READY&&!DEMO&&store.get('tg',false)}
async function tgCall(mode,extra){let dev='';try{dev=localStorage.getItem('sn_dev')||''}catch(e){}
 const r=await fetch(REMIND_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({k:'wasl-nrg-2026',d:dev,mode},extra||{}))});
 const j=await r.json().catch(()=>({}));if(!r.ok&&!j.error)j.error='http';return j}
/* the message text: medicine names and bill amounts never leave the phone */
function tgText(i){const t=i.title;
 if(i.type==='med')return'💊 ميعاد الدوا';
 if(i.type==='appt')return'🚶 اتحرك دلوقتي عشان تلحق: '+t+(i.where?' ('+i.where+')':'');
 if(i.type==='bill')return'💸 فاتورة النهارده: '+t;
 if(i.type==='call')return'📞 '+t;if(i.type==='buy')return'🛒 '+t;return'✅ '+t}
/* every dated, open item in the next 14 days (repeats expanded); appointments fire when it's time to leave */
function tgList(){const n=nowMs(),end=n+14*864e5,out=[];
 items.filter(i=>!i.done&&i.type!=='idea'&&i.due).forEach(i=>{let d=parseL(i.due);if(!d||isNaN(d))return;let g=0;
  while(d.getTime()<=end&&g++<40){let at=d.getTime()-(i.type==='appt'?leaveMins(i)*6e4:0);
   if(g===1&&i.snooze>n&&at<i.snooze)at=i.snooze;
   if(at>n+30e3)out.push({at,text:tgText(i)});
   if(!i.repeat)break;d=new Date(d);if(i.repeat==='daily')d.setDate(d.getDate()+1);else if(i.repeat==='weekly')d.setDate(d.getDate()+7);else d.setMonth(d.getMonth()+1)}});
 return out.sort((a,b)=>a.at-b.at).slice(0,120)}
async function tgSync(force){if(!tgOn())return;const rem=tgList();const sig=JSON.stringify(rem);
 if(!force&&sig===store.get('tgSig','')&&nowMs()-store.get('tgAt',0)<6*36e5)return;
 try{const j=await tgCall('sync',{rem});if(j.error)return;
  if(j.linked===false){store.set('tg',false);store.set('tgSig','');toast('تليجرام اتفصل عن سندي. تقدر تربطه تاني من الإعدادات',4500);return}
  store.set('tgSig',sig);store.set('tgAt',nowMs())}catch(e){}}
function tgSoon(){if(!tgOn())return;clearTimeout(window.__tgT);window.__tgT=setTimeout(()=>tgSync(),4000)}
/* after the user pressed Start in Telegram and came back */
async function tgCheck(){const w=store.get('tgWait',0);if(!TG_READY||!w||DEMO)return;if(nowMs()-w>35*6e4){store.set('tgWait',0);return}
 try{const j=await tgCall('status');if(j.linked){store.set('tgWait',0);store.set('tg',true);await tgSync(true);confetti();toast('✅ تليجرام اتربط. تذكيراتك هتوصلك هناك حتى لو سندي مقفول',5000);if(!$('sheet').hidden&&$('tgBox'))tgSheet()}}catch(e){}}
function tgSheet(){const on=store.get('tg',false);
 openSheet(`<h2>تذكير على تليجرام</h2><div class="stack" id="tgBox">${on?
  `<p>✅ مربوط. أي ميعاد أو مهمة ليها وقت هتوصلك رسالة على تليجرام في وقتها، حتى لو التطبيق مقفول.</p><button class="btn ghost" id="tgNow">🔄 حدّث التذكيرات دلوقتي</button><button class="btn ghost" id="tgOff" style="color:var(--red)">افصل تليجرام</button>`:
  `<p>سندي يبعتلك رسالة على تليجرام في وقت كل ميعاد أو مهمة، حتى لو التطبيق مقفول والموبايل في جيبك.</p><button class="btn" id="tgGo">📲 اربط تليجرام</button><div id="tgLink"></div>`}
  <p class="note">علشان ده يشتغل، عناوين الحاجات اللي ليها وقت (للأسبوعين الجايين بس) ووقتها بتتحفظ على سيرفرنا لحد ما توصلك. اسم الدوا ومبالغ الفواتير ما بتتبعتش. لما تفصل، كل ده بيتمسح.</p></div>`);
 if(on){$('tgNow').onclick=async()=>{await tgSync(true);toast('اتحدّثت')};
  $('tgOff').onclick=async()=>{try{await tgCall('unlink')}catch(e){}store.set('tg',false);store.set('tgSig','');closeSheet();toast('اتفصل، ومسحنا تذكيراتك من السيرفر')};return}
 $('tgGo').onclick=async()=>{const b=$('tgGo');b.disabled=true;b.textContent='لحظة...';let j={};try{j=await tgCall('link')}catch(e){j={error:'net'}}
  b.disabled=false;b.textContent='📲 اربط تليجرام';
  if(j.error==='nobot'){toast('الخدمة دي لسه بتتجهز، جرّب كمان شوية',4000);return}
  if(!j.url||!/^https:\/\/t\.me\//.test(j.url)){toast('مفيش نت أو السيرفر مش بيرد. جرّب تاني',4000);return}
  store.set('tgWait',nowMs());
  b.hidden=true;$('tgLink').innerHTML=`<a class="btn" style="display:block;text-align:center" href="${esc(j.url)}" target="_blank" rel="noopener">✈️ افتح تليجرام واضغط Start</a><p class="note">بعد ما تضغط Start ارجع هنا، وسندي هيتأكد لوحده.</p>`}}

function drawMoney(){const A=availCalc();const col=A.avail<0?'var(--red)':A.avail<(M.week||500)?'var(--yel)':'var(--grn)';
 $('availCard').innerHTML=`<div class="ch"><h3>تقدر تصرف لحد المرتب</h3><small>المرتب الجاي ${A.end.getDate()} ${MONTHS[A.end.getMonth()]} · فاضل ${A.days} يوم</small></div><div class="big num" style="color:${col}">${money(A.avail)} <small style="font-size:18px">جنيه</small></div>
 <div class="lines"><div><span>الرصيد</span><span class="num">${money(A.bal)}</span></div><div><span>− فواتير وأقساط قبل المرتب (${A.bills.length})</span><span class="num">${money(A.bsum)}</span></div><div><span>− أكل ومواصلات (${A.days} يوم)</span><span class="num">${money(A.living)}</span></div><div><span>− مبلغ الطوارئ</span><span class="num">${money(A.buf)}</span></div></div>
 ${!M.bal&&!M.sal?'<p class="note">قول لسندي مرة واحدة: "معايا في البنك 12 ألف، ومرتبي 15 ألف بقبضه يوم 1" أو املا الإعدادات تحت.</p>':''}`;
 $('wishCard').innerHTML=`<div class="ch"><h3>🎁 قايمة الأمنيات</h3><small>الحاجات اللي اتأجلت. أول ما الفلوس تكفي هقولك.</small></div>${wish.length?wish.map(w=>{const fr=Math.max(0,Math.min(1,A.avail/w.price));return`<div class="item"><div class="tx"><b>${esc(w.name)} · <span class="num">${money(w.price)}</span> ج</b><small>${w.wait&&nowMs()<w.wait?'⏳ استنى لحد '+fmtWhen(toLocal(new Date(w.wait))):w.plan?'🗓️ الخطة: '+new Date(w.plan).getDate()+' '+MONTHS[new Date(w.plan).getMonth()]:''}</small><div class="bar"><i style="width:${fr*100}%"></i></div></div><button class="mini-b" data-w="${w.id}">✕</button></div>`}).join(''):'<p class="note">فاضية.</p>'}`;
 $('wishCard').querySelectorAll('[data-w]').forEach(x=>x.onclick=()=>{wish=wish.filter(w=>w.id!==x.dataset.w);save();drawMoney()});
 const bills=items.filter(i=>i.type==='bill'&&!i.done).sort((a,b)=>(a.due||'').localeCompare(b.due||''));
 $('billsCard').innerHTML=`<div class="ch"><h3>🧾 الفواتير والأقساط والاشتراكات</h3><small>هفكّرك قبل ميعادها بيومين</small></div>${bills.length?bills.map(itemRow).join(''):'<p class="note">مفيش. قول "فاتورة النت 450 كل شهر يوم 28".</p>'}<button class="btn ghost" id="addBill">+ فاتورة</button>`;
 bindRows($('billsCard'));$('addBill').onclick=()=>editItem(null,{type:'bill',sec:'money',repeat:'monthly'});
 const mk=dayKey().slice(0,7);const sp=(M.spends||[]).filter(s=>toLocal(new Date(s.d)).slice(0,7)===mk);const tot=sp.reduce((s,x)=>s+x.a,0);const by={};sp.forEach(s=>{const k=s.note||'حاجات تانية';by[k]=(by[k]||0)+s.a});const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,3);
 const paid=sp.filter(s=>s.bill).length;
 $('monthCard').innerHTML=`<div class="ch"><h3>📊 الشهر ده</h3><small>من غير لوم، عشان تعرف بس</small></div><p>صرفت <b class="num">${money(tot)}</b> جنيه${top.length?'، أكتر حاجة في '+top.map(t=>esc(t[0])+' (<span class="num">'+money(t[1])+'</span>)').join(' و'):''}.</p>${paid?'<p>دفعت '+paid+' فواتير في ميعادها 👏</p>':''}${M.saved?'<p>حوّشت <b class="num">'+money(M.saved)+'</b> جنيه.</p>':''}<button class="btn ghost" id="saveBtn">حوّشت ${money(M.week||500)} النهارده</button>`;
 $('saveBtn').onclick=()=>{M.saved=(M.saved||0)+(M.week||500);save();award(10);confetti();drawMoney()};
 [['mBal','bal'],['mSal','sal'],['mPay','pay'],['mDaily','daily'],['mBuf','buf'],['mWeek','week'],['mBrake','brake']].forEach(([id,k])=>{if(document.activeElement!==$(id))$(id).value=M[k]||''})}
$('mSave').onclick=()=>{[['mBal','bal'],['mSal','sal'],['mPay','pay'],['mDaily','daily'],['mBuf','buf'],['mWeek','week'],['mBrake','brake']].forEach(([id,k])=>M[k]=+$(id).value||0);save();toast('اتحفظ');render()};

/* ---------- NIGHT REVIEW ---------- */
$('qNight').onclick=()=>nightSheet();$('qWeek').onclick=()=>weekSheet();
function nightSheet(){const d=doneToday();const n=d.length;const steps=items.reduce((s,i)=>s,0);
 const msg=n?'النهارده عملت '+n+' '+(n===1?'حاجة':'حاجات')+'. '+cheer():'النهارده كان يوم، وده كفاية. بكرة يوم جديد.';
 openSheet(`<h2>🌙 ملخص اليوم</h2><div class="stack"><div class="say">${esc(msg)}</div>${n?'<div class="res">'+d.map(i=>'<div class="item done"><span class="ck on">✓</span><div class="tx"><b>'+esc(i.title)+'</b></div></div>').join('')+'</div>':''}
 <p><b>نمت كام ساعة امبارح؟</b></p><div class="feel" id="nS">${['4','5','6','7','8+'].map(x=>`<button class="chip">${x}</button>`).join('')}</div>
 <p><b>التركيز النهارده كان عامل إزاي؟</b></p><div class="feel" id="nF">${['😫','😐','🙂','😄'].map(x=>`<button class="chip">${x}</button>`).join('')}</div>
 <div class="acts"><button class="btn" id="nDump">🎙️ فرّغ دماغك لبكرة</button><button class="btn ghost" id="nSleep">😴 وضع النوم</button></div>
 <p class="note">الإجابات دي بتتسجل في يوميات تقدر تاخدها للدكتور من الإعدادات.</p></div>`);
 const log=(k,v)=>{let e=diary.find(x=>x.d===dayKey()&&x.night);if(!e){e={d:dayKey(),t:nowMs(),night:1};diary.push(e)}e[k]=v;save()};
 $('nS').querySelectorAll('button').forEach(b=>b.onclick=()=>{log('sleep',b.textContent);$('nS').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))});
 $('nF').querySelectorAll('button').forEach(b=>b.onclick=()=>{log('focus',b.textContent);$('nF').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))});
 $('nDump').onclick=()=>openDump(null,'إيه اللي في دماغك لبكرة؟ قوله وسيبه لسندي، ونام وإنت مرتاح.');$('nSleep').onclick=()=>{closeSheet();sleepMode()};speak(msg)}

/* ---------- papers: renewal reminder a month before a document expires ---------- */
const docDate=e=>{const d=new Date(e+'T10:00');return isNaN(d)?e:d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear()};
function docRenew(name,exp){const ex=new Date(exp+'T10:00');if(!name||isNaN(ex))return null;docs[name]=exp;
 const rem=new Date(ex);rem.setDate(rem.getDate()-30);const n=NOW();if(rem<n){rem.setTime(n.getTime()+864e5);rem.setHours(10,0,0,0)}
 const title='أجدد '+name+' (بيخلص '+docDate(exp)+')';const old=items.find(i=>!i.done&&i.doc===name);
 if(old){old.title=title;old.due=toLocal(rem);old.notified=0;old.touched=nowMs();save();return old}
 const it=addItem({type:'task',sec:'papers',title,due:toLocal(rem)});it.doc=name;save();return it}
function docsSheet(){const n=nowMs();const list=Object.keys(docs).map(k=>({k,e:docs[k],d:(new Date(docs[k]+'T10:00')-n)/864e5})).sort((a,b)=>a.d-b.d);
 openSheet(`<h2>📄 ورقي ومواعيد التجديد</h2><div class="stack"><p>قول لسندي مثلاً «الرخصة بتخلص 15 يناير» وهو يحطها هنا ويفكّرك تجددها قبلها بشهر. أو ضيفها بإيدك:</p>
 ${list.length?'<div class="res">'+list.map(x=>`<div class="item"><div class="tx"><b>${x.d<0?'⛔':x.d<60?'⚠️':'📄'} ${esc(x.k)}</b><small>${x.d<0?'خلص من ':'بيخلص '}${esc(docDate(x.e))}</small></div><button class="mini-b rm" data-k="${esc(x.k)}">✕</button></div>`).join('')+'</div>':'<p class="note">لسه ما فيش ورق متسجل.</p>'}
 <div class="form"><label>اسم الورقة<input id="dcN" placeholder="مثلاً: الباسبور"></label><label>بتخلص إمتى؟<input id="dcE" type="date"></label><button class="btn" id="dcAdd">ضيف</button></div></div>`);
 document.querySelectorAll('.rm[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;delete docs[k];items=items.filter(i=>!(i.doc===k&&!i.done));save();docsSheet()});
 $('dcAdd').onclick=()=>{const nm=$('dcN').value.trim().slice(0,40),e=$('dcE').value;if(!nm||!/^\d{4}-\d{2}-\d{2}$/.test(e)){toast('اكتب الاسم والتاريخ');return}docRenew(nm,e);toast('تمام، هفكّرك تجدد '+nm+' قبلها بشهر');render();docsSheet()}}

/* ---------- weekly review: a calm 5-minute reset once a week ---------- */
function nextWeek(id){const it=byId(id);if(!it)return;const d=NOW();d.setDate(d.getDate()+7);d.setHours(10,0,0,0);it.due=toLocal(d);it.touched=nowMs();it.notified=0;save();render()}
function weekSheet(){const n=nowMs(),wk=7*864e5;
 const done=items.filter(i=>i.done&&i.doneAt&&n-i.doneAt<wk).length;
 const late=items.filter(i=>!i.done&&i.type!=='idea'&&i.type!=='med'&&i.due&&parseL(i.due)<n).sort((a,b)=>parseL(a.due)-parseL(b.due)).slice(0,8);
 const next=items.filter(i=>!i.done&&i.type!=='idea'&&i.due&&parseL(i.due)>=n&&parseL(i.due)-n<wk).sort((a,b)=>parseL(a.due)-parseL(b.due)).slice(0,10);
 const pick=items.filter(i=>!i.done&&i.type!=='idea'&&i.type!=='buy'&&!i.due).sort((a,b)=>(b.star?1:0)-(a.star?1:0)||(a.created||0)-(b.created||0)).slice(0,10);
 const msg=done?'الأسبوع ده خلّصت '+done+' '+(done===1?'حاجة':done<=10?'حاجات':'حاجة')+'. '+cheer():'أسبوع جديد، بداية جديدة. يلا نرتب سوا من غير لوم.';
 const W=i=>(SEC[i.sec]||['•'])[0];
 openSheet(`<h2>🗓️ مراجعة الأسبوع</h2><div class="stack"><div class="say">${esc(msg)}</div>
 ${late.length?`<p><b>حاجات عدّى وقتها (${late.length})</b><br><small>نقرر في كل واحدة بسرعة:</small></p>`+late.map(i=>`<div class="wrow" data-w="${i.id}"><div class="item"><div class="tx"><b>${W(i)} ${esc(i.title)}</b><small>كان ${esc(fmtWhen(i.due))}</small></div></div><div class="acts"><button class="chip" data-a="t">بكرة</button><button class="chip" data-a="w">الأسبوع الجاي</button><button class="chip" data-a="d">خلصت ✓</button><button class="chip" data-a="x">شيلها</button></div></div>`).join(''):'<p>👌 مفيش حاجة متأخرة.</p>'}
 ${next.length?`<p><b>الأسبوع الجاي</b></p><div class="res">`+next.map(i=>`<div class="item"><div class="tx"><b>${W(i)} ${esc(i.title)}</b><small>${esc(fmtWhen(i.due))}${i.type==='bill'&&i.amount?' · '+money(i.amount)+' جنيه':''}</small></div></div>`).join('')+'</div>':''}
 ${pick.length?`<p><b>اختار لحد 3 حاجات مهمة للأسبوع</b><br><small>هيطلعوا لك فوق في الصفحة الرئيسية.</small></p><div class="feel" id="wPick">`+pick.map(i=>`<button class="chip ${i.star?'on':''}" data-id="${i.id}">${esc(i.title)}</button>`).join('')+'</div>':''}
 <button class="btn big" id="wDone">خلصت المراجعة ✓</button></div>`);
 document.querySelectorAll('.wrow').forEach(r=>r.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const id=r.dataset.w,a=b.dataset.a;
  if(a==='t')toTomorrow(id);else if(a==='w')nextWeek(id);else if(a==='d')finish(id,true);else removeItem(id);r.remove()}));
 const wp=$('wPick');if(wp)wp.querySelectorAll('button').forEach(b=>b.onclick=()=>{const it=byId(b.dataset.id);if(!it)return;
  if(!it.star&&items.filter(i=>i.star&&!i.done).length>=3){toast('3 كفاية. شيل واحدة الأول');return}
  it.star=!it.star;it.touched=nowMs();b.classList.toggle('on',it.star);save()});
 $('wDone').onclick=()=>{store.set('weekRev',nowMs());award(15);closeSheet();confetti();toast('أسبوعك مترتب 🗓️ '+cheer(),3500);render()}}

/* ---------- backup: data lives only on this phone, so let it move to a new one ---------- */
const BK_SKIP=['dev','tok','tok_at','tg','tgSig','tgAt','tgWait'];
function backupSave(){const data={};Object.keys(localStorage).forEach(k=>{if(!k.startsWith(PFX))return;const nm=k.slice(PFX.length);if(BK_SKIP.includes(nm))return;data[nm]=localStorage.getItem(k)});
 const f={app:'sanady',v:1,at:new Date(nowMs()).toISOString(),data};
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(f)],{type:'application/json'}));a.download='sanady-backup-'+dayKey()+'.json';a.click();
 store.set('bkAt',nowMs());toast('اتحفظت نسخة. ابعتها لنفسك على واتساب أو حطها على درايف',4500)}
function backupLoad(file){if(!file)return;if(file.size>5e6){toast('الملف كبير قوي، ده مش نسخة من سندي');return}
 const r=new FileReader();r.onload=()=>{let f=null;try{f=JSON.parse(r.result)}catch(e){}
  if(!f||f.app!=='sanady'||!f.data||typeof f.data!=='object'){toast('الملف ده مش نسخة من سندي');return}
  const keys=Object.keys(f.data).filter(k=>/^[A-Za-z0-9_]{1,30}$/.test(k)&&!BK_SKIP.includes(k)&&typeof f.data[k]==='string');
  let it0=[];try{it0=JSON.parse(f.data.items||'[]')}catch(e){}
  if(!confirm('هنرجّع نسخة '+String(f.at||'').slice(0,10)+' فيها '+(Array.isArray(it0)?it0.length:0)+' حاجة. اللي على الموبايل دلوقتي هيتبدل بيها. موافق؟'))return;
  Object.keys(localStorage).filter(k=>k.startsWith(PFX)&&!BK_SKIP.includes(k.slice(PFX.length))).forEach(k=>localStorage.removeItem(k));
  keys.forEach(k=>{try{localStorage.setItem(PFX+k,f.data[k])}catch(e){}});
  try{localStorage.removeItem(PFX+'tgSig')}catch(e){}
  toast('رجعت بياناتك ✓');setTimeout(()=>location.reload(),900)};r.readAsText(file)}
function backupSheet(){const at=store.get('bkAt',0);
 openSheet(`<h2>💾 نسخة احتياطية</h2><div class="stack"><p>كل حاجة في سندي محفوظة على الموبايل ده بس. لو ضاع أو غيرته، النسخة دي بترجّع كل حاجة: مهامك وفلوسك وأماكن حاجاتك ويومياتك.</p>
 <p><small>${at?'آخر نسخة: '+esc(fmtWhen(toLocal(new Date(at)))):'لسه ما عملتش نسخة.'}</small></p>
 <button class="btn" id="bkSave">💾 احفظ نسخة دلوقتي</button>
 <label class="btn ghost" style="text-align:center">📂 رجّع من نسخة<input type="file" id="bkFile" accept="application/json,.json" hidden></label>
 <p class="note">الملف فيه كل بياناتك، فابعته لنفسك بس (واتساب لنفسك أو درايف). ربط تليجرام ما بيتنقلش، اربطه تاني على الموبايل الجديد.</p></div>`);
 $('bkSave').onclick=()=>{backupSave();closeSheet()};$('bkFile').onchange=e=>backupLoad(e.target.files&&e.target.files[0])}

/* ---------- SETTINGS ---------- */
$('btnSet').onclick=()=>{openSheet(`<h2>الإعدادات</h2><div class="form">
 <label>اسمك<input id="sN" value="${esc(prof.name)}"></label>
 <label>أكلمك بصيغة<select id="sX"><option value="m" ${prof.sex!=='f'?'selected':''}>مذكر</option><option value="f" ${prof.sex==='f'?'selected':''}>مؤنث</option></select></label>
 <label class="tog"><input type="checkbox" id="sV" ${prof.voice?'checked':''}> سندي يتكلم بصوت</label>
 <label>صوت سندي<select id="sG"><option value="f" ${prof.vg!=='m'?'selected':''}>بنت</option><option value="m" ${prof.vg==='m'?'selected':''}>ولد</option></select></label>
 <label>بتصحى الساعة كام؟<input id="sW" type="time" value="${esc(prof.wake)}"></label>
 <label>بتنام الساعة كام؟<input id="sS" type="time" value="${esc(prof.sleep)}"></label>
 <label>المشوار العادي بياخد كام دقيقة؟<input id="sT" type="number" inputmode="numeric" value="${prof.travel}"></label>
 <label>حاجات تاخدها وإنت نازل<input id="sP" value="${esc(prof.prep)}"></label>
 <button class="btn" id="sSave">احفظ</button>
 ${TG_READY?'<button class="btn ghost" id="sTg">📲 تذكير على تليجرام (والتطبيق مقفول)</button>':''}
 <button class="btn ghost" id="sDoc">📄 ورقي ومواعيد التجديد</button>
 <button class="btn ghost" id="sBk">💾 نسخة احتياطية / موبايل جديد</button>
 <button class="btn ghost" id="sCal">📅 كل مواعيدي في الكالندر (ينبّهك والتطبيق مقفول)</button>
 <button class="btn ghost" id="sNot">🔔 شغّل التنبيهات</button>
 <button class="btn ghost" id="sFam">👨‍👩‍👧 خلّي حد من العيلة يضيفلك تذكير</button>
 <button class="btn ghost" id="sExp">🩺 يوميات للدكتور (ملف)</button>
 <a class="btn ghost" href="privacy.html">🔒 الخصوصية والأمان</a>
 <button class="btn ghost" id="sWipe" style="color:var(--red)">امسح كل بياناتي</button>
 <p class="note">سندي مش دكتور ولا علاج، وبيكمّل الدكتور مش بيبدله. مواعيد الدوا تذكير بس من غير جرعات. مستشار المشتريات بينظّم الصرف بس. كل بياناتك على موبايلك، والكلام اللي بتقوله بيتبعت بس عشان يترتب ومش بيتحفظ عندنا.</p></div>`);
 $('sSave').onclick=()=>{Object.assign(prof,{name:$('sN').value.trim(),sex:$('sX').value,voice:$('sV').checked,vg:$('sG').value,wake:$('sW').value||'07:30',sleep:$('sS').value||'23:30',travel:+$('sT').value||30,prep:$('sP').value.trim()||'المفاتيح'});save();closeSheet();toast('اتحفظ')};
 $('sCal').onclick=()=>icsAll();
 if($('sTg'))$('sTg').onclick=()=>tgSheet();
 $('sBk').onclick=()=>backupSheet();
 $('sDoc').onclick=()=>docsSheet();
 $('sNot').onclick=async()=>{try{const p=await Notification.requestPermission();toast(p==='granted'?'تمام، هنبهك والتطبيق مفتوح. للتنبيه وهو مقفول ضيف مواعيدك للكالندر':'التنبيهات مقفولة من المتصفح',4500)}catch(e){toast('المتصفح ده مش بيدعم التنبيهات')}};
 $('sFam').onclick=()=>{const link=location.origin+location.pathname+'?send=1&to='+encodeURIComponent(prof.name||'');const txt='لو عايز تفكّرني بحاجة، ابعتلي من اللينك ده وهتوصل على سندي: '+link;
  $('sheetBody').innerHTML=`<h2>تذكير من العيلة</h2><div class="stack"><p>ابعت اللينك ده لحد بتثق فيه. يكتب التذكير، ويبعتهولك، وإنت توافق عليه قبل ما يتضاف. مفيش حسابات ولا سيرفر.</p>${draftBox(txt)}
  <details><summary><b>شرح بسيط للعيلة عن الـ ADHD</b></summary>${draftBox('الـ ADHD مش كسل ولا قلة اهتمام. الدماغ بيلاقي صعوبة في البدء والتنظيم وحساب الوقت، مش في الذكاء. اللي بيساعد: تذكير هادي بدل اللوم، وطلب حاجة واحدة في المرة، ومساعدة في أول خطوة. شكراً إنك بتحاول تفهم 💜')}</details></div>`};
 $('sExp').onclick=()=>{const rows=[['التاريخ','نوم (ساعات)','تركيز','إحساس','دوا اتاخد']];const by={};diary.forEach(e=>{const r=by[e.d]=by[e.d]||{d:e.d,sleep:'',focus:'',feel:[],med:[]};if(e.sleep)r.sleep=e.sleep;if(e.focus)r.focus=e.focus;if(e.feel)r.feel.push(e.feel);if(e.med)r.med.push(e.med)});
  Object.values(by).sort((a,b)=>a.d.localeCompare(b.d)).forEach(r=>rows.push([r.d,r.sleep,r.focus,r.feel.join(' / '),r.med.join(' / ')]));
  const csv='﻿'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='sanady-diary.csv';a.click()};
 $('sWipe').onclick=async()=>{if(!confirm('متأكد؟ كل حاجة هتتمسح من الموبايل.'))return;if(store.get('tg',false)){try{await tgCall('unlink')}catch(e){}}Object.keys(localStorage).filter(k=>k.startsWith(PFX)).forEach(k=>localStorage.removeItem(k));location.reload()}};

/* ---------- family links ---------- */
function b64e(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function b64d(s){try{return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))))}catch(e){return null}}
function familyFlows(){const q=new URLSearchParams(location.search);
 if(q.get('send')){document.querySelector('.tabs').hidden=true;document.querySelector('.top').hidden=true;document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  const to=q.get('to')||'';openSheet(`<h2>${to?'فكّر '+esc(to)+' بحاجة':'ابعت تذكير على سندي'}</h2><div class="form"><label>اسمك<input id="faF" placeholder="ماما، بابا، مراتي..."></label><label>التذكير<input id="faT" placeholder="ميعاد الدكتور، تجيب عيش..."></label><label>امتى؟<input id="faD" type="datetime-local"></label><button class="btn" id="faGo">جهّز الرسالة</button><div id="faOut"></div><p class="note">التذكير مش بيتحفظ عند حد. هيوصل في الرسالة بس، و${esc(to)||'هو'} يوافق عليه.</p></div>`);
  $('sheetX').hidden=true;$('faGo').onclick=()=>{const t=$('faT').value.trim();if(!t)return;const link=location.origin+location.pathname+'#add='+b64e({t,d:$('faD').value,f:$('faF').value.trim()});$('faOut').innerHTML=draftBox('ضيفتلك تذكير على سندي: '+t+'\n'+link)};return true}
 if(location.hash.startsWith('#add=')){const o=b64d(location.hash.slice(5));history.replaceState(null,'',location.pathname+location.search);if(o&&o.t){setTimeout(()=>{openSheet(`<h2>تذكير من ${esc(o.f||'حد بيحبك')}</h2><div class="stack"><div class="say">${esc(o.t)}${o.d?' · '+esc(fmtWhen(o.d)):''}</div><div class="acts"><button class="btn" id="faY">ضيفه</button><button class="btn ghost" onclick="closeSheet()">لأ</button></div></div>`);$('faY').onclick=()=>{addItem({type:'task',sec:'people',title:o.t,due:o.d||'',from:o.f});closeSheet();toast('اتضاف 💜')}},400)}}
 return false}

/* ---------- screens & render ---------- */
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));document.querySelectorAll('.tabs [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===id));window.scrollTo(0,0);render()}
document.querySelectorAll('.tabs [data-t]').forEach(b=>b.onclick=()=>show(b.dataset.t));
function render(){const n=NOW();const h=n.getHours();const nm=prof.name?' يا '+prof.name:'';
 $('greet').textContent=(h<12?'صباح الخير':h<17?'أهلاً':'مساء الخير')+nm;$('today').textContent=DAYS[n.getDay()]+' '+n.getDate()+' '+MONTHS[n.getMonth()]+' · '+fmtT(n);
 $('hardBar').hidden=!isHard();$('qHard').classList.toggle('on',isHard());
 const on=document.querySelector('.screen.on');if(!on)return;
 if(on.id==='now'){drawNudge();drawNext();drawTop3();drawMini()}else if(on.id==='all')drawAll();else if(on.id==='money')drawMoney();else if(on.id==='focus')drawRing()}
function morning(){const k=dayKey();if(store.get('morning','')===k||NOW().getHours()>=13||DEMO)return;store.set('morning',k);const c=candidates();const n=items.filter(i=>!i.done&&i.due&&dayKey(parseL(i.due))===k).length;
 const msg=(prof.name?'صباح الخير يا '+prof.name+'. ':'صباح الخير. ')+(n?'النهارده عندك '+n+' حاجات. ':'')+(c[0]?'أول حاجة: '+c[0].title+'.':'يومك فاضي، استمتع بيه.');setTimeout(()=>{if(audUnlocked)speak(msg);else toast(msg,5000)},800)}
setInterval(()=>{if(!$('sheet').hidden&&document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;if($('sheet').hidden)render();else{const t=$('today');if(t)t.textContent=DAYS[NOW().getDay()]+' '+NOW().getDate()+' '+MONTHS[NOW().getMonth()]+' · '+fmtT(NOW())}},20000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){render();tgCheck();tgSync()}});

/* ---------- boot ---------- */
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
window.addEventListener('DOMContentLoaded',()=>{if(familyFlows())return;render();setTimeout(()=>{tgCheck();tgSync()},1500);if(store.get('seen',false))morning();
 const go=new URLSearchParams(location.search).get('go');if(go==='focus')show('focus');else if(go==='money')show('money');else if(go==='dump'&&store.get('seen',false))setTimeout(()=>openDump(),300);
 if(!store.get('seen',false)&&!DEMO){store.set('seen',true);openSheet(`<h2>أهلاً، أنا سندي 💜</h2><div class="stack"><div class="say">سندك اللي جواك. قولّي كل اللي في دماغك وأنا أرتبه، وأفكّرك في الوقت الصح، وأبدأ معاك أول خطوة. من غير لوم.</div>
 <label class="form">اسمك إيه؟<input id="wN" placeholder="اسمك"></label><div class="acts"><button class="btn ghost" data-x="m">كلّمني بصيغة المذكر</button><button class="btn ghost" data-x="f">بصيغة المؤنث</button></div>
 <button class="btn big" id="wGo">🎙️ يلا نفرّغ دماغك</button><p class="note">كل حاجة بتتحفظ على موبايلك بس. سندي مش علاج ولا تشخيص.</p></div>`);
  document.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{prof.sex=b.dataset.x;document.querySelectorAll('[data-x]').forEach(x=>x.classList.toggle('on',x===b))});
  $('wGo').onclick=()=>{prof.name=$('wN').value.trim();save();closeSheet();openDump()}}});
