/* ---------- "Sayvo does it": the agent does the thinking work of a task itself ----------
   Writing, planning, lists and looking things up are done by Sayvo, on its own when it's obvious, or when you tap ⚡.
   Anything that leaves the phone (sending an email or a message, adding to your Google calendar) waits for your OK,
   and every action goes into "what Sayvo did" with undo. */
const DO_RX=/(اكتب|أكتب|ابعت|أبعت|ايميل|إيميل|رسالة|جواب|شكوى|طلب|خطة|خطه|أخطط|اخطط|أجهز|اجهز|أحضّر|احضر|قايمة|قائمة|أقارن|اقارن|أدور|ادور|أعرف|اعرف|بوست|سي ?في|cv|write|email|e-mail|message|letter|plan|prepare|list|compare|research|find out|look up|draft|post|écri|courriel|planifi|escrib|correo|planear|schreib|plane|vergleich)/i;
let DOQ=store.get('doq',{d:'',n:0});
const doKey=it=>it.id;
function doable(it){return it&&!it.done&&it.type!=='idea'&&it.type!=='bill'&&it.type!=='med'&&DO_RX.test(it.title||'')}
async function doIt(it,extra){const task={title:it.title,type:it.type,sec:it.sec,due:it.due||'',where:it.where||'',amount:it.amount||0,steps:it.steps||[]};
 const r=await brain('do',{task,extra:extra||'',_wait:50000});
 if(!r||!r.kind||typeof r.output!=='string')return null;
 it.prep={kind:r.kind,title:String(r.title||'').slice(0,80),output:String(r.output).slice(0,2400),subject:String(r.subject||'').slice(0,160),to:String(r.to||'').slice(0,80),next:String(r.next||'').slice(0,160),reason:String(r.reason||'').slice(0,300),at:nowMs(),seen:false};save();return it.prep}
const DOK={email:'📧',message:'💬',plan:'🗺️',list:'📝',research:'🔎',text:'📄',cant:'🧭'};
async function doSheet(it,force){if(!it)return;
 if(it.prep&&!force){showPrep(it);return}
 openSheet(`<h2>⚡ سندي بيعملها</h2><div class="stack"><div class="say">${esc(it.title)}</div><p class="note">بكتب وبرتّب دلوقتي… ممكن ياخد لحد نص دقيقة.</p><div class="dots"><i class="on"></i><i></i><i></i></div></div>`);
 let k=0;const iv=setInterval(()=>{const d=document.querySelectorAll('#sheetBody .dots i');if(!d.length)return clearInterval(iv);k=(k+1)%3;d.forEach((x,j)=>x.classList.toggle('on',j===k))},450);
 const p=await doIt(it,typeof force==='string'?force:'');clearInterval(iv);
 if(!p){if(!$('sheet').hidden)$('sheetBody').innerHTML=`<h2>⚡ سندي بيعملها</h2><div class="stack"><p>النت مش مساعد دلوقتي. هحاول تاني بعد شوية.</p><button class="btn" id="dqR">جرّب تاني</button></div>`;if($('dqR'))$('dqR').onclick=()=>doSheet(it,true);return}
 agentLog(`⚡ جهّزت «${it.title}»: ${p.title||''}`,null);if(!$('sheet').hidden)showPrep(it)}
