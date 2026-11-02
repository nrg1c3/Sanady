/* ---------- languages: the app is written in Egyptian Arabic; this turns the screen into English, French, Spanish or German ----------
   Loaded first. Picks the language (settings → link ?lang= → phone language), loads that language's word list
   (i18n-xx.js, only when needed) and translates every text that appears on screen, as it appears.
   The brain, the microphone and the voice follow the same setting (prof.lang). */
(function(){
'use strict';
// people who used Sanady ADHD (sn_) or Mudabbir (sm_) on this phone keep their data in Sayvo (sy_); Sanady users get Focus+
try{if(localStorage.getItem('sy_seen')===null){const from=localStorage.getItem('sn_seen')!==null?'sn_':localStorage.getItem('sm_seen')!==null?'sm_':'';
 if(from){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(from)&&localStorage.getItem('sy_'+k.slice(3))===null)localStorage.setItem('sy_'+k.slice(3),localStorage.getItem(k))}
  if(from==='sn_'&&localStorage.getItem('sy_focus')===null)localStorage.setItem('sy_focus','true')}}}catch(e){}
const DK='sy_';
const PFX=new URLSearchParams(location.search).has('demo')?'sydemo_':DK;
const UI=['en','fr','es','de'];
const rd=k=>{try{return JSON.parse(localStorage.getItem(PFX+k))}catch(e){return null}};
const prof0=rd('prof')||{};
const q=(new URLSearchParams(location.search).get('lang')||'').slice(0,2).toLowerCase();
const nav=((navigator.languages&&navigator.languages[0])||navigator.language||'ar').toLowerCase();
// the language the person chose wins; then a ?lang= link; then the phone's language (Arabic phones stay Arabic)
// many people in Egypt and the Gulf keep their phone in English: there, Arabic stays the default
let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
const ARTZ=/^(Africa\/(Cairo|Tripoli|Tunis|Algiers|Casablanca|Khartoum|Nouakchott)|Asia\/(Riyadh|Dubai|Kuwait|Qatar|Bahrain|Muscat|Amman|Baghdad|Beirut|Damascus|Aden|Gaza|Hebron))$/;
let L=prof0.lang?(UI.includes(prof0.lang)?prof0.lang:'ar'):(q==='ar'?'ar':UI.includes(q)?q:nav.startsWith('ar')||ARTZ.test(tz)?'ar':UI.includes(nav.slice(0,2))?nav.slice(0,2):'en');
window.UI_LANG=L;window.I18N_DICT=window.I18N_DICT||null;
if(L==='ar'){window.tr=s=>s;return}
document.documentElement.lang=L;document.documentElement.dir='ltr';
// the word list for this language, loaded before the app draws anything
const me=document.currentScript&&document.currentScript.src||'';const base=me.replace(/[^/]*$/,'');
document.write('<script src="'+base+'i18n-'+L+'.js?v=1"><\/script>');

/* currency: the Arabic text says جنيه; show the person's own currency */
const REG=(nav.split('-')[1]||'').toUpperCase();
const EUR='AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' ');
const CUR=prof0.cur||(REG==='US'?'$':REG==='GB'?'£':REG==='CA'?'C$':REG==='AU'?'A$':REG==='IN'?'₹':EUR.includes(REG)?'€':REG==='EG'?'EGP':REG==='AE'?'AED':REG==='SA'?'SAR':L==='en'?'$':L==='es'&&!REG?'$':'€');
const pre=/^[$£€₹]|^[A-Z]\$$/.test(CUR);
const UNITS=({en:{'يوم':['day','days'],'دقيقة':['minute','minutes'],'ساعة':['hour','hours'],'حاجة':['thing','things'],'مرة':['time','times'],'خطوة':['step','steps'],'أسبوع':['week','weeks'],'شهر':['month','months']},
 fr:{'يوم':['jour','jours'],'دقيقة':['minute','minutes'],'ساعة':['heure','heures'],'حاجة':['chose','choses'],'مرة':['fois','fois'],'خطوة':['étape','étapes'],'أسبوع':['semaine','semaines'],'شهر':['mois','mois']},
 es:{'يوم':['día','días'],'دقيقة':['minuto','minutos'],'ساعة':['hora','horas'],'حاجة':['cosa','cosas'],'مرة':['vez','veces'],'خطوة':['paso','pasos'],'أسبوع':['semana','semanas'],'شهر':['mes','meses']},
 de:{'يوم':['Tag','Tage'],'دقيقة':['Minute','Minuten'],'ساعة':['Stunde','Stunden'],'حاجة':['Sache','Sachen'],'مرة':['Mal','Mal'],'خطوة':['Schritt','Schritte'],'أسبوع':['Woche','Wochen'],'شهر':['Monat','Monate']}})[L];
