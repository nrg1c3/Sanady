/* ---------- Focus+ (the add-on for focus and ADHD): the simple screen, and Barkley's "point of performance" tools ----------
   Simple screen (default with Focus+): the time left made visible, one thing now, one big mic, what the agent did.
   Everything else sits behind "كل الأدوات".
   Accountability partner: once a week Sanady drafts a short progress message to someone you trust. */
// new users start on the simple screen; people already using the app keep what they had
if(IS_ADHD&&store.get('simple',null)===null)store.set('simple',!store.get('seen',false));
const simpleOn=()=>IS_ADHD&&store.get('simple',false);
function applySimple(){const on=simpleOn()&&curMode()==='one';document.body.classList.toggle('simple',on);
 let m=$('moreTools');if(on&&!m){m=document.createElement('button');m.id='moreTools';m.className='link more-tools';const q=document.querySelector('#nowOne .quick');q&&q.before(m)}
 if(m){m.hidden=!on;m.textContent=document.body.classList.contains('simple-more')?'خبّي الأدوات ⌃':'كل الأدوات ⌄';m.onclick=()=>{document.body.classList.toggle('simple-more');applySimple()}}}
function setSimple(on){store.set('simple',on);document.body.classList.remove('simple-more');applySimple();render()}

/* accountability partner */
function buddySheet(){const b=store.get('buddy',{name:'',phone:''});
 openSheet(`<h2>🤝 شريك المتابعة</h2><div class="form"><p class="note">حد بتثق فيه يعرف إنجازاتك كل أسبوع. وجود حد متابع بيخلّي المهام أسهل تتعمل. الرسالة بتتكتب لوحدها وإنت اللي بتبعتها.</p>
 <label>اسمه<input id="bdN" value="${esc(b.name)}" placeholder="أخويا، صاحبي، الكوتش"></label><label>موبايله<input id="bdP" type="tel" value="${esc(b.phone)}"></label>
 <div class="acts"><button class="btn" id="bdS">احفظ</button>${b.name?'<button class="btn ghost" id="bdNow">ابعتله دلوقتي</button>':''}</div></div>`);
 $('bdS').onclick=()=>{store.set('buddy',{name:$('bdN').value.trim(),phone:$('bdP').value.trim()});closeSheet();toast('كل جمعة هجهزلك رسالة ليه')};
 const nw=$('bdNow');if(nw)nw.onclick=buddyDraft}
function weekStats(){const n=nowMs(),wk=7*864e5;const done=items.filter(i=>i.done&&i.doneAt&&n-i.doneAt<wk&&!i.ghost);
 const big=done.filter(i=>i.big).length;const steps=items.reduce((s,i)=>s+((i.steps||[]).filter(x=>x.done).length),0);
 const agent=ALOG.filter(e=>n-e.at<wk&&!e.undone).length;return{done:done.length,big,steps,agent,top:done.slice(-3).map(i=>i.title)}}
function buddyDraft(){const b=store.get('buddy',{name:'',phone:''});const s=weekStats();
 const t=`أهلاً يا ${b.name||'صاحبي'} 👋\nده ملخص أسبوعي من ${BRAND}:\n✅ خلصت ${s.done} حاجات${s.big?' (منهم '+s.big+' كبار)':''}\n${s.top.length?'آخر حاجات: '+s.top.join('، ')+'\n':''}الأسبوع الجاي هكمّل، شجعني 💪`;
 store.set('buddyAt',dayKey());openSheet('<h2>رسالة لشريك المتابعة</h2>'+draftBox(t,b.phone?normPhone(b.phone):''))}
NUDGE_EXTRA.push((t,hard)=>{const b=store.get('buddy',null);const n=NOW();if(!b||!b.name||hard)return[];if(n.getDay()!==5||n.getHours()<17||store.get('buddyAt','')===dayKey())return[];
 return[{id:'bd'+dayKey(),pr:35,i:'🤝',p:'النهارده الجمعة. نبعت لـ '+b.name+' إنجازات الأسبوع؟',acts:[['جهّز الرسالة',buddyDraft],['مش النهارده',()=>{store.set('buddyAt',dayKey());render()}]]}]});

/* say the next step out loud (self-talk at the point of performance) */
const _goFocus=goFocus;goFocus=function(it,mins,step){_goFocus(it,mins,step);if(!IS_ADHD||!it)return;
 const s=step!=null&&step>=0&&it.steps?it.steps[step].t:it.title;if(store.get('selfTalk',true)){toast('🗣️ قولها بصوت عالي: «هعمل '+s+' دلوقتي»',5000)}};

