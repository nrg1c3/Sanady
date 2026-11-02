/* ================= Sanady daily life: habits, occasions, subscriptions, car, gam'iya, debts, health
   + tools that exist only in Sanady ADHD (dopamine menu, med focus window, leave-the-house check) ================= */
'use strict';
let LIFE=store.get('life',{});
['habits','occ','gam','debts'].forEach(k=>{if(!Array.isArray(LIFE[k]))LIFE[k]=[]});LIFE.car=LIFE.car||{};LIFE.water=LIFE.water||{};
const saveLife=()=>{store.set('life',LIFE);save()};
let LIFE_SUB='';
const md=d=>pad(d.getMonth()+1)+'-'+pad(d.getDate());
const ymKey=d=>dayKey(d).slice(0,7);
const back=()=>`<button class="link" id="lfBack" style="align-self:flex-start">‹ حياتي</button>`;
const SECTIONS=[['me','🌿','اهتماماتي','دين، حيوانات، هوايات'],['habits','✅','عاداتي','حاجة صغيرة كل يوم'],['occ','🎂','المناسبات','أعياد ميلاد وذكريات'],['subs','🔁','الاشتراكات','بتدفع كام كل شهر'],['car','🚗','العربية','زيت، رخصة، تأمين'],['gam','🤝','الجمعية','قسطك ودورك'],['debts','💸','لي وعليا','السلف والفلوس اللي برة'],['health','💧','صحتي','مية ونوم ودكاترة']].concat(IS_ADHD?[]:[['parents','👵','بابا وماما','مكالمة كل يوم ودواهم']]);
function drawLife(b){if(SEG==='me')LIFE_SUB='me';const s=LIFE_SUB;
 if(!s){b.innerHTML=`<div class="card"><div class="ch"><h3>حياتي</h3><small>أقسام صغيرة لحاجات كل يوم. استخدم اللي يفيدك بس.</small></div></div><div class="blocks">${SECTIONS.map(([k,i,t,d])=>`<button class="blk" data-l="${k}"><i>${i}</i><b>${t}</b><small>${esc(lifeHint(k)||d)}</small></button>`).join('')}</div>`;
  b.querySelectorAll('[data-l]').forEach(x=>x.onclick=()=>{LIFE_SUB=x.dataset.l;drawAll();window.scrollTo(0,0)});return}
 if(s==='me'){drawInterests(b);b.insertAdjacentHTML('afterbegin',back())}
 else({habits:drawHabits,occ:drawOcc,subs:drawSubs,car:drawCar,gam:drawGam,debts:drawDebts,health:drawHealth,parents:b=>drawParents(b)})[s](b);
 const bk=$('lfBack');if(bk)bk.onclick=()=>{LIFE_SUB='';if(SEG==='me')SEG='life';drawAll()}}
function lifeHint(k){const n=NOW();
 if(k==='habits'&&LIFE.habits.length){const d=LIFE.habits.filter(h=>h.days&&h.days[dayKey()]).length;return d+' من '+LIFE.habits.length+' النهارده'}
 if(k==='occ'){const u=upcomingOcc()[0];if(u)return u.o.t+' '+(u.days===0?'النهارده':'بعد '+nDays(u.days))}
 if(k==='subs'){const t=subsTotal();if(t)return money(t)+' جنيه في الشهر'}
 if(k==='gam'&&LIFE.gam.length){const g=LIFE.gam[0];const left=gamTurnIn(g);return left===0?'الشهر ده دورك 🎉':left>0?'دورك بعد '+left+' شهور':''}
 if(k==='debts'){const a=debtSum('them'),b2=debtSum('me');if(a||b2)return (a?'ليك '+money(a):'')+(a&&b2?' · ':'')+(b2?'عليك '+money(b2):'')}
 if(k==='health'){const w=LIFE.water[dayKey()]||0;return w+' كوبايات مية النهارده'}
 return''}

