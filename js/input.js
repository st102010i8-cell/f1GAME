'use strict';
/* Grid 2026 — 鍵盤與觸控輸入 */
/* ================= INPUT ================= */
addEventListener('keydown',e=>{
  if(capture){e.preventDefault();e.stopPropagation();if(e.code==='Escape'){capture=null;renderSettings();return}
    const {a,sl}=capture;if(e.code==='Backspace'){settings.keys[a][sl]=null}else{Object.keys(settings.keys).forEach(k=>settings.keys[k]=settings.keys[k].map(c=>c===e.code?null:c));settings.keys[a][sl]=e.code}
    capture=null;saveSettings();renderSettings();return}
  if(!$('settings').hidden){if(e.code==='Escape')closeSettings();return}
  if(state!=='race')return;if(tut&&tut.frz&&!paused&&e.code==='Enter'){e.preventDefault();if(!e.repeat)tutNext();return}
  const act=KEYMAP[e.code];if(!act)return;e.preventDefault();
  if((act==='aero'||act==='overtake')&&clutchPhase()){input.clutchK=1;return}
  if(act==='throttle')input.thrK=1;else if(act==='brake')input.brkK=1;else if(act==='left')input.left=1;else if(act==='right')input.right=1;else if(act==='overtake')input.ot=1;
  if(e.repeat)return;
  if(act==='aero')xPress=true;else if(act==='shiftUp'){if(settings.assist.gearbox==='manual')shiftReq=1;else toast('自動變速中 · 到設定切換手動')}else if(act==='shiftDown'){if(settings.assist.gearbox==='manual')shiftReq=-1}
  else if(act==='ersUp')cycleMode(1);else if(act==='ersDown')cycleMode(-1);else if(act==='overtake')toggleOT();
  else if(act==='camera')cycleCam();else if(act==='line')cycleLine();else if(act==='reset'&&raceT>0)resetPlayer();
  else if(act==='mute'){muted=!muted;ls.set('grid26.mute',muted?'1':'0');if(!muted)startAudio();toast(muted?'引擎聲 關':'引擎聲 開')}
  else if(act==='pause'){releasePads();paused=!paused;screen(paused?'pause':null);if(paused)ttSwitchRender()}},true);
addEventListener('keyup',e=>{const act=KEYMAP[e.code];if(act==='aero'||act==='overtake')input.clutchK=0;if(act==='throttle')input.thrK=0;else if(act==='brake')input.brkK=0;else if(act==='left')input.left=0;else if(act==='right')input.right=0;else if(act==='overtake')input.ot=0});
addEventListener('blur',()=>{Object.assign(input,{thrK:0,brkK:0,left:0,right:0,ot:0});if(state==='race'&&raceT>0&&!paused){paused=true;screen('pause')}});
// touch: steering wheel, analog pedals, buttons — all repositionable
const TC=['tWheel','tBrake','tThr','tUp','tDn','tX','tOT','tMode','tClutch','tCam'],TC_NAME={tClutch:'離合器（起跑）',tMode:'電能模式',tERSp:'電能微調 +',tERSm:'電能微調 −',tCam:'切換視角',tWheel:'方向盤',tBrake:'煞車踏板',tThr:'油門踏板',tUp:'升檔',tDn:'降檔',tX:'直道模式',tOT:'Overtake',cluster:'儀表板',mini:'賽道地圖',tyreHud:'輪胎狀態'};
// HUD panels that can be moved too; their saved spot only applies while the touch controls are in use
const TC_HUD=['cluster','mini','tyreHud'],TC_ALL=TC.concat(TC_HUD);
// phones (short or narrow landscape screens) get their own compact defaults and their own saved layout,
// so moving a button on a phone never disturbs the layout tuned on a tablet, and the other way round
const isCompact=()=>innerHeight<520||innerWidth<932;
const tlKey=()=>document.body.classList.contains('compact')?'touchLayoutM':'touchLayout';
const TLay=()=>settings[tlKey()]||(settings[tlKey()]={});
function updCompact(){const c=isCompact(),b=document.body.classList;if(b.contains('compact')!==c){b.toggle('compact',c);if(touchEdit)tcSelect(null)}}
let touchEdit=false,tcSel=null,hudWasHidden=null;updCompact();
function applyTouchLayout(){const L=TLay();TC.forEach(id=>{const el=$(id),l=L[id];if(l&&el.offsetWidth){el.style.left=(l.cx*innerWidth-el.offsetWidth/2)+'px';el.style.top=(l.cy*innerHeight-el.offsetHeight/2)+'px';el.style.right='auto';el.style.bottom='auto';el.style.transform=`scale(${l.s||1})`}else if(!l){el.style.left=el.style.top=el.style.right=el.style.bottom=el.style.transform=''}});applyHudLayout()}
// positioned by their centre in viewport units, so a panel that is still hidden lands in the right place once shown
function applyHudLayout(){const L=TLay(),act=touchEdit||document.body.classList.contains('touching');TC_HUD.forEach(id=>{const el=$(id),l=L[id],st=el.style;
  if(act&&l){st.left=(l.cx*100).toFixed(3)+'vw';st.top=(l.cy*100).toFixed(3)+'vh';st.right=st.bottom='auto';st.transformOrigin='50% 50%';st.transform=`translate(-50%,-50%) scale(${l.s||1})`}
  else st.left=st.top=st.right=st.bottom=st.transform=st.transformOrigin=''})}
