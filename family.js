/* ================= Sanady family: mom mode, the child's phone, interests (faith, pets) ================= */
'use strict';

/* ---------- MOM MODE: the whole house in one place ---------- */
const CHORES0=[['🍽️','المواعين والمطبخ',1],['🧺','الغسيل',2],['🚽','الحمام',3],['🧹','كنس ومسح',4],['🛏️','تغيير الملايات',7],['🧊','تنضيف التلاجة',14],['🪟','الشبابيك والتراب',14]];
let HOME=store.get('home',null);
if(!HOME||!Array.isArray(HOME.chores))HOME={chores:CHORES0.map(([i,t,e],k)=>({id:'c'+k,i,t,every:e,last:0})),kids:[],work:{}};
HOME.kids=HOME.kids||[];HOME.work=HOME.work||{};
const saveHome=()=>{store.set('home',HOME);save()};
const workToday=()=>!!HOME.work[dayKey()];
const choreDue=c=>!c.last||(nowMs()-c.last)/864e5>=c.every-0.3;
const choreLate=c=>c.last?((nowMs()-c.last)/864e5)/c.every:9;
const NEEDS={food:['🍞 الأكل',['عيش','لبن','بيض','رز','مكرونة','زيت','سكر','فراخ','خضار','فاكهة','جبنة']],home:['🧴 البيت',['منظفات','صابون','مناديل','أكياس زبالة','مسحوق غسيل']],kids:['🧸 الولاد',['حفاضات','لبن أطفال','أكل المدرسة','أدوات مدرسة']]};
const needItems=()=>items.filter(i=>i.type==='buy'&&!i.done);
function addNeed(t,cat){if(needItems().some(i=>arN(i.title)===arN(t))){toast(t+' موجودة في القايمة');return}addItem({type:'buy',sec:'shop',title:t,cat:cat||'food'});toast('اتضافت: '+t)}
const kidName=id=>{const k=HOME.kids.find(x=>x.id===id);return k?k.name:''};

function drawMom(){const box=$('nowMom'),n=NOW(),k=dayKey(),work=workToday();
 const today=items.filter(i=>!i.done&&i.due&&i.type!=='idea'&&dayKey(parseL(i.due))===k).sort((a,b)=>parseL(a.due)-parseL(b.due));
 const due=HOME.chores.filter(choreDue).sort((a,b)=>choreLate(b)-choreLate(a));const show=due.slice(0,work?2:4);
 const needs=needItems();const byCat={food:[],home:[],kids:[]};needs.forEach(i=>(byCat[i.cat]||byCat.food).push(i));
 box.innerHTML=`<span class="badge2">مود الأم</span>
 <div class="card"><div class="ch"><h3>يومك${prof.name?' يا '+esc(prof.name):''}</h3><small>${today.length?today.length+' مواعيد':'مفيش مواعيد'} · ${due.length?due.length+' حاجات نضافة':'البيت تمام'} · ${needs.length?needs.length+' ناقصين':'مفيش حاجة ناقصة'}</small></div>
  <div class="seg" id="mWork"><button data-w="0" class="${work?'':'on'}">في البيت النهارده</button><button data-w="1" class="${work?'on':''}">شغالة النهارده</button></div>
  ${work?'<p class="note">يوم شغل: هخفف عليكي البيت، حاجتين نضافة بس، والباقي يستنى.</p>':''}</div>
 <div class="card"><div class="ch"><h3>النهارده</h3><small>مواعيدك ومواعيد الولاد</small></div><div id="mToday">${today.length?today.slice(0,8).map(itemRow).join(''):'<p class="note">مفيش مواعيد النهارده.</p>'}</div></div>
 <div class="card"><div class="ch"><h3>🧹 نضافة النهارده</h3><small>${work?'حاجتين بس عشان يوم شغل':'على قد طاقتك، مش لازم كله'}</small></div>
  ${show.length?show.map(c=>`<div class="wtask" data-c="${c.id}"><div class="tx"><b>${c.i} ${esc(c.t)}</b><small class="note">${c.last?'آخر مرة من '+nDays(Math.max(1,daysAgo(c.last))):'أول مرة'}</small></div><button class="btn ghost" style="min-height:44px;padding:0 14px">خلصت ✓</button></div>`).join(''):'<p class="note">البيت تمام النهارده 👏</p>'}
  <button class="link" id="mChores" style="align-self:flex-start">كل حاجات النضافة ومواعيدها</button></div>
 <div class="card"><div class="ch"><h3>🛒 ناقص في البيت</h3><small>دوسي على اللي خلص، أو اكتبي</small></div>
  ${Object.entries(NEEDS).map(([c,[h]])=>byCat[c].length?`<div class="sec"><div class="sech">${h} <span>${byCat[c].length}</span></div>${byCat[c].map(itemRow).join('')}</div>`:'').join('')}
  <div class="feel" id="mChips">${Object.entries(NEEDS).map(([c,[,l]])=>l.filter(t=>!needs.some(i=>i.title===t)).slice(0,6).map(t=>`<button class="chip" data-c="${c}">${esc(t)}</button>`).join('')).join('')}</div>
  <div class="inrow"><input id="mNeed" placeholder="حاجة تانية خلصت؟"><button class="btn" id="mNeedGo">ضيف</button></div>
  ${needs.length?'<button class="btn ghost" id="mShare">ابعتي القايمة واتساب</button>':''}<button class="link" id="mHome" style="align-self:flex-start">🏠 ${typeof HS!=='undefined'&&HS.key?'البيت المشترك شغال ✓':'شاركي القايمة مع أهل البيت'}</button></div>
 <div class="card"><div class="ch"><h3>🍳 تعبانة؟ أكلة سريعة</h3><small>قوليلي عندك إيه وأقولك تعملي إيه في ربع ساعة</small></div><button class="btn" id="mFood">اقترحلي أكلة</button></div>
 <div class="card"><div class="ch"><h3>👧 الولاد</h3><small>دواهم ودكتورهم ومدرستهم وحواراتهم</small></div><div id="mKids"></div><button class="btn ghost" id="mKidAdd">+ ضيفي طفل</button></div>`;
 $('mWork').querySelectorAll('button').forEach(b=>b.onclick=()=>{HOME.work[dayKey()]=b.dataset.w==='1';const ks=Object.keys(HOME.work).sort().slice(-30);HOME.work=Object.fromEntries(ks.map(x=>[x,HOME.work[x]]));saveHome();render()});
 box.querySelectorAll('[data-c].wtask').forEach(r=>r.querySelector('button').onclick=()=>{const c=HOME.chores.find(x=>x.id===r.dataset.c);c.last=nowMs();saveHome();award(5);buzz(20);toast(cheer());render()});
 $('mChores').onclick=choresSheet;
 $('mChips').querySelectorAll('button').forEach(b=>b.onclick=()=>{addNeed(b.textContent,b.dataset.c);render()});
 const add=()=>{const v=$('mNeed').value.trim();if(!v)return;addNeed(v,'food');render()};$('mNeedGo').onclick=add;$('mNeed').onkeydown=e=>{if(e.key==='Enter')add()};
 $('mHome').onclick=()=>homeSheet();
 const sh=$('mShare');if(sh)sh.onclick=()=>openSheet('<h2>قايمة البيت</h2>'+draftBox('محتاجين من برة:\n'+needs.map(i=>'• '+i.title).join('\n')));
 $('mFood').onclick=()=>foodSheet();$('mKidAdd').onclick=()=>kidForm();
 bindRows($('mToday'));box.querySelectorAll('.sec').forEach(s=>bindRows(s));drawKids()}