/* habits */
function streak(h){let n=0;const d=NOW();if(!h.days[dayKey(d)])d.setDate(d.getDate()-1);while(h.days[dayKey(d)]){n++;d.setDate(d.getDate()-1)}return n}
function drawHabits(b){b.innerHTML=back()+`<div class="card"><div class="ch"><h3>✅ عاداتي</h3><small>حاجة صغيرة كل يوم أحسن من حاجة كبيرة مرة. لو فوّت يوم عادي، كمّل.</small></div>
 ${LIFE.habits.map(h=>{const on=!!h.days[dayKey()];const w=[...Array(7)].map((_,i)=>{const d=NOW();d.setDate(d.getDate()-6+i);return h.days[dayKey(d)]?'🟩':'⬜'}).join('');return`<div class="wtask" data-h="${h.id}"><div class="tx"><b>${esc(h.t)}</b><small class="note">${w} ${streak(h)?'· 🔥 '+streak(h)+' يوم ورا بعض':''}${h.at?' · '+esc(h.at):''}</small></div><button class="ck ${on?'on':''}" aria-label="عملتها النهارده">${on?'✓':''}</button><button class="mini-b rm">✕</button></div>`}).join('')||'<p class="note">مفيش عادات لسه.</p>'}
 <div class="feel">${['أشرب 8 كوبايات مية','أقرا 10 صفحات','أتمشى 20 دقيقة','أنام قبل 12','أكلم حد بحبه'].filter(t=>!LIFE.habits.some(h=>h.t===t)).map(t=>`<button class="chip" data-q="${t}">+ ${t}</button>`).join('')}</div>
 <div class="inrow"><input id="hbT" placeholder="عادة جديدة"><input id="hbA" type="time" style="max-width:120px" aria-label="تذكير (اختياري)"><button class="btn" id="hbGo">ضيف</button></div></div>`;
 b.querySelectorAll('[data-h]').forEach(r=>{const h=LIFE.habits.find(x=>x.id===r.dataset.h);r.querySelector('.ck').onclick=()=>{const k=dayKey();if(h.days[k])delete h.days[k];else{h.days[k]=1;award(3);buzz(20);const s2=streak(h);if(s2&&s2%7===0){confetti();toast('🔥 '+s2+' يوم ورا بعض! '+cheer())}}saveLife();drawAll()};r.querySelector('.rm').onclick=()=>{LIFE.habits=LIFE.habits.filter(x=>x!==h);saveLife();drawAll()}});
 const add=t=>{if(!t)return;LIFE.habits.push({id:uid(),t,at:$('hbA').value||'',days:{}});saveLife();drawAll()};
 b.querySelectorAll('[data-q]').forEach(x=>x.onclick=()=>add(x.dataset.q));$('hbGo').onclick=()=>add($('hbT').value.trim())}

/* occasions */
function upcomingOcc(){const n=NOW();n.setHours(0,0,0,0);return LIFE.occ.map(o=>{const [m,d]=o.d.split('-').map(Number);let x=new Date(n.getFullYear(),m-1,d);if(x<n)x=new Date(n.getFullYear()+1,m-1,d);return{o,x,days:Math.round((x-n)/864e5)}}).sort((a,b)=>a.days-b.days)}
const OCCK={bday:['🎂','عيد ميلاد'],anniv:['💍','ذكرى جواز'],other:['📅','مناسبة']};
function occWish(o){return o.k==='bday'?'كل سنة وإنت طيب يا '+o.who+' 🎉 ربنا يسعدك وتفضل منوّر حياتنا.':o.k==='anniv'?'كل سنة وإحنا مع بعض ❤️':'كل سنة وإنتو طيبين 🎉'}
function drawOcc(b){const U=upcomingOcc();b.innerHTML=back()+`<div class="card"><div class="ch"><h3>🎂 المناسبات</h3><small>هفكّرك قبلها بـ 3 أيام عشان الهدية، ويوم المناسبة عشان التهنئة.</small></div>
 ${U.map(({o,days})=>`<div class="wtask" data-o="${o.id}"><div class="tx"><b>${OCCK[o.k][0]} ${esc(o.t)}</b><small class="note">${days===0?'النهارده!':'بعد '+nDays(days)}${o.gift?' · فكرة هدية: '+esc(o.gift):''}</small></div>${days<=3?'<button class="btn ghost" style="min-height:44px;padding:0 12px" data-w="1">تهنئة</button>':''}<button class="mini-b rm">✕</button></div>`).join('')||'<p class="note">مفيش مناسبات لسه.</p>'}
 <div class="form"><div class="inrow"><select id="ocK" style="max-width:150px"><option value="bday">عيد ميلاد</option><option value="anniv">ذكرى جواز</option><option value="other">مناسبة تانية</option></select><input id="ocW" placeholder="مين؟ (ماما، سارة...)"></div>
 <div class="inrow"><input id="ocD" type="date"><input id="ocG" placeholder="فكرة هدية (اختياري)"></div><button class="btn" id="ocGo">ضيف</button></div></div>`;
 b.querySelectorAll('[data-o]').forEach(r=>{const o=LIFE.occ.find(x=>x.id===r.dataset.o);r.querySelector('.rm').onclick=()=>{LIFE.occ=LIFE.occ.filter(x=>x!==o);saveLife();drawAll()};const w=r.querySelector('[data-w]');if(w)w.onclick=()=>openSheet('<h2>تهنئة</h2>'+draftBox(occWish(o)))});
 $('ocGo').onclick=()=>{const k=$('ocK').value,who=$('ocW').value.trim(),dv=$('ocD').value;if(!who||!dv){toast('اكتب مين والتاريخ');return}LIFE.occ.push({id:uid(),k,who,t:OCCK[k][1]+' '+who,d:dv.slice(5),gift:$('ocG').value.trim()});saveLife();toast('هفكّرك قبلها');drawAll()}}