function applyTouchVisibility(){updCompact();const t=settings.assist.touch;const want=t==='on'||(t==='auto'&&matchMedia('(pointer:coarse)').matches);const on=touchEdit||(want&&state==='race'&&!!player);show('touch',on);document.body.classList.toggle('touching',on);document.body.classList.toggle('tcEdit',touchEdit);const man=settings.assist.gearbox==='manual'||touchEdit;show('tUp',man);show('tDn',man);if(touchEdit)show('tClutch',true);$('touch').classList.toggle('edit',touchEdit);show('touchBar',touchEdit);if(on)applyTouchLayout();else applyHudLayout()}
function tcSelect(id){tcSel=id;TC_ALL.forEach(k=>$(k).classList.toggle('sel',k===id));const l=id&&TLay()[id];$('tbSel').textContent=id?TC_NAME[id]+' 大小':'尚未選取項目';$('tbProf').textContent=tlKey()==='touchLayoutM'?'手機配置':'平板／電腦配置';$('tbSize').value=l?l.s||1:1;$('tbSize').disabled=!id;$('tbVal').textContent=l?Math.round((l.s||1)*100)+'%':'—'}
function openTouchEdit(){capture=null;show('settings',false);touchEdit=true;TC_ALL.forEach(k=>$(k).classList.remove('on'));hudWasHidden=TC_HUD.map(k=>$(k).hidden);TC_HUD.forEach(k=>show(k,true));tcSelect(null);applyTouchVisibility()}
$('tbDone').onclick=()=>{touchEdit=false;tcSelect(null);if(hudWasHidden)TC_HUD.forEach((k,n)=>show(k,!hudWasHidden[n]));hudWasHidden=null;show('tClutch',false);saveSettings();show('settings',true);renderSettings()};
$('tbReset').onclick=()=>{settings[tlKey()]={};tcSelect(null);applyTouchLayout()};
const tcSize=v=>{if(!tcSel)return;const l=TLay()[tcSel];if(!l)return;l.s=clamp(Math.round(v*100)/100,0.5,1.8);$('tbSize').value=l.s;$('tbVal').textContent=Math.round(l.s*100)+'%';applyTouchLayout()};
$('tbSize').addEventListener('input',e=>tcSize(+e.target.value));
$('tbMinus').onclick=()=>tcSize(+$('tbSize').value-0.05);$('tbPlus').onclick=()=>tcSize(+$('tbSize').value+0.05);
TC_ALL.forEach(id=>{const el=$(id);let grab=null;
  el.addEventListener('pointerdown',e=>{if(!touchEdit)return;e.preventDefault();e.stopPropagation();const r=el.getBoundingClientRect(),old=TLay()[id];
    const l=TLay()[id]={cx:(r.left+r.width/2)/innerWidth,cy:(r.top+r.height/2)/innerHeight,s:old?old.s||1:Math.round(r.width/(el.offsetWidth||r.width)*100)/100};
    grab={dx:e.clientX-l.cx*innerWidth,dy:e.clientY-l.cy*innerHeight};tcSelect(id);try{el.setPointerCapture(e.pointerId)}catch(_){}applyTouchLayout()});
  el.addEventListener('pointermove',e=>{if(!touchEdit||!grab)return;const l=TLay()[id];l.cx=clamp((e.clientX-grab.dx)/innerWidth,0.04,0.96);l.cy=clamp((e.clientY-grab.dy)/innerHeight,0.05,0.96);applyTouchLayout()});
  const end=()=>{grab=null};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end)});
