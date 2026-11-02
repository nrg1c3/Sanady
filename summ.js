/* ---------- Sayvo Plus: summarize a lecture or a book ----------
   Lecture: the phone writes down what's said (its own speech recognition), then Sayvo summarizes it: key points,
   terms, review questions, and any assignment or exam date becomes a task. Book: a PDF, photos of pages, or pasted text,
   summarized part by part, then as a whole. The material is sent only to be summarized and is never kept on our server;
   the summaries stay on the phone. */
let SUMMS=store.get('summs',[]);const saveSumms=()=>store.set('summs',SUMMS.slice(-30));
const PART=38000;
function summSheet(){openSheet(`<h2>📚 لخّصلي</h2><div class="stack"><p class="note">محاضرة، أو كتاب، أو أي نص طويل. بطلعلك الملخص وأهم النقط والمصطلحات وأسئلة مراجعة، وأي ميعاد أو واجب بيتحط مهمة.</p>
 <button class="btn big" id="smLec">🎓 سجّل محاضرة دلوقتي</button>
 <div class="row2"><label class="btn ghost" for="smPdf">📄 ملف PDF</label><label class="btn ghost" for="smImg">📷 صوّر صفحات</label></div>
 <input type="file" id="smPdf" accept="application/pdf" hidden><input type="file" id="smImg" accept="image/*" multiple hidden>
 <details><summary>📋 الصق نص</summary><div class="form"><input id="smT" placeholder="العنوان"><textarea id="smX" rows="6" placeholder="الصق النص هنا"></textarea><button class="btn ghost" id="smGo">لخّص</button></div></details>
 ${SUMMS.length?`<p><b>ملخصاتك</b></p>${SUMMS.slice().reverse().map(s=>`<button class="pick" data-s="${s.id}"><i>${s.kind==='lecture'?'🎓':'📖'}</i><span><b>${esc(s.title)}</b><small>${esc(fmtWhen(toLocal(new Date(s.at))))}</small></span></button>`).join('')}`:''}</div>`);
 $('smLec').onclick=lecSheet;
 $('smPdf').onchange=e=>{const f=e.target.files[0];if(f)pdfSumm(f)};
 $('smImg').onchange=e=>{const fs=[...e.target.files];if(fs.length)imgSumm(fs)};
 $('smGo').onclick=()=>{const x=$('smX').value.trim();if(x.length<200){toast('النص قصير قوي');return}runSumm('book',$('smT').value.trim()||x.slice(0,40),{text:x})};
 document.querySelectorAll('#sheetBody [data-s]').forEach(b=>b.onclick=()=>showSumm(SUMMS.find(s=>s.id===b.dataset.s)))}

/* recording a lecture with the phone's own speech recognition */
const LEC={on:false,txt:'',t0:0,rec:null,wl:null,iv:null,paused:false};
function lecSheet(){if(!isPlus()){paywall('تلخيص المحاضرات والكتب جزء من Sayvo Plus.');return}if(!SR){toast('الموبايل ده مش بيدعم السماع. جرّب Chrome');return}
 openSheet(`<h2>🎓 محاضرة</h2><div class="stack"><label class="form">اسم المادة أو المحاضرة<input id="lcT" placeholder="مثلاً: تسويق رقمي، المحاضرة 3"></label>
 <p class="note">حط الموبايل قريب من الدكتور، وسيب الشاشة مفتوحة. الكلام بيتكتب على موبايلك، ولما تخلص بلخّصه.</p><button class="btn big" id="lcGo">🔴 ابدأ التسجيل</button></div>`);
 $('lcGo').onclick=()=>lecStart($('lcT').value.trim()||'محاضرة')}
