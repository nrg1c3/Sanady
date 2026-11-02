/* ---------- PAY A BILL: from the reminder straight to Basata or Fawry ---------- */
// روابط الشركا: لما الاتفاق يتمضي، نحط هنا لينك الدفع المباشر وكود الإحالة بتاع كل شركة.
const PAYP={
 basata:{n:'بساطة',ios:'https://apps.apple.com/app/id1208463077',and:'https://play.google.com/store/search?q=%D8%A8%D8%B3%D8%A7%D8%B7%D8%A9%20Basata&c=apps',near:'بساطة لدفع الفواتير'},
 fawry:{n:'فوري',ios:'https://apps.apple.com/app/id1462911630',and:'https://play.google.com/store/search?q=myfawry&c=apps',near:'فوري'}};
function billKind(t){const s=arN(t);
 if(/كهربا/.test(s))return['⚡','رقم العداد أو رقم الحساب'];if(/ميه|مياه/.test(s))return['💧','رقم العداد'];if(/غاز/.test(s))return['🔥','رقم العداد'];
 if(/نت|انترنت|ارضي|تليفون|we\b|وي\b/.test(s))return['🌐','رقم التليفون الأرضي'];if(/موبايل|شحن|كارت|باقه/.test(s))return['📱','رقم الموبايل'];
 if(/قسط|تقسيط|فاليو|كونتكت|سهوله/.test(s))return['🧾','رقم العقد أو الموبايل المسجل'];if(/مدرس|مدارس|جامع|كليه/.test(s))return['🎓','كود الطالب'];
 return['🧾','رقم الحساب أو الاشتراك']}
function paySheet(it){if(!it)return;const [ic,lab]=billKind(it.title);const last=store.get('payp','basata');const order=[PAYP[last]?last:'basata'].concat(Object.keys(PAYP).filter(k=>k!==last));
 openSheet(`<h2>${ic} ادفع ${esc(it.title)}</h2>${it.amount?`<p class="kbig num" style="text-align:right">${money(it.amount)} جنيه</p>`:''}
 <div class="form"><label>${esc(lab)}<input id="pyRef" value="${esc(it.ref||'')}" placeholder="هتحتاجه وإنت بتدفع، وهفتكره المرة الجاية"></label></div>
 <p class="note">اختار هتدفع منين. هنسخلك الرقم وأفتحلك التطبيق.</p>
 <div class="stack">${order.map((k,x)=>`<button class="btn ${x?'ghost':''}" data-p="${k}">ادفع من ${PAYP[k].n}</button>`).join('')}</div>
 <details style="margin-top:8px"><summary>هدفع كاش في فرع قريب</summary><div class="acts">${order.map(k=>`<a class="btn ghost" href="https://www.google.com/maps/search/${encodeURIComponent(PAYP[k].near)}" target="_blank" rel="noopener">أقرب ${PAYP[k].n}</a>`).join('')}</div></details>
 <div class="acts" style="margin-top:12px"><button class="btn" id="pyDone">دفعتها ✓</button><button class="btn ghost" id="pyLater">بعدين</button></div>
 <p class="note">🔒 سندي مبيشوفش فلوسك ولا بيانات كارتك. الدفع بيتم جوه تطبيق ${PAYP.basata.n} أو ${PAYP.fawry.n} نفسه.</p>`);
 const keep=()=>{const v=$('pyRef').value.trim().slice(0,40);if(v!==(it.ref||'')){it.ref=v;save()}return v};
 document.querySelectorAll('#sheetBody [data-p]').forEach(b=>b.onclick=()=>{const k=b.dataset.p,p=PAYP[k],ref=keep();store.set('payp',k);
  const st=store.get('paystat',{});st[k]=(st[k]||0)+1;store.set('paystat',st);it.payVia=k;save();
  if(ref){try{navigator.clipboard.writeText(ref).catch(()=>{})}catch(e){}toast('نسخت الرقم '+ref+'، الصقه في '+p.n,4000)}
  const u=/iPhone|iPad|iPod/.test(navigator.userAgent)?p.ios:p.and;if(window.__noNav||DEMO)window.__lastPay=u;else window.open(u,'_blank','noopener')});
 $('pyDone').onclick=()=>{keep();closeSheet();finish(it.id);toast('اتدفعت ✓ هفكّرك المرة الجاية')};$('pyLater').onclick=()=>{keep();closeSheet()}}