/* subscriptions (stored as repeating bills, so they also remind before payment) */
const subs=()=>items.filter(i=>i.sub&&!i.done);
const subsTotal=()=>subs().reduce((s,i)=>s+(i.repeat==='yearly'?(i.amount||0)/12:(i.amount||0)),0);
function drawSubs(b){const L=subs();b.innerHTML=back()+`<div class="card"><div class="ch"><h3>🔁 الاشتراكات</h3><small>نت، موبايل، جيم، نتفليكس... بتدفع كام من غير ما تاخد بالك.</small></div>
 ${L.length?`<div class="say">بتدفع حوالي ${money(subsTotal())} جنيه في الشهر، يعني ${money(subsTotal()*12)} في السنة.</div>`:''}
 ${L.map(i=>`<div class="wtask" data-s="${i.id}"><div class="tx"><b>${esc(i.title)}</b><small class="note">${money(i.amount)} ج ${i.repeat==='yearly'?'في السنة':'في الشهر'} · الدفع ${esc(fmtWhen(i.due))}${i.usedAt&&daysAgo(i.usedAt)<60?'':' · لسه بتستخدمه؟'}</small></div><button class="btn ghost" style="min-height:44px;padding:0 10px" data-u="1">بستخدمه</button><button class="mini-b rm">✕</button></div>`).join('')||'<p class="note">مفيش اشتراكات متسجلة.</p>'}
 <div class="form"><div class="inrow"><input id="sbN" placeholder="الاشتراك"><input id="sbA" type="number" inputmode="numeric" placeholder="المبلغ" style="max-width:110px"></div>
 <div class="inrow"><input id="sbD" type="date" aria-label="ميعاد الدفع الجاي"><select id="sbR" style="max-width:130px"><option value="monthly">كل شهر</option><option value="yearly">كل سنة</option></select></div><button class="btn" id="sbGo">ضيف</button>
 <p class="note">لو فيه اشتراك مش بتستخدمه من شهرين، هقولك عليه عشان تلغيه.</p></div></div>`;
 b.querySelectorAll('[data-s]').forEach(r=>{const it=byId(r.dataset.s);r.querySelector('.rm').onclick=()=>{removeItem(it.id);drawAll()};r.querySelector('[data-u]').onclick=()=>{it.usedAt=nowMs();save();toast('تمام 👍');drawAll()}});
 $('sbGo').onclick=()=>{const t=$('sbN').value.trim(),a=+$('sbA').value||0,d=$('sbD').value;if(!t||!d){toast('اكتب الاسم وميعاد الدفع');return}const it=addItem({type:'bill',sec:'money',title:t,amount:a,due:d+'T10:00',repeat:$('sbR').value});it.sub=1;it.usedAt=nowMs();save();drawAll()}}

/* car */
function oilState(){const c=LIFE.car;if(!c.lastOil)return null;const months=(nowMs()-new Date(c.lastOil).getTime())/(30*864e5);const kmLeft=c.km&&c.lastOilKm?(c.oilEvery||5000)-(c.km-c.lastOilKm):null;return{months,kmLeft,due:months>=(c.oilMonths||6)||(kmLeft!=null&&kmLeft<=300)}}
function drawCar(b){const c=LIFE.car,o=oilState();b.innerHTML=back()+`<div class="card"><div class="ch"><h3>🚗 العربية</h3><small>الزيت والرخصة والتأمين، من غير ما تفتكر.</small></div>
 ${o?`<div class="say">${o.due?'⚠️ جه وقت تغيير الزيت':'الزيت تمام'}${o.kmLeft!=null?' · فاضل '+money(Math.max(0,o.kmLeft))+' كم':''} · آخر تغيير من ${nDays(Math.max(1,Math.round(o.months*30)))}</div>`:''}
 <div class="form"><label>العداد دلوقتي (كم)<input id="crK" type="number" inputmode="numeric" value="${c.km||''}"></label>
 <label>بتغيّر الزيت كل كام كيلو؟<input id="crE" type="number" inputmode="numeric" value="${c.oilEvery||5000}"></label>
 <button class="btn ghost" id="crOil">🛢️ غيّرت الزيت النهارده</button>
 <label>الرخصة بتخلص<input id="crL" type="date" value="${esc(docs['رخصة العربية']||'')}"></label><label>التأمين بيخلص<input id="crI" type="date" value="${esc(docs['تأمين العربية']||'')}"></label>
 <button class="btn" id="crSave">احفظ</button><p class="note">هفكّرك تجدد الرخصة والتأمين قبلهم بشهر.</p></div></div>`;
 $('crOil').onclick=()=>{c.km=+$('crK').value||c.km||0;c.lastOil=dayKey();c.lastOilKm=c.km;saveLife();award(5);toast('تمام، هفكّرك بالتغيير الجاي');drawAll()};
 $('crSave').onclick=()=>{c.km=+$('crK').value||c.km;c.oilEvery=+$('crE').value||5000;const l=$('crL').value,i=$('crI').value;if(l)docRenew('رخصة العربية',l);if(i)docRenew('تأمين العربية',i);saveLife();toast('اتحفظ');drawAll()}}