/* settings entries (ADHD edition) */
function adhdSettings(){const box=document.querySelector('#sheetBody .form');if(!box||$('sAgent'))return;
 if(IS_ADHD)box.insertAdjacentHTML('afterbegin',`<label class="tog"><input type="checkbox" id="sSimple" ${simpleOn()?'checked':''}> الشاشة البسيطة (حاجة واحدة وزرار صوت)</label>`);
 const k=$('sKid');k&&k.insertAdjacentHTML('beforebegin',(IS_ADHD?'<button class="btn ghost" id="sBuddy">🤝 شريك المتابعة الأسبوعي</button>':'')+'<button class="btn ghost" id="sAgent">🤖 '+BRAND+' عمل إيه لوحده</button>');
 if($('sSimple'))$('sSimple').onchange=e=>setSimple(e.target.checked);if($('sBuddy'))$('sBuddy').onclick=buddySheet;$('sAgent').onclick=agentSheet;if(window.trustSettings)trustSettings()}
new MutationObserver(()=>{if($('sSave')&&!$('sAgent'))adhdSettings()}).observe(document.getElementById('sheetBody'),{childList:true});
/* the Focus+ tab: the focus timer is free for everyone; Focus+ adds its tools on top */
function drawFP(){const box=$('fpCard');if(!box)return;
 if(!IS_ADHD){box.innerHTML=`<div class="ch"><h3>${FP_ICON} فوكس+</h3><small>للتركيز والبداية</small></div><p class="note">أدوات زيادة للي بيلاقي صعوبة يبدأ أو يركّز أو بينسى الوقت: الشاشة البسيطة، و«جنبك»، والانتظار قبل المواعيد، وشريك متابعة.</p><button class="btn" id="fpTry">جرّب فوكس+</button>`;$('fpTry').onclick=focusSheet;return}
 box.innerHTML=`<div class="ch"><h3>${FP_ICON} فوكس+</h3><small>شغال ✓</small></div><div class="acts"><button class="btn ghost" id="fpWith">🤝 جنبك</button><button class="btn ghost" id="fpWait">⏳ الانتظار</button><button class="btn ghost" id="fpSimple">${simpleOn()?'☝️ الشاشة الكاملة':'☝️ الشاشة البسيطة'}</button><button class="btn ghost" id="fpBuddy">🤝 شريك المتابعة</button><button class="link" id="fpSet">إعدادات فوكس+</button></div>`;
 $('fpWith').onclick=()=>setMode('with');$('fpWait').onclick=()=>setMode('wait');$('fpSimple').onclick=()=>{setMode('one');setSimple(!simpleOn())};$('fpBuddy').onclick=buddySheet;$('fpSet').onclick=focusSheet}
const _render=render;render=function(){applySimple();_render();drawFP()};
applySimple();
/* Focus+: what it adds, and turning it on or off (sold through Google Play once the store app is out; free to try now) */
function focusSheet(){const on=IS_ADHD;
 openSheet(`<h2>${FP_ICON} فوكس+</h2><div class="stack"><p>أدوات زيادة للي بيلاقي صعوبة يبدأ أو يركّز أو بينسى الوقت، سواء عنده ADHD أو لأ.</p>
 <ul class="note" style="line-height:1.9;padding-inline-start:18px"><li>الشاشة البسيطة: حاجة واحدة دلوقتي وزرار صوت كبير</li><li>وضع «جنبك»: حد معاك وإنت بتشتغل</li><li>وضع الانتظار قبل المواعيد، وأنا اللي أقولك تقوم</li><li>البداية بدقيقتين بس، وتقسيم الحاجة الكبيرة لخطوات</li><li>شريك متابعة كل أسبوع</li><li>اختيار الحاجة حسب طاقتك</li></ul>
 <p class="note">${on?'فوكس+ شغال على الموبايل ده.':'تقدر تجربه دلوقتي ببلاش. الاشتراك هيبقى من جوجل بلاي.'}</p>
 <button class="btn big" id="fcGo">${on?'اقفل فوكس+':'جرّب فوكس+'}</button></div>`);
 $('fcGo').onclick=()=>{store.set('focus',!on);if(!on){store.set('focusAt',Date.now());store.set('simple',true)}location.reload()}}
Object.assign(window,{focusSheet,setSimple,buddySheet,buddyDraft,weekStats});