/* ---------- PLANS: free with limits, monthly for the extras (all open during the beta) ---------- */
function plansSheet(){const row=(i,t,s)=>`<div class="wtask"><div class="tx"><b>${i} ${t}</b>${s?`<small class="note">${s}</small>`:''}</div></div>`;
 openSheet(`<h2>⭐ الباقات</h2><p class="note">دلوقتي كل حاجة مفتوحة ببلاش طول فترة التجربة. السعر هيتعلن قبل ما التجربة تخلص.</p>
 <div class="card"><div class="ch"><h3>مجاني</h3><small>كفاية لناس كتير</small></div>
 ${row('🎙️','فرّغ دماغك بالصوت','عدد مرات محدود في اليوم')}${row('⏰','التذكير والمنبّه','يرن والتطبيق مقفول')}${row('🧾','الفواتير والفلوس والدفع ببساطة وفوري')}${row('🏠','مود الأم والولاد وأقسام حياتي')}${row('💼','مود صاحب الشغل')}</div>
 <div class="card" style="border-color:var(--pri)"><div class="ch"><h3>الاشتراك الشهري</h3><small>للبيت كله</small></div>
 ${row('👨‍👩‍👧','البيت المشترك','قايمة واحدة للبيت كله، مقفولة ومحدش يقراها غيركم')}${row('♾️','الصوت من غير حدود')}${row('💬','سندي على واتساب','قريب')}</div>`)}