const AMPM={'الصبح':'AM','الضهر':'PM','بالليل':'PM'};
const H24=L!=='en'; // French, Spanish and German read 24-hour time
const AR=/[؀-ۿ]/;
let D=null,RX=null,miss=new Set();const cache=new Map();
function ready(){if(D)return true;if(!window.I18N_DICT)return false;D=window.I18N_DICT;
 const ks=Object.keys(D).filter(k=>D[k]&&k.length>1).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 RX=new RegExp('(?<![\\u0600-\\u06FF])(?:'+ks.join('|')+')(?![\\u0600-\\u06FF])','g');return true}
const MORE={en:(n,u)=>n+' more '+u,fr:(n,u)=>n+' autre'+(+n>1?'s ':' ')+u,es:(n,u)=>n+' '+u+' más',de:(n,u)=>n+' weitere '+u}[L];
const BASE={'أيام':'يوم','دقايق':'دقيقة','ساعات':'ساعة','حاجات':'حاجة','مرات':'مرة','خطوات':'خطوة','أسابيع':'أسبوع','شهور':'شهر'};
const unit=(n,u)=>{const U=UNITS[BASE[u]||u];return U?U[+n===1?0:1]:null};
function core(s){
 const t0=s.trim();if(D[t0])return s.replace(t0,D[t0]);
 // numbers with words around them are rebuilt first and kept aside, so the word list doesn't split them
 const keep=[];const K=v=>{keep.push(v);return ''+(keep.length-1)+''};
 s=s.replace(/(\d{1,2})(?::(\d\d))?\s*(الصبح|الضهر|بالليل)/g,(m,h,mm,ap)=>{h=+h;mm=mm||'00';
  if(!H24)return K(h+(mm!=='00'?':'+mm:'')+' '+AMPM[ap]);const H=ap==='الصبح'?h%12:(h===12?12:h+12);return K(H+':'+mm)});
 s=s.replace(/(?<![\d؀-ۿ])(ساعة|ساعتين) و(?=\d)/g,(m,h)=>(h==='ساعة'?'1':'2')+' ساعة ');
 s=s.replace(/(?<![؀-ۿ])(يومين|ساعتين|دقيقتين|مرتين|أسبوعين|شهرين)(?![؀-ۿ])/g,(m,w)=>K('2 '+unit(2,{'يومين':'يوم','ساعتين':'ساعة','دقيقتين':'دقيقة','مرتين':'مرة','أسبوعين':'أسبوع','شهرين':'شهر'}[w])));
 const UW='يوم|أيام|دقيقة|دقايق|ساعة|ساعات|حاجة|حاجات|مرة|مرات|خطوة|خطوات|أسبوع|أسابيع|شهر|شهور';
 s=s.replace(new RegExp('(\\d+)\\s+(حاجة|حاجات) (تانية|تانيين|كمان)(?![\\u0600-\\u06FF])','g'),(m,n,u)=>K(MORE(n,unit(n,u))));
 s=s.replace(new RegExp('(\\d+)\\s+('+UW+')(?![\\u0600-\\u06FF])','g'),(m,n,u)=>{const w=unit(n,u);return w?K(n+' '+w):m});
 s=s.replace(/(\d[\d,.]*)\s*(ج|جنيه)(?![؀-ۿ])/g,(m,n)=>K(n+' ¤')).replace(/(\d+)\s*د(?![؀-ۿ])/g,(m,n)=>K(n+' '+(L==='de'?'Min.':'min'))).replace(/(\d+)\s*س(?![؀-ۿ])/g,(m,n)=>K(n+' '+(L==='de'?'Std.':'h')));
 const t=s.trim();if(D[t])s=s.replace(t,D[t]);else s=s.replace(RX,k=>D[k]||k);
 s=s.replace(/(^|\s)و(?=|\d)/g,'$1'+({en:'and ',fr:'et ',es:'y ',de:'und '}[L]));
 return s.replace(/(\d+)/g,(m,i)=>keep[+i])}
