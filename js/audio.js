'use strict';
/* Grid 2026 — 音效 */
/* ================= AUDIO ================= */
let audio=null,muted=ls.get('grid26.mute')==='1';
// five engine voices: [2nd osc type, 2nd ratio, sub level, filter base Hz, distortion, turbo whistle, MGU-K whine, pops]
const VOICE=[['square',2,0.5,900,8,0.15,0.2,0.2],['sawtooth',3,0.2,1750,4,0.5,0.15,0.05],['triangle',2,0.3,1300,3,0.2,0.7,0],['square',1.5,0.8,740,14,0.1,0.1,0.8],['sawtooth',2.5,0.4,1100,20,0.3,0.25,0.4]];
// per team: fundamental multiplier and how fast the engine picks up revs when you blip it
const VOICE_MUL=[1.0,1.07,1.03,0.93,0.98],VOICE_REV=[1.0,1.15,1.05,0.85,0.95];
const VOICE_NOTE=['渾厚均衡，低頻紮實','高頻進氣嘯叫，渦輪聲明顯','聲線乾淨，電動機高頻聲最重','低沉排氣轟鳴，收油會回火','沙啞粗獷，失真最重'];
const distCurve=k=>{const n=256,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i*2/n-1;c[i]=(1+k)*x/(1+k*Math.abs(x))}return c};
const volume=()=>muted?0:(settings.assist.vol==null?70:settings.assist.vol)/100;
let previewT=0,prevThr=0,popFlash=0,revHold=false,revR=4200,audT=0,audioIdle=0;
function startAudio(){if(audio||muted)return;try{const ac=new (window.AudioContext||window.webkitAudioContext)();
  const mk=t=>{const o=ac.createOscillator();o.type=t;o.start();return o},gn=v=>{const g=ac.createGain();g.gain.value=v;return g};
  const o1=mk('sawtooth'),o2=mk('square'),o3=mk('sine'),g2=gn(0.6),g3=gn(0.5),sh=ac.createWaveShaper(),f=ac.createBiquadFilter(),g=gn(0),master=gn(1);
  f.type='lowpass';f.Q.value=1.2;o1.connect(sh);o2.connect(g2);g2.connect(sh);o3.connect(g3);g3.connect(sh);sh.connect(f);f.connect(g);g.connect(master);master.connect(ac.destination);
  const ow=mk('sine'),gw=gn(0),om=mk('triangle'),gm=gn(0);ow.connect(gw);gw.connect(master);om.connect(gm);gm.connect(master);
  const nb=ac.createBuffer(1,Math.floor(ac.sampleRate*0.09),ac.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=(Math.random()*2-1)*Math.pow(1-i/nd.length,2);
  audio={ac,o1,o2,o3,g2,g3,sh,f,g,master,ow,gw,om,gm,nb,team:-1}}catch(e){audio=null}}
function setVoice(k){const a=audio,v=VOICE[k]||VOICE[0];a.team=k;a.v=v;a.o2.type=v[0];a.g3.gain.value=v[2];a.sh.curve=distCurve(v[4])}
function audioPop(){const a=audio;if(!a)return;const src=a.ac.createBufferSource(),bp=a.ac.createBiquadFilter(),g=a.ac.createGain();src.buffer=a.nb;bp.type='bandpass';bp.frequency.value=500+Math.random()*900;bp.Q.value=0.8;g.gain.value=0.5;src.connect(bp);bp.connect(g);g.connect(a.master);src.start(a.ac.currentTime+Math.random()*0.05);popFlash=0.09}
function audioWake(){if(muted)return;startAudio();if(audio&&audio.ac.state!=='running'){try{audio.ac.resume()}catch(e){}}}
function previewVoice(){audioWake();if(audio)previewT=performance.now()}
// mute switch shared by the M key, the settings tab and the team screen's engine button
function setMuted(m){muted=!!m;ls.set('grid26.mute',muted?'1':'0');if(!muted)audioWake();renderEngBtn()}
function renderEngBtn(){const b=document.getElementById('engBtn');if(b){b.textContent=muted?'引擎聲：關':'引擎聲：開';b.setAttribute('aria-pressed',String(!muted))}}
// browsers only start audio inside a user gesture: the first tap, click or key press anywhere unlocks it
['pointerdown','keydown','touchend'].forEach(t=>addEventListener(t,()=>audioWake(),{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{if(!audio)return;try{document.hidden?audio.ac.suspend():(audioIdle=0)}catch(e){}});
function tickAudio(){if(!audio)return;const a=audio,t=a.ac.currentTime,nowP=performance.now(),dt=Math.min(0.1,audT?(nowP-audT)/1000:0.016);audT=nowP;
  if(a.team!==opts.team)setVoice(opts.team);const v=a.v,k=opts.team;
  let r=4000,thr=0,on=false,spd=0,ers=0,tension=0,ot=false;
  const pv=previewT?(performance.now()-previewT)/1000:9;
  if(state==='race'&&!paused&&player){r=player.rpm;thr=Math.max(input.thr,input.thrT);if(player.ap)thr=0.45;on=true;spd=Math.abs(player.v);ers=Math.max(0,player.ersP||0)/PHY.ers;if(player.launchPend)thr=Math.max(thr,0.5);
    if(player.shiftCut>0)thr*=0.15; // ignition cut on the shift: the note drops for a moment
    tension=(player.gear||1)/8*0.6+(player.aero>0.5?0.4:0);ot=!!player.otActive}
  else if(state==='menu'&&revHold){on=true;revR+=((12200-revR)*1.9*VOICE_REV[k]*(revR<11800?1:0.2))*dt;r=revR;thr=1;spd=0;ers=0.6}
  else if(state==='menu'&&!revHold&&revR>4400){on=true;revR+=(4200-revR)*2.6*dt;r=revR;thr=0}
  else if(state==='menu'&&pv<1.7){on=true;r=pv<1.1?5000+6800*(pv/1.1):11800-5200*((pv-1.1)/0.6);thr=pv<1.1?1:0;spd=30+60*Math.min(1,pv);ers=thr*0.8}
  if(!revHold&&!(state==='menu'&&revR>4400))revR=Math.max(4200,Math.min(revR,r));
  const f0=r/60*3*VOICE_MUL[k],rf=clamp(r/12000,0,1.05);
  a.o1.frequency.setTargetAtTime(f0,t,0.03);a.o2.frequency.setTargetAtTime(f0*v[1]*1.004,t,0.03);a.o3.frequency.setTargetAtTime(f0*0.5,t,0.03);
  a.f.frequency.setTargetAtTime(v[3]*(0.6+0.9*rf)+thr*650+tension*380,t,0.05);a.g2.gain.setTargetAtTime(0.6+(ot?0.35:0)+tension*0.15,t,0.08);
  a.g.gain.setTargetAtTime(on?0.028+0.062*thr:0,t,0.05);
  a.ow.frequency.setTargetAtTime(2300+r*0.36,t,0.05);a.gw.gain.setTargetAtTime(on?v[5]*0.035*thr*rf*rf:0,t,0.08);
  a.om.frequency.setTargetAtTime(380+spd*15,t,0.05);a.gm.gain.setTargetAtTime(on?v[6]*0.03*Math.min(1,ers):0,t,0.08);
  a.master.gain.setTargetAtTime(volume(),t,0.05);
  if(on&&prevThr>0.6&&thr<0.1&&r>8800&&Math.random()<v[7]){const n=1+(Math.random()*3|0);for(let k=0;k<n;k++)audioPop()}
  prevThr=on?thr:0;
  // nothing to play for a while (paused, results, menus): stop the audio clock so no hiss or battery drain remains
  if(on){audioIdle=0;if(a.ac.state==='suspended'&&!document.hidden){try{a.ac.resume()}catch(e){}}}
  else{if(!audioIdle)audioIdle=nowP;if(nowP-audioIdle>1200&&a.ac.state==='running'){try{a.ac.suspend()}catch(e){}}}}