/* ---------- SMALL BUSINESS: orders, money outside, and a tiny cash book ---------- */
let BIZ=store.get('biz',null);if(!BIZ||!Array.isArray(BIZ.orders))BIZ={orders:[],cash:[]};
const saveBiz=()=>{store.set('biz',BIZ);save()};
const oLeft=o=>Math.max(0,(o.amt||0)-(o.dep||0));
const oDays=o=>o.due?Math.round((new Date(o.due+'T00:00')-new Date(dayKey()+'T00:00'))/864e5):99;
const oWhen=o=>{const d=oDays(o);return d<0?'متأخر '+nDays(-d):d===0?'النهارده':d===1?'بكرة':d<99?'بعد '+nDays(d):'من غير ميعاد'};
function collectMsg(o){return`أهلاً يا ${o.c} 🌷\nبفكّر حضرتك بباقي حساب ${o.t}: ${money(oLeft(o))} جنيه.\nلو تحب تحوّل أو أعدّي أخدهم، قولّي الأنسب ليك. شكراً لثقتك 🙏`}
function drawBiz(){const box=$('nowBiz');if(!box)return;const dk=dayKey(),mk=dk.slice(0,7);
 const open=BIZ.orders.filter(o=>o.st!=='done').sort((a,b)=>oDays(a)-oDays(b));const late=open.filter(o=>oDays(o)<0),today=open.filter(o=>oDays(o)===0);
 const owed=BIZ.orders.filter(o=>oLeft(o)>0);const out=owed.reduce((s,o)=>s+oLeft(o),0);
 const tIn=BIZ.cash.filter(c=>c.d===dk&&c.in).reduce((s,c)=>s+c.a,0),tOut=BIZ.cash.filter(c=>c.d===dk&&!c.in).reduce((s,c)=>s+c.a,0);
 const mIn=BIZ.cash.filter(c=>c.d.slice(0,7)===mk&&c.in).reduce((s,c)=>s+c.a,0),mOut=BIZ.cash.filter(c=>c.d.slice(0,7)===mk&&!c.in).reduce((s,c)=>s+c.a,0);
 box.innerHTML=`<span class="badge2">مود صاحب الشغل</span>
 <div class="card"><div class="ch"><h3>شغلك النهارده</h3><small>${today.length?today.length+' تسليم':'مفيش تسليم'}${late.length?' · ⚠️ '+late.length+' متأخر':''} · ${out?money(out)+' جنيه برة':'مفيش فلوس برة'}</small></div>
  <div class="blocks"><div class="blk"><i>⬇️</i><b class="num">${money(tIn)}</b><small>دخل النهارده</small></div><div class="blk"><i>⬆️</i><b class="num">${money(tOut)}</b><small>صرف النهارده</small></div></div></div>
 <div class="card"><div class="ch"><h3>📦 الطلبات</h3><small>الأقرب ميعاداً فوق</small></div>
  ${open.length?open.slice(0,12).map(o=>`<div class="wtask" data-o="${o.id}"><div class="tx op"><b>${esc(o.t)} · ${esc(o.c)}</b><small class="note" style="${oDays(o)<0?'color:var(--red)':''}">${oWhen(o)}${o.amt?' · '+money(o.amt)+' ج':''}${oLeft(o)&&o.amt?' · باقي '+money(oLeft(o)):''}${o.st==='ready'?' · جاهز':''}</small></div><button class="btn ghost" data-a="next" style="min-height:44px;padding:0 12px">${o.st==='ready'?'اتسلم ✓':'جاهز'}</button></div>`).join(''):'<p class="note">مفيش طلبات مفتوحة. ضيف أول طلب.</p>'}
  <button class="btn" id="bzNew">+ طلب جديد</button></div>
 <div class="card"><div class="ch"><h3>💰 فلوسك برة</h3><small>${owed.length?owed.length+' عملا':'كله مدفوع 👏'}</small></div>
  ${owed.slice(0,8).map(o=>`<div class="wtask" data-o="${o.id}"><div class="tx"><b>${esc(o.c)} · <span class="num">${money(oLeft(o))}</span> ج</b><small class="note">${esc(o.t)}</small></div><button class="btn ghost" data-a="ask" style="min-height:44px;padding:0 12px">فكّره</button><button class="btn ghost" data-a="paid" style="min-height:44px;padding:0 12px">دفع ✓</button></div>`).join('')}</div>
 <div class="card"><div class="ch"><h3>📒 الخزنة</h3><small>الشهر ده: دخل ${money(mIn)} · صرف ${money(mOut)} · ${mIn-mOut>=0?'مكسب':'خسارة'} ${money(Math.abs(mIn-mOut))}</small></div>
  <div class="inrow"><input id="bzA" type="number" inputmode="numeric" placeholder="المبلغ"><input id="bzN" placeholder="على إيه؟"></div>
  <div class="acts"><button class="btn" id="bzIn">دخل ⬇️</button><button class="btn ghost" id="bzOut">صرف ⬆️</button></div>
  ${BIZ.cash.filter(c=>c.d===dk).slice(-5).reverse().map(c=>`<small class="note">${c.in?'⬇️':'⬆️'} ${money(c.a)} ${esc(c.n||'')}</small>`).join('')}</div>`;
 $('bzNew').onclick=()=>orderForm();
 box.querySelectorAll('[data-o]').forEach(r=>{const o=BIZ.orders.find(x=>x.id===r.dataset.o);if(!o)return;const op=r.querySelector('.op');if(op)op.onclick=()=>orderForm(o);
  r.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;
   if(a==='next'){if(o.st==='ready'){o.st='done';o.doneAt=nowMs();award(5);buzz(20);toast(oLeft(o)?'اتسلم ✓ وباقي '+money(oLeft(o))+' برة':cheer())}else{o.st='ready';toast('جاهز ✓ نبعتله؟')}saveBiz();drawBiz()}
   else if(a==='ask')openSheet('<h2>فكّر '+esc(o.c)+' بلطف</h2>'+draftBox(collectMsg(o),o.ph?normPhone(o.ph):''));
   else if(a==='paid'){const l=oLeft(o);o.dep=o.amt;BIZ.cash.push({id:uid(),a:l,in:true,n:o.c+' · '+o.t,d:dayKey()});saveBiz();toast('دخل '+money(l)+' جنيه ✓');drawBiz()}})});
 const cash=inn=>{const a=+$('bzA').value||0;if(a<=0){toast('اكتب المبلغ');return}BIZ.cash.push({id:uid(),a,in:inn,n:$('bzN').value.trim(),d:dayKey()});if(BIZ.cash.length>2000)BIZ.cash=BIZ.cash.slice(-2000);saveBiz();drawBiz()};
 $('bzIn').onclick=()=>cash(true);$('bzOut').onclick=()=>cash(false)}
