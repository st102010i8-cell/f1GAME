'use strict';
/* Grid 2026 — 手機版分步流程（窄螢幕：每個選擇一個畫面） */
// body.compact (short or narrow window) turns the menus into four pages with one fixed bottom bar:
// 0 driver name · 1 team + 3D car + engine sound · 2 track (setup shortcut, best lap) · 3 leaderboard → start.
// Desktop / tablet layout is untouched: none of this applies without body.compact.
let menuYaw=0,menuDragT=-1e9,mflowSig='';
const mflowOn=()=>document.body.classList.contains('compact')&&(state==='menu'||state==='tracks')&&$('settings').hidden&&!touchEdit&&$('fsHelp').hidden;
const MF_EYE=[['#menu .topbar .eyebrow','步驟 1 / 4 · 車手名稱','步驟 2 / 4 · 選擇車隊'],['#trackScreen .topbar .eyebrow','步驟 3 / 4 · 選擇賽道'],['#lb .eyebrow','步驟 4 / 4 · 計時賽排行榜']];
function mflowEyebrows(on){MF_EYE.forEach(([sel,...txt])=>{const el=document.querySelector(sel);if(!el)return;if(el.dataset.orig==null)el.dataset.orig=el.textContent;
  el.textContent=!on?el.dataset.orig:sel.startsWith('#menu')?txt[mstep===0?0:1]:sel.startsWith('#lb')&&mstep!==3?el.dataset.orig:txt[0]})}
function mflowTick(){const on=mflowOn(),step=on?mstep:-1,go=$('go').textContent,sig=on+'|'+step+'|'+go;if(sig===mflowSig)return;mflowSig=sig;
  document.body.classList.toggle('mflow',on);document.body.dataset.mstep=on?String(mstep):'';show('mNav',on);mflowEyebrows(on);if(!on)return;
  const L=[['',`下一步 · 選車隊`],['上一步','下一步 · 選賽道'],['上一步 · 車隊','下一步 · 排行榜'],['上一步 · 賽道',go]][mstep]||['',''];
  $('mPrev').textContent=L[0];$('mPrev').style.visibility=L[0]?'visible':'hidden';$('mNext').textContent=L[1];
  [...$('mDots').children].forEach((d,k)=>d.classList.toggle('on',k===mstep));
  // each page starts at its top
  const ov=mstep<2?$('menu'):mstep===2?$('trackScreen'):$('lb');if(ov)ov.scrollTop=0}
$('mNext').onclick=()=>{if(mstep===0){$('pName').blur();mstep=1}
  else if(mstep===1)toTracks();
  else if(mstep===2)showLB();
  else if(mstep===3){show('lb',false);mstep=2;$('go').click()}};
$('mPrev').onclick=()=>{if(mstep===1)mstep=0;else if(mstep===2)toTeams();else if(mstep===3){show('lb',false);mstep=2}};
// rotate the preview car by dragging the free part of the screen (the menu passes touches through there)
{let px=null;const cv=$('gl');
 cv.addEventListener('pointerdown',e=>{if(state!=='menu')return;px=e.clientX;menuDragT=performance.now();try{cv.setPointerCapture(e.pointerId)}catch(_){}});
 cv.addEventListener('pointermove',e=>{if(px==null)return;menuYaw+=(e.clientX-px)*0.009;px=e.clientX;menuDragT=performance.now()});
 ['pointerup','pointercancel'].forEach(t=>cv.addEventListener(t,()=>{px=null}))}
// engine sound switch and hold-to-rev on the team screen
$('engBtn').onclick=()=>{setMuted(!muted);toast(muted?'引擎聲 關':'引擎聲 開 · '+VOICE_NOTE[opts.team])};
{const b=$('revBtn'),down=e=>{e.preventDefault();if(muted)setMuted(false);audioWake();previewT=0;revHold=true;b.classList.add('on')},up=()=>{revHold=false;b.classList.remove('on')};
 b.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,up));b.addEventListener('contextmenu',e=>e.preventDefault())}
renderEngBtn();
