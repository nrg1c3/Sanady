/* ---------- Focus+: a whisper coach in your earbuds ----------
   During a talk, a meeting or a conversation, Sayvo listens and every so often (or when you tap "help me now")
   whispers one short line: what to say next, a good answer, a point you forgot, or "slow down, breathe".
   What's heard is sent only to be understood and is never kept. */
const COACH={on:false,paused:false,busy:false,rec:null,txt:'',lastLen:0,iv:null,pt:null,again:false,lastSay:'',lastHeard:0,ctx:'meeting',goal:'',notes:''};
const CO_CTX=[['present','🎤','عرض أو كلمة'],['meeting','👥','اجتماع'],['talk','🗣️','كلام مع حد'],['negotiate','🤝','تفاوض']];
function coachSheet(){if(!IS_ADHD){focusSheet();return}const c=store.get('coach',{ctx:'meeting',goal:'',notes:''});
 openSheet(`<h2>🎧 مستشار في ودنك</h2><div class="stack"><p class="note">البس السماعة. هسمع الكلام، وكل شوية أهمس في ودنك بجملة قصيرة تساعدك. ولو احتجتني على طول دوس «ساعدني دلوقتي».</p>
 <div class="chips" id="coC">${CO_CTX.map(([k,i,t])=>`<button class="chip ${c.ctx===k?'on':''}" data-c="${k}">${i} ${t}</button>`).join('')}</div>
 <label class="form">عايز توصل لإيه؟<input id="coG" value="${esc(c.goal||'')}" placeholder="مثلاً: أقنعهم يوافقوا على الميزانية"></label>
 <label class="form">نقط مهمة عايز تفتكرها (اختياري)<textarea id="coN" rows="3" placeholder="الأرقام، الأسماء، اللي عايز تقوله">${esc(c.notes||'')}</textarea></label>
 <label class="tog"><input type="checkbox" id="coOk" ${store.get('coachOk',false)?'checked':''}> فاهم إني مسؤول أعرّف اللي بكلمهم إن معايا مساعد بيسمع لو ده مطلوب عندي، ومش هستخدمه في امتحان أو مقابلة ممنوع فيها المساعدة.</label>
 <label class="form">صوت الهمس<select id="coV"><option value="fast" ${store.get('coachVoice','fast')==='fast'?'selected':''}>سريع (صوت الموبايل)</option><option value="eg" ${store.get('coachVoice','fast')==='eg'?'selected':''}>مصري طبيعي (أبطأ شوية)</option></select></label>
 <button class="btn big" id="coGo">🎧 ابدأ</button><p class="note">الكلام بيتبعت عشان يتفهم بس، ومش بيتحفظ عندنا ولا على الموبايل.</p></div>`);
 let ctx=c.ctx||'meeting';document.querySelectorAll('#coC .chip').forEach(b=>b.onclick=()=>{ctx=b.dataset.c;document.querySelectorAll('#coC .chip').forEach(x=>x.classList.toggle('on',x===b))});
 $('coGo').onclick=()=>{if(!$('coOk').checked){toast('علّم على الموافقة الأول');return}store.set('coachOk',true);store.set('coachVoice',$('coV').value);
  const goal=$('coG').value.trim().slice(0,300),notes=$('coN').value.trim().slice(0,1200);store.set('coach',{ctx,goal,notes});coachStart(ctx,goal,notes)}}
function coachStart(ctx,goal,notes){if(!SR){toast('الموبايل ده مش بيدعم السماع. جرّب Chrome');return}
 Object.assign(COACH,{on:true,paused:false,busy:false,txt:'',lastLen:0,again:false,lastSay:'',lastHeard:Date.now(),ctx,goal,notes});
 openSheet(`<h2>🎧 مستشار في ودنك</h2><div class="stack"><p class="note" id="coSt">🎙️ بسمع…</p>
 <div class="say coach" id="coSay">أنا معاك. ابدأ براحتك.</div><p class="note" id="coTip"></p><p class="note" id="coLive" dir="auto"></p>
 <button class="btn big" id="coHelp">🆘 ساعدني دلوقتي</button>
 <div class="acts"><button class="btn ghost" id="coP">⏸ وقفة</button><button class="btn ghost" id="coEnd">⏹ خلصت</button></div>
 <details><summary>اللي سامعه</summary><p class="note" id="coTx" dir="auto"></p></details></div>`);
 $('sheetX').onclick=()=>{coachStop();closeSheet()};
 $('coHelp').onclick=()=>{if(COACH.mode==='hear'&&HEAR.voiced>0.3)hearFlush();coachAsk(true)};$('coEnd').onclick=()=>{coachStop();closeSheet();toast('برافو عليك 👏')};
 $('coP').onclick=()=>{COACH.paused=!COACH.paused;$('coP').textContent=COACH.paused?'▶️ كمّل':'⏸ وقفة';coachState()};
 COACH.mode='hear';hearStart().then(ok=>{if(!ok&&COACH.on){COACH.mode='sr';coachListen()}});COACH.iv=setInterval(coachWatch,3000);agentLog('🎧 شغّلت المستشار في ودنك',null);try{noSleep&&noSleep()}catch(e){}}