function orderForm(o){const isNew=!o;o=o||{id:uid(),c:'',ph:'',t:'',amt:0,dep:0,due:'',st:'new',at:nowMs()};
 openSheet(`<h2>${isNew?'طلب جديد':'تعديل الطلب'}</h2><div class="form">
 <label>العميل<input id="oc" value="${esc(o.c)}"></label><label>موبايله (اختياري)<input id="oph" type="tel" value="${esc(o.ph||'')}"></label>
 <label>الطلب إيه؟<input id="ot" value="${esc(o.t)}" placeholder="تورتة عيد ميلاد، فستان، تصليح..."></label>
 <label>الحساب كله<input id="oa" type="number" inputmode="numeric" value="${o.amt||''}"></label><label>دفع كام لحد دلوقتي؟<input id="od" type="number" inputmode="numeric" value="${o.dep||''}"></label>
 <label>ميعاد التسليم<input id="odue" type="date" value="${esc(o.due||'')}"></label>
 <div class="acts"><button class="btn" id="oSave">احفظ</button>${isNew?'':'<button class="btn ghost" id="oDel">شيله</button>'}</div></div>`);
 $('oSave').onclick=()=>{const v={c:$('oc').value.trim(),ph:$('oph').value.trim(),t:$('ot').value.trim(),amt:+$('oa').value||0,dep:+$('od').value||0,due:$('odue').value};if(!v.c||!v.t){toast('اكتب العميل والطلب');return}
  const newDep=Math.max(0,v.dep-(o.dep||0));Object.assign(o,v);if(isNew)BIZ.orders.push(o);if(newDep)BIZ.cash.push({id:uid(),a:newDep,in:true,n:o.c+' · '+o.t,d:dayKey()});
  BIZ.orders=BIZ.orders.filter(x=>x.st!=='done'||nowMs()-(x.doneAt||0)<120*864e5||oLeft(x)>0);saveBiz();closeSheet()};
 if(!isNew)$('oDel').onclick=()=>{BIZ.orders=BIZ.orders.filter(x=>x!==o);saveBiz();closeSheet()}}