function choresSheet(){openSheet(`<h2>🧹 النضافة</h2><div class="stack"><p class="note">كل حاجة كل كام يوم؟ أنا هطلعلك اللي عليه الدور بس.</p>
 ${HOME.chores.map(c=>`<div class="wtask" data-c="${c.id}"><div class="tx"><b>${c.i} ${esc(c.t)}</b></div><label class="note" style="display:flex;align-items:center;gap:6px">كل<input type="number" inputmode="numeric" min="1" value="${c.every}" style="width:70px;min-height:40px">يوم</label><button class="mini-b rm" aria-label="شيل">✕</button></div>`).join('')}
 <div class="inrow"><input id="chN" placeholder="حاجة تانية (مثلاً: البلكونة)"><input id="chE" type="number" inputmode="numeric" placeholder="كل كام يوم" style="max-width:120px"><button class="btn" id="chAdd">ضيف</button></div></div>`);
 document.querySelectorAll('#sheetBody .wtask').forEach(r=>{const c=HOME.chores.find(x=>x.id===r.dataset.c);r.querySelector('input').onchange=e=>{c.every=Math.max(1,+e.target.value||1);saveHome()};r.querySelector('.rm').onclick=()=>{HOME.chores=HOME.chores.filter(x=>x!==c);saveHome();choresSheet()}});
 $('chAdd').onclick=()=>{const t=$('chN').value.trim();if(!t)return;HOME.chores.push({id:uid(),i:'✨',t,every:Math.max(1,+$('chE').value||7),last:0});saveHome();choresSheet()}}

/* quick food: offline ideas from what is at home (no AI needed) */
const RECIPES=[
 {t:'شكشوكة',m:15,n:['بيض','طماطم'],s:'شوّحي بصلة وفلفل في الزيت، ضيفي طماطم مقطعة وملح وكمون، ولما تسبك اكسري البيض فوقها وغطيها 5 دقايق.'},
 {t:'عجة بالبقدونس',m:15,n:['بيض'],s:'اخفقي البيض مع بقدونس وبصل مفروم ورشة دقيق وملح وفلفل، واتقليها في طاسة سخنة على الوشين.'},
 {t:'مكرونة بالصلصة',m:20,n:['مكرونة','طماطم'],s:'اسلقي المكرونة. في الوقت ده شوّحي توم وصلصة وملح وفلفل، وقلّبيهم مع المكرونة.'},
 {t:'مكرونة بالتونة',m:20,n:['مكرونة','تونة'],s:'اسلقي المكرونة، وقلّبيها مع التونة وشوية صلصة أو ليمون وفلفل أسود.'},
 {t:'فول بالزيت والليمون',m:10,n:['فول'],s:'سخّني الفول وهرسيه، وضيفي زيت وكمون وليمون وملح، وقدّميه مع عيش وطماطم.'},
 {t:'بطاطس بالبيض',m:20,n:['بطاطس','بيض'],s:'قطّعي البطاطس مكعبات صغيرة وشوّحيها لحد ما تستوي، واكسري عليها البيض بالملح والفلفل.'},
 {t:'صدور فراخ بالبصل في الطاسة',m:25,n:['فراخ'],s:'قطّعي الفراخ شرايح رفيعة، شوّحي بصلة، ضيفي الفراخ والتوابل والملح وسيبيها 15 دقيقة على نار متوسطة.'},
 {t:'رز بالشعرية',m:25,n:['رز'],s:'حمّري الشعرية في سمنة، ضيفي الرز المغسول والملح ومية قده مرة ونص، وسيبيه على نار هادية 20 دقيقة.'},
 {t:'ساندوتشات جبنة وخيار',m:10,n:['جبنة','عيش'],s:'جبنة بيضا متهرسة بطماطم وخيار ونعناع، أو جبنة رومي في التوستر.'},
 {t:'سلطة تونة',m:10,n:['تونة'],s:'تونة مع ذرة وخيار وطماطم وليمون وشوية زيت، تتاكل لوحدها أو في عيش.'},
 {t:'شوربة عدس سريعة',m:30,n:['عدس'],s:'اسلقي العدس الأصفر مع بصلة وجزرة وطماطماية، واضربيهم وضيفي كمون وملح وليمون.'},
 {t:'بيض مسلوق وجبنة وعيش',m:10,n:['بيض','جبنة'],s:'أسهل عشا: بيض مسلوق وجبنة وخضار مقطع. مش لازم كل يوم طبخة.'}];
const HAVE=['بيض','طماطم','مكرونة','تونة','فول','بطاطس','فراخ','رز','جبنة','عيش','عدس'];
function foodSheet(sel){sel=sel||store.get('have',[]);const ok=RECIPES.map(r=>({r,miss:r.n.filter(x=>!sel.includes(x))})).sort((a,b)=>a.miss.length-b.miss.length||a.r.m-b.r.m);
 openSheet(`<h2>🍳 أكلة سريعة</h2><div class="stack"><p>عندك إيه في البيت؟</p><div class="feel" id="fdHave">${HAVE.map(h=>`<button class="chip ${sel.includes(h)?'on':''}">${h}</button>`).join('')}</div>
 ${ok.slice(0,5).map(({r,miss})=>`<div class="card" style="padding:14px"><b>${esc(r.t)} <span class="dur">${minsAr(r.m)}</span></b><p style="font-size:15px">${esc(r.s)}</p>${miss.length?`<small class="note">ناقصك: ${miss.join('، ')}</small>`:'<small class="note" style="color:var(--grn)">كله عندك ✓</small>'}</div>`).join('')}
 <p class="note">ولو تعبانة خالص، اطلبي أكل من برة النهارده، ده مش تقصير.</p></div>`);
 $('fdHave').querySelectorAll('button').forEach(b=>b.onclick=()=>{const h=b.textContent;const s2=sel.includes(h)?sel.filter(x=>x!==h):sel.concat(h);store.set('have',s2);foodSheet(s2)})}