/* listening: answer each point right after you pause, not on a timer; keep the mic alive (Android stops it often,
   and after the whisper plays); don't throw away what you say while the whisper is playing */
function coachListen(){if(!COACH.on)return;let me;try{me=new SR()}catch(e){return}COACH.rec=me;COACH.lastHeard=Date.now();
 me.lang=({gulf:'ar-AE',en:'en-US',fr:'fr-FR',es:'es-ES',de:'de-DE'})[prof.lang]||'ar-EG';me.continuous=true;me.interimResults=true;
 const base=COACH.txt;
 me.onstart=()=>{COACH.lastHeard=Date.now();coachState()};
 me.onresult=e=>{COACH.lastHeard=Date.now();if(COACH.paused)return;const r=srText(e);
  let t=(base+' '+r.fin).trim();
  // the mic may hear our own whisper (phone speaker): drop it, only from what came in just after the whisper
  if(COACH.lastSay&&Date.now()-COACH.sayAt<12000&&t.length>COACH.sayLen){const head=t.slice(0,COACH.sayLen),tail=coachStrip(t.slice(COACH.sayLen),COACH.lastSay);t=(head+' '+tail).trim()}
  COACH.txt=t.slice(-2600);
  const tx=$('coTx');if(tx)tx.textContent=COACH.txt.slice(-600);const li=$('coLive');if(li)li.textContent=r.int?'🗣️ '+r.int:'';
  clearTimeout(COACH.pt);if(!r.int&&COACH.txt.length-COACH.lastLen>=25)COACH.pt=setTimeout(()=>coachAsk(false),900)}; // you paused: answer this point
 me.onerror=ev=>{if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){COACH.on=false;const s=$('coSt');if(s)s.textContent='🚫 لازم تسمح للميكروفون'}};
 me.onend=()=>{if(COACH.on&&COACH.rec===me){COACH.rec=null;setTimeout(()=>{if(COACH.on&&!COACH.rec)coachListen()},200)}};
 try{me.start()}catch(e){COACH.rec=null}}
/* beep-free hearing: Android plays a beep every time the phone's speech recognition starts or stops, and in the
   earbuds that comes every few seconds. So the coach records the mic itself (no beep), cuts it at your pauses, and
   sends only the parts with speech to our server to be written out (ElevenLabs Scribe); nothing is kept.
   Falls back to the phone's recognition if the mic can't be opened or the server can't hear. */