/* ---------- PARENTS CARE: calls, their medicine times, their doctor ---------- */
let CARE=store.get('care',null);if(!CARE||!Array.isArray(CARE.ps))CARE={ps:[]};
const saveCare=()=>{store.set('care',CARE);save()};
const calledAgo=p=>p.lastCall?daysAgo(p.lastCall):null;
function drawParents(b){b.innerHTML=`${back()}
 <div class="card"><div class="ch"><h3>👵 بابا وماما</h3><small>تكلمهم كل يوم، وتفتكر دواهم ودكاترتهم</small></div>
 ${CARE.ps.length?CARE.ps.map(p=>{const a=calledAgo(p);return`<div class="card" data-p="${p.id}" style="margin:0"><div class="ch"><h3>${esc(p.name)}</h3><small>${a==null?'لسه مسجلتش مكالمة':a===0?'كلمته النهارده ✓':'آخر مكالمة من '+nDays(a)}${p.call?' · بفكّرك تكلمه '+esc(p.call):''}</small></div>
  ${(p.meds||[]).length?`<small class="note">💊 ${p.meds.map(m=>esc(m.t)+' '+esc(m.at)).join(' · ')}</small>`:''}
  <div class="acts">${p.phone?`<a class="btn" data-a="call" href="tel:+${esc(normPhone(p.phone))}">📞 كلّمه</a>`:`<button class="btn" data-a="called">كلمته ✓</button>`}<button class="btn ghost" data-a="wa">💬 اطمن</button><button class="btn ghost" data-a="doc">🩺 ميعاد دكتور</button></div>
  <div class="acts"><button class="link" data-a="edit">تعديل</button><button class="link" data-a="phone">📱 موبايل كبير السن</button></div></div>`}).join(''):'<p class="note">ضيف بابا أو ماما أو حد كبير بتراعيه.</p>'}
 <button class="btn" id="cAdd">+ ضيف</button></div>`;
 $('cAdd').onclick=()=>parentForm();
 b.querySelectorAll('[data-p]').forEach(c=>{const p=CARE.ps.find(x=>x.id===c.dataset.p);c.querySelectorAll('[data-a]').forEach(x=>x.onclick=()=>{const a=x.dataset.a;
  if(a==='call'||a==='called'){p.lastCall=nowMs();saveCare();if(a==='called'){toast('ربنا يخليهوملك 💛');drawAll()}}
  else if(a==='wa')openSheet('<h2>اطمن على '+esc(p.name)+'</h2>'+draftBox('صباح الخير يا '+p.name+' 💛 عامل إيه النهارده؟ خدت الدوا؟ محتاج أي حاجة أجيبهالك؟',p.phone?normPhone(p.phone):''));
  else if(a==='doc')editItem(null,{type:'appt',sec:'health',title:'دكتور '+p.name+(p.doc?' ('+p.doc+')':'')});
  else if(a==='edit')parentForm(p);else if(a==='phone')elderLink(p)})})}
function parentForm(p){const isNew=!p;p=p||{id:uid(),name:'',phone:'',call:'19:00',meds:[],doc:''};
 openSheet(`<h2>${isNew?'ضيف حد بتراعيه':'تعديل'}</h2><div class="form">
 <label>بتقوله إيه؟<input id="pN" value="${esc(p.name)}" placeholder="ماما، بابا، تيتة..."></label><label>موبايله<input id="pP" type="tel" value="${esc(p.phone||'')}"></label>
 <label>فكّرني أكلمه كل يوم الساعة<input id="pC" type="time" value="${esc(p.call||'')}"></label>
 <label>دواه (كل سطر: اسم الدوا - الساعة) عشان أفكّرك تتأكد إنه خده<textarea id="pM" placeholder="الضغط - 09:00&#10;السكر - 21:00">${esc((p.meds||[]).map(m=>m.t+' - '+m.at).join('\n'))}</textarea></label>
 <label>دكتوره<input id="pD" value="${esc(p.doc||'')}"></label>
 <div class="acts"><button class="btn" id="pSave">احفظ</button>${isNew?'':'<button class="btn ghost" id="pDel">شيله</button>'}</div><p class="note">سندي مش دكتور: ده تذكير بس، من غير جرعات ولا نصايح.</p></div>`);
 $('pSave').onclick=()=>{const name=$('pN').value.trim();if(!name){toast('اكتب الاسم');return}
  const meds=$('pM').value.split('\n').map(l=>{const m=l.match(/^(.+?)\s*[-–]\s*(\d{1,2}):(\d{2})\s*$/);return m?{id:uid().slice(-6),t:m[1].trim(),at:pad(+m[2])+':'+m[3]}:null}).filter(Boolean).slice(0,8);
  Object.assign(p,{name,phone:$('pP').value.trim(),call:$('pC').value,meds,doc:$('pD').value.trim()});if(isNew)CARE.ps.push(p);saveCare();closeSheet()};
 if(!isNew)$('pDel').onclick=()=>{CARE.ps=CARE.ps.filter(x=>x!==p);saveCare();closeSheet()}}
