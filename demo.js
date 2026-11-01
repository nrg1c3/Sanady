/* Demo mode (?demo=1): "a day with Sanady" for the competition video. Uses its own storage, a scripted clock and canned AI answers so it never fails on stage. */
(function(){if(!new URLSearchParams(location.search).has('demo'))return;
const D=new Date(2027,0,12);const at=(h,m)=>new Date(2027,0,12,h,m).getTime();const L=(h,m,dd)=>toLocal(new Date(2027,0,12+(dd||0),h,m));
const DUMP1='النهارده عندي شغل الساعة عشرة الصبح في مدينة نصر، ولازم أكلم أحمد بالليل الساعة تسعة أفكّره بميعاد بكرة، وعايز أشتري لبن وجبنة وحاجات للغدا، وأصلّح الكهربا والتكييف، وأأكّل الكلبة، وفاتورة النت بكرة 450، وجاتلي فكرة أعمل بودكاست، والباسبور في الدولاب.';
const DUMP2='بكرة الصبح لازم أروح البنك، ويوم الخميس عيد ميلاد سارة وعايز أجيبلها هدية.';
const DUMP3='سلّفت كريم 500 جنيه هيرجعهم أول الشهر، وعيد ميلاد سارة 14 مارس عايز أجيبلها برفان، واشتراك نتفليكس 240 كل شهر، وخلص العيش واللبن، وياسين عنده دكتور أسنان بكرة الساعة 5.';
const BUY='عايز أشتري سماعة وجزمة وشاحن جديد، وأجدد اشتراك الجيم بـ 1700';
DEMO={t0:at(7,40),real0:Date.now(),dumpText:null,
 brain(mode,x){if(mode==='breakdown')return{steps:[{t:'افتح ملف التقرير واكتب العنوان بس',min:3},{t:'اكتب 3 نقط أهم حاجات اتعملت الشهر ده',min:10},{t:'ضيف رقم واحد لكل نقطة',min:10},{t:'اكتب الخطوة الجاية في سطر',min:5},{t:'راجعه وابعته',min:5}],go:'يلا، 3 دقايق بس، افتح الملف واكتب العنوان.'};
  if(mode==='draft'){if(x.kind==='late')return{text:'آسف جداً، هتأخر حوالي ربع ساعة، أنا في الطريق.'};if(x.kind==='hello')return{text:'ماما وحشتيني ❤️ عاملة إيه؟ هعدّي عليكي الجمعة إن شاء الله.'};if(x.kind==='calm')return{text:'ممكن نتكلم في الموضوع ده بكرة بهدوء؟ أنا محتاج أفهم اللي حصل.'};return{text:'أحمد، إزيك؟ بفكّرك بميعادنا بكرة الساعة 10 في مدينة نصر. لو فيه أي تغيير قولي 🙏'}}
  const t=x.text||'';
  if(/أشتري سماعة/.test(t))return{reply:'',add:[],update:[],spend:[],wants:[{name:'السماعة',price:2500,est:true},{name:'الجزمة',price:2000,est:true},{name:'الشاحن',price:600,est:true},{name:'الجيم',price:1700,est:false}],places:[],find:''};
  if(/سلّفت كريم/.test(t))return{reply:'تمام، سجلت إن كريم عليه 500، وهفكّرك بعيد ميلاد سارة قبلها بـ 3 أيام، ونتفليكس كل شهر، ودكتور ياسين بكرة 5.',add:[],update:[],spend:[],wants:[],places:[],find:'',life:{debts:[{who:'كريم',amount:500,dir:'them',note:'هيرجعهم أول الشهر',due:'2027-02-01'}],occ:[{kind:'bday',who:'سارة',date:'03-14',gift:'برفان'}],subs:[{name:'نتفليكس',amount:240,due:'2027-01-20',repeat:'monthly'}],needs:[{t:'عيش',cat:'food'},{t:'لبن',cat:'food'}],habits:[],kid:[{name:'ياسين',type:'appt',title:'دكتور أسنان',due:L(17,0,1),repeat:''}]}};
  if(/البنك/.test(t))return{reply:'تمام، حطيت البنك بكرة الصبح، وهفكّرك بهدية سارة قبل الخميس. نام وإنت مرتاح.',add:[{type:'task',sec:'money',title:'أروح البنك',due:L(10,0,1)},{type:'task',sec:'people',title:'أجيب هدية عيد ميلاد سارة',due:L(18,0,1)}],update:[],spend:[],wants:[],places:[],find:''};
  return{reply:'تمام، رتبت 8 حاجات. هفكّرك تتحرك لشغل مدينة نصر، وتكلم أحمد الساعة 9 بالليل.',
   add:[{type:'appt',sec:'work',title:'شغل في مدينة نصر',due:L(10,0),where:'مدينة نصر'},{type:'call',sec:'people',title:'أكلم أحمد وأفكّره بميعاد بكرة',due:L(21,0)},{type:'buy',sec:'shop',title:'لبن، جبنة، حاجات للغدا'},{type:'task',sec:'home',title:'أصلّح الكهربا والتكييف'},{type:'task',sec:'me',title:'أأكّل الكلبة',due:L(18,0)},{type:'bill',sec:'money',title:'فاتورة النت',amount:450,due:L(9,0,1),repeat:'monthly'},{type:'idea',sec:'me',title:'أعمل بودكاست'}],
   update:[],spend:[],wants:[],places:[{thing:'الباسبور',where:'الدولاب'}],find:''}},
 typeInto(el,text){let k=0;DEMO.dumpText=null;const st=document.getElementById('dState');const go=()=>{if(!document.body.contains(el))return;k+=2;el.textContent=text.slice(0,k);if(k<text.length)setTimeout(go,45);else if(st)st.innerHTML='<span>دوس "خلصت" لما تخلص.</span>'};go()}};
document.body.classList.add('demo');
function reset(){Object.keys(localStorage).filter(k=>k.startsWith(PFX)).forEach(k=>localStorage.removeItem(k));
 prof={name:'محمد',sex:'m',voice:true,vg:'f',wake:'07:30',sleep:'23:30',travel:30,prep:'المفاتيح والبطاقة والشاحن'};
 M={bal:12350,sal:15000,pay:1,daily:150,buf:1500,week:1000,brake:3000,spends:[],saved:0};
 HOME={chores:CHORES0.map(([i,t,e],k)=>({id:'c'+k,i,t,every:e,last:0})),kids:[],work:{}};LIFE={habits:[],occ:[],gam:[],debts:[],car:{},water:{}};store.set('mode','one');
 items=[];wish=[];places={};diary=[];nsn={};pts={p:180,days:{}};travel={'مدينة نصر':40};
 people=[{id:'p1',name:'ماما',every:30,last:at(9,0)-33*864e5}];
 const it=addItem({type:'bill',sec:'money',title:'قسط العربية',amount:3200,due:L(9,0,3),repeat:'monthly'});
 const r=addItem({type:'task',sec:'work',title:'أكتب تقرير الشهر للمدير',big:true});r.created=at(9,0)-3*864e5;
 store.set('seen',true);store.set('morning','x');spoken={};save()}
function ensure(title,o){let it=items.find(i=>i.title===title);if(!it)it=addItem({title,...o});return it}
function base(){ensure('شغل في مدينة نصر',{type:'appt',sec:'work',due:L(10,0),where:'مدينة نصر'});ensure('أكلم أحمد وأفكّره بميعاد بكرة',{type:'call',sec:'people',due:L(21,0)});ensure('فاتورة النت',{type:'bill',sec:'money',amount:450,due:L(9,0,1),repeat:'monthly'});ensure('لبن، جبنة، حاجات للغدا',{type:'buy',sec:'shop'});ensure('أأكّل الكلبة',{type:'task',sec:'me',due:L(18,0)})}
const markDone=(title,h)=>{const it=items.find(i=>i.title===title&&!i.done&&(!i.due||parseL(i.due)<new Date(2027,0,14)));if(it){if(it.repeat){items.push({...it,id:uid(),done:true,doneAt:at(h,0),repeat:'',ghost:1});rollRepeat(it)}else{it.done=true;it.doneAt=at(h,0)}}};
function clock(t){DEMO.t0=t;DEMO.real0=Date.now();spoken={};store.set('spoken',{})}
const mode=m=>store.set(IS_ADHD?'mode':'lay',m);
if(typeof WCFG!=='undefined'){WCFG.every=20000;WCFG.guard=60000} // check-ins fast enough to film
const S=[
 ['☀️ 7:45 فرّغ دماغك',()=>{mode(IS_ADHD?'one':'blocks');clock(at(7,45));closeSheetSafe();show('now');DEMO.dumpText=DUMP1;openDump()}],
 ['🚗 8:55 الصبح',()=>{mode(IS_ADHD?'one':'blocks');clock(at(8,55));base();closeSheetSafe();show('now')}],
 ['🧾 1:00 الضهر',()=>{mode(IS_ADHD?'one':'blocks');clock(at(13,0));base();const a=items.find(i=>i.title==='شغل في مدينة نصر');if(a&&!a.done){a.done=true;a.doneAt=at(10,0)}save();closeSheetSafe();show('now')}],
 ['🧩 4:30 العصر',()=>{mode(IS_ADHD?'one':'blocks');clock(at(16,30));base();markDone('فاتورة النت',13);const a=items.find(i=>i.title==='شغل في مدينة نصر');if(a&&!a.done){a.done=true;a.doneAt=at(10,0)}markDone('لبن، جبنة، حاجات للغدا',14);save();closeSheetSafe();show('now')}],
 ['🛍️ 7:00 عايز أشتري',()=>{mode(IS_ADHD?'one':'blocks');clock(at(19,0));closeSheetSafe();show('money');setTimeout(()=>{const i=document.getElementById('buyIn');i.value=BUY;setTimeout(()=>{askBuy(BUY);i.value=''},900)},400)}],
 ['📞 9:00 بالليل',()=>{mode(IS_ADHD?'one':'blocks');clock(at(21,0));base();markDone('أأكّل الكلبة',18);const r=items.find(i=>i.title==='أكتب تقرير الشهر للمدير');if(r&&!r.done){r.done=true;r.doneAt=at(17,10)}save();closeSheetSafe();show('now')}],
 ['⏳ 7:50 مود الانتظار',()=>{mode(IS_ADHD?'one':'blocks');clock(at(7,50));base();closeSheetSafe();if(IS_ADHD)mode('wait');show('now')}],
 ['😩 4:30 مش قادر أبدأ',()=>{mode('one');clock(at(16,30));base();markDone('فاتورة النت',13);closeSheetSafe();show('now');const r=items.find(i=>i.title==='أكتب تقرير الشهر للمدير');if(r&&IS_ADHD)setTimeout(()=>cantStart(r),500)}],
 ['🧑‍🤝‍🧑 4:35 جنبك',()=>{clock(at(16,35));base();closeSheetSafe();const r=items.find(i=>i.title==='أكتب تقرير الشهر للمدير');if(r){W.task=r.id;if(!r.steps)r.steps=DEMO.brain('breakdown',{}).steps.map(x=>({...x,done:false}));save()}mode(IS_ADHD?'with':'one');show('now')}],
 ['👩 6:00 مود الأم',()=>{clock(at(18,0));base();if(!HOME.kids.length){HOME.kids.push({id:'k1',name:'ياسين',age:'9',doc:'د. سامي',docPhone:''});const m=addItem({type:'med',sec:'health',title:'دوا ياسين (شراب الكحة)',due:L(20,0),repeat:'daily'});m.kid='k1';store.set('home',HOME)}closeSheetSafe();mode('mom');show('now')}],
 ['🗣️ 6:10 سلفت وعيد ميلاد',()=>{mode('mom');clock(at(18,10));closeSheetSafe();show('now');DEMO.dumpText=DUMP3;openDump()}],
 ['🌙 11:00 قبل النوم',()=>{mode(IS_ADHD?'one':'blocks');clock(at(23,0));base();markDone('أكلم أحمد وأفكّره بميعاد بكرة',21);save();closeSheetSafe();show('now');setTimeout(()=>{DEMO.dumpText=DUMP2;nightSheet()},500)}]];
{const T={'11:00':1380,'7:45':445,'7:50':470,'8:55':535,'1:00':780,'4:30 العصر':990,'4:30 مش':991,'4:35':995,'6:00':1080,'6:10':1090,'7:00':1140,'9:00':1260};const key=l=>{for(const k in T)if(l.includes(k))return T[k];return 9999};S.sort((x,y)=>key(x[0])-key(y[0]))}
function closeSheetSafe(){if(!document.getElementById('sheet').hidden)closeSheet()}
window.addEventListener('DOMContentLoaded',()=>{if(!store.get('seen',false))reset();const bar=document.getElementById('demoBar');bar.hidden=false;
 bar.innerHTML='<b>عرض تجريبي</b>'+S.map((s,k)=>`<button data-k="${k}">${s[0]}</button>`).join('')+'<button id="dmPrep">🔊 حضّر الأصوات</button><button id="dmReset">↺ من الأول</button>';
 bar.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{hush();bar.querySelectorAll('[data-k]').forEach(x=>x.classList.toggle('on',x===b));S[+b.dataset.k][1]();render()});
 document.getElementById('dmReset').onclick=()=>{hush();reset();clock(at(7,40));closeSheetSafe();show('now');toast('رجعنا لأول اليوم')};
 document.getElementById('dmPrep').onclick=prep});
async function prep(){const btn=document.getElementById('dmPrep');btn.textContent='⏳ بحضّر...';const lines=new Set();
 const snap=JSON.stringify({items,M,wish,places,people,pts,diary,nsn,travel});const t0=DEMO.t0,r0=DEMO.real0;
 reset();[[8,55],[13,0],[16,30],[21,0],[23,0]].forEach(([h,m],k)=>{clock(at(h,m));base();if(k>=1){const a=items.find(i=>i.title==='شغل في مدينة نصر');a.done=true}if(k>=2)markDone('فاتورة النت',13);if(k>=3){const r=items.find(i=>i.title==='أكتب تقرير الشهر للمدير');if(r)r.done=true}nudges().slice(0,1).forEach(n=>lines.add(n.p))});
 const V=verdict(DEMO.brain('talk',{text:BUY}).wants);lines.add(V.say);
 ['تمام، رتبت 8 حاجات. هفكّرك تتحرك لشغل مدينة نصر، وتكلم أحمد الساعة 9 بالليل.','تمام، حطيت البنك بكرة الصبح، وهفكّرك بهدية سارة قبل الخميس. نام وإنت مرتاح.','يلا، 3 دقايق بس، افتح الملف واكتب العنوان.','يلا، 3 دقايق بس. أنا معاك.','خلصت كل الخطوات!','تصبح على خير. الصوت هيوطى لوحده ويقف.'].forEach(l=>lines.add(l));
 [3,4,5,6].forEach(n=>lines.add('النهارده عملت '+n+' حاجات. '+'عاش! 👏'));
 const o=JSON.parse(snap);items=o.items;M=o.M;wish=o.wish;places=o.places;people=o.people;pts=o.pts;diary=o.diary;nsn=o.nsn;travel=o.travel;save();DEMO.t0=t0;DEMO.real0=r0;
 let ok=0;for(const l of lines){try{await ttsBlob(l,true);ok++}catch(e){}btn.textContent='⏳ '+ok+'/'+lines.size}
 btn.textContent='✅ '+ok+'/'+lines.size+' صوت جاهز';render()}
})();