/* gam'iya: the Egyptian rotating savings circle */
function gamMonthIdx(g){const [y,m]=g.start.split('-').map(Number);const n=NOW();return (n.getFullYear()-y)*12+(n.getMonth()+1-m)}
const gamTurnIn=g=>g.turn-1-gamMonthIdx(g);
function drawGam(b){b.innerHTML=back()+`<div class="card"><div class="ch"><h3>🤝 الجمعية</h3><small>قسطك كل شهر ودورك إمتى.</small></div>
 ${LIFE.gam.map(g=>{const i=gamMonthIdx(g),left=gamTurnIn(g),paid=!!(g.paid||{})[ymKey(NOW())],over=i>=g.n;return`<div class="card" style="padding:14px;background:var(--bg)" data-g="${g.id}"><b>${esc(g.name)}</b><small class="note">${money(g.amount)} ج كل شهر يوم ${g.day} · ${g.n} شهور · هتقبض ${money(g.amount*g.n)}</small>
  <div class="say">${over?'الجمعية خلصت 👏':left===0?'🎉 الشهر ده دورك تقبض':left>0?'دورك بعد '+left+' '+(left===1?'شهر':'شهور'):'قبضت دورك، فاضل '+(g.n-1-i)+' أقساط'}</div>
  ${over?'':`<div class="acts" style="display:flex;gap:8px;flex-wrap:wrap">${paid?'<span class="dur">✓ دفعت الشهر ده</span>':'<button class="btn" data-a="pay">دفعت قسط الشهر</button>'}${left===0&&!g.got?'<button class="btn ghost" data-a="got">قبضت</button>':''}<button class="mini-b" data-a="rm">✕</button></div>`}</div>`}).join('')||'<p class="note">مفيش جمعيات.</p>'}
 <div class="form"><input id="gmN" placeholder="اسمها (جمعية الشغل)"><div class="inrow"><input id="gmA" type="number" inputmode="numeric" placeholder="القسط"><input id="gmC" type="number" inputmode="numeric" placeholder="كام شهر"></div>
 <div class="inrow"><input id="gmT" type="number" inputmode="numeric" placeholder="دورك رقم كام"><input id="gmD" type="number" inputmode="numeric" placeholder="يوم الدفع" min="1" max="28"></div><label>أول شهر<input id="gmS" type="month"></label><button class="btn" id="gmGo">ضيف</button></div></div>`;
 b.querySelectorAll('[data-g]').forEach(r=>{const g=LIFE.gam.find(x=>x.id===r.dataset.g);r.querySelectorAll('[data-a]').forEach(x=>x.onclick=()=>{const a=x.dataset.a;
  if(a==='pay'){g.paid=g.paid||{};g.paid[ymKey(NOW())]=1;M.bal=(M.bal||0)-g.amount;M.spends.push({a:g.amount,note:'قسط '+g.name,d:nowMs()});award(5);toast('سجلت القسط')}
  else if(a==='got'){g.got=1;M.bal=(M.bal||0)+g.amount*g.n;confetti();toast('مبروك! ضفت '+money(g.amount*g.n)+' لرصيدك')}else LIFE.gam=LIFE.gam.filter(y=>y!==g);saveLife();drawAll()})});
 $('gmGo').onclick=()=>{const g={id:uid(),name:$('gmN').value.trim()||'الجمعية',amount:+$('gmA').value||0,n:+$('gmC').value||0,turn:+$('gmT').value||0,day:Math.min(28,Math.max(1,+$('gmD').value||1)),start:$('gmS').value||ymKey(NOW()),paid:{}};
  if(!g.amount||!g.n||!g.turn||g.turn>g.n){toast('اكتب القسط وعدد الشهور ودورك');return}LIFE.gam.push(g);saveLife();drawAll()}}