function elderLink(p){const link=location.origin+location.pathname+'#eldersetup='+b64e({n:p.name,c:prof.name||'',m:(p.meds||[]).map(m=>({t:m.t,at:m.at}))});
 openSheet(`<h2>📱 موبايل ${esc(p.name)}</h2><div class="stack"><p>افتح اللينك ده على موبايل ${esc(p.name)} واكتب رقمك هناك. الموبايل هيبقى فيه شاشة كبيرة وبسيطة: يكلمك بضغطة، يقولك «أنا كويس»، ويعلّم على الدوا لما ياخده فتوصلك رسالة.</p>${draftBox(link)}
 <p class="note">مفيش تتبع مكان ولا تسجيل. الرسايل بتروح منه ليك على طول.</p></div>`)}

/* ---------- SENIOR PHONE: big buttons for an older parent ---------- */
let ELDER=store.get('elder',null);const saveElder=()=>store.set('elder',ELDER);
function elderSetup(pre){pre=pre||{};
 openSheet(`<h2>موبايل كبير السن</h2><div class="form"><p class="note">الشاشة دي تتعمل على موبايل بابا أو ماما، بإيدك.</p>
 <label>اسمه<input id="esN" value="${esc(pre.n||'')}" placeholder="ماما"></label><label>اسمك (اللي هيكلمه)<input id="esC" value="${esc(pre.c||'')}"></label>
 <label>رقم موبايلك<input id="esP" type="tel" placeholder="01xxxxxxxxx"></label>
 <label>الرسايل تروح على<select id="esV"><option value="wa">واتساب</option><option value="sms">رسالة عادية SMS</option></select></label>
 <label>دواه (كل سطر: اسم الدوا - الساعة)<textarea id="esM">${esc((pre.m||[]).map(m=>m.t+' - '+m.at).join('\n'))}</textarea></label>
 <label>رقم سري (4 أرقام) عشان الشاشة متتقفلش بالغلط<input id="esPin" type="password" inputmode="numeric" maxlength="6"></label>
 <button class="btn big" id="esGo">شغّل الشاشة الكبيرة</button></div>`);
 $('esGo').onclick=()=>{const n=$('esN').value.trim(),ph=normPhone($('esP').value),pin=$('esPin').value.trim();
  if(!n){toast('اكتب الاسم');return}if(ph.length<8){toast('اكتب رقمك صح');return}if(!/^\d{4,6}$/.test(pin)){toast('الرقم السري 4 أرقام');return}
  const meds=$('esM').value.split('\n').map(l=>{const m=l.match(/^(.+?)\s*[-–]\s*(\d{1,2}):(\d{2})\s*$/);return m?{id:uid().slice(-6),t:m[1].trim(),at:pad(+m[2])+':'+m[3]}:null}).filter(Boolean).slice(0,8);
  ELDER={on:true,name:n,child:$('esC').value.trim()||'ابنك',phone:ph,via:$('esV').value,pin,meds,taken:{},log:[]};saveElder();location.hash='';location.reload()}}
function elderSend(t){const msg=ELDER.name+': '+t+' ('+fmtT(NOW())+')',ph=ELDER.phone;ELDER.log=(ELDER.log||[]).concat({t,d:nowMs()}).slice(-20);saveElder();
 const url=ELDER.via==='sms'?'sms:+'+ph+'?body='+encodeURIComponent(msg):'https://wa.me/'+ph+'?text='+encodeURIComponent(msg);
 if(DEMO||window.__noNav)window.__lastElderMsg=url;else{const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.click()}drawElder()}