const HEAR={on:false,ctx:null,stream:null,proc:null,sink:null,chunks:[],len:0,voiced:0,quiet:0,nf:0.004,seq:0,next:0,done:{},fails:0,rate:16000};
async function hearStart(){if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)||!(window.AudioContext||window.webkitAudioContext))return false;
 try{HEAR.stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}catch(e){
  if(e&&e.name==='NotAllowedError'){COACH.on=false;const s=$('coSt');if(s)s.textContent='🚫 لازم تسمح للميكروفون';return true}return false}
 if(!COACH.on){hearStop();return true}
 const AC=window.AudioContext||window.webkitAudioContext;HEAR.ctx=new AC();try{await HEAR.ctx.resume()}catch(e){}
 const src=HEAR.ctx.createMediaStreamSource(HEAR.stream);HEAR.proc=HEAR.ctx.createScriptProcessor(4096,1,1);HEAR.sink=HEAR.ctx.createGain();HEAR.sink.gain.value=0;
 src.connect(HEAR.proc);HEAR.proc.connect(HEAR.sink);HEAR.sink.connect(HEAR.ctx.destination);
 Object.assign(HEAR,{on:true,chunks:[],len:0,voiced:0,quiet:0,seq:0,next:0,done:{},fails:0});COACH.rec=HEAR;COACH.lastHeard=Date.now();
 HEAR.proc.onaudioprocess=e=>{if(!HEAR.on)return;const d=e.inputBuffer.getChannelData(0),sr=e.inputBuffer.sampleRate,dur=d.length/sr;
  const speaking=(window.speechSynthesis&&speechSynthesis.speaking)||(typeof AUD!=='undefined'&&AUD&&!AUD.paused);
  if(COACH.paused||speaking){if(HEAR.voiced>0.5)hearFlush();else hearReset();return} // don't hear our own whisper
  let sum=0;for(let i=0;i<d.length;i++)sum+=d[i]*d[i];const rms=Math.sqrt(sum/d.length);
  const loud=rms>Math.max(0.012,HEAR.nf*3.2);if(!loud)HEAR.nf=HEAR.nf*0.95+rms*0.05; // follow the room's noise
  const step=sr/HEAR.rate,out=new Float32Array(Math.floor(d.length/step));for(let i=0;i<out.length;i++)out[i]=d[Math.floor(i*step)];
  HEAR.chunks.push(out);HEAR.len+=dur;if(loud){HEAR.voiced+=dur;HEAR.quiet=0;COACH.lastHeard=Date.now();const li=$('coLive');if(li)li.textContent='🗣️ …'}else HEAR.quiet+=dur;
  if(HEAR.voiced<0.25&&HEAR.len>2){hearReset();return} // only silence: drop it, keep a little lead-in
  if(HEAR.voiced>=0.5&&(HEAR.quiet>=0.7||HEAR.len>=12))hearFlush()};
 return true}
function hearReset(){const keep=HEAR.chunks.slice(-1);HEAR.chunks=keep;HEAR.len=keep.reduce((a,c)=>a+c.length/HEAR.rate,0);HEAR.voiced=0;HEAR.quiet=0}
function hearFlush(){if(!HEAR.chunks.length)return;const n=HEAR.chunks.reduce((a,c)=>a+c.length,0),pcm=new Float32Array(n);let o=0;HEAR.chunks.forEach(c=>{pcm.set(c,o);o+=c.length});
 HEAR.chunks=[];HEAR.len=0;HEAR.voiced=0;HEAR.quiet=0;const li=$('coLive');if(li)li.textContent='✍️ …';hearSend(HEAR.seq++,hearWav(pcm,HEAR.rate))}
function hearWav(pcm,rate){const b=new ArrayBuffer(44+pcm.length*2),v=new DataView(b);const w=(p,s)=>{for(let i=0;i<s.length;i++)v.setUint8(p+i,s.charCodeAt(i))};
 w(0,'RIFF');v.setUint32(4,36+pcm.length*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
 w(36,'data');v.setUint32(40,pcm.length*2,true);for(let i=0;i<pcm.length;i++){const x=Math.max(-1,Math.min(1,pcm[i]));v.setInt16(44+i*2,x<0?x*0x8000:x*0x7fff,true)}
 const u=new Uint8Array(b);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}
async function hearSend(seq,audio){let text='',ok=false;
 try{const ac=new AbortController(),to=setTimeout(()=>ac.abort(),15000);
  const r=await fetch(TTS_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k:'wasl-nrg-2026',stt:1,mime:'audio/wav',lang:prof.lang||'eg',audio}),signal:ac.signal});clearTimeout(to);
  if(r.ok){const j=await r.json();text=String(j.text||'').trim();ok=true}}catch(e){}
 if(!COACH.on)return;HEAR.fails=ok?0:HEAR.fails+1;
 if(HEAR.fails>=3&&COACH.mode==='hear'){hearStop();COACH.mode='sr';toast('السمع من السيرفر مش شغال، هسمع بالموبايل');coachListen();return}
 HEAR.done[seq]=text.replace(/^[.\s]+$/,'');while(HEAR.next in HEAR.done){const t=HEAR.done[HEAR.next];delete HEAR.done[HEAR.next];HEAR.next++;if(t)hearText(t)}}
function hearText(t){let add=t;if(COACH.lastSay&&Date.now()-COACH.sayAt<12000)add=coachStrip(t,COACH.lastSay);if(!add.trim())return;
 COACH.txt=(COACH.txt+' '+add).trim().slice(-2600);const tx=$('coTx');if(tx)tx.textContent=COACH.txt.slice(-600);const li=$('coLive');if(li)li.textContent='';
 if(COACH.txt.length-COACH.lastLen>=25)coachAsk(false)} // each chunk ends at a pause: answer this point
