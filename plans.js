/* ---------- Sayvo plans: Free, Sayvo Plus, and Sayvo Focus+ (everything in Plus plus the focus tools, one subscription) ----------
   Until Google Play Billing is connected everything is open (the trial), but usage is counted per month
   so the limits switch on the day billing goes live (TRIAL=false and PLAN from the store purchase). */
const TRIAL=true;
const PLAN=()=>store.get('plan','free'); // 'free' | 'plus' | 'focus' (focus = Plus + Focus+ in one subscription)
const isPlus=()=>TRIAL||PLAN()==='plus'||PLAN()==='focus';
const isFocusPlan=()=>PLAN()==='focus';
const LIMITS={do:{free:3,plus:100},lecture_min:{free:0,plus:600},book:{free:0,plus:5}};
function usage(){const m=dayKey().slice(0,7);let u=store.get('usage',null);if(!u||u.m!==m)u={m};return u}
const used=k=>usage()[k]||0;
function useUp(k,n){const u=usage();u[k]=(u[k]||0)+(n||1);store.set('usage',u)}
const limitOf=k=>LIMITS[k][PLAN()==='free'?'free':'plus'];
function allowed(k,n){return TRIAL||used(k)+(n||1)<=limitOf(k)}
function paywall(why){openSheet(`<h2>⭐ Sayvo Plus</h2><div class="stack"><div class="say">${esc(why)}</div>
 <ul class="note" style="padding-inline-start:18px;line-height:1.9"><li>⚡ سندي يعملها من غير حد تقريباً، ويجهّز لوحده</li><li>📚 تلخيص المحاضرات والكتب</li><li>🔗 جوجل كالندر وجيميل</li><li>🏠 البيت المشترك، والصوت من غير حدود</li></ul>
 <button class="btn big" id="pwPlans">شوف الباقات</button><p class="note">الاشتراك هيبقى قريب. ولو عندك ADHD، Sayvo Focus+ فيه كل ده وأدوات التركيز في اشتراك واحد.</p></div>`);$('pwPlans').onclick=plansSheet}

/* the plans page */
plansSheet=function(){const row=(i,t,s)=>`<div class="wtask"><div class="tx"><b>${i} ${t}</b>${s?`<small class="note">${s}</small>`:''}</div></div>`;
 const u=usage();
 openSheet(`<h2>⭐ الباقات</h2>${TRIAL?'<p class="note">طول فترة التجربة كل حاجة مفتوحة ببلاش. السعر هيتعلن قبل ما التجربة تخلص.</p>':''}
 <p class="note">الشهر ده: ⚡ ${u.do||0} مرة · 🎓 ${Math.round(u.lecture_min||0)} دقيقة محاضرات · 📖 ${u.book||0} كتاب</p>
 <div class="card"><div class="ch"><h3>مجاني</h3><small>عشان تجرّب سندي</small></div>
 ${row('🎙️','فرّغ دماغك بالصوت','عدد مرات في اليوم')}${row('⏰','التذكير والمنبّه','يرن والتطبيق مقفول')}${row('🧾','الفواتير والفلوس والدفع')}${row('⚡','سندي يعملها','3 مرات في الشهر')}</div>
 <div class="card" style="border-color:var(--pri)"><div class="ch"><h3>Sayvo Plus</h3><small>الاشتراك الأساسي</small></div>
 ${row('⚡','سندي يعملها','يكتب ويخطط ويدوّر بدالك، ويجهّز لوحده')}${row('📚','تلخيص المحاضرات والكتب','10 ساعات محاضرات و5 كتب في الشهر')}${row('🔗','جوجل كالندر وجيميل')}${row('🏠','البيت المشترك','قايمة واحدة للبيت كله، مقفولة ومحدش يقراها غيركم')}${row('♾️','الصوت من غير حدود')}${row('📞','سندي يتصل بالنيابة عنك','قريباً')}</div>
 <div class="card"><div class="ch"><h3>${FP_ICON} Sayvo Focus+</h3><small>اشتراك واحد: كل اللي في Plus، ومعاه أدوات التركيز</small></div>
 ${row('⭐','كل اللي في Sayvo Plus')}${row('☝️','الشاشة البسيطة، و«جنبك»، والانتظار قبل المواعيد')}${row('🎧','مستشار في ودنك','يسمع الاجتماع أو المحادثة ويهمسلك بالرد المناسب')}${row('🤝','شريك متابعة كل أسبوع')}</div>`)};

/* "Sayvo does it" counts against the plan; preparing on its own is a Plus thing */
if(typeof doSheet==='function'){const _ds=doSheet;doSheet=function(it,force){if(it&&(!it.prep||force)&&!allowed('do')){paywall('خلصت مرات «سندي يعملها» المجانية للشهر ده. مع Sayvo Plus يعملها لك من غير ما تعدّ.');return}return _ds(it,force)}}
if(typeof doIt==='function'){const _di=doIt;doIt=async function(it,extra){const p=await _di(it,extra);if(p)useUp('do');return p}}
Object.assign(window,{isPlus,isFocusPlan,allowed,useUp,usage,paywall});