function drawElder(){const el=$('kidApp');if(!el||!ELDER)return;const e=ELDER,dk=dayKey(),tk=(e.taken[dk]=e.taken[dk]||{}),n=NOW();
 const meds=(e.meds||[]).slice().sort((a,b)=>a.at.localeCompare(b.at));const last=(e.log||[]).slice(-1)[0];
 el.innerHTML=`<header class="kh"><div><b>أهلاً يا ${esc(e.name)} 💛</b><small>${esc(DAYS[n.getDay()])}</small></div><div class="kstar" style="font-size:26px">${esc(fmtT(n))}</div></header>
 <div class="ksafe"><a href="tel:+${esc(e.phone)}" style="grid-column:1/-1;min-height:120px">📞<b style="font-size:24px">كلّم ${esc(e.child)}</b></a>
 <button data-m="أنا كويس الحمد لله 👍">👍<b>أنا كويس</b></button><button data-m="محتاجك تكلمني دلوقتي 🙏" style="border-color:var(--red)">🆘<b>محتاج مساعدة</b></button></div>
 ${last?`<p class="note" style="text-align:center">آخر رسالة: ${esc(last.t)} · ${esc(fmtT(new Date(last.d)))}</p>`:''}
 ${meds.length?`<div class="card kcard"><div class="ch"><h3>💊 دوا النهارده</h3><small>دوس لما تاخده</small></div>${meds.map(m=>`<div class="wtask"><div class="tx"><b style="font-size:22px">${esc(m.t)}</b><small class="note">${esc(fmtT(hm(m.at,n)))}</small></div>${tk[m.id]?'<span class="dur" style="font-size:20px">✓ خدته</span>':`<button class="btn big" data-md="${m.id}" style="min-height:56px">خدته ✓</button>`}</div>`).join('')}</div>`:''}
 <button class="link" id="eExit" style="align-self:center;margin:10px 0">🔒 الإعدادات</button>`;
 el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{elderSend(b.dataset.m);buzz(30);toast('اتبعتت لـ '+e.child+' 💛')});
 el.querySelectorAll('[data-md]').forEach(b=>b.onclick=()=>{const m=meds.find(x=>x.id===b.dataset.md);tk[m.id]=nowMs();saveElder();buzz(20);elderSend('خدت دوا '+m.t+' ✓')});
 $('eExit').onclick=()=>{openSheet(`<h2>🔒 الإعدادات</h2><div class="form"><label>الرقم السري<input id="ePin" type="password" inputmode="numeric"></label><button class="btn" id="ePinGo">ادخل</button></div>`);
  $('ePinGo').onclick=()=>{if($('ePin').value.trim()!==e.pin){toast('الرقم غلط');return}openSheet(`<h2>الإعدادات</h2><div class="stack"><button class="btn" id="eNot">🔔 شغّل منبّه الدوا</button><button class="btn ghost" id="eEdit">عدّل الشاشة</button><button class="btn ghost" id="eOff" style="color:var(--red)">اقفل الشاشة الكبيرة</button></div>`);
   $('eNot').onclick=()=>{closeSheet();enablePush()};$('eEdit').onclick=()=>elderSetup({n:e.name,c:e.child,m:e.meds});$('eOff').onclick=()=>{ELDER.on=false;saveElder();location.reload()}}}}
function elderBoot(){const h=location.hash;
 if(h.startsWith('#eldersetup=')){const o=b64d(h.slice(12))||{};history.replaceState(null,'',location.pathname+location.search);if(!(ELDER&&ELDER.on)){setTimeout(()=>elderSetup(o),300);return false}}
 if(!(ELDER&&ELDER.on))return false;
 $('app').hidden=true;document.body.classList.add('kidmode');let el=$('kidApp');if(!el){el=document.createElement('div');el.id='kidApp';document.body.insertBefore(el,$('sheet'))}
 drawElder();setInterval(()=>{if($('sheet').hidden)drawElder()},60000);
 setTimeout(()=>{try{checkAlarms();writeAlarms();pushSync()}catch(e){}},1500);return true}