/* kids (parent side) */
function drawKids(){const box=$('mKids');if(!box)return;
 box.innerHTML=HOME.kids.length?HOME.kids.map(k=>{const its=items.filter(i=>i.kid===k.id&&!i.done).sort((a,b)=>(a.due||'9').localeCompare(b.due||'9'));
  return`<div class="card" style="padding:14px;background:var(--bg)" data-k="${k.id}"><div class="ch"><h3>${esc(k.name)}${k.age?' · '+esc(k.age)+' سنين':''}</h3>${k.doc?`<small>دكتوره: ${esc(k.doc)}${k.docPhone?' · <a class="link" href="tel:'+esc(k.docPhone)+'">اتصلي</a>':''}</small>`:''}</div>
  ${its.length?its.slice(0,5).map(i=>`<div class="item"><div class="tx"><b>${{med:'💊',appt:'🩺',task:'📌'}[i.type]||'•'} ${esc(i.title)}</b><small>${esc(fmtWhen(i.due))}${i.repeat==='daily'?' · كل يوم':''}</small></div><button class="mini-b" data-x="${i.id}">✕</button></div>`).join(''):'<p class="note">مفيش حاجة متسجلة لسه.</p>'}
  <div class="feel"><button class="chip" data-a="med">💊 ميعاد دوا</button><button class="chip" data-a="doc">🩺 ميعاد دكتور</button><button class="chip" data-a="task">📌 مدرسة / حوار</button><button class="chip" data-a="hw">📲 ابعتله مهمة</button><button class="chip" data-a="phone">⚙️ جهّزي موبايله</button><button class="chip" data-a="edit">✏️</button></div></div>`}).join(''):'<p class="note">ضيفي ولادك عشان أفكّرك بدواهم ودكتورهم ومدرستهم.</p>';
 box.querySelectorAll('[data-k]').forEach(c=>{const k=HOME.kids.find(x=>x.id===c.dataset.k);
  c.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>removeItem(b.dataset.x));
  c.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;if(a==='edit')kidForm(k);else if(a==='hw')hwLink(k);else if(a==='phone')kidPhoneLink(k);else kidItem(k,a)})})}
function kidForm(k){const isNew=!k;k=k||{id:uid(),name:'',age:'',doc:'',docPhone:''};
 openSheet(`<h2>${isNew?'طفل جديد':esc(k.name)}</h2><div class="form"><label>الاسم<input id="kN" value="${esc(k.name)}"></label><label>السن<input id="kA" type="number" inputmode="numeric" value="${esc(k.age)}"></label>
 <label>اسم الدكتور (اختياري)<input id="kD" value="${esc(k.doc)}"></label><label>تليفون الدكتور (اختياري)<input id="kP" type="tel" value="${esc(k.docPhone)}"></label>
 <div class="acts"><button class="btn" id="kSave">احفظ</button>${isNew?'':'<button class="btn ghost" id="kDel" style="color:var(--red)">شيل</button>'}</div><p class="note">بنحفظ الاسم الأول والسن بس، على موبايلك.</p></div>`);
 $('kSave').onclick=()=>{const nm=$('kN').value.trim();if(!nm)return;Object.assign(k,{name:nm,age:$('kA').value.trim(),doc:$('kD').value.trim(),docPhone:$('kP').value.trim()});if(isNew)HOME.kids.push(k);saveHome();closeSheet()};
 if(!isNew)$('kDel').onclick=()=>{HOME.kids=HOME.kids.filter(x=>x!==k);items=items.filter(i=>!(i.kid===k.id&&!i.done));saveHome();closeSheet()}}
function kidItem(k,a){const lab={med:'ميعاد دوا '+k.name,doc:'ميعاد دكتور '+k.name,task:'حاجة تخص '+k.name}[a];
 openSheet(`<h2>${esc(lab)}</h2><div class="form">${a==='med'?'<label>اسم الدوا (اختياري)<input id="kiT"></label>':a==='task'?'<label>إيه هي؟<input id="kiT" placeholder="رحلة المدرسة، عيد ميلاد صاحبه، اجتماع أولياء الأمور..."></label>':'<label>فين؟ (اختياري)<input id="kiW" value="'+esc(k.doc||'')+'"></label>'}
 <label>${a==='med'?'الساعة كام؟':'امتى؟'}<input id="kiD" type="${a==='med'?'time':'datetime-local'}"></label>${a==='med'?'<label class="tog"><input type="checkbox" id="kiR" checked> كل يوم</label><p class="note">ده تذكير بالميعاد بس. الجرعة زي ما الدكتور كاتبها.</p>':''}<button class="btn" id="kiSave">احفظ</button></div>`);
 $('kiSave').onclick=()=>{let due=$('kiD').value;if(!due){toast('اختاري الوقت');return}
  if(a==='med'){const d=NOW();const [h,m]=due.split(':').map(Number);d.setHours(h,m,0,0);if(d<NOW())d.setDate(d.getDate()+1);due=toLocal(d);const t=$('kiT').value.trim();addItem({type:'med',sec:'health',title:'دوا '+k.name+(t?' ('+t+')':''),due,repeat:$('kiR').checked?'daily':''}).kid=k.id}
  else if(a==='doc')addItem({type:'appt',sec:'health',title:'دكتور '+k.name,due,where:$('kiW').value.trim()}).kid=k.id;
  else{const t=$('kiT').value.trim();if(!t)return;addItem({type:'task',sec:'people',title:t+' ('+k.name+')',due}).kid=k.id}
  save();closeSheet();toast('هفكّرك في ميعادها')}}
function hwLink(k){openSheet(`<h2>ابعتي مهمة لموبايل ${esc(k.name)}</h2><div class="form"><label>المهمة<input id="hwT" placeholder="واجب الرياضة صفحة 45"></label><button class="btn" id="hwGo">جهّزي الرسالة</button><div id="hwOut"></div><p class="note">بتوصل في رسالة بس، ومش بتتحفظ عند حد. ${esc(k.name)} يفتحها على موبايله وتتضاف عنده خطوة خطوة.</p></div>`);
 $('hwGo').onclick=()=>{const t=$('hwT').value.trim();if(!t)return;$('hwOut').innerHTML=draftBox('مهمة جديدة على سندي: '+t+'\n'+location.origin+location.pathname+'#hw='+b64e({t}))}}
function kidPhoneLink(k){const link=location.origin+location.pathname+'#kidsetup='+b64e({n:k.name,a:k.age,p:prof.name||'ماما'});
 openSheet(`<h2>موبايل ${esc(k.name)}</h2><div class="stack"><p>افتحي اللينك ده على موبايل ${esc(k.name)}، واكتبي رقمك ورقم سري (PIN) هناك. بعدها الموبايل يبقى فيه شاشة الطفل بس، ومحدش يخرج منها غيرك.</p>${draftBox(link)}
 <p class="note">من موبايله يقدر يبعتلك بضغطة «وصلت المدرسة» و«وصلت البيت» و«أنا كويس»، ويتصل بيكي على طول. مفيش تتبع مكان، ولا تسجيل صوت، ولا كلام حر مع الذكاء الاصطناعي.</p></div>`)}

