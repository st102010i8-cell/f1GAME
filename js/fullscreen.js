'use strict';
/* Grid 2026 — 全螢幕 */
// Fullscreen API where the browser has it (desktop, Android, iPad). iPhone browsers do not allow a page to go
// fullscreen, so there the button explains "Add to Home Screen", which opens the game without any browser bars.
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
const fsCan=()=>{const d=document.documentElement;return !!(d.requestFullscreen||d.webkitRequestFullscreen)&&(document.fullscreenEnabled!==false||document.webkitFullscreenEnabled)};
// installed / home-screen launch; (display-mode: fullscreen) also matches while the page itself is fullscreen, so rule that out
const fsStandalone=()=>{if(fsEl())return false;try{return matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
function toggleFullscreen(){
  if(fsStandalone()){toast('已經是全螢幕（從主畫面開啟）');return}
  if(!fsCan()){show('fsHelp',true);return}
  try{if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document)}
    else{const d=document.documentElement,r=(d.requestFullscreen||d.webkitRequestFullscreen).call(d,{navigationUI:'hide'});
      const lock=()=>{try{const o=screen.orientation;if(o&&o.lock)o.lock('landscape').catch(()=>{})}catch(e){}};
      if(r&&r.then)r.then(lock).catch(()=>show('fsHelp',true));else lock()}}catch(e){show('fsHelp',true)}}
function fsRender(){const on=!!fsEl();document.querySelectorAll('.fsBtn').forEach(b=>{b.textContent=on?'離開全螢幕':'全螢幕';b.hidden=fsStandalone();b.setAttribute('aria-pressed',String(on))})}
['fullscreenchange','webkitfullscreenchange'].forEach(t=>document.addEventListener(t,()=>{fsRender();dispatchEvent(new Event('resize'))}));
document.querySelectorAll('.fsBtn').forEach(b=>b.addEventListener('click',toggleFullscreen));
$('fsHelpClose').onclick=()=>show('fsHelp',false);
{const ios=/iPhone|iPod/.test(navigator.userAgent),crios=/CriOS/.test(navigator.userAgent);
 $('fsHelpSteps').innerHTML=ios?`<li>點${crios?'網址列右側的<b>分享</b>按鈕':'下方工具列的<b>分享</b>按鈕（方框加向上箭頭）'}</li><li>往下找到<b>加入主畫面</b>，按「加入」</li><li>回到主畫面，點 <b>Grid 2026</b> 圖示開啟：沒有網址列與工具列，就是全螢幕</li>`
  :`<li>這個瀏覽器不支援網頁全螢幕。</li><li>可以改用瀏覽器選單裡的<b>加入主畫面／安裝應用程式</b>，從圖示開啟就是全螢幕</li>`}
fsRender();
