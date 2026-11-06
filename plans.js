/* ---------- Sayvo plans: Free, and Sayvo Focus (paid: everything, one subscription) ----------
   Until payments are connected everything is open (the trial), but usage is counted per month
   so the limits switch on the day billing goes live (TRIAL=false; the plan comes from pay.js). */
const TRIAL=true;
const PLAN=()=>{const p=store.get('plan','free');return p==='plus'?'focus':p}; // 'free' | 'focus' (old 'plus' counts as focus)
const isPaid=()=>PLAN()==='focus';
const isPlus=()=>TRIAL||isPaid(); // kept for older callers: "has the paid features"
const isFocusPlan=isPaid;
const PAID_NAME='سايفو فوكس';
const LIMITS={do:{free:3,paid:100},lecture_min:{free:0,paid:600},book:{free:0,paid:5}};
function usage(){const m=dayKey().slice(0,7);let u=store.get('usage',null);if(!u||u.m!==m)u={m};return u}
const used=k=>usage()[k]||0;
function useUp(k,n){const u=usage();u[k]=(u[k]||0)+(n||1);store.set('usage',u)}
const limitOf=k=>LIMITS[k][isPaid()?'paid':'free'];
function allowed(k,n){return TRIAL||used(k)+(n||1)<=limitOf(k)}
function paywall(why){openSheet(`<h2>⭐ ${PAID_NAME}</h2><div class="stack"><div class="say">${esc(why)}</div>
 <ul class="note" style="padding-inline-start:18px;line-height:1.9"><li>⚡ سندي يعملها من غير حد تقريباً، ويجهّز لوحده</li><li>📚 تلخيص المحاضرات والكتب</li><li>🔗 جوجل كالندر وجيميل</li><li>🎯 أدوات التركيز والمستشار في ودنك</li></ul>
 <button class="btn big" id="pwPlans">شوف الباقات</button></div>`);$('pwPlans').onclick=plansSheet}

/* the plans page: two choices only */
plansSheet=function(){const row=(i,t,s)=>`<div class="wtask"><div class="tx"><b>${i} ${t}</b>${s?`<small class="note">${s}</small>`:''}</div></div>`;
 const u=usage(),paid=isPaid(),price=window.PAY&&PAY.priceText?PAY.priceText():'';
 openSheet(`<h2>⭐ الباقات</h2>${TRIAL&&!paid?'<p class="note">طول فترة التجربة كل حاجة مفتوحة ببلاش. السعر هيتعلن قبل ما التجربة تخلص.</p>':''}
 <p class="note">الشهر ده: ⚡ ${u.do||0} مرة · 🎓 ${Math.round(u.lecture_min||0)} دقيقة محاضرات · 📖 ${u.book||0} كتاب</p>
 <div class="card"><div class="ch"><h3>مجاني</h3><small>${paid?'':'إنت عليها دلوقتي'}</small></div>
 ${row('🎙️','فرّغ دماغك بالصوت','عدد مرات في اليوم')}${row('⏰','التذكير والمنبّه','يرن والتطبيق مقفول')}${row('🧾','الفواتير والفلوس')}${row('⚡','سندي يعملها','3 مرات في الشهر')}</div>
 <div class="card" style="border-color:var(--pri)"><div class="ch"><h3>${FP_ICON} ${PAID_NAME}</h3><small>${paid?'✓ إنت مشترك':(price||'كل حاجة، في اشتراك واحد')}</small></div>
 ${row('⚡','سندي يعملها','يكتب ويخطط ويدوّر بدالك، ويجهّز لوحده')}${row('📚','تلخيص المحاضرات والكتب','10 ساعات محاضرات و5 كتب في الشهر')}${row('🔗','جوجل كالندر وجيميل')}${row('🏠','البيت المشترك','قايمة واحدة للبيت كله، مقفولة ومحدش يقراها غيركم')}${row('♾️','الصوت من غير حدود')}
 ${row('🎯','أدوات التركيز','الشاشة البسيطة، و«جنبك»، والانتظار قبل المواعيد، وشريك متابعة')}${row('🎧','مستشار في ودنك','يسمع الاجتماع أو المحادثة ويهمسلك بالرد المناسب')}${row('📞','سندي يتصل بالنيابة عنك','قريباً، برصيد')}
 ${paid?'':`<button class="btn big" id="plBuy">اشترك في ${PAID_NAME}</button>`}<button class="link" id="plRestore">اشتركت قبل كده؟ رجّع اشتراكك</button></div>`);
 if($('plBuy'))$('plBuy').onclick=()=>window.PAY?PAY.buy():toast('الدفع لسه بيتجهز');
 $('plRestore').onclick=()=>window.PAY?PAY.restoreSheet():toast('الدفع لسه بيتجهز')};

/* "Sayvo does it" counts against the plan */
if(typeof doSheet==='function'){const _ds=doSheet;doSheet=function(it,force){if(it&&(!it.prep||force)&&!allowed('do')){paywall('خلصت مرات «سندي يعملها» المجانية للشهر ده. مع '+PAID_NAME+' يعملها لك من غير ما تعدّ.');return}return _ds(it,force)}}
if(typeof doIt==='function'){const _di=doIt;doIt=async function(it,extra){const p=await _di(it,extra);if(p)useUp('do');return p}}
Object.assign(window,{isPlus,isPaid,isFocusPlan,allowed,useUp,usage,paywall,PAID_NAME});