/* ---------- CHILD PHONE: simple screen for a 7-12 year old, parents get "I'm OK" messages ---------- */
const R0={morning:['اصحى واغسل وشك 🪥','البس هدوم المدرسة 👕','افطر 🥪','جهّز الشنطة 🎒','البس الجزمة 👟'],after:['غيّر هدومك 👕','اتغدى 🍽️','استريح نص ساعة 🛋️','اعمل الواجب 📚','جهّز شنطة بكرة 🎒'],night:['خد شاور 🚿','البس البيجامة 🌙','اغسل سنانك 🪥','احكي لماما يومك 💬','نام بدري 😴']};
const RNAME={morning:'روتين الصبح',after:'بعد المدرسة',night:'قبل النوم'};
const HW_STEPS=['طلّع الكتاب والكشكول وحطهم قدامك','اقرا المطلوب مرة واحدة','اعمل أول سؤال بس','كمّل الباقي','راجع وقفل الشنطة'];
let KID=store.get('kid',null);
const saveKid=()=>store.set('kid',KID);
const normPhone=p=>{let d=String(p||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);if(/^01\d{9}$/.test(d))d='2'+d;if(/^05\d{8}$/.test(d))d='971'+d.slice(1);return d};
function kidSetup(pre){pre=pre||{};const r=(KID&&KID.r)||R0;
 openSheet(`<h2>موبايل طفل</h2><div class="form"><p class="note">الشاشة دي تتعمل على موبايل الطفل نفسه، بإيد الأب أو الأم.</p>
 <label>اسم الطفل<input id="ksN" value="${esc(pre.n||'')}"></label><label>السن<input id="ksA" type="number" inputmode="numeric" value="${esc(pre.a||'')}"></label>
 <label>بيبعت لمين؟<input id="ksP" value="${esc(pre.p||'ماما')}"></label><label>رقم موبايلك<input id="ksPh" type="tel" placeholder="01xxxxxxxxx"></label>
 <label>الرسايل تروح على<select id="ksV"><option value="wa">واتساب</option><option value="sms">رسالة عادية SMS</option></select></label>
 <label>رقم سري للأهل (4 أرقام) عشان محدش يخرج من شاشة الطفل غيركم<input id="ksPin" type="password" inputmode="numeric" maxlength="6"></label>
 <details><summary><b>عدّل الروتين</b></summary>${Object.keys(R0).map(x=>`<label>${RNAME[x]} (كل خطوة في سطر)<textarea id="ksR_${x}">${esc(r[x].join('\n'))}</textarea></label>`).join('')}</details>
 <label>المكافآت (كل سطر: المكافأة - عدد النجوم)<textarea id="ksRw">${esc(((KID&&KID.rw)||[{t:'نص ساعة لعب زيادة',c:20},{t:'خروجة يوم الجمعة',c:60}]).map(x=>x.t+' - '+x.c).join('\n'))}</textarea></label>
 <button class="btn big" id="ksGo">شغّل شاشة الطفل</button><p class="note">مفيش تتبع مكان، ولا تسجيل صوت أو صور، ولا شات مع الذكاء الاصطناعي. الرسايل بتروح منه ليكم على طول.</p></div>`);
 $('ksGo').onclick=()=>{const name=$('ksN').value.trim(),ph=normPhone($('ksPh').value),pin=$('ksPin').value.trim();
  if(!name){toast('اكتب اسم الطفل');return}if(ph.length<8){toast('اكتب رقم موبايلك صح');return}if(!/^\d{4,6}$/.test(pin)){toast('الرقم السري 4 أرقام');return}
  const rr={};Object.keys(R0).forEach(x=>{const l=$('ksR_'+x).value.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,10);rr[x]=l.length?l:R0[x]});
  const rw=$('ksRw').value.split('\n').map(l=>{const m=l.match(/^(.+?)\s*[-–]\s*(\d+)\s*$/);return m?{t:m[1].trim(),c:+m[2]}:null}).filter(Boolean).slice(0,6);
  KID={on:true,name,age:$('ksA').value.trim(),parent:$('ksP').value.trim()||'ماما',phone:ph,via:$('ksV').value,pin,r:rr,rw,stars:(KID&&KID.stars)||0,done:{},hw:(KID&&KID.hw)||[],log:[]};saveKid();location.hash='';location.reload()}}
function kidBoot(){const h=location.hash;
 if(h.startsWith('#kidsetup=')){const o=b64d(h.slice(10))||{};history.replaceState(null,'',location.pathname+location.search);if(!(KID&&KID.on)){setTimeout(()=>kidSetup(o),300);return false}}
 if(!(KID&&KID.on))return false;
 if(h.startsWith('#hw=')){const o=b64d(h.slice(4));history.replaceState(null,'',location.pathname+location.search);if(o&&o.t){KID.hw.push({id:uid(),t:String(o.t).slice(0,120),s:HW_STEPS.map(t=>({t,d:false})),d:false,at:nowMs()});saveKid();setTimeout(()=>toast('📚 مهمة جديدة: '+o.t,4000),400)}}
 $('app').hidden=true;document.body.classList.add('kidmode');let el=$('kidApp');if(!el){el=document.createElement('div');el.id='kidApp';document.body.insertBefore(el,$('sheet'))}
 drawKid();setInterval(()=>{if($('sheet').hidden)drawKid()},60000);return true}
const rKey=()=>{const h=NOW().getHours();return h<12?'morning':h<18?'after':'night'};
function kidSend(t){const msg=KID.name+': '+t+' ('+fmtT(NOW())+')';const ph=KID.phone;
 KID.log=(KID.log||[]).concat({t,d:nowMs()}).slice(-20);saveKid();
 const url=KID.via==='sms'?'sms:+'+ph+'?body='+encodeURIComponent(msg):'https://wa.me/'+ph+'?text='+encodeURIComponent(msg);
 if(DEMO||window.__noNav){window.__lastKidMsg=url}else{const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.click()}drawKid()}
