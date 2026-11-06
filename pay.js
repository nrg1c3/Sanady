/* ---------- Payments: one app, the right way to pay on each phone and in each country ----------
   - The Android app from Google Play: Google Play Billing (Digital Goods API inside the Play app).
   - iPhone and the browser: our checkout page — Paymob or Fawry in Egypt, Paddle everywhere else.
   Whatever the way, our server (n8n "sayvo-plan") checks the payment and answers with the plan, the end date and a
   restore code; the app then opens Sayvo Focus. No account: the restore code (also emailed after a web payment)
   brings the subscription back on a new phone. Nothing here charges anyone until the accounts are connected. */
const PAY_CFG={api:'sayvo-plan',sku:'sayvo_focus_monthly',skuYear:'sayvo_focus_yearly',playMethod:'https://play.google.com/billing'};
// opened from the Play app (a trusted web activity)? remembered, because only the first page load says so
if(document.referrer.startsWith('android-app://'))store.set('twa',true);
const PAY={
 channel(){if(store.get('twa',false)&&'getDigitalGoodsService' in window)return'play';return'web'},
 region(){return(typeof inEgypt==='function'&&inEgypt())?'eg':'intl'},
 priceText(){const p=store.get('payPrice',null);return p&&p.t?p.t+' في الشهر':''},
 async call(body){try{const r=await fetch(TAPI+PAY_CFG.api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({k:'wasl-nrg-2026',aid:store.get('aid',''),ed:ED},body))});
  if(!r.ok)return null;return await r.json()}catch(e){return null}},
 setPlan(j){if(!j||!j.plan)return false;store.set('plan',j.plan==='focus'?'focus':'free');store.set('planUntil',+j.until||0);if(j.key)store.set('payKey',String(j.key).slice(0,40));
  store.set('planChecked',Date.now());if(j.plan==='focus'&&!store.get('focus',false)){store.set('focus',true);store.set('focusAt',Date.now())}return true},
 async play(){const svc=await window.getDigitalGoodsService(PAY_CFG.playMethod);return svc},
 async loadPrice(){if(this.channel()!=='play')return;try{const svc=await this.play();const d=await svc.getDetails([PAY_CFG.sku]);
  if(d&&d[0]&&d[0].price){const p=d[0].price;store.set('payPrice',{t:new Intl.NumberFormat(undefined,{style:'currency',currency:p.currency}).format(+p.value)})}}catch(e){}},
 async buy(){if(this.channel()==='play')return this.buyPlay();return this.buyWeb()},
 async buyPlay(){try{const req=new PaymentRequest([{supportedMethods:PAY_CFG.playMethod,data:{sku:PAY_CFG.sku}}],{total:{label:'Total',amount:{currency:'USD',value:'0'}}});
  const res=await req.show();const token=res.details&&res.details.purchaseToken;
  const j=token?await this.call({act:'play',sku:PAY_CFG.sku,token}):null;
  if(j&&this.setPlan(j)){await res.complete('success');this.welcome()}else{await res.complete('fail');toast('الدفع ما اتأكدش. لو اتخصم منك فلوس، دوس «رجّع اشتراكك»')}}
  catch(e){if(e&&e.name!=='AbortError')toast('الدفع من جوجل بلاي مش متاح دلوقتي')}},
 async buyWeb(){const j=await this.call({act:'checkout',region:this.region(),lang:prof.lang||'eg'});
  if(j&&/^https:\/\//.test(j.url||'')){store.set('payPending',Date.now());location.href=j.url;return}
  openSheet(`<h2>⭐ ${PAID_NAME}</h2><div class="stack"><div class="say">الاشتراك لسه بيتجهز. لحد ما يجهز، كل حاجة مفتوحة ببلاش.</div>
  <p class="note">${this.region()==='eg'?'هتقدر تدفع بالكارت أو فوري أو المحفظة.':'You\'ll be able to pay by card.'}</p><button class="btn" id="pwOk">تمام</button></div>`);$('pwOk').onclick=closeSheet},
 restoreSheet(){openSheet(`<h2>رجّع اشتراكك</h2><div class="stack">
  ${this.channel()==='play'?'<button class="btn big" id="rsPlay">دوّر على اشتراكي في جوجل بلاي</button>':''}
  <label class="form">كود الاشتراك (اتبعتلك على الإيميل لما دفعت)<input id="rsKey" dir="ltr" autocomplete="off" value="${esc(store.get('payKey',''))}" placeholder="SAYVO-XXXX-XXXX"></label>
  <button class="btn" id="rsGo">رجّعه</button></div>`);
  if($('rsPlay'))$('rsPlay').onclick=async()=>{try{const svc=await this.play();const ps=await svc.listPurchases();let ok=false;
   for(const p of ps||[]){const j=await this.call({act:'play',sku:p.itemId,token:p.purchaseToken});if(this.setPlan(j)&&j.plan==='focus'){ok=true;break}}
   if(ok)this.welcome();else toast('ما لقيتش اشتراك شغال على الحساب ده')}catch(e){toast('جوجل بلاي مش متاح دلوقتي')}};
  $('rsGo').onclick=async()=>{const key=$('rsKey').value.trim().toUpperCase();if(!/^[A-Z0-9-]{8,40}$/.test(key)){toast('الكود مش مظبوط');return}
   const j=await this.call({act:'restore',key});if(this.setPlan(j)&&j.plan==='focus')this.welcome();else toast(j?'الكود ده مش عليه اشتراك شغال':'السيرفر مش متاح دلوقتي، جرّب كمان شوية')}},
 welcome(){openSheet(`<h2>🎉 أهلاً بيك في ${PAID_NAME}</h2><div class="stack"><div class="say">كل حاجة اتفتحت. ${store.get('payKey','')?'كود اشتراكك: <b dir="ltr">'+esc(store.get('payKey',''))+'</b>. احتفظ بيه عشان ترجّع اشتراكك على أي موبايل.':''}</div><button class="btn" id="pwOk">يلا</button></div>`);$('pwOk').onclick=()=>{closeSheet();render()}},
 // once a day: is the subscription still on? (also right after coming back from a web checkout)
 async refresh(force){const key=store.get('payKey',''),pend=store.get('payPending',0);if(!key&&!pend&&store.get('plan','free')==='free')return;
  if(!force&&!pend&&Date.now()-store.get('planChecked',0)<864e5)return;
  const j=await this.call({act:'status',key,pending:!!pend});if(j&&this.setPlan(j)){if(pend){store.set('payPending',0);if(j.plan==='focus')this.welcome()}return}
  if(store.get('plan','free')==='focus'&&store.get('planUntil',0)&&Date.now()>store.get('planUntil',0)+3*864e5)store.set('plan','free')} // ended and can't be confirmed: back to free after 3 days' grace
};
window.addEventListener('load',()=>{if(!IS_LIVE||DEMO)return;setTimeout(()=>{PAY.loadPrice();PAY.refresh()},2500)});
window.PAY=PAY;