async function lecStart(title){Object.assign(LEC,{on:true,txt:'',t0:Date.now(),paused:false,title});
 try{LEC.wl=navigator.wakeLock&&await navigator.wakeLock.request('screen')}catch(e){}
 openSheet(`<h2>🔴 ${esc(title)}</h2><div class="stack"><div class="kbig num" id="lcTm">00:00</div><p class="note" id="lcN">بسمع…</p>
 <details><summary>اللي اتكتب لحد دلوقتي</summary><p class="note" id="lcX" dir="auto"></p></details>
 <div class="acts"><button class="btn ghost" id="lcP">⏸ وقفة</button><button class="btn" id="lcStop">⏹ خلصت، لخّص</button></div></div>`);
 $('sheetX').onclick=()=>{if(confirm('توقف التسجيل من غير ملخص؟')){lecStop();closeSheet()}};
 $('lcP').onclick=()=>{LEC.paused=!LEC.paused;$('lcP').textContent=LEC.paused?'▶️ كمّل':'⏸ وقفة'};
 $('lcStop').onclick=()=>{const txt=LEC.txt.trim(),mins=(Date.now()-LEC.t0)/6e4;lecStop();if(txt.length<300){toast('الكلام اللي اتسجل قليل قوي');closeSheet();return}
  if(!allowed('lecture_min',mins)){paywall('خلصت ساعات المحاضرات للشهر ده.');return}useUp('lecture_min',mins);runSumm('lecture',title,{text:txt})};
 LEC.iv=setInterval(()=>{const s=Math.floor((Date.now()-LEC.t0)/1000),e=$('lcTm');if(e)e.textContent=pad(Math.floor(s/60))+':'+pad(s%60);const n=$('lcN');if(n)n.textContent=LEC.paused?'⏸ واقف':'🎙️ بسمع… '+LEC.txt.split(/\s+/).filter(Boolean).length+' كلمة'},1000);
 lecListen()}
function lecListen(){if(!LEC.on)return;let me;try{me=new SR()}catch(e){return}LEC.rec=me;me.lang=({gulf:'ar-AE',en:'en-US',fr:'fr-FR',es:'es-ES',de:'de-DE'})[prof.lang]||'ar-EG';me.continuous=true;me.interimResults=false;
 const base=LEC.txt;me.onresult=e=>{if(LEC.paused)return;LEC.txt=(base+' '+srText(e).fin).trim();const x=$('lcX');if(x)x.textContent=LEC.txt.slice(-500)};
 me.onend=()=>{if(LEC.on&&LEC.rec===me)setTimeout(lecListen,200)};try{me.start()}catch(e){}}
function lecStop(){LEC.on=false;clearInterval(LEC.iv);try{LEC.rec&&LEC.rec.stop()}catch(e){}LEC.rec=null;try{LEC.wl&&LEC.wl.release()}catch(e){}}

/* books: PDF text (pdf.js, loaded only when needed) or photos of pages */
function loadPdfJs(){return new Promise((res,rej)=>{if(window.pdfjsLib)return res(pdfjsLib);const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
 s.onload=()=>{try{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}catch(e){}res(pdfjsLib)};s.onerror=rej;document.head.appendChild(s)})}
async function pdfSumm(file){if(!isPlus()){paywall('تلخيص المحاضرات والكتب جزء من Sayvo Plus.');return}if(!allowed('book')){paywall('خلصت كتب الشهر ده.');return}
 progress('📖 بقرا الملف…');let text='';
 try{const lib=await loadPdfJs();const pdf=await lib.getDocument({data:await file.arrayBuffer()}).promise;const n=Math.min(pdf.numPages,400);
  for(let p=1;p<=n;p++){const pg=await pdf.getPage(p);const c=await pg.getTextContent();text+=c.items.map(i=>i.str).join(' ')+'\n';if(p%10===0)progress('📖 بقرا الصفحات… '+p+' من '+n)}}
 catch(e){toast('ما قدرتش أقرا الملف ده');closeSheet();return}
 if(text.replace(/\s/g,'').length<500){openSheet('<h2>📄 الملف ده صور</h2><div class="stack"><p>الملف ده عبارة عن صور مش نص. صوّر الصفحات المهمة من «📷 صوّر صفحات» وأنا أقراها.</p></div>');return}
 useUp('book');runSumm('book',file.name.replace(/\.pdf$/i,''),{text})}
async function imgSumm(files){if(!isPlus()){paywall('تلخيص المحاضرات والكتب جزء من Sayvo Plus.');return}if(!allowed('book')){paywall('خلصت كتب الشهر ده.');return}
 files=files.slice(0,36);progress('📷 بجهّز الصور…');const imgs=[];
 for(const f of files){try{imgs.push(await shrink(f))}catch(e){}}
 if(!imgs.length){toast('ما قدرتش أقرا الصور');closeSheet();return}useUp('book');runSumm('book',files.length+' صفحات',{images:imgs})}
function shrink(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1280/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.72).split(',')[1])};im.onerror=rej;im.src=r.result};r.onerror=rej;r.readAsDataURL(f)})}
function progress(t){if($('sheet').hidden||!$('smProg'))openSheet(`<h2>📚 لخّصلي</h2><div class="stack"><div class="say" id="smProg"></div><div class="dots"><i class="on"></i><i></i><i></i></div></div>`);$('smProg').textContent=t}