/* money lent and borrowed */
const debtSum=dir=>LIFE.debts.filter(d=>!d.done&&d.dir===dir).reduce((s,d)=>s+d.amount,0);
function drawDebts(b){const open=LIFE.debts.filter(d=>!d.done);b.innerHTML=back()+`<div class="card"><div class="ch"><h3>💸 لي وعليا</h3><small>الفلوس اللي سلفتها أو استلفتها، عشان محدش ينسى ومن غير إحراج.</small></div>
 <div class="row2"><div class="card mini"><small>ليك عند الناس</small><b class="num">${money(debtSum('them'))}</b></div><div class="card mini"><small>عليك للناس</small><b class="num">${money(debtSum('me'))}</b></div></div>
 ${open.map(d=>`<div class="wtask" data-d="${d.id}"><div class="tx"><b>${d.dir==='them'?'⬅️ '+esc(d.who)+' عليه':'➡️ عليك لـ '+esc(d.who)} ${money(d.amount)} ج</b><small class="note">${esc(d.note||'')}${d.due?' · '+esc(fmtWhen(d.due+'T10:00')):''}</small></div>${d.dir==='them'?'<button class="btn ghost" style="min-height:44px;padding:0 10px" data-a="ask">فكّره</button>':''}<button class="btn ghost" style="min-height:44px;padding:0 10px" data-a="ok">اتسددت</button></div>`).join('')||'<p class="note">مفيش حاجة.</p>'}
 <div class="form"><select id="dbD"><option value="them">سلّفت حد</option><option value="me">استلفت من حد</option></select><div class="inrow"><input id="dbW" placeholder="مين؟"><input id="dbA" type="number" inputmode="numeric" placeholder="المبلغ" style="max-width:110px"></div>
 <div class="inrow"><input id="dbN" placeholder="في إيه؟ (اختياري)"><input id="dbT" type="date" aria-label="هيترد امتى" style="max-width:160px"></div><button class="btn" id="dbGo">سجّل</button></div></div>`;
 b.querySelectorAll('[data-d]').forEach(r=>{const d=LIFE.debts.find(x=>x.id===r.dataset.d);r.querySelectorAll('[data-a]').forEach(x=>x.onclick=()=>{
  if(x.dataset.a==='ask'){openSheet('<h2>رسالة لطيفة</h2>'+draftBox('إزيك يا '+d.who+' 🙏 لو ينفع الـ '+money(d.amount)+' جنيه'+(d.note?' بتوع '+d.note:'')+' الأيام دي يبقى كتر خيرك، ولو مش متاح دلوقتي عادي قولي إمتى يناسبك.'));return}
  d.done=nowMs();if(d.dir==='me'){M.bal=(M.bal||0)-d.amount;M.spends.push({a:d.amount,note:'سداد '+d.who,d:nowMs()})}else M.bal=(M.bal||0)+d.amount;award(5);saveLife();toast(d.dir==='me'?'سددت، عاش 👏':'رجعتلك فلوسك 👍');drawAll()})});
 $('dbGo').onclick=()=>{const who=$('dbW').value.trim(),a=+$('dbA').value||0;if(!who||!a){toast('اكتب الاسم والمبلغ');return}LIFE.debts.push({id:uid(),dir:$('dbD').value,who,amount:a,note:$('dbN').value.trim(),due:$('dbT').value,at:nowMs()});saveLife();drawAll()}}

/* health: water, sleep from the night review, doctor visits */
function drawHealth(b){const w=LIFE.water[dayKey()]||0;const nights=diary.filter(e=>e.night&&e.sleep).slice(-7);const appts=items.filter(i=>!i.done&&i.type==='appt'&&i.sec==='health').sort((a,c)=>(a.due||'').localeCompare(c.due||''));
 b.innerHTML=back()+`<div class="card"><div class="ch"><h3>💧 المية النهارده</h3><small>الهدف 8 كوبايات</small></div><div style="font-size:30px;letter-spacing:2px">${'💧'.repeat(Math.min(w,8))}${'▫️'.repeat(Math.max(0,8-w))}</div><div class="acts" style="display:flex;gap:8px"><button class="btn" id="hwP">+ كوباية</button>${w?'<button class="btn ghost" id="hwM">−</button>':''}</div></div>
 <div class="card"><div class="ch"><h3>😴 النوم</h3><small>من ملخص اليوم بالليل</small></div>${nights.length?'<p>آخر '+nights.length+' ليالي: '+nights.map(n=>esc(n.sleep)).join(' · ')+' ساعات</p>':'<p class="note">لما تعمل «ملخص اليوم» بالليل، نومك بيتسجل هنا.</p>'}</div>
 <div class="card"><div class="ch"><h3>🩺 مواعيد الدكاترة</h3></div>${appts.map(itemRow).join('')||'<p class="note">مفيش مواعيد.</p>'}<button class="btn ghost" id="hwAp">+ ميعاد دكتور</button></div>`;
 $('hwP').onclick=()=>{LIFE.water[dayKey()]=w+1;const ks=Object.keys(LIFE.water).sort().slice(-30);LIFE.water=Object.fromEntries(ks.map(k=>[k,LIFE.water[k]]));store.set('bodyAt',nowMs());award(1);if(w+1===8){confetti();toast('8 كوبايات! جسمك شاكرك 💧')}saveLife();drawAll()};
 const m=$('hwM');if(m)m.onclick=()=>{LIFE.water[dayKey()]=Math.max(0,w-1);saveLife();drawAll()};$('hwAp').onclick=()=>editItem(null,{type:'appt',sec:'health'});bindRows(b)}

