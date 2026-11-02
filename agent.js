/* ---------- THE AGENT: Sanady acts on its own, tells you what it did, and every action can be undone ----------
   1. Replans the day when you fall behind (late tasks move to the next free slot; hard day = tomorrow).
   2. Breaks a big task into small steps by itself and spreads the steps over the coming days.
   3. Follows up after a call or a message: next day it asks if they replied and drafts the reminder.
   4. Spots a task you keep pushing and offers to cut it smaller or drop it.
   Everything it does goes into the log (سندي عمل إيه) with an undo button. */
let ALOG=store.get('alog',[]);let AFU=store.get('afu',[]);
const saveAgent=()=>{store.set('alog',ALOG.slice(-80));store.set('afu',AFU.slice(-60))};
const agentOn=()=>store.get('agent',true)&&!(window.KID&&KID.on);
function agentLog(t,undo){ALOG.push({id:uid(),t,at:nowMs(),undo:undo||null});ALOG=ALOG.slice(-80);saveAgent()}
function agentUndo(id){const e=ALOG.find(x=>x.id===id);if(!e||!e.undo)return;
 (e.undo.due||[]).forEach(([iid,old])=>{const it=byId(iid);if(it){it.due=old;it.notified=0;it.amoved=Math.max(0,(it.amoved||1)-1)}});
 (e.undo.steps||[]).forEach(iid=>{const it=byId(iid);if(it&&it.steps){it.steps.forEach(s=>{delete s.due});it.splan=0;it.splanOff=1}});
 (e.undo.fu||[]).forEach(fid=>{AFU=AFU.filter(f=>f.id!==fid)});
 if(e.undo.plan){const it=byId(e.undo.plan[0]);if(it)it.steps=e.undo.plan[1]}
 e.undo=null;e.undone=1;save();saveAgent();toast('رجّعتها زي ما كانت');render()}
const dayEnd=()=>{const [h,m]=(prof.sleep||'23:30').split(':').map(Number);const d=NOW();d.setHours(h||23,m||0,0,0);if(d<NOW())d.setDate(d.getDate()+1);return d};
const dayStart=d=>{const [h,m]=(prof.wake||'07:30').split(':').map(Number);const x=new Date(d);x.setHours(h||7,m||30,0,0);return x};
function busyAt(t,skip){return items.some(i=>{if(i.done||i.id===skip||!i.due||i.type==='idea')return false;const d=parseL(i.due).getTime();
 if(i.type==='appt')return t>=d-(leaveMins(i)+30)*6e4&&t<=d+60*6e4; // the trip there and the visit itself
 return Math.abs(d-t)<25*6e4})}
function freeSlots(from,until,n,skip){const out=[];const t=new Date(from);t.setSeconds(0,0);t.setMinutes(t.getMinutes()<30?30:60);
 while(t<until&&out.length<n){if(!busyAt(t,skip)&&!out.some(x=>Math.abs(x-t)<25*6e4))out.push(new Date(t));t.setMinutes(t.getMinutes()+30)}return out}
const tName=t=>'«'+(String(t).length>32?String(t).slice(0,30)+'…':t)+'»';
const whenAr=d=>{const n=NOW();const same=dayKey(d)===dayKey(n);const tm=new Date(n);tm.setDate(tm.getDate()+1);return (same?'':dayKey(d)===dayKey(tm)?'بكرة ':DAYS[d.getDay()]+' ')+fmtT(d)};

/* 1) replan when you fall behind */
function agentReplan(force){if(!agentOn()||DEMO&&!force)return 0;const n=nowMs();
 if(!force&&n-store.get('areplan',0)<60*6e4)return 0;
 const late=items.filter(i=>!i.done&&!i.ghost&&['task','call','buy'].includes(i.type)&&i.due&&parseL(i.due)<n-45*6e4&&!essential(i)&&!(i.snooze>n));
 if(!late.length)return 0;store.set('areplan',n);
 late.sort((a,b)=>score(b)-score(a));const end=new Date(dayEnd().getTime()-45*6e4);const hard=isHard();
 const slots=hard?[]:freeSlots(new Date(n+20*6e4),end,3);const moved=[];const tm=dayStart(new Date(n+864e5));
 let tmSlots=null;late.forEach((it,k)=>{let at=slots[k];if(!at){tmSlots=tmSlots||freeSlots(new Date(tm.getTime()+90*6e4),new Date(tm.getTime()+12*36e5),late.length,it.id);at=tmSlots.shift()||new Date(tm.getTime()+(150+k*30)*6e4)}
  moved.push([it.id,it.due]);it.due=toLocal(at);it.notified=0;it.touched=n;it.amoved=(it.amoved||0)+1});
 save();const shown=late.slice(0,3).map(it=>tName(it.title)+' '+whenAr(parseL(it.due))).join('، ');
 const msg=(hard?'النهارده يوم صعب، فشلت عنك '+late.length+' حاجات لبكرة: ':'اتأخرت في '+late.length+(late.length===1?' حاجة':' حاجات')+'، فرتبتهم من غير ما تتعب: ')+shown+(late.length>3?' والباقي بكرة':'')+'.';
 agentLog(msg,{due:moved});if(!force){toast('🤖 '+msg,6000);if(audUnlocked&&prof.voice)speak('رتبتلك اللي اتأخر. شوفه في الشاشة.')}alarmsSoon&&alarmsSoon();return late.length}

