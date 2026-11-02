// البيت المشترك: كذا موبايل في نفس البيت بيشوفوا نفس قايمة الناقص والنضافة والولاد.
// كود البيت هو المفتاح: القوايم بتتقفل على الموبايل قبل ما تطلع، والسيرفر بيشوف كلام مقفول بس.
const HSYNC_URL='https://2.31.109.72.sslip.io/webhook/sanady-home';
const HS={code:null,key:null,hid:'',busy:false,last:+(store.get('hs_at',0)||0),err:''};
const hsGet=k=>{try{return localStorage.getItem(DK+k)}catch(e){return null}};
const hsSet=(k,v)=>{try{v==null?localStorage.removeItem(DK+k):localStorage.setItem(DK+k,v)}catch(e){}};
const IS_DEMO=PFX!==DK;
const hsB64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
const hsUnB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function hsInit(code){if(!code||!crypto.subtle)return false;
 const enc=new TextEncoder();const h=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode('sanady-home:'+code)));
 HS.hid=Array.from(h.slice(0,16)).map(x=>('0'+x.toString(16)).slice(-2)).join('');
 const base=await crypto.subtle.importKey('raw',enc.encode(code),'PBKDF2',false,['deriveKey']);
 HS.key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:enc.encode('sanady-home-v1'),iterations:100000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 HS.code=code;return true}
async function hsLock(o){const iv=crypto.getRandomValues(new Uint8Array(12));const c=await crypto.subtle.encrypt({name:'AES-GCM',iv},HS.key,new TextEncoder().encode(JSON.stringify(o)));return hsB64(iv)+'.'+hsB64(c)}
async function hsOpen(s){try{const [a,b]=String(s).split('.');const p=await crypto.subtle.decrypt({name:'AES-GCM',iv:hsUnB64(a)},HS.key,hsUnB64(b));return JSON.parse(new TextDecoder().decode(p))}catch(e){return null}}
const hsCode=()=>{const a=crypto.getRandomValues(new Uint8Array(24)),c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';return Array.from(a,x=>c[x%c.length]).join('')};

// القوايم المشتركة: id → العنصر
function hsLocal(){const okId=id=>/^[A-Za-z0-9_-]{1,40}$/.test(String(id));const m={needs:{},chores:{},kids:{},kitems:{}};
 items.forEach(i=>{if(!okId(i.id))return;if(i.type==='buy')m.needs[i.id]=i;else if(i.kid)m.kitems[i.id]=i});
 HOME.chores.forEach(c=>{if(okId(c.id))m.chores[c.id]=c});HOME.kids.forEach(k=>{if(okId(k.id))m.kids[k.id]=k});return m}
function hsPut(col,id,v){
 if(col==='chores'||col==='kids'){const arr=HOME[col],ix=arr.findIndex(x=>x.id===id);if(v==null){if(ix>=0)arr.splice(ix,1)}else if(ix>=0)arr[ix]=v;else arr.push(v);return}
 const ix=items.findIndex(x=>x.id===id);if(v==null){if(ix>=0)items.splice(ix,1)}else if(ix>=0)items[ix]=v;else items.push(v)}

async function homeSync(quiet){if(!HS.key||HS.busy||IS_DEMO)return;HS.busy=true;
 try{const snap=store.get('hs_snap',null);const first=!snap;const s=snap||{};const cur=hsLocal(),now=Date.now(),out={},sent={};
  if(!first)for(const c of Object.keys(cur)){const sc=s[c]||{},cc=cur[c];out[c]={};sent[c]={};
   for(const [id,v] of Object.entries(cc)){const j=JSON.stringify(v);sent[c][id]=j;if(!sc[id]||sc[id]!==j)out[c][id]={v:await hsLock(v),u:now}}
   for(const id of Object.keys(sc))if(!(id in cc)&&sc[id]!=='')out[c][id]={del:1,u:now}}
  const r=await fetch(HSYNC_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k:'wasl-nrg-2026',d:hsGet('dev')||'',h:HS.hid,data:out})});
  const j=await r.json().catch(()=>null);if(!r.ok||!j||!j.ok)throw new Error((j&&j.why)||'server');
  const after=hsLocal(),ns={};let changed=false;
  for(const c of Object.keys(after)){ns[c]={};const rem=(j.data&&j.data[c])||{};
   for(const [id,e] of Object.entries(rem)){
    const mid=after[c][id]&&JSON.stringify(after[c][id])!==(sent[c]?sent[c][id]:JSON.stringify(after[c][id]));
    if(mid&&!first)continue; // اتغيّر هنا وإحنا بنبعت: يستنى المرة الجاية
    if(e.del){if(after[c][id]){hsPut(c,id,null);changed=true}ns[c][id]='';continue}
    const v=await hsOpen(e.v);if(!v||v.id!==id)continue;const jv=JSON.stringify(v);
    if(!after[c][id]||JSON.stringify(after[c][id])!==jv){hsPut(c,id,v);changed=true}ns[c][id]=jv}
   if(!first)for(const [id,j2] of Object.entries(s[c]||{}))if(!(id in ns[c])&&j2==='')ns[c][id]=''}
  store.set('hs_snap',ns);HS.last=Date.now();store.set('hs_at',HS.last);HS.err='';
  if(changed){store.set('home',HOME);save();if($('sheet').hidden)render()}
  if(first)setTimeout(()=>homeSync(true),500); // الحاجات اللي كانت عندك بس تطلع للبيت
 }catch(e){HS.err=String(e.message||e);if(!quiet)toast('البيت المشترك مش متاح دلوقتي، هنحاول تاني')}
 finally{HS.busy=false}}