/* summarizing: one call for short material, otherwise notes per part and then one summary of the notes */
async function runSumm(kind,title,src){const parts=[];
 if(src.images){for(let i=0;i<src.images.length;i+=6)parts.push({images:src.images.slice(i,i+6)})}
 else{const t=src.text;for(let i=0;i<t.length;i+=PART)parts.push({text:t.slice(i,i+PART)})}
 let res=null;
 if(parts.length===1&&parts[0].text){progress('✍️ بلخّص…');res=await brain('summ',{kind,stage:'final',title,text:parts[0].text,_wait:90000})}
 else{const notes=[];for(let i=0;i<parts.length;i++){progress(`📖 بقرا الجزء ${i+1} من ${parts.length}…`);
   const r=await brain('summ',Object.assign({kind,stage:'part',title,part:{i:i+1,n:parts.length},_wait:90000},parts[i]));if(r&&r.notes)notes.push(r.notes)}
  if(!notes.length){toast('النت مش مساعد دلوقتي. جرّب تاني');closeSheet();return}
  progress('✍️ بجمّع الملخص…');res=await brain('summ',{kind,stage:'final',title,notes:notes.join('\n\n'),_wait:90000})}
 if(!res||!res.summary){toast('ما قدرتش ألخّص دلوقتي. جرّب تاني');closeSheet();return}
 const s={id:uid(),kind,title:String(title).slice(0,120),at:nowMs(),summary:String(res.summary||''),points:(res.points||[]).slice(0,12),terms:(res.terms||[]).slice(0,14),questions:(res.questions||[]).slice(0,10),tasks:(res.tasks||[]).slice(0,8),apply:(res.apply||[]).slice(0,4)};
 SUMMS.push(s);saveSumms();agentLog(`📚 لخّصت «${s.title}»`,null);showSumm(s)}
function showSumm(s){if(!s)return;const L=a=>a.map(x=>`<li>${esc(typeof x==='string'?x:'')}</li>`).join('');
 openSheet(`<h2>${s.kind==='lecture'?'🎓':'📖'} ${esc(s.title)}</h2><div class="stack sumv">
 <div class="say">${esc(s.summary)}</div>
 ${s.points.length?`<h3>أهم النقط</h3><ul>${L(s.points)}</ul>`:''}
 ${s.terms.length?`<h3>المصطلحات</h3><ul>${s.terms.map(t=>`<li><b>${esc(t.t||'')}</b>: ${esc(t.d||'')}</li>`).join('')}</ul>`:''}
 ${s.questions.length?`<h3>أسئلة مراجعة</h3>${s.questions.map(q=>`<details><summary>${esc(q.q||q)}</summary><p>${esc(q.a||'')}</p></details>`).join('')}`:''}
 ${s.tasks.length?`<h3>مهام ومواعيد</h3>${s.tasks.map((t,i)=>`<div class="wtask"><div class="tx"><b>${esc(t.title||'')}</b>${t.due?`<small class="note">${esc(fmtWhen(t.due.length===10?t.due+'T10:00':t.due))}</small>`:''}</div><button class="btn ghost" data-ta="${i}" style="min-height:44px;padding:0 12px">ضيفها</button></div>`).join('')}`:''}
 ${s.apply.length?`<h3>تطبّقها إزاي</h3><ul>${L(s.apply)}</ul>`:''}
 <div class="acts"><button class="btn ghost" id="svCp">انسخ الملخص</button><button class="btn ghost" id="svDel">امسحه</button></div></div>`);
 document.querySelectorAll('#sheetBody [data-ta]').forEach(b=>b.onclick=()=>{const t=s.tasks[+b.dataset.ta];addItem({title:t.title,type:'task',sec:s.kind==='lecture'?'study':'home',due:t.due?(t.due.length===10?t.due+'T10:00':t.due):''});b.disabled=true;b.textContent='✓';render()});
 $('svCp').onclick=()=>{const t=[s.title,'',s.summary,'',...s.points.map(p=>'• '+p)].join('\n');try{navigator.clipboard.writeText(t).catch(()=>{})}catch(e){}toast('اتنسخ')};
 $('svDel').onclick=()=>{SUMMS=SUMMS.filter(x=>x.id!==s.id);saveSumms();closeSheet()}}
document.addEventListener('DOMContentLoaded',()=>{const q=$('qSumm');if(q)q.onclick=summSheet});
window.addEventListener('pagehide',lecStop);
Object.assign(window,{summSheet,showSumm,runSumm});