/* 2) big tasks: break down by itself, then spread the steps over the days */
let abdBusy=false;
async function agentBreakdown(){if(!agentOn()||abdBusy||DEMO)return;const it=items.find(i=>!i.done&&i.big&&!(i.steps&&i.steps.length)&&!i.abd);if(!it)return;
 abdBusy=true;it.abd=1;save();try{const r=await brain('breakdown',{text:it.title});if(r&&r.steps&&r.steps.length&&!(it.steps&&it.steps.length)){it.steps=r.steps.map(s=>({...s,done:false}));it.go=r.go||'يلا، 5 دقايق بس';save();
  agentLog('قسمت '+tName(it.title)+' لـ '+it.steps.length+' خطوات صغيرة، أولها: «'+it.steps[0].t+'» ('+minsAr(it.steps[0].min||5)+').')}}catch(e){}abdBusy=false;agentPlanSteps();if($('sheet').hidden)render()}
function agentPlanSteps(){if(!agentOn())return;const n=nowMs();let changed=false;
 items.filter(i=>!i.done&&i.steps&&i.steps.length&&!i.splanOff&&i.steps.some(s=>!s.done)).forEach(it=>{
  const open=it.steps.map((s,k)=>({s,k})).filter(x=>!x.s.done);const first=open[0].s;
  const missed=first.due&&parseL(first.due)<n-3*36e5;if(it.splan&&!missed)return;
  const start=NOW();const today=start.getHours()<18?freeSlots(new Date(n+30*6e4),new Date(Math.min(dayEnd().getTime()-60*6e4,n+8*36e5)),1,it.id)[0]:null;
  const atH=(today||dayStart(new Date(n+864e5)));const base=today?new Date(today):new Date(atH.getTime()+150*6e4);
  open.forEach((x,j)=>{const d=new Date(base);d.setDate(d.getDate()+j);x.s.due=toLocal(d)});it.splan=1;changed=true;
  agentLog((missed?'الخطوة بتاعة '+tName(it.title)+' فاتت، فزحلقت الباقي: ':'وزعت خطوات '+tName(it.title)+' على '+nDays(open.length)+'، خطوة صغيرة كل يوم. ')+'الجاية «'+first.t+'» '+whenAr(parseL(first.due))+'.',{steps:[it.id]})});
 if(changed){save();alarmsSoon&&alarmsSoon()}}
const stepToday=()=>{const n=nowMs(),k=dayKey();const out=[];items.filter(i=>!i.done&&i.steps).forEach(it=>{const x=it.steps.findIndex(s=>!s.done);if(x<0)return;const s=it.steps[x];if(s.due&&dayKey(parseL(s.due))===k&&parseL(s.due)-n<30*6e4)out.push({it,s,x})});return out};

/* 3) follow up after you reach out to someone */
const reachOut=it=>it.type==='call'||/ابعت|أبعت|رسال|اكلم|أكلم|كلم|ارد|أرد|ايميل|إيميل|أسأل|اسأل|أطلب|اطلب/.test(arN(it.title));
function agentAfter(it,silent){if(!agentOn()||!it||it.ghost||!reachOut(it))return;const d=new Date(nowMs()+864e5);d.setHours(11,0,0,0);
 const f={id:uid(),t:it.title,at:d.getTime(),n:0};AFU.push(f);saveAgent();agentLog('هتابع معاك '+tName(it.title)+' بكرة الساعة 11: لو محدش رد، هكتبلك رسالة تفكير.',{fu:[f.id]})}
function fuDraft(f){openSheet('<h2>رسالة تفكير</h2><div class="stack" id="fuOut"><div class="listening thinking"><span class="dot"></span><span>بكتبها...</span></div></div>');
 brain('draft',{kind:'remind',text:'متابعة بخصوص: '+f.t+'. لسه مستني الرد.',to:''}).then(r=>{const o=$('fuOut');if(o)o.innerHTML=draftBox((r&&r.text)||('أهلاً، بتابع مع حضرتك بخصوص: '+f.t+'. مستني ردك لما تفضى 🙏'))})}

