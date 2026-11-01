/* Sanady sounds: generated in the browser with Web Audio, no files needed */
const SND=(()=>{let ac=null,master=null,nodes=[],cur='off',vol=.55,fadeT=null;
 function ctx(){if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ac=new C();master=ac.createGain();master.gain.value=vol;master.connect(ac.destination)}if(ac.state==='suspended')ac.resume();return ac}
 function noise(kind){const n=ac.sampleRate*4,b=ac.createBuffer(2,n,ac.sampleRate);
  for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);let last=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
   for(let i=0;i<n;i++){const w=Math.random()*2-1;
    if(kind==='brown'){last=(last+.02*w)/1.02;d[i]=last*3.5}
    else if(kind==='pink'){b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11;b6=w*.115926}
    else d[i]=w*.35}}
  const s=ac.createBufferSource();s.buffer=b;s.loop=true;return s}
 function stopAll(){nodes.forEach(n=>{try{n.stop&&n.stop()}catch(e){}try{n.disconnect()}catch(e){}});nodes=[]}
 function play(kind){if(!ctx())return;stopAll();cur=kind;if(kind==='off')return;
  if(fadeT){clearInterval(fadeT);fadeT=null}master.gain.cancelScheduledValues(ac.currentTime);master.gain.setValueAtTime(vol,ac.currentTime);
  if(kind==='white'||kind==='brown'){const s=noise(kind==='white'?'white':'brown');const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=kind==='white'?9000:1200;s.connect(f).connect(master);s.start();nodes.push(s,f)}
  else if(kind==='rain'){const s=noise('pink');const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=400;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=7000;const g=ac.createGain();g.gain.value=.9;s.connect(hp).connect(lp).connect(g).connect(master);s.start();nodes.push(s,hp,lp,g);
   // drops: short filtered clicks
   const drops=noise('white');const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2500;bp.Q.value=4;const dg=ac.createGain();dg.gain.value=0;drops.connect(bp).connect(dg).connect(master);drops.start();nodes.push(drops,bp,dg);
   const tick=()=>{if(cur!=='rain')return;const t=ac.currentTime;dg.gain.setValueAtTime(.0,t);dg.gain.linearRampToValueAtTime(.25+Math.random()*.3,t+.005);dg.gain.exponentialRampToValueAtTime(.001,t+.06);bp.frequency.setValueAtTime(1500+Math.random()*3500,t);setTimeout(tick,40+Math.random()*180)};tick()}
  else if(kind==='waves'){const s=noise('brown');const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;const g=ac.createGain();g.gain.value=.5;const lfo=ac.createOscillator();lfo.frequency.value=.09;const lg=ac.createGain();lg.gain.value=.45;lfo.connect(lg).connect(g.gain);s.connect(lp).connect(g).connect(master);s.start();lfo.start();nodes.push(s,lp,g,lfo,lg)}}
 function setVol(v){vol=v;if(master&&!fadeT)master.gain.setValueAtTime(v,ac.currentTime)}
 function fadeOut(min,done){if(!ac||cur==='off'){done&&done();return}const t=ac.currentTime;master.gain.cancelScheduledValues(t);master.gain.setValueAtTime(vol,t);master.gain.linearRampToValueAtTime(.0001,t+min*60);
  fadeT=setTimeout(()=>{fadeT=null;stopAll();cur='off';master.gain.setValueAtTime(vol,ac.currentTime);done&&done()},min*60000)}
 function chime(){if(!ctx())return;const t=ac.currentTime;[660,880,990].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.18);g.gain.linearRampToValueAtTime(.25,t+i*.18+.02);g.gain.exponentialRampToValueAtTime(.001,t+i*.18+1.2);o.connect(g).connect(ac.destination);o.start(t+i*.18);o.stop(t+i*.18+1.3)})}
 return{play,setVol,fadeOut,chime,get cur(){return cur},unlock(){ctx()}}})();