function drawKid(){const el=$('kidApp');if(!el)return;const k=KID,rk=rKey(),dk=dayKey();k.done=k.done||{};const dd=k.done[dk]=k.done[dk]||{};const doneR=dd[rk]||[];const R=k.r[rk]||R0[rk];
 const nextI=R.findIndex((_,i)=>!doneR.includes(i));const last=(k.log||[]).slice(-1)[0];const hw=(k.hw||[]).filter(x=>!x.d);
 el.innerHTML=`<header class="kh"><div><b>أهلاً يا ${esc(k.name)} 👋</b><small>${esc(DAYS[NOW().getDay()]+' · '+fmtT(NOW()))}</small></div><div class="kstar">⭐ ${k.stars}</div></header>
 <div class="ksafe"><button data-m="وصلت المدرسة 🏫">🏫<b>وصلت المدرسة</b></button><button data-m="وصلت البيت 🏠">🏠<b>وصلت البيت</b></button><button data-m="أنا كويس 👍">👍<b>أنا كويس</b></button><a href="tel:+${esc(k.phone)}">📞<b>كلّم ${esc(k.parent)}</b></a></div>
 ${last?`<p class="note" style="text-align:center">آخر رسالة لـ ${esc(k.parent)}: ${esc(last.t)} · ${esc(fmtT(new Date(last.d)))}</p>`:''}
 <div class="card kcard"><div class="ch"><h3>${RNAME[rk]}</h3><small>${doneR.length} من ${R.length}</small></div><div class="bar"><i style="width:${doneR.length/R.length*100}%"></i></div>
  ${nextI<0?`<div class="kbig">برافو عليك! خلصت ${RNAME[rk]} 🎉</div><button class="btn big big-wide" id="kTell">قول لـ ${esc(k.parent)} إني خلصت</button>`:
  `<div class="kbig">${esc(R[nextI])}</div><button class="btn big big-wide" id="kStep">خلصت دي ✓</button>`}
  <div class="ksteps">${R.map((s,i)=>`<span class="${doneR.includes(i)?'on':i===nextI?'cur':''}">${doneR.includes(i)?'✓':i+1}</span>`).join('')}</div></div>
 ${hw.length?`<div class="card kcard"><div class="ch"><h3>📚 المهام</h3><small>خطوة صغيرة كل مرة</small></div>${hw.map(x=>{const si=x.s.findIndex(s=>!s.d);return`<div class="wtask" data-h="${x.id}"><div class="tx"><b>${esc(x.t)}</b><small class="note">الخطوة ${si+1} من ${x.s.length}: ${esc(x.s[si].t)}</small></div><button class="btn" style="min-height:48px;padding:0 14px">خلصت الخطوة</button></div>`}).join('')}<button class="btn ghost" id="kTimer">⏱️ 10 دقايق تركيز</button><div id="kT"></div></div>`:''}
 <div class="card kcard"><div class="ch"><h3>🎁 المكافآت</h3><small>النجوم بتيجي من الروتين والمهام</small></div>${(k.rw||[]).map((r,i)=>`<div class="wtask"><div class="tx"><b>${esc(r.t)}</b><div class="bar"><i style="width:${Math.min(1,k.stars/r.c)*100}%"></i></div></div>${k.stars>=r.c?`<button class="btn" data-rw="${i}" style="min-height:44px">اطلبها</button>`:`<span class="dur">${r.c-k.stars} ⭐ كمان</span>`}</div>`).join('')}</div>
 <button class="link" id="kExit" style="align-self:center;margin:10px 0">🔒 للأهل</button>`;
 el.querySelectorAll('.ksafe [data-m]').forEach(b=>b.onclick=()=>{kidSend(b.dataset.m);buzz(30);toast('اتبعتت لـ '+k.parent+' 💛')});
 const st=$('kStep');if(st)st.onclick=()=>{dd[rk]=doneR.concat(nextI);k.stars++;saveKid();buzz(20);if(dd[rk].length>=R.length){confetti();k.stars+=3;saveKid()}else toast(['عاش! ⭐','برافو ⭐','كمّل كده ⭐'][doneR.length%3]);drawKid()};
 const tl=$('kTell');if(tl)tl.onclick=()=>kidSend('خلصت '+RNAME[rk]+' ✓');
 el.querySelectorAll('[data-h]').forEach(r=>r.querySelector('button').onclick=()=>{const x=k.hw.find(y=>y.id===r.dataset.h);const s=x.s.find(s=>!s.d);s.d=true;k.stars++;if(x.s.every(s=>s.d)){x.d=true;k.stars+=5;confetti();saveKid();kidSend('خلصت: '+x.t+' 📚');return}saveKid();toast('عاش ⭐');drawKid()});
 const tm=$('kTimer');if(tm)tm.onclick=()=>{let left=600;const t=setInterval(()=>{left--;const e=$('kT');if(!e){clearInterval(t);return}e.innerHTML='<div class="kbig" style="font-size:42px;direction:ltr">'+Math.floor(left/60)+':'+pad(left%60)+'</div>';if(left<=0){clearInterval(t);SND.chime();k.stars+=2;saveKid();confetti();drawKid()}},1000);tm.hidden=true};
 el.querySelectorAll('[data-rw]').forEach(b=>b.onclick=()=>{const r=k.rw[+b.dataset.rw];k.stars-=r.c;saveKid();confetti();kidSend('عايز المكافأة: '+r.t+' 🎁')});
 $('kExit').onclick=()=>{openSheet('<h2>للأهل بس</h2><div class="form"><label>الرقم السري<input id="kpin" type="password" inputmode="numeric"></label><div class="acts"><button class="btn" id="kpOk">دخول</button></div></div>');
  $('kpOk').onclick=()=>{if($('kpin').value!==k.pin){toast('الرقم غلط');return}
   $('sheetBody').innerHTML='<h2>إعدادات موبايل الطفل</h2><div class="stack"><button class="btn" id="kpEdit">عدّل الروتين والمكافآت والرقم</button><button class="btn ghost" id="kpOff" style="color:var(--red)">اقفل شاشة الطفل</button></div>';
   $('kpEdit').onclick=()=>kidSetup({n:k.name,a:k.age,p:k.parent});$('kpOff').onclick=()=>{KID.on=false;saveKid();location.reload()}}}}

