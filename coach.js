/* ---------- Focus+: a whisper coach in your earbuds ----------
   During a talk, a meeting or a conversation, Sayvo listens and every so often (or when you tap "help me now")
   whispers one short line: what to say next, a good answer, a point you forgot, or "slow down, breathe".
   What's heard is sent only to be understood and is never kept. */
const COACH={on:false,paused:false,busy:false,rec:null,txt:'',lastLen:0,ignore:0,iv:null,ctx:'meeting',goal:'',notes:''};
const CO_CTX=[['present','🎤','عرض أو كلمة'],['meeting','👥','اجتماع'],['talk','🗣️','كلام مع حد'],['negotiate','🤝','تفاوض']];
function coachSheet(){if(!IS_ADHD){focusSheet();return}const c=store.get('coach',{ctx:'meeting',goal:'',notes:''});
 openSheet(`<h2>🎧 مستشار في ودنك</h2><div class="stack"><p class="note">البس السماعة. هسمع الكلام، وكل شوية أهمس في ودنك بجملة قصيرة تساعدك. ولو احتجتني على طول دوس «ساعدني دلوقتي».</p>
 <div class="chips" id="coC">${CO_CTX.map(([k,i,t])=>`<button class="chip ${c.ctx===k?'on':''}" data-c="${k}">${i} ${t}</button>`).join('')}</div>
 <label class="form">عايز توصل لإيه؟<input id="coG" value="${esc(c.goal||'')}" placeholder="مثلاً: أقنعهم يوافقوا على الميزانية"></label>
 <label class="form">نقط مهمة عايز تفتكرها (اختياري)<textarea id="coN" rows="3" placeholder="الأرقام، الأسماء، اللي عايز تقوله">${esc(c.notes||'')}</textarea></label>
 <label class="tog"><input type="checkbox" id="coOk" ${store.get('coachOk',false)?'checked':''}> فاهم إني مسؤول أعرّف اللي بكلمهم إن معايا مساعد بيسمع لو ده مطلوب عندي، ومش هستخدمه في امتحان أو مقابلة ممنوع فيها المساعدة.</label>
 <button class="btn big" id="coGo">🎧 ابدأ</button><p class="note">الكلام بيتبعت عشان يتفهم بس، ومش بيتحفظ عندنا ولا على الموبايل.</p></div>`);
 let ctx=c.ctx||'meeting';document.querySelectorAll('#coC .chip').forEach(b=>b.onclick=()=>{ctx=b.dataset.c;document.querySelectorAll('#coC .chip').forEach(x=>x.classList.toggle('on',x===b))});
 $('coGo').onclick=()=>{if(!$('coOk').checked){toast('علّم على الموافقة الأول');return}store.set('coachOk',true);
  const goal=$('coG').value.trim().slice(0,300),notes=$('coN').value.trim().slice(0,1200);store.set('coach',{ctx,goal,notes});coachStart(ctx,goal,notes)}}
function coachStart(ctx,goal,notes){if(!SR){toast('الموبايل ده مش بيدعم السماع. جرّب Chrome');return}
 Object.assign(COACH,{on:true,paused:false,busy:false,txt:'',lastLen:0,ignore:0,ctx,goal,notes});
 openSheet(`<h2>🎧 مستشار في ودنك</h2><div class="stack"><p class="note" id="coSt">🎙️ بسمع…</p>
 <div class="say coach" id="coSay">أنا معاك. ابدأ براحتك.</div><p class="note" id="coTip"></p>
 <button class="btn big" id="coHelp">🆘 ساعدني دلوقتي</button>
 <div class="acts"><button class="btn ghost" id="coP">⏸ وقفة</button><button class="btn ghost" id="coEnd">⏹ خلصت</button></div>
 <details><summary>اللي سامعه</summary><p class="note" id="coTx" dir="auto"></p></details></div>`);
 $('sheetX').onclick=()=>{coachStop();closeSheet()};
 $('coHelp').onclick=()=>coachAsk(true);$('coEnd').onclick=()=>{coachStop();closeSheet();toast('برافو عليك 👏')};
 $('coP').onclick=()=>{COACH.paused=!COACH.paused;$('coP').textContent=COACH.paused?'▶️ كمّل':'⏸ وقفة';$('coSt').textContent=COACH.paused?'⏸ واقف':'🎙️ بسمع…'};
 coachListen();COACH.iv=setInterval(()=>coachAsk(false),20000);agentLog('🎧 شغّلت المستشار في ودنك',null);try{noSleep&&noSleep()}catch(e){}}
function coachListen(){if(!COACH.on)return;let me;try{me=new SR()}catch(e){return}COACH.rec=me;me.lang=({gulf:'ar-AE',en:'en-US',fr:'fr-FR',es:'es-ES',de:'de-DE'})[prof.lang]||'ar-EG';me.continuous=true;me.interimResults=false;
 me.onresult=e=>{if(COACH.paused||Date.now()<COACH.ignore)return;for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal){COACH.txt=(COACH.txt+' '+r[0].transcript.trim()).slice(-2600)}}
  const tx=$('coTx');if(tx)tx.textContent=COACH.txt.slice(-600)};
 me.onerror=ev=>{if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){COACH.on=false;const s=$('coSt');if(s)s.textContent='🚫 لازم تسمح للميكروفون'}};
 me.onend=()=>{if(COACH.on&&COACH.rec===me)setTimeout(coachListen,250)};try{me.start()}catch(e){}}
async function coachAsk(ask){if(!COACH.on||COACH.busy||(COACH.paused&&!ask))return;const fresh=COACH.txt.length-COACH.lastLen;if(!ask&&fresh<60)return;
 COACH.busy=true;COACH.lastLen=COACH.txt.length;const st=$('coSt');if(st&&ask)st.textContent='💭 بفكّر…';
 const r=await brain('coach',{ctx:COACH.ctx,goal:COACH.goal,notes:COACH.notes,transcript:COACH.txt.slice(-2500),ask:!!ask,_wait:15000});COACH.busy=false;
 if(!COACH.on)return;if(st)st.textContent=COACH.paused?'⏸ واقف':'🎙️ بسمع…';
 const say=r&&typeof r.say==='string'?r.say.trim():'';const tip=r&&typeof r.tip==='string'?r.tip.trim():'';
 if(!say){if(ask&&$('coSay'))$('coSay').textContent='كمّل، إنت ماشي كويس.';return}
 if($('coSay'))$('coSay').textContent=say;if($('coTip'))$('coTip').textContent=tip;
 try{navigator.vibrate&&navigator.vibrate(40)}catch(e){}COACH.ignore=Date.now()+Math.min(9000,1500+say.length*90);const v=prof.voice;prof.voice=true;speak(say);prof.voice=v}
function coachStop(){COACH.on=false;clearInterval(COACH.iv);try{COACH.rec&&COACH.rec.stop()}catch(e){}COACH.rec=null;COACH.txt='';try{hush()}catch(e){}}
window.addEventListener('pagehide',coachStop);
Object.assign(window,{coachSheet,coachStop});