const padEnders=[];
// each control follows exactly one pointer id; any way that finger can go away releases it
function pad(el,onMove,onEnd,leave,sib){let id=null;
  const fin=()=>{if(id===null)return;const p=id;id=null;try{el.releasePointerCapture(p)}catch(_){}el.classList.remove('on');onEnd()};
  const end=e=>{if(id!==null&&e.pointerId===id)fin()};
  const self={el,busy:()=>id!==null,take(e){if(id!==null)return;id=e.pointerId;try{el.setPointerCapture(id)}catch(_){}el.classList.add('on');onMove(e)}};
  el.addEventListener('pointerdown',e=>{if(touchEdit)return;e.preventDefault();self.take(e)});
  el.addEventListener('pointermove',e=>{if(touchEdit||e.pointerId!==id)return;
    const o=sib&&sib();if(o&&!o.busy()){const r=o.el.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){fin();o.take(e);return}} // finger slid onto the other pedal
    if(leave){const r=el.getBoundingClientRect();if(e.clientX<r.left-leave||e.clientX>r.right+leave||e.clientY<r.top-leave||e.clientY>r.bottom+leave){fin();return}}onMove(e)});
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>el.addEventListener(t,end));
  addEventListener('pointerup',end,true);addEventListener('pointercancel',end,true);padEnders.push(fin);return self}