function showPrep(it){const p=it.prep;if(!p)return;p.seen=true;save();
 const isMail=p.kind==='email',isMsg=p.kind==='message',isList=p.kind==='plan'||p.kind==='list';
 openSheet(`<h2>${DOK[p.kind]||'⚡'} ${esc(p.title||'جهّزتلك')}</h2><div class="stack">
 ${p.kind==='cant'&&p.reason?`<p class="note">${esc(p.reason)}</p>`:''}
 ${isMail?`<label class="form">الموضوع<input id="dqS" value="${esc(p.subject)}"></label>`:''}
 <textarea id="dqO" rows="9" class="dqo">${esc(p.output)}</textarea>
 ${p.next?`<p class="note">👉 ${esc(p.next)}</p>`:''}
 <div class="acts">${isMail?'<button class="btn" id="dqMail">📧 ابعته</button>':''}${isMsg?'<button class="btn" id="dqWa">💬 ابعتها واتساب</button>':''}${isList?'<button class="btn" id="dqSteps">✅ حطها خطوات</button>':''}<button class="btn ghost" id="dqCopy">انسخ</button><button class="btn ghost" id="dqDone">خلصت ✓</button></div>
 <details><summary>عايز تعديل؟</summary><div class="form"><input id="dqX" placeholder="مثلاً: أقصر، أرسمي، بالإنجليزي، زوّد نقطة…"><button class="btn ghost" id="dqRe">⚡ عدّلها</button></div></details>
 <p class="note">سندي جهّزها بس. مفيش حاجة بتتبعت غير لما إنت تدوس.</p></div>`);
 const out=()=>$('dqO').value.trim(),keep=()=>{p.output=out();if($('dqS'))p.subject=$('dqS').value.trim();save()};
 $('dqCopy').onclick=()=>{keep();try{navigator.clipboard.writeText(out()).catch(()=>{})}catch(e){}toast('اتنسخت')};
 $('dqDone').onclick=()=>{keep();closeSheet();finish(it.id)};
 $('dqRe').onclick=()=>{const x=$('dqX').value.trim();if(!x)return;keep();doSheet(it,x)};
 if($('dqWa'))$('dqWa').onclick=()=>{keep();window.open('https://wa.me/?text='+encodeURIComponent(brandify(out())),'_blank','noopener');agentLog('💬 فتحت واتساب برسالة «'+it.title+'» (إنت اللي بعتها)',null)};
 if($('dqSteps'))$('dqSteps').onclick=()=>{keep();const lines=out().split('\n').map(l=>l.replace(/^\s*(?:[-•*·]|\d+[.)-]|☐|✅)\s*/,'').trim()).filter(l=>l.length>1&&l.length<140).slice(0,12);if(!lines.length)return;
  const old=it.steps?JSON.parse(JSON.stringify(it.steps)):null;it.steps=lines.map(t=>({t,done:false}));it.big=true;save();closeSheet();render();
  agentLog(`✅ حطيت ${lines.length} خطوات لـ «${it.title}»`,{plan:[it.id,old]});toast('حطيتها خطوات')};
 if($('dqMail'))$('dqMail').onclick=()=>{keep();mailSheet(it)}}

/* sending an email: through the person's Gmail when connected (after they confirm), otherwise their mail app */
function mailSheet(it){const p=it.prep;
 openSheet(`<h2>📧 ابعت الإيميل</h2><div class="form"><label>لمين؟ (الإيميل)<input id="mlTo" type="email" dir="ltr" value="${esc(store.get('lastTo',''))}" placeholder="name@example.com"></label>
 <p class="note">${esc(p.subject||'')}</p><div class="acts">${G.on()?'<button class="btn" id="mlG">ابعته من جيميل بتاعي</button>':''}<button class="btn ${G.on()?'ghost':''}" id="mlApp">افتحه في تطبيق الإيميل</button></div>
 <p class="note">${G.on()?'هيتبعت من حسابك أول ما تدوس. ':''}${G.ready()&&!G.on()?'تقدر تربط جيميل من الإعدادات عشان يتبعت من هنا على طول.':''}</p></div>`);
 const to=()=>{const v=$('mlTo').value.trim();if(v)store.set('lastTo',v);return v};
 $('mlApp').onclick=()=>{const t=to();location.href='mailto:'+encodeURIComponent(t)+'?subject='+encodeURIComponent(p.subject||'')+'&body='+encodeURIComponent(p.output);agentLog('📧 فتحت الإيميل «'+(p.subject||it.title)+'» في تطبيق الإيميل',null)};
 if($('mlG'))$('mlG').onclick=async()=>{const t=to();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)){toast('اكتب إيميل صحيح');return}
  $('mlG').disabled=true;const ok=await G.send(t,p.subject||it.title,p.output);$('mlG').disabled=false;
  if(ok){closeSheet();toast('اتبعت ✓');agentLog('📧 بعت إيميل «'+(p.subject||it.title)+'» لـ '+t+' (بموافقتك)',null);finish(it.id)}else toast('ما اتبعتش. جرّب تاني')}}

/* the ⚡ button on the next card and in the edit sheet */
const _drawNext=drawNext;drawNext=function(){_drawNext();const c=candidates()[0],card=$('nextCard');if(!c||!card||$('nxDo'))return;const a=card.querySelector('.acts')||card.querySelector('.two');
 const h=`<button class="btn ghost" id="nxDo">${c.prep?'⚡ اللي جهّزته':'⚡ سندي يعملها'}</button>`;if(a&&a.classList.contains('acts'))a.insertAdjacentHTML('beforeend',h);else card.insertAdjacentHTML('beforeend','<div class="acts" style="margin-top:8px">'+h+'</div>');$('nxDo').onclick=()=>doSheet(c)};