/* nudges and alarms the agent adds */
NUDGE_EXTRA.push((t,hard)=>{if(!agentOn())return[];const out=[];
 AFU.filter(f=>f.at<=t&&!f.done).slice(0,1).forEach(f=>out.push({id:'fu'+f.id,pr:62,i:'🔁',p:'كنت '+(/كلم|اتصل/.test(f.t)?'كلمت':'بعت')+' بخصوص '+tName(f.t)+'. حد رد عليك؟',
  acts:[['أيوه ✓',()=>{f.done=1;saveAgent();render()}],['اكتبلي تفكير',()=>{f.done=1;saveAgent();fuDraft(f)}],['بعد يومين',()=>{f.at=t+2*864e5;f.n++;saveAgent();render()}]]}));
 stepToday().slice(0,1).forEach(({it,s,x})=>out.push({id:'st'+it.id+x+dayKey(),pr:66,i:'🪜',p:'خطوة النهارده في '+tName(it.title)+': «'+s.t+'» ('+minsAr(s.min||5)+' بس).',
  acts:[['يلا نبدأ',()=>goFocus(it,Math.min(s.min||5,25),x)],['بعدين',()=>{nsn['st'+it.id+x+dayKey()]=t+3*36e5;save();render()}]]}));
 items.filter(i=>!i.done&&(i.amoved||0)>=3&&!i.stuckSeen).slice(0,1).forEach(i=>out.push({id:'sk'+i.id,pr:55,i:'🧱',p:tName(i.title)+' اتأجلت '+i.amoved+' مرات. غالباً هي كبيرة أو مش واضحة. نقسمها لخطوات صغيرة؟',
  acts:[['قسّمها',()=>{i.stuckSeen=1;i.big=true;save();startTask(i.id)}],['شيلها',()=>{i.stuckSeen=1;removeItem(i.id)}],['سيبها',()=>{i.stuckSeen=1;save();render()}]]}));
 return out});
ALARM_EXTRA.push((from,end)=>{if(!agentOn())return[];const out=[];
 items.filter(i=>!i.done&&i.steps).forEach(it=>it.steps.forEach((s,k)=>{if(!s.done&&s.due){const at=parseL(s.due).getTime();if(at>=from&&at<=end)out.push({k:'as'+it.id+k+s.due.replace(/\D/g,''),iid:it.id,at,text:'🪜 خطوة صغيرة: '+s.t})}}));
 AFU.filter(f=>!f.done&&f.at>=from&&f.at<=end).forEach(f=>out.push({k:'fu'+f.id+f.at,iid:'life',at:f.at,text:'🔁 حد رد عليك بخصوص: '+f.t+'؟'}));return out});

/* the log on the main screen */
function agentCard(){const host=$('nowOne');if(!host||host.hidden)return;let c=$('agentCard');if(!c){c=document.createElement('div');c.id='agentCard';c.className='card agent';const nx=$('nextCard');nx&&nx.after(c)}
 const k=dayKey();const today=ALOG.filter(e=>dayKey(new Date(e.at))===k&&!e.undone).slice(-3).reverse();
 if(!agentOn()||!today.length){c.hidden=true;return}c.hidden=false;
 c.innerHTML=`<div class="ch"><h3>🤖 عملته لوحدي النهارده</h3><button class="link" id="agAll">الكل</button></div>${today.map(e=>`<div class="alog"><p>${esc(brandify(e.t))}</p>${e.undo?`<button class="link" data-u="${e.id}">رجّعها</button>`:''}</div>`).join('')}`;
 c.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>agentUndo(b.dataset.u));$('agAll').onclick=agentSheet}
function agentSheet(){const list=ALOG.slice().reverse().slice(0,40);
 openSheet(`<h2>🤖 ${esc(BRAND)} عمل إيه لوحده</h2><p class="note">بيرتب يومك لما تتأخر، يقسم المهام الكبيرة ويوزعها على الأيام، ويتابع معاك اللي مستني رد. أي حاجة تقدر ترجّعها.</p>
 <label class="tog"><input type="checkbox" id="agOn" ${store.get('agent',true)?'checked':''}> خلّيه يتصرف لوحده</label>
 ${list.length?list.map(e=>`<div class="alog"><small class="note">${esc(fmtWhen(toLocal(new Date(e.at))))}</small><p style="${e.undone?'text-decoration:line-through;opacity:.6':''}">${esc(brandify(e.t))}</p>${e.undo?`<button class="link" data-u="${e.id}">رجّعها</button>`:''}</div>`).join(''):'<p class="note">لسه معملش حاجة.</p>'}`);
 $('agOn').onchange=e=>{store.set('agent',e.target.checked);toast(e.target.checked?'هتصرف لوحدي وأقولك':'مش هتصرف غير لما تقولّي')};
 document.querySelectorAll('#sheetBody [data-u]').forEach(b=>b.onclick=()=>{agentUndo(b.dataset.u);agentSheet()})}

/* wiring: runs quietly every minute, and after anything is finished */
const _afPrev=window.afterFinish;window.afterFinish=(it,silent)=>{if(_afPrev)_afPrev(it,silent);agentAfter(it,silent)};
const _drawNow=drawNow;drawNow=function(){_drawNow();try{agentCard()}catch(e){}};
function agentTick(){if(!agentOn()||(window.KID&&KID.on)||(window.ELDER&&ELDER.on))return;const n0=ALOG.length;try{agentReplan();agentPlanSteps();agentBreakdown()}catch(e){}if(ALOG.length!==n0&&$('sheet').hidden)render()}
setTimeout(agentTick,4000);setInterval(agentTick,60000);
Object.assign(window,{agentReplan,agentPlanSteps,agentBreakdown,agentAfter,agentUndo,agentSheet,agentLog});