function tr(s){if(s==null)return s;s=String(s);if(!AR.test(s)||!ready())return s;
 if(cache.has(s))return cache.get(s);
 let x=s.replace(/مُدبّر|مدبّر|سايفو/g,'سندي');x=core(x);
 x=x.replace(/(\d[\d,.]*)\s*¤/g,(m,n)=>pre?CUR+n:n+' '+CUR).replace(/¤/g,CUR).replace(/ {2,}/g,' ');
 x=x.replace(/Sanady|Mudabbir/g,'Sayvo');
 if(AR.test(x)&&miss.size<500)miss.add(s);
 if(cache.size>4000)cache.clear();cache.set(s,x);return x}
window.tr=tr;window.__i18nMiss=miss;

/* translate the page as it changes */
const SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,NOSCRIPT:1};
const ATTR=['placeholder','title','aria-label'];
function tNode(t){const p=t.parentNode;if(!p||SKIP[p.nodeName]||p.isContentEditable)return;const v=t.nodeValue;if(!v||!AR.test(v))return;const n=tr(v);if(n!==v)t.nodeValue=n}
function tEl(e){for(const a of ATTR){const v=e.getAttribute&&e.getAttribute(a);if(v&&AR.test(v)){const n=tr(v);if(n!==v)e.setAttribute(a,n)}}
 if(e.nodeName==='INPUT'&&/^(button|submit)$/.test(e.type)&&AR.test(e.value))e.value=tr(e.value)}
function walk(n){if(!n)return;if(n.nodeType===3)return tNode(n);if(n.nodeType!==1||SKIP[n.nodeName])return;tEl(n);
 const w=document.createTreeWalker(n,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let x;while((x=w.nextNode())){if(x.nodeType===3)tNode(x);else tEl(x)}}
function all(){if(!ready())return;walk(document.body);if(AR.test(document.title))document.title=tr(document.title)}
new MutationObserver(ms=>{if(!ready())return;for(const m of ms){if(m.type==='characterData')tNode(m.target);else if(m.type==='attributes')tEl(m.target);else m.addedNodes.forEach(walk)}})
 .observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR});

/* things that are not on the page: dialogs and notifications */
const _c=window.confirm.bind(window),_a=window.alert.bind(window),_p=window.prompt.bind(window);
window.confirm=m=>_c(tr(m));window.alert=m=>_a(tr(m));window.prompt=(m,d)=>_p(tr(m),d);
if(window.ServiceWorkerRegistration){const sn=ServiceWorkerRegistration.prototype.showNotification;
 ServiceWorkerRegistration.prototype.showNotification=function(title,o){o=Object.assign({},o||{});o.body=tr(o.body);o.lang=L;o.dir='ltr';
  if(o.actions)o.actions=o.actions.map(a=>Object.assign({},a,{title:tr(a.title)}));return sn.call(this,tr(title),o)}}
if(window.Notification){try{const N=window.Notification;window.Notification=function(t,o){o=Object.assign({},o||{});o.body=tr(o.body);o.dir='ltr';o.lang=L;return new N(tr(t),o)};
 Object.setPrototypeOf(window.Notification,N);window.Notification.prototype=N.prototype;Object.defineProperty(window.Notification,'permission',{get:()=>N.permission})}catch(e){}}

/* after the app's own code has loaded */
document.addEventListener('DOMContentLoaded',()=>{
 const st=document.createElement('style');
 st.textContent='.acts:has([data-x="m"]){display:none!important}.next .empty{text-align:start}.sx{left:auto;right:12px}.sbox h2{padding-left:0;padding-right:44px}';
 document.head.appendChild(st);
 all();
 try{ // remember the choice, so the brain, microphone and voice use it too
  if(typeof prof!=='undefined'&&!prof.lang){prof.lang=L;if(typeof save==='function')save()}
  if(typeof KV!=='undefined'){const s0=KV.set.bind(KV);KV.set=(k,v)=>{if(k==='alarms'&&v&&Array.isArray(v.list))v=Object.assign({},v,{list:v.list.map(a=>Object.assign({},a,{text:tr(a.text)}))});return s0(k,v)};s0('lang',L)}
 }catch(e){}
 setTimeout(all,50)});
window.addEventListener('load',()=>setTimeout(all,0));
})();