/* ---------- alarms and nudges for the new parts ---------- */
ALARM_EXTRA.push((from,end)=>{const out=[];const d0=new Date(from);d0.setHours(0,0,0,0);
 for(let i=0;i<15;i++){const d=new Date(d0);d.setDate(d.getDate()+i);const ds=dayKey(d).replace(/-/g,''),dk=dayKey(d);
  if(ELDER&&ELDER.on){(ELDER.meds||[]).forEach(m=>{if(!(ELDER.taken[dk]||{})[m.id])out.push({k:'el'+m.id+ds,iid:'life',at:hm(m.at,d).getTime(),text:'💊 ميعاد دوا '+m.t})});continue}
  CARE.ps.forEach(p=>{if(p.call&&!(i===0&&calledAgo(p)===0))out.push({k:'pc'+p.id+ds,iid:'life',at:hm(p.call,d).getTime(),text:'📞 كلّم '+p.name+' واطمن عليه'});
   (p.meds||[]).forEach(m=>out.push({k:'pm'+p.id+m.id+ds,iid:'life',at:hm(m.at,d).getTime()+15*6e4,text:'💊 '+p.name+' كان المفروض ياخد '+m.t+'. اتأكد إنه خده'}))});
  BIZ.orders.forEach(o=>{if(o.st!=='done'&&o.due===dk)out.push({k:'bz'+o.id+ds,iid:'life',at:hm('09:00',d).getTime(),text:'📦 تسليم '+o.t+' لـ '+o.c+' النهارده'})})}
 return out.filter(a=>a.at>=from&&a.at<=end)});
NUDGE_EXTRA.push((t,hard)=>{const out=[];if(hard)return out;
 CARE.ps.forEach(p=>{const a=calledAgo(p);if(a!=null&&a>=3)out.push({id:'pc'+p.id+dayKey(),pr:48,i:'📞',p:'بقالك '+nDays(a)+' مكلمتش '+p.name+'. تكلمه دلوقتي؟',
  acts:[[p.phone?'كلّمه':'كلمته ✓',()=>{p.lastCall=nowMs();saveCare();if(p.phone&&!window.__noNav)location.href='tel:+'+normPhone(p.phone);render()}],['بعدين',()=>{nsn['pc'+p.id+dayKey()]=t+864e5;save();render()}]]})});
 BIZ.orders.filter(o=>o.st!=='done'&&oDays(o)<0).slice(0,1).forEach(o=>out.push({id:'bzl'+o.id+dayKey(),pr:58,i:'📦',p:o.t+' لـ '+o.c+' متأخر '+nDays(-oDays(o))+'. نبعتله رسالة نطمنه؟',
  acts:[['اكتبلي الرسالة',()=>openSheet('<h2>رسالة لـ '+esc(o.c)+'</h2>'+draftBox('أهلاً يا '+o.c+' 🌷 آسفين على التأخير في '+o.t+'، هيكون جاهز في أقرب وقت وهبلغ حضرتك أول ما يخلص 🙏',o.ph?normPhone(o.ph):''))],['تمام',()=>{nsn['bzl'+o.id+dayKey()]=t+864e5;save();render()}]]}));
 return out});

// home-screen shortcuts and links: ?go=pay opens the nearest bill, #pay=<id> opens one bill
function workBoot(){const go=new URLSearchParams(location.search).get('go');
 const m=/^#pay=([A-Za-z0-9_-]+)/.exec(location.hash);if(m){history.replaceState(null,'',location.pathname+location.search);const it=byId(m[1]);if(it)setTimeout(()=>paySheet(it),400)}
 else if(go==='pay'){const b=items.filter(i=>i.type==='bill'&&!i.done).sort((a,c)=>(a.due||'9').localeCompare(c.due||'9'))[0];setTimeout(()=>b?paySheet(b):(show('money'),toast('مفيش فواتير. قول «فاتورة النت 450 كل شهر»')),400)}
 else if(go==='need'){setTimeout(()=>{openSheet('<h2>🛒 إيه اللي خلص في البيت؟</h2><div class="inrow"><input id="gnT" placeholder="لبن، عيش، صابون..."><button class="btn" id="gnGo">ضيف</button></div>');const add=()=>{const t=$('gnT').value.trim();if(!t)return;addNeed(t,'food');closeSheet()};$('gnGo').onclick=add;$('gnT').onkeydown=e=>{if(e.key==='Enter')add()};$('gnT').focus()},400)}}
Object.assign(window,{paySheet,plansSheet,drawBiz,drawParents,elderBoot,workBoot});