/* reminders and nudges from these sections */
ALARM_EXTRA.push((from,end)=>{const out=[];const d0=new Date(from);d0.setHours(0,0,0,0);
 for(let i=0;i<15;i++){const d=new Date(d0);d.setDate(d.getDate()+i);const ds=dayKey(d).replace(/-/g,'');
  LIFE.habits.forEach(h=>{if(h.at&&!(i===0&&h.days[dayKey()]))out.push({k:'hb'+h.id+ds,iid:'life',at:hm(h.at,d).getTime(),text:'✅ '+h.t})});
  LIFE.occ.forEach(o=>{const t=new Date(d);t.setDate(t.getDate()+3);if(md(t)===o.d)out.push({k:'oc3'+o.id+ds,iid:'life',at:hm('10:00',d).getTime(),text:'🎁 '+o.t+' بعد 3 أيام'+(o.gift?'، فكرة الهدية: '+o.gift:'')});if(md(d)===o.d)out.push({k:'oc0'+o.id+ds,iid:'life',at:hm('09:00',d).getTime(),text:'🎂 النهارده '+o.t+'. ابعتله تهنئة'})});
  LIFE.gam.forEach(g=>{if(d.getDate()===g.day&&gamMonthIdx(g)>=0&&gamMonthIdx(g)<g.n&&!(g.paid||{})[ymKey(d)])out.push({k:'gm'+g.id+ds,iid:'life',at:hm('10:00',d).getTime(),text:'🤝 قسط '+g.name+' '+money(g.amount)+' جنيه'})})}
 return out.filter(a=>a.at>=from&&a.at<=end)});
NUDGE_EXTRA.push((t,hard)=>{const out=[];if(hard)return out;
 upcomingOcc().filter(u=>u.days===0).forEach(({o})=>out.push({id:'oc'+o.id+dayKey(),pr:52,i:'🎂',p:'النهارده '+o.t+'. نبعتله تهنئة؟',acts:[['اكتبلي التهنئة',()=>openSheet('<h2>تهنئة</h2>'+draftBox(occWish(o)))],['بعتها ✓',()=>{nsn['oc'+o.id+dayKey()]=t+864e5;save();render()}]]}));
 const o=oilState();if(o&&o.due)out.push({id:'oil'+ymKey(NOW()),pr:26,i:'🛢️',p:'جه وقت تغيير زيت العربية'+(o.kmLeft!=null?' (فاضل '+money(Math.max(0,o.kmLeft))+' كم)':'')+'.',acts:[['غيرته ✓',()=>{LIFE.car.lastOil=dayKey();LIFE.car.lastOilKm=LIFE.car.km||0;saveLife();render()}],['بعدين',()=>{nsn['oil'+ymKey(NOW())]=t+7*864e5;save();render()}]]});
 LIFE.debts.filter(d=>!d.done&&d.due&&new Date(d.due+'T10:00')<=t+864e5).forEach(d=>out.push({id:'db'+d.id,pr:40,i:'💸',p:d.dir==='me'?'ميعاد ترجع '+money(d.amount)+' لـ '+d.who+'.':d.who+' كان هيرجعلك '+money(d.amount)+'. نفكّره بلطف؟',acts:[[d.dir==='me'?'رجعتها ✓':'رجعهالي ✓',()=>{d.done=nowMs();M.bal=(M.bal||0)+(d.dir==='me'?-d.amount:d.amount);saveLife();render()}],['بعدين',()=>{nsn['db'+d.id]=t+3*864e5;save();render()}]]}));
 subs().filter(i=>(i.usedAt||i.created)&&daysAgo(i.usedAt||i.created)>60).slice(0,1).forEach(i=>out.push({id:'su'+i.id,pr:20,i:'🔁',p:'لسه بتستخدم '+i.title+'؟ لو لأ، الغيه ووفر '+money(i.repeat==='yearly'?i.amount:i.amount*12)+' جنيه في السنة.',acts:[['بستخدمه',()=>{i.usedAt=nowMs();save();render()}],['هلغيه',()=>{removeItem(i.id);toast('وفرت '+money(i.repeat==='yearly'?i.amount:i.amount*12)+' في السنة 👏')}]]}));
 return out});