const _editItem=editItem;editItem=function(it,tm){_editItem(it,tm);if(!it||it.done)return;const a=document.querySelector('#sheetBody .acts');if(!a)return;
 a.insertAdjacentHTML('afterbegin',`<button class="btn ghost" id="eDo">${it.prep?'⚡ اللي جهّزته':'⚡ سندي يعملها'}</button>`);$('eDo').onclick=()=>doSheet(it)};

/* on its own: when a new task is clearly writing/planning work, Sayvo prepares it in the background (a few a day) and tells you */
async function doTick(){if(!IS_LIVE||DEMO||!navigator.onLine||(window.isPlus&&!isPlus()))return;const k=dayKey();if(DOQ.d!==k)DOQ={d:k,n:0};if(DOQ.n>=4)return;
 const it=items.find(i=>doable(i)&&!i.prep&&!i.doTried&&nowMs()-(i.created||0)<3*864e5);if(!it)return;
 it.doTried=nowMs();DOQ.n++;store.set('doq',DOQ);save();const p=await doIt(it);if(p){agentLog(`⚡ جهّزت لوحدي «${it.title}»: ${p.title||''}`,null);render()}}
setTimeout(doTick,15000);setInterval(doTick,3*6e4);
NUDGE_EXTRA.push(()=>{const it=items.find(i=>!i.done&&i.prep&&!i.prep.seen);if(!it)return[];
 return[{id:'dq'+it.id,pr:44,i:'⚡',p:`جهّزتلك «${it.title}»: ${it.prep.title||''}. تبص عليه؟`,acts:[['وريني',()=>showPrep(it)],['بعدين',()=>{it.prep.seen=true;save();render()}]]}]});

/* ---------- Google: calendar and Gmail, straight between the phone and the person's Google account ----------
   Needs NRG's OAuth client id (set GOOGLE_CLIENT_ID below once it exists in Google Cloud). Tokens live in memory for an hour. */
