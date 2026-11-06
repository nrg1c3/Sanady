/* ---------- Home: just a voice orb, like a call screen ----------
   Tap the orb and talk; tap again (or pause a while) and Sayvo sorts it. Under it, one line: the next thing.
   Sayvo's answer floats above the orb and fades. Everything else lives in the side menu on the left.
   Settings can switch the start screen back to "Today". */
const ORB={on:false,txt:'',idle:null,last:0};
const orbHome=()=>store.get('orb',true)!==false;
function orbState(st){const o=$('orb');if(!o)return;o.className='orb'+(st?' '+st:'');const H=$('home');if(H){H.classList.remove('listen','think','speak');if(st)H.classList.add(st)}
 const h=$('orbHint');if(h)h.textContent=st==='listen'?'خلصت؟ دوس هنا':st==='think'?'بيرتّب…':st==='speak'?'سايفو بيتكلم':'اتكلم';
 const x=$('orbStop'),f=$('orbFocus');if(x&&f){x.hidden=st!=='listen';f.hidden=st==='listen'}}
function orbGreet(){const h=new Date().getHours();
 return `${h<12?'صباح الخير':h<18?'أهلاً':'مساء الخير'}${prof.name?`، <span translate="no">${esc(prof.name)}</span>`:''}<br>إيه اللي في دماغك؟`}
function drawOrb(){const c=candidates(),it=c[0],b=$('orbNow');if(!b)return;const g=$('orbGreet');if(g&&!ORB.on)g.innerHTML=orbGreet();
 if(it){const t=it.due?fmtT(parseL(it.due)):'';b.innerHTML=`<span>الجاي:</span> <b translate="no" dir="auto">${esc(it.title)}</b>${t?` <small>${t}</small>`:''}`;b.hidden=false}
 else{b.innerHTML='<span>مفيش حاجة مستعجلة دلوقتي</span>';b.hidden=false}
 const n=$('dName');if(n)n.textContent=prof.name?BRAND+' · '+prof.name:BRAND}
function orbSay(t){const box=$('orbSay');if(!box||!t)return;const d=document.createElement('div');d.className='bub';d.textContent=String(t).slice(0,220);
 box.prepend(d);while(box.children.length>2)box.lastChild.remove();setTimeout(()=>d.classList.add('fade'),9000);setTimeout(()=>d.remove(),10500)}
function orbTap(){if(ORB.on){orbDone();return}
 if(!SR){openDump();return}
 hush();ORB.on=true;ORB.txt='';$('orbHeard').textContent='';orbState('listen');
 const dr=store.get('dumpDraft',null),d0=dr&&Date.now()-dr.at<2*864e5?dr.t:'';if(d0)$('orbHeard').textContent=d0;
 const ok=startRec((f,i)=>{ORB.txt=f;ORB.last=Date.now();if(f)store.set('dumpDraft',{t:f,at:Date.now()});const h=$('orbHeard');if(h)h.textContent=(f+(i?' '+i:'')).slice(-240)},
  st=>{if(st==='blocked'||st==='nosr'){ORB.on=false;orbState('');toast('الميكروفون مش متاح، اكتب بدل الكلام');openDump();setTimeout(()=>{const t=$('dType');t&&t.click()},50)}},d0);
 if(!ok){ORB.on=false;orbState('');return}
 clearInterval(ORB.idle);ORB.last=Date.now();ORB.idle=setInterval(()=>{if(ORB.on&&ORB.txt&&Date.now()-ORB.last>6000)orbDone()},1000)} // a long pause: you're done
function orbDone(){clearInterval(ORB.idle);ORB.on=false;stopRec();const text=(recFinal||ORB.txt||'').trim();
 if(text.length<2){orbState('');$('orbHeard').textContent='';toast('لسه ما قلتش حاجة');return}
 orbState('think');openDump(text,null,true)}
function openDrawer(){$('drawer').hidden=false;requestAnimationFrame(()=>$('drawer').classList.add('on'))}
function closeDrawer(){$('drawer').classList.remove('on');setTimeout(()=>{$('drawer').hidden=true},200)}
// the header and tabs hide on the orb screen; everywhere else a small orb button brings you back
const _showO=show;show=function(id){if(ORB.on&&id!=='home'){ORB.on=false;stopRec();orbState('')}
 _showO(id);document.getElementById('app').classList.toggle('orbmode',id==='home');if(id==='home')drawOrb()};
const _renderO=render;render=function(){_renderO();const on=document.querySelector('.screen.on');if(on&&on.id==='home')drawOrb()};
// Sayvo's answers float above the orb
const _chatLogO=chatLog;chatLog=function(who,t){_chatLogO(who,t);if(who==='s'&&document.querySelector('#home.on'))orbSay(t)};
// the orb moves while Sayvo talks
setInterval(()=>{const o=$('orb');if(!o||!document.querySelector('#home.on')||ORB.on)return;
 const talking=(window.speechSynthesis&&speechSynthesis.speaking)||(typeof AUD!=='undefined'&&AUD&&!AUD.paused&&!AUD.ended);
 const sheetOpen=!$('sheet').hidden;if(talking)orbState('speak');else if(o.classList.contains('speak')||(o.classList.contains('think')&&!sheetOpen)){orbState('');$('orbHeard').textContent=''}},300);
$('orb').onclick=orbTap;
$('orbKb').onclick=()=>{openDump();setTimeout(()=>{const t=$('dType');t&&t.click()},50)};
$('orbNow').onclick=()=>show('now');
$('orbToday').onclick=()=>show('now');$('orbFocus').onclick=()=>show('focus');
$('orbStop').onclick=()=>{clearInterval(ORB.idle);ORB.on=false;stopRec();store.set('dumpDraft',null);$('orbHeard').textContent='';orbState('');toast('اتلغى')}; // cancel: nothing is sent
$('mnuBtn').onclick=openDrawer;$('mnuTop').onclick=openDrawer;$('toOrb').onclick=()=>show('home');
$('drawerX').onclick=closeDrawer;$('drawer').onclick=e=>{if(e.target.id==='drawer')closeDrawer()};
$('dbox').querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const d=b.dataset.d;closeDrawer();
 if(d==='set')$('btnSet').click();else if(d==='plans')plansSheet();else if(d==='life'){if(typeof LIFE_SUB!=='undefined')LIFE_SUB='';show('all');setSeg('life')}
 else if(d==='all'){show('all');setSeg('tasks')}else show(d)});
// settings: choose the start screen
new MutationObserver(()=>{if($('sSave')&&!$('sOrb')){const at=$('sAwake')?$('sAwake').closest('label'):$('sSave');
 at.insertAdjacentHTML(at.id==='sSave'?'beforebegin':'afterend',`<label class="tog"><input type="checkbox" id="sOrb" ${orbHome()?'checked':''}> أبدأ بدايرة الصوت (من غير ما أشوف حاجة تانية)</label>`);
 $('sOrb').onchange=e=>store.set('orb',e.target.checked)}}).observe($('sheetBody'),{childList:true});
// start on the orb (not for the child, senior or family screens, which take over the app)
window.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{if(!orbHome())return;if((typeof KID!=='undefined'&&KID&&KID.on)||(typeof ELDER!=='undefined'&&ELDER&&ELDER.on))return;
 const q=new URLSearchParams(location.search).get('go');if(q)return;if(document.querySelector('.screen.on')&&document.querySelector('.screen.on').id!=='now')return;show('home')},0)});
Object.assign(window,{orbTap,orbDone,orbSay,drawOrb,openDrawer,closeDrawer});