let hsLastSeen='';
function hsTick(){if(!HS.key||document.hidden)return;const j=JSON.stringify(hsLocal());
 if(j!==hsLastSeen||Date.now()-HS.last>90e3){hsLastSeen=j;homeSync(true)}}

async function homeJoin(code,quiet){if(!/^[A-Za-z0-9]{20,40}$/.test(code))return false;if(!(await hsInit(code)))return false;
 hsSet('home_code',code);store.set('hs_snap',null);await homeSync(quiet);return true}
function homeLeave(){hsSet('home_code',null);store.set('hs_snap',null);Object.assign(HS,{code:null,key:null,hid:''});toast('خرجت من البيت المشترك. قوايمك فضلت على موبايلك')}
const homeLink=()=>location.origin+location.pathname+'#home='+HS.code+(prof.name?'&n='+encodeURIComponent(prof.name):'');

function homeSheet(){
 const tag='<p class="note">⭐ من مزايا الاشتراك الشهري، ومفتوحة مجاناً طول فترة التجربة.</p>';
 const priv='<p class="note">🔒 قايمة الناقص والنضافة والولاد بتتقفل على موبايلك بكود البيت قبل ما تطلع، والسيرفر بيشيلها مقفولة ومبيقدرش يقراها. اللي معاه اللينك بس يقدر يدخل، فابعتيه لأهل البيت بس.</p>';
 if(IS_DEMO){openSheet('<h2>🏠 البيت المشترك</h2><p class="note">مش متاح في وضع العرض التجريبي.</p>');return}
 if(!HS.key){openSheet(`<h2>🏠 البيت المشترك</h2><p>إنتي وجوزك والولاد الكبار تشوفوا نفس القايمة: اللي خلص في البيت، النضافة، ودوا ومواعيد الولاد. أي حد يضيف أو يشطب، الكل يشوف.</p>${tag}<button class="btn" id="hsNew">اعملي بيت جديد</button><p class="note">عندك لينك من حد في البيت؟ افتحيه من الموبايل ده وهيدخلك على طول.</p>${priv}`);
  $('hsNew').onclick=async()=>{$('hsNew').disabled=true;const ok=await homeJoin(hsCode());if(ok){toast('البيت جاهز 🏠');homeSheet()}else{$('hsNew').disabled=false;toast('الموبايل ده مش بيدعم القفل، جربي متصفح أحدث')}};return}
 const when=HS.last?new Date(HS.last).toLocaleTimeString('ar-EG',{hour:'numeric',minute:'2-digit'}):'لسه';
 openSheet(`<h2>🏠 البيت المشترك</h2><p>شغال ✓ · آخر تحديث ${esc(when)}${HS.err?' · <span style="color:var(--red)">مفيش نت دلوقتي</span>':''}</p>
  <p class="note">ابعتي اللينك ده لأهل البيت. أول ما يفتحوه هيشوفوا نفس القايمة.</p>
  <button class="btn" id="hsWa">ابعتي اللينك واتساب</button><button class="btn ghost" id="hsCp">انسخي اللينك</button>
  <button class="btn ghost" id="hsNow">حدّثي دلوقتي</button>${tag}${priv}
  <button class="btn ghost" id="hsOut" style="color:var(--red)">اخرجي من البيت المشترك</button>`);
 const msg='تعالى نشوف قايمة البيت مع بعض على سندي 🏠\n'+homeLink();
 $('hsWa').onclick=()=>{const u='https://wa.me/?text='+encodeURIComponent(msg);if(!window.__noNav)window.open(u,'_blank');window.__lastWa=u};
 $('hsCp').onclick=()=>{try{navigator.clipboard.writeText(homeLink()).catch(()=>{});toast('اتنسخ')}catch(e){}};
 $('hsNow').onclick=async()=>{await homeSync();homeSheet()};
 $('hsOut').onclick=()=>{homeLeave();closeSheet()}}

function homeBoot(){const m=/^#home=([A-Za-z0-9]{20,40})(?:&n=([^&]*))?/.exec(location.hash);
 if(m&&!IS_DEMO){history.replaceState(null,'',location.pathname+location.search);const who=m[2]?decodeURIComponent(m[2]):'';
  if(HS.code===m[1]){toast('إنتي أصلاً في البيت ده');return}
  openSheet(`<h2>🏠 تنضمي للبيت؟</h2><p>${who?esc(who)+' عايز':'حد من البيت عايز'} يشاركك قايمة البيت: الناقص والنضافة والولاد.</p><button class="btn" id="hsJoin">انضمي</button><button class="btn ghost" id="hsNo">مش دلوقتي</button>`);
  $('hsJoin').onclick=async()=>{$('hsJoin').disabled=true;const ok=await homeJoin(m[1]);closeSheet();toast(ok?'دخلتي البيت 🏠':'معرفتش أدخل، جربي تاني')};$('hsNo').onclick=()=>closeSheet()}}

(async()=>{const c=hsGet('home_code');if(c&&!IS_DEMO&&await hsInit(c))homeSync(true);homeBoot();
 setInterval(hsTick,15e3);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&HS.key)homeSync(true)})})();
window.homeSheet=homeSheet;window.homeSync=homeSync;