/* ================= ADHD-only tools ================= */
if(IS_ADHD){
 /* dopamine menu: small rewards picked after finishing something, or when bored */
 const DOPA0=['أغنية بحبها 🎵','قهوة أو شاي ☕','5 دقايق موبايل 📱','حتة شوكولاتة 🍫','أطلع البلكونة دقيقتين 🌤️','أرقص على أغنية 💃'];
 window.dopa=()=>store.get('dopa',DOPA0);
 window.dopaSheet=()=>{const L=dopa();const pick=L[Math.floor(Math.random()*L.length)];
  openSheet(`<h2>🎁 قايمة المكافآت</h2><div class="stack"><div class="say" style="font-size:24px;text-align:center">${esc(pick||'ضيف مكافآت تحت')}</div><button class="btn ghost" id="dpAgain">🎲 غيرها</button>
  <p class="note">حاجات صغيرة بتحبها، تاخدها بعد ما تخلص حاجة. الدماغ بيتعلم إن الشغل وراه حاجة حلوة.</p>${L.map((x,i)=>`<div class="item"><div class="tx"><b>${esc(x)}</b></div><button class="mini-b" data-i="${i}">✕</button></div>`).join('')}
  <div class="inrow"><input id="dpN" placeholder="مكافأة جديدة"><button class="btn" id="dpGo">ضيف</button></div></div>`);
  $('dpAgain').onclick=dopaSheet;document.querySelectorAll('#sheetBody [data-i]').forEach(b=>b.onclick=()=>{const l=dopa();l.splice(+b.dataset.i,1);store.set('dopa',l);dopaSheet()});$('dpGo').onclick=()=>{const v=$('dpN').value.trim();if(!v)return;store.set('dopa',dopa().concat(v));dopaSheet()}};
 window.afterFinish=(it,silent)=>{if(silent||!it||!(it.big||it.star))return;const L=dopa();if(!L.length)return;setTimeout(()=>toast('🎁 تستاهل: '+L[Math.floor(Math.random()*L.length)],4500),2700)};
 /* focus window from the user's own medicine time (no doses, no medical advice) */
 window.medWin=()=>{const m=store.get('medwin',null);if(!m||!m.at)return null;const n=NOW();let best=null;for(const dd of[0,-1]){const d=new Date(n);d.setDate(d.getDate()+dd);const s=hm(m.at,d);s.setTime(s.getTime()+(m.start||1)*36e5);const e=new Date(s.getTime()+(m.len||6)*36e5);const w={s,e,on:n>=s&&n<e};if(w.on)return w;if(!best)best=w}return best}; // a dose late at night still counts after midnight
 window.medBoost=i=>{const w=medWin();return w&&w.on&&i.big?15:0};
 window.medSheet=()=>{const m=store.get('medwin',{at:'',start:1,len:6});
  openSheet(`<h2>💊 شباك التركيز</h2><div class="form"><p>لو بتاخد دوا تركيز، قولّي ميعاده والمفعول بيبدأ وبيستمر قد إيه حسب كلام دكتورك. هطلعلك الحاجات الصعبة في الوقت ده.</p>
  <label>بتاخده الساعة كام؟<input id="mwA" type="time" value="${esc(m.at||'')}"></label><label>المفعول بيبدأ بعد كام ساعة؟<input id="mwS" type="number" step="0.5" inputmode="decimal" value="${m.start}"></label><label>بيستمر كام ساعة؟<input id="mwL" type="number" step="0.5" inputmode="decimal" value="${m.len}"></label>
  <div class="acts"><button class="btn" id="mwGo">احفظ</button>${m.at?'<button class="btn ghost" id="mwOff">مش باخد دوا</button>':''}</div><p class="note">سندي مش بيقول جرعات ولا بيغيّر علاجك. ده بس بيرتب يومك على الميعاد اللي إنت كاتبه.</p></div>`);
  $('mwGo').onclick=()=>{const a=$('mwA').value;if(!a){toast('اكتب الميعاد');return}store.set('medwin',{at:a,start:Math.max(0,+$('mwS').value||1),len:Math.max(1,+$('mwL').value||6)});closeSheet();toast('تمام، هطلعلك الحاجات الكبيرة جوه الشباك ده')};const o=$('mwOff');if(o)o.onclick=()=>{store.set('medwin',null);closeSheet()}};
 /* leave-the-house check: tap each thing before you go out */
 window.doorSheet=()=>{const L=(store.get('door',null)||((prof.prep||'المفاتيح، البطاقة، الشاحن').split(/[،,]/).map(s=>s.trim()).filter(Boolean).concat(['الموبايل','المحفظة']))).filter((x,i,a)=>a.indexOf(x)===i);const got=[];
  const draw=()=>{$('sheetBody').innerHTML=`<h2>✅ قبل ما تنزل</h2><div class="stack"><p class="note">دوس على كل حاجة وهي في إيدك.</p><div class="feel">${L.map((x,i)=>`<button class="chip ${got.includes(i)?'on':''}" data-i="${i}" style="font-size:18px;padding:12px 16px">${got.includes(i)?'✓ ':''}${esc(x)}</button>`).join('')}</div>
   ${got.length===L.length?'<div class="say">كله معاك. يلا اتحرك 🚶 والنور والغاز؟</div>':''}<div class="inrow"><input id="drN" placeholder="حاجة تانية بتنساها"><button class="btn ghost" id="drGo">ضيف</button></div></div>`;
   document.querySelectorAll('#sheetBody [data-i]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(!got.includes(i)){got.push(i);buzz(15)}if(got.length===L.length){award(3);speak('كله معاك. يلا اتحرك.')}draw()});
   $('drGo').onclick=()=>{const v=$('drN').value.trim();if(!v)return;L.push(v);store.set('door',L);draw()}};openSheet('');draw()};
 /* shortcuts on the One-thing screen */
 const q=document.querySelector('#nowOne .quick');if(q){q.insertAdjacentHTML('afterbegin','<button class="chip" id="qDopa">🎁 زهقان؟ مكافأة</button><button class="chip" id="qDoor">✅ قبل ما تنزل</button><button class="chip" id="qMed">💊 شباك التركيز</button>');
  $('qDopa').onclick=dopaSheet;$('qDoor').onclick=doorSheet;$('qMed').onclick=medSheet}
 NUDGE_EXTRA.push(t=>{const w=medWin();if(!w||!w.on||curMode()!=='one')return[];const big=candidates().find(i=>i.big);if(!big)return[];return[{id:'mw'+dayKey(),pr:57,i:'🎯',p:'دلوقتي شباك تركيزك لحد '+fmtT(w.e)+'. ده أحسن وقت لـ «'+big.title+'».',acts:[['يلا نبدأ',()=>startTask(big.id)],['تمام',()=>{nsn['mw'+dayKey()]=t+864e5;save();render()}]]}]});
}

/* the brain sends things that belong to these sections; put each in its place */
window.applyLife=(L,lines,added,r)=>{if(!L)return;let ch=false;
 (L.debts||[]).forEach(d=>{LIFE.debts.push({id:uid(),dir:d.dir==='me'?'me':'them',who:d.who,amount:d.amount,note:d.note||'',due:d.due||'',at:nowMs()});ch=true;lines.push('💸 '+(d.dir==='me'?'عليك لـ '+d.who:d.who+' عليه')+' '+money(d.amount))});
 (L.occ||[]).forEach(o=>{const k=OCCK[o.kind]?o.kind:'other';const t=k==='other'?o.who:OCCK[k][1]+' '+o.who;if(LIFE.occ.some(x=>x.t===t))return;LIFE.occ.push({id:uid(),k,who:o.who,t,d:o.date,gift:o.gift||''});ch=true;lines.push('🎂 '+t+' · هفكّرك قبلها بـ 3 أيام');
  if(o.gift&&r&&r.wants)r.wants=r.wants.filter(w=>!arN(w.name).includes(arN(o.gift)))});
 (L.subs||[]).forEach(x=>{if(subs().some(i=>arN(i.title)===arN(x.name)))return;const it=addItem({type:'bill',sec:'money',title:x.name,amount:x.amount||0,due:(x.due||dayKey())+'T10:00',repeat:x.repeat==='yearly'?'yearly':'monthly'});it.sub=1;it.usedAt=nowMs();added.push(it);lines.push('🔁 اشتراك '+x.name+(x.amount?' '+money(x.amount)+' ج':''))});
 (L.needs||[]).forEach(x=>{if(needItems().some(i=>arN(i.title)===arN(x.t)))return;const it=addItem({type:'buy',sec:'shop',title:x.t,cat:x.cat||'food'});added.push(it)});
 (L.habits||[]).forEach(h=>{if(LIFE.habits.some(x=>x.t===h.t))return;LIFE.habits.push({id:uid(),t:h.t,at:h.at||'',days:{}});ch=true;lines.push('✅ عادة جديدة: '+h.t+(h.at?' · هفكّرك '+h.at:''))});
 (L.kid||[]).forEach(x=>{let k=HOME.kids.find(c=>arN(c.name)===arN(x.name));if(!k){k={id:uid(),name:x.name,age:'',doc:'',docPhone:''};HOME.kids.push(k);store.set('home',HOME)}
  const it=addItem({type:x.type,sec:x.type==='task'?'people':'health',title:x.type==='med'?'دوا '+k.name+' ('+x.title+')':x.title.includes(k.name)?x.title:x.title+' ('+k.name+')',due:x.due||'',repeat:x.repeat||''});it.kid=k.id;added.push(it)});
 if(r&&r.wants&&!r.wants.length)delete r.wants;
 if(ch)store.set('life',LIFE)};