/* ---------- INTERESTS: faith, pets, anything else ---------- */
let FAITH=store.get('faith',{f:'',city:'cairo',pr:{fajr:1,dhuhr:1,asr:1,maghrib:1,isha:1},adhkar:1,kahf:1,chr:{am:'07:00',pm:'22:00',mass:0,massT:'08:00',read:'21:00',on:{am:1,pm:1,mass:1,read:0}}});
const saveFaith=()=>{store.set('faith',FAITH);save()};
const CITIES={cairo:['القاهرة',30.0444,31.2357,'eg'],giza:['الجيزة',30.0131,31.2089,'eg'],alex:['الإسكندرية',31.2001,29.9187,'eg'],tanta:['طنطا',30.7865,31.0004,'eg'],mansoura:['المنصورة',31.0409,31.3785,'eg'],zagazig:['الزقازيق',30.5877,31.502,'eg'],portsaid:['بورسعيد',31.2653,32.3019,'eg'],suez:['السويس',29.9668,32.5498,'eg'],assiut:['أسيوط',27.1783,31.1859,'eg'],minya:['المنيا',28.1099,30.7503,'eg'],luxor:['الأقصر',25.6872,32.6396,'eg'],aswan:['أسوان',24.0889,32.8998,'eg'],dubai:['دبي',25.2048,55.2708,'ae'],abudhabi:['أبوظبي',24.4539,54.3773,'ae'],sharjah:['الشارقة',25.3463,55.4209,'ae'],riyadh:['الرياض',24.7136,46.6753,'sa'],jeddah:['جدة',21.4858,39.1925,'sa'],kuwait:['الكويت',29.3759,47.9774,'kw'],doha:['الدوحة',25.2854,51.531,'qa']};
const METHODS={eg:{f:19.5,i:17.5},ae:{f:18.2,i:18.2},sa:{f:18.5,i90:1},kw:{f:18,i:17.5},qa:{f:18,i90:1}};
const PNAMES={fajr:'الفجر',sunrise:'الشروق',dhuhr:'الظهر',asr:'العصر',maghrib:'المغرب',isha:'العشاء'};
/* prayer times, computed on the phone (standard astronomical method, no internet) */
function prayTimes(day,ck){const c=CITIES[ck]||CITIES.cairo,lat=c[1],lng=c[2],m=METHODS[c[3]];const R=Math.PI/180;
 let y=day.getFullYear(),mo=day.getMonth()+1;const d=day.getDate();const Y=mo<=2?y-1:y,M=mo<=2?mo+12:mo;const A=Math.floor(Y/100),B=2-A+Math.floor(A/4);
 const jd=Math.floor(365.25*(Y+4716))+Math.floor(30.6001*(M+1))+d+B-1524.5-lng/(15*24);
 const fix=(a,b)=>{a=a-b*Math.floor(a/b);return a<0?a+b:a};
 const sun=t=>{const D=jd+t/24-2451545,g=fix(357.529+0.98560028*D,360),q=fix(280.459+0.98564736*D,360),L=fix(q+1.915*Math.sin(g*R)+0.020*Math.sin(2*g*R),360),e=23.439-0.00000036*D;
  const RA=fix(Math.atan2(Math.cos(e*R)*Math.sin(L*R),Math.cos(L*R))/R/15,24);return{dec:Math.asin(Math.sin(e*R)*Math.sin(L*R))/R,eqt:q/15-RA}};
 const noon=t=>fix(12-sun(t).eqt,24);
 const at=(ang,t,ccw)=>{const s=sun(t);const v=(-Math.sin(ang*R)-Math.sin(s.dec*R)*Math.sin(lat*R))/(Math.cos(s.dec*R)*Math.cos(lat*R));const T=Math.acos(Math.max(-1,Math.min(1,v)))/R/15;return noon(t)+(ccw?-T:T)};
 const asr=t=>{const s=sun(t);const a=-Math.atan(1/(1+Math.tan(Math.abs(lat-s.dec)*R)))/R;return at(a,t)};
 const h={fajr:at(m.f,5,true),sunrise:at(0.833,6,true),dhuhr:noon(12)+1/60,asr:asr(13),maghrib:at(0.833,18)};h.isha=m.i90?h.maghrib+1.5:at(m.i,18);
 const base=Date.UTC(y,mo-1,d);const out={};Object.keys(h).forEach(k=>{out[k]=new Date(base+(h[k]-lng/15)*36e5)});return out}
const pT=d=>{const h=d.getHours()%12||12;return h+':'+pad(d.getMinutes())};
const isMuslim=()=>FAITH.f==='m',isChristian=()=>FAITH.f==='c';
const hm=(s,d)=>{const [a,b]=String(s||'0:0').split(':').map(Number);const x=new Date(d);x.setHours(a||0,b||0,0,0);return x};
/* faith reminders ring like any alarm (and through push when the app is closed) */
ALARM_EXTRA.push((from,end)=>{const out=[];if(!FAITH.f)return out;const day0=new Date(from);day0.setHours(0,0,0,0);
 for(let i=0;i<15;i++){const d=new Date(day0);d.setDate(d.getDate()+i);const ds=dayKey(d).replace(/-/g,'');
  if(isMuslim()){const T=prayTimes(d,FAITH.city);['fajr','dhuhr','asr','maghrib','isha'].forEach(p=>{if(FAITH.pr[p])out.push({k:'pr'+ds+p,iid:'faith',at:T[p].getTime(),text:'🕌 '+(p==='dhuhr'&&d.getDay()===5?'صلاة الجمعة':'أذان '+PNAMES[p])+' · '+CITIES[FAITH.city][0],adhan:p})});
   if(FAITH.adhkar){out.push({k:'az'+ds+'m',iid:'faith',at:T.fajr.getTime()+40*6e4,text:'📿 أذكار الصباح'});out.push({k:'az'+ds+'e',iid:'faith',at:T.asr.getTime()+30*6e4,text:'📿 أذكار المساء'})}
   if(FAITH.kahf&&d.getDay()===5)out.push({k:'kh'+ds,iid:'faith',at:hm('10:00',d).getTime(),text:'📖 يوم الجمعة: سورة الكهف'})}
  if(isChristian()){const c=FAITH.chr;if(c.on.am)out.push({k:'ca'+ds,iid:'faith',at:hm(c.am,d).getTime(),text:'✝️ صلاة الصبح'});if(c.on.pm)out.push({k:'cp'+ds,iid:'faith',at:hm(c.pm,d).getTime(),text:'✝️ صلاة قبل النوم'});
   if(c.on.read)out.push({k:'cr'+ds,iid:'faith',at:hm(c.read,d).getTime(),text:'📖 قراية الإنجيل'});if(c.on.mass&&d.getDay()===+c.mass)out.push({k:'cm'+ds,iid:'faith',at:hm(c.massT,d).getTime()-60*6e4,text:'⛪ القداس كمان ساعة'})}}
 return out.filter(a=>a.at>=from&&a.at<=end)});
/* adhan: the user picks a recording from their own phone, so we never ship or stream someone's recording */
let ADHAN_URL=null;const ADH=new Audio();
KV.get('adhan').then(b=>{if(b)ADHAN_URL=URL.createObjectURL(b)});
function playAdhan(){if(!ADHAN_URL)return false;try{ADH.src=ADHAN_URL;ADH.currentTime=0;ADH.play().catch(()=>{});return true}catch(e){return false}}
function stopAdhan(){try{ADH.pause()}catch(e){}}
window.playAdhan=playAdhan;window.stopAdhan=stopAdhan;
const AZ={m:[['أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير',1]],e:[['أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير',1],['أعوذ بكلمات الله التامات من شر ما خلق',3]],
 both:[['بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم',3],['رضيت بالله ربا، وبالإسلام دينا، وبمحمد صلى الله عليه وسلم نبيا',3],['حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم',7],['لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير',10],['سبحان الله وبحمده',100],['أستغفر الله وأتوب إليه',100],['اللهم صل وسلم على نبينا محمد',10]]};
function adhkarSheet(w){const L=AZ[w].concat(AZ.both);const cnt=L.map(()=>0);
 openSheet(`<h2>📿 أذكار ${w==='m'?'الصباح':'المساء'}</h2><div class="stack">${L.map(([t,n],i)=>`<button class="card zk" data-i="${i}" style="text-align:start;font-size:19px;line-height:1.9"><span>${esc(t)}</span><small class="note" id="zc${i}">اضغط للعدّ · 0 من ${n}</small></button>`).join('')}<p class="note">المصدر: حصن المسلم.</p></div>`);
 document.querySelectorAll('.zk').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,n=L[i][1];if(cnt[i]>=n)return;cnt[i]++;buzz(15);$('zc'+i).textContent=cnt[i]>=n?'✓ تمام':cnt[i]+' من '+n;if(cnt[i]>=n){b.style.opacity=.6;if(cnt.every((c,j)=>c>=L[j][1])){award(10);confetti();toast('تقبّل الله 🤍')}}})}