const releasePads=()=>padEnders.forEach(f=>f());
addEventListener('blur',()=>{input.clutchK=0;releasePads()});document.addEventListener('visibilitychange',()=>{if(document.hidden)releasePads()});
function tap(el,down,up){el.addEventListener('pointerdown',e=>{if(touchEdit)return;e.preventDefault();el.classList.add('on');down()});const end=()=>{if(touchEdit)return;el.classList.remove('on');up&&up()};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('pointerleave',end)}
const pedalVal=(el,e)=>{const r=el.getBoundingClientRect();return clamp(0.2+0.8*(r.bottom-e.clientY)/r.height,0.2,1)};
const padThr=pad($('tThr'),e=>{input.thrT=pedalVal($('tThr'),e);$('tThr').firstElementChild.style.height=input.thrT*100+'%'},()=>{input.thrT=0;$('tThr').firstElementChild.style.height='0'},48,()=>padBrk);
const padBrk=pad($('tBrake'),e=>{input.brkT=pedalVal($('tBrake'),e);$('tBrake').firstElementChild.style.height=input.brkT*100+'%'},()=>{input.brkT=0;$('tBrake').firstElementChild.style.height='0'},48,()=>padThr);pad($('tClutch'),()=>{input.clutchT=1},()=>{input.clutchT=0});
// steering wheel: grab anywhere on it and turn around its centre; springs back on release
let wAng=0,wTgt=0,wHeld=false,wPrev=0;
const wheelLock=()=>(settings.assist.wheelLock||120)*Math.PI/180;
function drawDz(){const A=settings.assist,a=(A.dead==null?10:A.dead)/100*(A.wheelLock||120)*Math.PI/180,x=96*Math.sin(a),y=100-96*Math.cos(a);$('dzArc').setAttribute('d',a<0.005?'':`M ${(100-x).toFixed(1)} ${y.toFixed(1)} A 96 96 0 0 1 ${(100+x).toFixed(1)} ${y.toFixed(1)}`)}
const wheelRender=()=>{$('wheelSvg').style.transform=`rotate(${wAng.toFixed(4)}rad)`};
function wheelAng(e){const r=$('tWheel').getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);return Math.hypot(dx,dy)<r.width*0.09?null:Math.atan2(dy,dx)}
// the finger sets a target; the wheel follows with damping and a turn-rate limit, and self-centres on release
let wX=0;const steerMode=()=>settings.assist.steerMode||'drag';
function wheelBtnRender(){const b=$('wheelBtns').children;b[0].classList.toggle('on',!!input.tL);b[1].classList.toggle('on',!!input.tR)}
function applySteerMode(){const btn=steerMode()==='buttons';show('wheelBtns',btn);$('wheelSvg').style.display=btn?'none':'';$('wheelDz').style.display=btn?'none':'';wAng=wTgt=0;wHeld=false;input.tL=input.tR=0;wheelBtnRender()}
pad($('tWheel'),e=>{const m=steerMode(),r=$('tWheel').getBoundingClientRect(),L=wheelLock();
  if(m==='buttons'){const left=e.clientX<r.left+r.width/2;input.tL=left?1:0;input.tR=left?0:1;wheelBtnRender();return} // sliding across the middle swaps sides
  if(m==='rotate'){const a=wheelAng(e);if(a==null)return;if(!wHeld){wHeld=true;wPrev=a;wTgt=wAng}let d=a-wPrev;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;wPrev=a;wTgt=clamp(wTgt+d,-L,L);return}
  if(!wHeld){wHeld=true;wX=e.clientX;wTgt=wAng}wTgt=clamp(wTgt+(e.clientX-wX)/(r.width*0.42)*L,-L,L);wX=e.clientX},()=>{wHeld=false;input.tL=input.tR=0;wheelBtnRender()});
function tickWheel(dt){const L=wheelLock(),v=player?Math.abs(player.v):0,hs=clamp((v*3.6-80)/220,0,1),W=settings.assist.weight||1;
  if(wHeld){const maxW=lerp(9,4.2,hs)/W*L/2.094;wAng+=clamp((wTgt-wAng)*Math.min(1,dt*lerp(22,12,hs)/W),-maxW*dt,maxW*dt)}
  else if(wAng!==0){wAng*=Math.exp(-dt*(2.2+7.5*clamp(v/60,0,1))/W);if(Math.abs(wAng)<0.012)wAng=0;wTgt=wAng}
  const on=wHeld||wAng!==0;if(on||input.steerTOn){input.steerTOn=on;input.steerT=-wAng/L;wheelRender()}}
tap($('tUp'),()=>{shiftReq=1});tap($('tDn'),()=>{shiftReq=-1});tap($('tX'),()=>{xPress=true});tap($('tOT'),()=>toggleOT());$('tMode').addEventListener('pointerdown',e=>{if(touchEdit)return;e.preventDefault();const b=e.target.closest('b');if(b)setMode(+b.dataset.m)});tap($('tCam'),()=>cycleCam());
addEventListener('resize',applyTouchVisibility);

// no text selection, callout menu or pinch/scroll gestures while driving
['contextmenu','selectstart','gesturestart','gesturechange','dragstart'].forEach(t=>document.addEventListener(t,e=>{if(e.target&&e.target.closest&&e.target.closest('textarea,input'))return;e.preventDefault()}));
// the layout editor's own controls (size slider, buttons) must keep their native touch dragging
document.addEventListener('touchmove',e=>{if(state==='race'&&!touchEdit&&!(e.target.closest&&e.target.closest('.ov,#touchBar,input')))e.preventDefault()},{passive:false});
