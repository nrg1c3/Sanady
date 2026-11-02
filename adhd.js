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
 const k=$('sKid')||$('sHome');k&&k.insertAdjacentHTML($('sKid')?'beforebegin':'afterend',(IS_ADHD?'<button class="btn ghost" id="sBuddy">🤝 شريك المتابعة الأسبوعي</button>':'')+'<button class="btn ghost" id="sAgent">🤖 '+BRAND+' عمل إيه لوحده</button>');
 if($('sSimple'))$('sSimple').onchange=e=>setSimple(e.target.checked);if($('sBuddy'))$('sBuddy').onclick=buddySheet;$('sAgent').onclick=agentSheet;if(window.trustSettings)trustSettings()}
new MutationObserver(()=>{if($('sSave')&&!$('sAgent'))adhdSettings()}).observe(document.getElementById('sheetBody'),{childList:true});
/* the Focus+ tab: the focus timer is free for everyone; Focus+ adds its tools on top */
function drawFP(){const box=$('fpCard');if(!box)return;const on=IS_ADHD;
 const T=[['coach','🎧','مستشار في ودنك','يهمسلك بالرد وإنت بتتكلم',1],['with','🤝','جنبك','حد معاك وإنت بتشتغل'],['wait','⏳','الانتظار','قبل ميعاد مهم، أقولك تقوم'],
  ['simple','☝️',simpleOn()?'الشاشة الكاملة':'الشاشة البسيطة',simpleOn()?'رجّع كل الأدوات':'حاجة واحدة ومايك كبير'],['buddy','👥','شريك المتابعة','رسالة إنجازاتك كل أسبوع']];
 box.innerHTML=`<div class="fph"><h3>${FP_ICON} فوكس+</h3>${on?'<span class="fps">شغال ✓</span><button class="ic fpset" id="fpSet" aria-label="إعدادات فوكس+">⚙️</button>':'<span class="fps off">للتركيز والبداية</span>'}</div>
 ${on?'':'<p class="note">أدوات زيادة للي بيلاقي صعوبة يبدأ أو يركّز أو بينسى الوقت، سواء عنده ADHD أو لأ.</p>'}
 <div class="fpg ${on?'':'locked'}">${T.map(([k,ic,t,d,wide])=>`<button class="fpt ${wide?'wide':''}" data-f="${k}"><i>${ic}</i><span><b>${t}</b><small>${d}</small></span>${on?'':'<em class="lk">🔒</em>'}</button>`).join('')}</div>
 ${on?'':'<button class="btn big" id="fpTry">جرّب فوكس+ ببلاش</button>'}`;
 box.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{if(!on){focusSheet();return}const k=b.dataset.f;
  if(k==='coach')window.coachSheet&&coachSheet();else if(k==='with')setMode('with');else if(k==='wait')setMode('wait');else if(k==='buddy')buddySheet();else if(k==='simple'){setMode('one');setSimple(!simpleOn())}});
 if($('fpSet'))$('fpSet').onclick=focusSheet;if($('fpTry'))$('fpTry').onclick=focusSheet}
const _render=render;render=function(){applySimple();_render();drawFP()};
applySimple();
/* Focus+: what it adds, and turning it on or off (sold through Google Play once the store app is out; free to try now) */
function focusSheet(){const on=IS_ADHD;
 openSheet(`<h2>${FP_ICON} فوكس+</h2><div class="stack"><p>أدوات زيادة للي بيلاقي صعوبة يبدأ أو يركّز أو بينسى الوقت، سواء عنده ADHD أو لأ.</p>
 <ul class="note" style="line-height:1.9;padding-inline-start:18px"><li>الشاشة البسيطة: حاجة واحدة دلوقتي وزرار صوت كبير</li><li>وضع «جنبك»: حد معاك وإنت بتشتغل</li><li>وضع الانتظار قبل المواعيد، وأنا اللي أقولك تقوم</li><li>البداية بدقيقتين بس، وتقسيم الحاجة الكبيرة لخطوات</li><li>شريك متابعة كل أسبوع</li><li>اختيار الحاجة حسب طاقتك</li><li>مستشار في ودنك: يسمع الاجتماع أو المحادثة ويهمسلك بالرد المناسب</li></ul>
 <p class="note">${on?'فوكس+ شغال على الموبايل ده.':'تقدر تجربه دلوقتي ببلاش. بعد التجربة هيبقى اشتراك واحد اسمه Sayvo Focus+، فيه كل اللي في Plus كمان.'}</p>
 <button class="btn big" id="fcGo">${on?'اقفل فوكس+':'جرّب فوكس+'}</button></div>`);
 $('fcGo').onclick=()=>{store.set('focus',!on);if(!on){store.set('focusAt',Date.now());store.set('simple',true)}location.reload()}}
Object.assign(window,{focusSheet,setSimple,buddySheet,buddyDraft,weekStats});