/* Quran: recitation and text from the public alquran.cloud API (Mishary Alafasy) */
const SURAHS=[[1,'الفاتحة'],[18,'الكهف'],[36,'يس'],[55,'الرحمن'],[56,'الواقعة'],[67,'الملك'],[78,'النبأ'],[87,'الأعلى'],[93,'الضحى'],[94,'الشرح'],[97,'القدر'],[103,'العصر'],[108,'الكوثر'],[112,'الإخلاص'],[113,'الفلق'],[114,'الناس']];
const QA=new Audio();let Q={list:[],i:0};
async function quranPlay(n){const box=$('qrBox');if(box)box.innerHTML='<p class="note">بيحمّل...</p>';
 try{const r=await fetch('https://api.alquran.cloud/v1/surah/'+n+'/ar.alafasy');const j=await r.json();const ay=(j.data&&j.data.ayahs)||[];if(!ay.length)throw 0;
  Q={list:ay,i:0,name:j.data.name};const go=()=>{const a=Q.list[Q.i];if(!a)return;const b=$('qrBox');if(b)b.innerHTML=`<div class="say" style="font-size:22px;line-height:2;font-family:'Amiri','IBM Plex Sans Arabic',serif">${esc(a.text)} ﴿${a.numberInSurah}﴾</div><div class="acts" style="display:flex;gap:8px"><button class="btn ghost" id="qrStop">وقّف</button></div>`;const s=$('qrStop');if(s)s.onclick=()=>{QA.pause();Q.list=[];$('qrBox').innerHTML=''};QA.src=a.audio;QA.play().catch(()=>{})};
  QA.onended=()=>{Q.i++;if(Q.i<Q.list.length)go();else{const b=$('qrBox');if(b)b.innerHTML='<p class="note">صدق الله العظيم</p>'}};go()}
 catch(e){if(box)box.innerHTML='<p class="note">محتاج نت عشان التلاوة. جرّب تاني.</p>'}}
const LORDS='أبانا الذي في السماوات، ليتقدس اسمك، ليأت ملكوتك، لتكن مشيئتك كما في السماء كذلك على الأرض. خبزنا كفافنا أعطنا اليوم، واغفر لنا ذنوبنا كما نغفر نحن أيضا للمذنبين إلينا، ولا تدخلنا في تجربة، لكن نجنا من الشرير. لأن لك الملك والقوة والمجد إلى الأبد. آمين.';
const PETS={dog:['🐶','كلب'],cat:['🐱','قطة'],bird:['🐦','عصفور'],fish:['🐠','سمك'],other:['🐾','تاني']};
let PETL=store.get('pets',[]);const savePets=()=>{store.set('pets',PETL);save()};