function hearStop(){HEAR.on=false;try{HEAR.proc&&(HEAR.proc.onaudioprocess=null,HEAR.proc.disconnect())}catch(e){}try{HEAR.stream&&HEAR.stream.getTracks().forEach(t=>t.stop())}catch(e){}
 try{HEAR.ctx&&HEAR.ctx.close()}catch(e){}HEAR.proc=HEAR.stream=HEAR.ctx=null;if(COACH.rec===HEAR)COACH.rec=null}
// drop words of our own last whisper if the mic picked them up
function coachStrip(t,say){const w=say.replace(/[^\p{L}\p{N}\s]/gu,'').split(/\s+/).filter(x=>x.length>2);if(w.length<3)return t;
 const words=t.split(/\s+/);for(let i=0;i<=words.length-3;i++){const win=words.slice(i,i+w.length).join(' ');const hit=w.filter(x=>win.includes(x)).length;if(hit/w.length>=.6)return(words.slice(0,i).join(' ')+' '+words.slice(i+w.length).join(' ')).trim()}return t}
function coachState(){const st=$('coSt');if(!st)return;st.textContent=COACH.paused?'⏸ واقف':COACH.busy?'💭 بفكّر…':COACH.rec?'🎙️ بسمع…':'🔄 بيشغّل المايك…'}
// keep the mic alive: if nothing has come in for a while, start listening again
function coachWatch(){if(!COACH.on||COACH.paused)return;if(COACH.mode==='hear'){coachState();return}if(!COACH.rec||Date.now()-COACH.lastHeard>12000){try{COACH.rec&&COACH.rec.abort()}catch(e){}COACH.rec=null;coachListen()}coachState()}
async function coachAsk(ask){if(!COACH.on||(COACH.paused&&!ask))return;if(COACH.busy){COACH.again=COACH.again||!!ask||true;return} // a new point while thinking: answer it right after
 const fresh=COACH.txt.slice(COACH.lastLen).trim();if(!ask&&fresh.length<25)return;
 COACH.busy=true;COACH.again=false;const upto=COACH.txt.length;coachState();
 const before=COACH.txt.slice(0,COACH.lastLen).slice(-2000);const transcript=(before?before+'\n— آخر حاجة اتقالت (رد عليها هي) —\n':'')+(fresh||COACH.txt.slice(-400));
 const r=await brain('coach',{ctx:COACH.ctx,goal:COACH.goal,notes:COACH.notes,transcript,ask:!!ask,_wait:12000});
 COACH.busy=false;COACH.lastLen=upto;if(!COACH.on)return;coachState();
 const say=r&&typeof r.say==='string'?r.say.trim():'';const tip=r&&typeof r.tip==='string'?r.tip.trim():'';
 if(say){if($('coSay'))$('coSay').textContent=say;if($('coTip'))$('coTip').textContent=tip;COACH.lastSay=say;COACH.sayAt=Date.now();COACH.sayLen=COACH.txt.length;
  try{navigator.vibrate&&navigator.vibrate(40)}catch(e){}coachSpeak(say)}else if(ask&&$('coSay'))$('coSay').textContent='كمّل، إنت ماشي كويس.';
 if(COACH.again||COACH.txt.length-COACH.lastLen>=25)setTimeout(()=>coachAsk(false),300)}
// whisper fast: the phone's own voice speaks at once; the Egyptian voice from the server is used when asked for in settings
function coachSpeak(say){if(store.get('coachVoice','fast')==='fast'&&window.speechSynthesis){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(say);
  u.lang=({gulf:'ar-AE',en:'en-US',fr:'fr-FR',es:'es-ES',de:'de-DE'})[prof.lang]||'ar-EG';u.rate=1.05;u.volume=.9;speechSynthesis.speak(u);return}catch(e){}}
 const v=prof.voice;prof.voice=true;speak(say);prof.voice=v}
function coachStop(){hearStop();COACH.on=false;clearInterval(COACH.iv);clearTimeout(COACH.pt);try{speechSynthesis.cancel()}catch(e){}try{COACH.rec&&COACH.rec.stop()}catch(e){}COACH.rec=null;COACH.txt='';try{hush()}catch(e){}}
window.addEventListener('pagehide',coachStop);
Object.assign(window,{coachSheet,coachStop,hearWav,HEAR});