const GOOGLE_CLIENT_ID='';
const G={tok:'',exp:0,
 ready(){return !!GOOGLE_CLIENT_ID},on(){return !!GOOGLE_CLIENT_ID&&store.get('gOn',false)},
 load(){return new Promise((res,rej)=>{if(window.google&&google.accounts&&google.accounts.oauth2)return res();const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=res;s.onerror=rej;document.head.appendChild(s)})},
 async token(prompt){if(this.tok&&Date.now()<this.exp-6e4)return this.tok;await this.load();
  return new Promise(res=>{const c=google.accounts.oauth2.initTokenClient({client_id:GOOGLE_CLIENT_ID,scope:'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send',
   callback:r=>{if(r&&r.access_token){G.tok=r.access_token;G.exp=Date.now()+(+r.expires_in||3600)*1e3;res(G.tok)}else res('')},error_callback:()=>res('')});c.requestAccessToken({prompt:prompt||''})})},
 async api(url,body){const t=await this.token();if(!t)return null;const r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify(body)});return r.ok?r.json():null},
 async addEvent(it){const d=parseL(it.due);if(!d)return false;const end=new Date(d.getTime()+(it.type==='appt'?60:30)*6e4);const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
  const r=await this.api('https://www.googleapis.com/calendar/v3/calendars/primary/events',{summary:it.title,location:it.where||undefined,description:'Sayvo',start:{dateTime:toLocal(d)+':00',timeZone:tz},end:{dateTime:toLocal(end)+':00',timeZone:tz},reminders:{useDefault:true}});
  if(r&&r.id){it.gcal=r.id;save();return true}return false},
 async send(to,subject,text){const enc=s=>'=?UTF-8?B?'+btoa(unescape(encodeURIComponent(s)))+'?=';
  const mime=['To: '+to,'Subject: '+enc(subject),'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',btoa(unescape(encodeURIComponent(brandify(text))))].join('\r\n');
  const raw=btoa(mime).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const r=await this.api('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{raw});return !!(r&&r.id)}};
function googleSheet(){if(!G.ready()){openSheet(`<h2>🔗 ربط جوجل</h2><div class="stack"><p>قريب: مواعيدك تتحط في جوجل كالندر لوحدها، والإيميلات اللي سندي بيكتبها تتبعت من جيميل بتاعك بعد موافقتك.</p><p class="note">لحد ما يجهز، زرار «📅 ضيفها للكالندر» شغال مع أي كالندر.</p></div>`);return}
 const on=G.on();openSheet(`<h2>🔗 جوجل</h2><div class="stack"><p>${on?'متربط ✓':'اربط حساب جوجل بتاعك:'}</p><ul class="note" style="padding-inline-start:18px;line-height:1.9"><li>📅 المواعيد الجديدة تتحط في جوجل كالندر لوحدها</li><li>📧 الإيميلات اللي سندي بيكتبها تتبعت من جيميل بتاعك، بس لما تدوس «ابعته»</li></ul>
 <p class="note">الربط بين موبايلك وجوجل على طول، وسيرفرنا مبيشوفش إيميلاتك ولا الكالندر.</p>
 <label class="tog"><input type="checkbox" id="gAuto" ${store.get('gAuto',true)?'checked':''}> ضيف المواعيد الجديدة للكالندر لوحدها</label>
 <button class="btn big" id="gGo">${on?'افصل جوجل':'اربط جوجل'}</button></div>`);
 $('gAuto').onchange=e=>store.set('gAuto',e.target.checked);
 $('gGo').onclick=async()=>{if(on){store.set('gOn',false);G.tok='';try{google.accounts.oauth2.revoke&&G.tok&&google.accounts.oauth2.revoke(G.tok)}catch(e){}closeSheet();toast('اتفصل');return}
  const t=await G.token('consent');if(t){store.set('gOn',true);closeSheet();toast('اتربط ✓');agentLog('🔗 ربطت حساب جوجل',null)}else toast('ما اتربطش')}}
// new appointments go to the person's Google calendar on their own once they turned that on
const _addItem=addItem;addItem=function(x){const it=_addItem(x);if(G.on()&&store.get('gAuto',true)&&it&&it.due&&(it.type==='appt'||it.type==='call'||it.type==='med')&&!it.gcal)
 G.addEvent(it).then(ok=>{if(ok)agentLog('📅 حطيت «'+it.title+'» في جوجل كالندر',null)}).catch(()=>{});return it};
const _ics=window.ics;if(typeof ics==='function'){ics=function(it){if(G.on())G.addEvent(it).then(ok=>toast(ok?'اتحطت في جوجل كالندر ✓':'ما اتحطتش، جرّب تاني'));else _ics(it)}}

/* ---------- paying bills outside Egypt: each bill keeps its company's pay page ---------- */
const inEgypt=()=>{try{return /^Africa\/Cairo$/.test(Intl.DateTimeFormat().resolvedOptions().timeZone)||/-EG$/i.test(navigator.language||'')}catch(e){return true}};
if(typeof paySheet==='function'){const _pay=paySheet;paySheet=function(it){if(!it)return;if(inEgypt())return _pay(it);
 openSheet(`<h2>🧾 ${esc(it.title)}</h2>${it.amount?`<p class="kbig num">${money(it.amount)} ج</p>`:''}<div class="form"><label>لينك صفحة الدفع بتاعة الشركة<input id="pyU" type="url" dir="ltr" value="${esc(it.payUrl||'')}" placeholder="https://"></label></div>
 <div class="acts"><button class="btn" id="pyO">افتح صفحة الدفع</button><button class="btn ghost" id="pyDone">دفعتها ✓</button><button class="btn ghost" id="pyLater">بعدين</button></div>
 <p class="note">بحفظ اللينك مع الفاتورة، والمرة الجاية بتدوس وتدفع على طول. الدفع بيتم في صفحة الشركة نفسها، وإحنا مبنشوفش فلوسك.</p>`);
 const keep=()=>{const v=$('pyU').value.trim();if(/^https:\/\//i.test(v)&&v.length<400){it.payUrl=v;save();return v}return ''};
 $('pyO').onclick=()=>{const u=keep()||it.payUrl;if(!u){toast('حط لينك صفحة الدفع الأول');return}window.open(u,'_blank','noopener')};
 $('pyDone').onclick=()=>{keep();closeSheet();finish(it.id);toast('اتسجلت إنها اتدفعت ✓')};$('pyLater').onclick=()=>{keep();closeSheet()}}}

/* settings entry */
new MutationObserver(()=>{const k=$('sKid');if($('sSave')&&k&&!$('sGoogle')){k.insertAdjacentHTML('beforebegin','<button class="btn ghost" id="sGoogle">🔗 ربط جوجل (الكالندر والجيميل)</button>');$('sGoogle').onclick=googleSheet}}).observe(document.getElementById('sheetBody'),{childList:true});
Object.assign(window,{doSheet,doIt,showPrep,googleSheet,G});