function drawInterests(b){const T=isMuslim()?prayTimes(NOW(),FAITH.city):null;let nx=null;
 if(T){const n=nowMs();nx=['fajr','dhuhr','asr','maghrib','isha'].map(p=>[p,T[p]]).find(([,d])=>d>n);if(!nx){const t2=prayTimes(new Date(n+864e5),FAITH.city);nx=['fajr',t2.fajr]}}
 const others=items.filter(i=>i.sec==='me'&&i.type==='task'&&i.repeat&&!i.done&&!i.pet);
 b.innerHTML=`<div class="card"><div class="ch"><h3>🤲 الدين</h3><small>تذكير بالصلاة وأذكار وقرآن، أو صلوات الكنيسة. اختياري تماماً.</small></div>
  <div class="seg" id="fSeg"><button data-f="m" class="${isMuslim()?'on':''}">مسلم</button><button data-f="c" class="${isChristian()?'on':''}">مسيحي</button><button data-f="" class="${FAITH.f?'':'on'}">مش دلوقتي</button></div>
  ${isMuslim()?`<label class="note">المدينة<select id="fCity">${Object.entries(CITIES).map(([k,c])=>`<option value="${k}" ${k===FAITH.city?'selected':''}>${c[0]}</option>`).join('')}</select></label>
   ${nx?`<div class="say">الصلاة الجاية: ${PNAMES[nx[0]]} ${esc(pT(nx[1]))} · بعد ${durAr((nx[1]-nowMs())/6e4)}</div>`:''}
   <div>${['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(p=>`<div class="item"><div class="tx"><b>${PNAMES[p]}</b></div><span class="num">${esc(pT(T[p]))}</span>${p==='sunrise'?'<span style="width:34px"></span>':`<label class="tog" title="تنبيه"><input type="checkbox" data-p="${p}" ${FAITH.pr[p]?'checked':''}>🔔</label>`}</div>`).join('')}</div>
   <label class="btn ghost" style="text-align:center">🔊 اختار صوت الأذان من موبايلك<input type="file" id="fAdhan" accept="audio/*" hidden></label><small class="note" id="fAdhanS">${ADHAN_URL?'✓ صوت الأذان متحفظ. هيشتغل والتطبيق مفتوح، ولو مقفول هيجيلك إشعار بصوت الموبايل.':'لو ما اخترتش صوت، التنبيه هيرن عادي.'}</small>
   <div class="acts" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="fAzM">📿 أذكار الصباح</button><button class="btn ghost" id="fAzE">📿 أذكار المساء</button></div>
   <label class="tog"><input type="checkbox" id="fAz" ${FAITH.adhkar?'checked':''}> فكّرني بالأذكار (بعد الفجر وبعد العصر)</label><label class="tog"><input type="checkbox" id="fKh" ${FAITH.kahf?'checked':''}> فكّرني بسورة الكهف يوم الجمعة</label>
   <div class="ch"><h3>📖 القرآن</h3><small>تلاوة الشيخ مشاري العفاسي (محتاج نت)</small></div><div class="feel">${SURAHS.map(([n,t])=>`<button class="chip" data-s="${n}">${t}</button>`).join('')}</div><div id="qrBox"></div>
   <p class="note">المواقيت محسوبة على الموبايل بطريقة ${CITIES[FAITH.city][3]==='eg'?'الهيئة المصرية العامة للمساحة':'الطريقة المعتمدة في البلد'}، وممكن تختلف دقيقة أو اتنين عن المسجد.</p>`:''}
  ${isChristian()?`${[['am','صلاة الصبح'],['pm','صلاة قبل النوم'],['read','قراية الإنجيل']].map(([k,t])=>`<div class="item"><div class="tx"><b>${t}</b></div><input type="time" data-ct="${k}" value="${esc(FAITH.chr[k])}" style="max-width:130px"><label class="tog"><input type="checkbox" data-co="${k}" ${FAITH.chr.on[k]?'checked':''}>🔔</label></div>`).join('')}
   <div class="item"><div class="tx"><b>القداس</b></div><select id="cMass" style="max-width:120px">${DAYS.map((d,i)=>`<option value="${i}" ${+FAITH.chr.mass===i?'selected':''}>${d}</option>`).join('')}</select><input type="time" data-ct="massT" value="${esc(FAITH.chr.massT)}" style="max-width:120px"><label class="tog"><input type="checkbox" data-co="mass" ${FAITH.chr.on.mass?'checked':''}>🔔</label></div>
   <button class="btn ghost" id="cLord">🙏 الصلاة الربانية</button>`:''}</div>
 <div class="card"><div class="ch"><h3>🐾 حيواناتي</h3><small>أكلهم وتطعيماتهم والدكتور البيطري</small></div><div id="petL">${PETL.map(p=>`<div class="wtask" data-p="${p.id}"><div class="tx"><b>${PETS[p.type][0]} ${esc(p.name)}</b><small class="note">أكل: ${esc(p.feed.join('، '))}${p.vac?' · التطعيم الجاي '+esc(fmtWhen(p.vac+'T10:00')):''}${p.vet?' · <a class="link" href="tel:'+esc(p.vet)+'">البيطري</a>':''}</small></div><button class="mini-b rm">✕</button></div>`).join('')||'<p class="note">مفيش لسه.</p>'}</div><button class="btn ghost" id="petAdd">+ ضيف حيوان</button></div>
 <div class="card"><div class="ch"><h3>✨ اهتمامات تانية</h3><small>رياضة، قراية، رسم... وأنا أفكّرك</small></div>${others.map(itemRow).join('')||'<p class="note">مفيش لسه.</p>'}
  <div class="inrow"><input id="oT" placeholder="مثلاً: رياضة"><input id="oH" type="time" value="19:00" style="max-width:120px"></div><div class="inrow"><select id="oR"><option value="daily">كل يوم</option><option value="weekly">كل أسبوع</option></select><button class="btn" id="oGo">ضيف</button></div></div>`;
 b.querySelectorAll('#fSeg button').forEach(x=>x.onclick=()=>{FAITH.f=x.dataset.f;saveFaith();drawAll()});
 const cs=$('fCity');if(cs)cs.onchange=()=>{FAITH.city=cs.value;saveFaith();drawAll()};
 b.querySelectorAll('[data-p]').forEach(x=>{if(x.type==='checkbox')x.onchange=()=>{FAITH.pr[x.dataset.p]=x.checked?1:0;saveFaith()}});
 const fa=$('fAdhan');if(fa)fa.onchange=async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;if(f.size>15e6){toast('الملف كبير، اختار ملف أصغر من 15 ميجا');return}await KV.set('adhan',f);ADHAN_URL=URL.createObjectURL(f);playAdhan();setTimeout(stopAdhan,6000);toast('اتحفظ صوت الأذان ✓');drawAll()};
 if($('fAzM')){$('fAzM').onclick=()=>adhkarSheet('m');$('fAzE').onclick=()=>adhkarSheet('e');$('fAz').onchange=e=>{FAITH.adhkar=e.target.checked?1:0;saveFaith()};$('fKh').onchange=e=>{FAITH.kahf=e.target.checked?1:0;saveFaith()};
  b.querySelectorAll('[data-s]').forEach(x=>x.onclick=()=>quranPlay(+x.dataset.s))}
 b.querySelectorAll('[data-ct]').forEach(x=>x.onchange=()=>{FAITH.chr[x.dataset.ct]=x.value;saveFaith()});b.querySelectorAll('[data-co]').forEach(x=>x.onchange=()=>{FAITH.chr.on[x.dataset.co]=x.checked?1:0;saveFaith()});
 if($('cMass'))$('cMass').onchange=e=>{FAITH.chr.mass=+e.target.value;saveFaith()};if($('cLord'))$('cLord').onclick=()=>openSheet('<h2>🙏 الصلاة الربانية</h2><div class="say" style="font-size:20px;line-height:2">'+esc(LORDS)+'</div>');
 b.querySelectorAll('#petL [data-p]').forEach(r=>r.querySelector('.rm').onclick=()=>{const p=PETL.find(x=>x.id===r.dataset.p);items=items.filter(i=>i.pet!==p.id||i.done);PETL=PETL.filter(x=>x!==p);savePets();drawAll()});
 $('petAdd').onclick=petForm;
 $('oGo').onclick=()=>{const t=$('oT').value.trim();if(!t)return;const d=hm($('oH').value||'19:00',NOW());if(d<NOW())d.setDate(d.getDate()+1);addItem({type:'task',sec:'me',title:t,due:toLocal(d),repeat:$('oR').value});toast('هفكّرك بـ '+t);drawAll()};
 bindRows(b)}
function petForm(){openSheet(`<h2>حيوان جديد</h2><div class="form"><label>اسمه<input id="pN"></label><label>نوعه<select id="pT">${Object.entries(PETS).map(([k,v])=>`<option value="${k}">${v[0]} ${v[1]}</option>`).join('')}</select></label>
 <label>مواعيد الأكل (مفصولة بفاصلة)<input id="pF" value="08:00, 20:00"></label><label>التطعيم الجاي (اختياري)<input id="pV" type="date"></label><label>تليفون الدكتور البيطري (اختياري)<input id="pVt" type="tel"></label>
 <label class="tog"><input type="checkbox" id="pW"> تمشية كل يوم (للكلاب)</label><button class="btn" id="pGo">احفظ</button></div>`);
 $('pT').onchange=()=>{$('pW').checked=$('pT').value==='dog'};
 $('pGo').onclick=()=>{const name=$('pN').value.trim();if(!name)return;const type=$('pT').value;const feed=$('pF').value.split(/[,،]/).map(s=>s.trim()).filter(s=>/^\d{1,2}:\d{2}$/.test(s)).slice(0,4);
  const p={id:uid(),name,type,feed,vac:$('pV').value,vet:$('pVt').value.trim()};PETL.push(p);
  const mk=(t,h)=>{const d=hm(h,NOW());if(d<NOW())d.setDate(d.getDate()+1);const it=addItem({type:'task',sec:'me',title:t,due:toLocal(d),repeat:'daily'});it.pet=p.id};
  feed.forEach(h=>mk('أأكّل '+name+' '+PETS[type][0],h));if($('pW').checked)mk('أمشّي '+name+' 🐶','18:00');
  if(p.vac){const it=addItem({type:'appt',sec:'me',title:'تطعيم '+name,due:p.vac+'T10:00'});it.pet=p.id}
  savePets();save();closeSheet();toast('هفكّرك بأكل '+name+(p.vac?' وتطعيمه':''));LIFE_SUB='me';show('all');setSeg('life')}}
$('qMe').onclick=()=>{LIFE_SUB='';show('all');setSeg('life')};
/* links opened while the app is already open only change the hash: reload so they are handled */
window.addEventListener('hashchange',()=>{if(/^#(hw|kidsetup|add|home)=/.test(location.hash))location.reload()});
