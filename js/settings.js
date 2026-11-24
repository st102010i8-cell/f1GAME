'use strict';
/* Grid 2026 — 設定 */
/* ================= SETTINGS ================= */
const ACTIONS=[['throttle','油門'],['brake','煞車'],['left','左轉'],['right','右轉'],['shiftUp','升檔'],['shiftDown','降檔'],['aero','直道模式 X / Z'],['overtake','Overtake 超車模式'],['ersUp','電能模式 往上'],['ersDown','電能模式 往下'],['camera','切換視角'],['line','賽車線 完整／僅彎道／關閉'],['reset','回到賽道'],['mute','引擎聲開關'],['pause','暫停']];
const DEF_KEYS={throttle:['KeyW','ArrowUp'],brake:['KeyS','ArrowDown'],left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],shiftUp:['KeyE','PageUp'],shiftDown:['KeyQ','PageDown'],aero:['Space',null],overtake:['ShiftLeft','ShiftRight'],ersUp:['KeyF','Equal'],ersDown:['KeyV','Minus'],camera:['KeyC',null],line:['KeyL',null],reset:['KeyR',null],mute:['KeyM',null],pause:['Escape','KeyP']};
const DEF_SET={keys:DEF_KEYS,assist:{gearbox:'auto',aero:'manual',steer:1,weight:1,dead:10,steerMode:'drag',vol:70,line:'full',fps:0,gfx:'mid',launch:'manual',guard:true,touch:'auto',ramp:false,wheelLock:120,autoPit:true},touchLayout:{},touchLayoutM:{},setup:{df:0,gearing:'std',bias:56,ers:'balance',tyre:'M',pitTyre:'M',mode:2,prevMode:2,trim:[0,0,0,0],charge:2}};
let settings=JSON.parse(JSON.stringify(DEF_SET));
try{const s=JSON.parse(ls.get('grid26.settings')||'null');if(s){Object.assign(settings.assist,s.assist||{});Object.assign(settings.setup,s.setup||{});if(s.touchLayout&&typeof s.touchLayout==='object')settings.touchLayout=s.touchLayout;if(s.touchLayoutM&&typeof s.touchLayoutM==='object')settings.touchLayoutM=s.touchLayoutM;if(s.keys)Object.keys(DEF_KEYS).forEach(k=>{if(Array.isArray(s.keys[k]))settings.keys[k]=s.keys[k]})}}catch(e){}
{const S=settings.setup;if(!(S.mode>=0&&S.mode<=3))S.mode=2;if(!(S.prevMode>=0&&S.prevMode<=2))S.prevMode=2;if(!Array.isArray(S.trim)||S.trim.length!==4)S.trim=[0,0,0,0]}
const saveSettings=()=>{ls.set('grid26.settings',JSON.stringify(settings));buildKeyMap();applyTouchVisibility();renderSetupSummary()};
let KEYMAP={};
function buildKeyMap(){KEYMAP={};Object.entries(settings.keys).forEach(([a,arr])=>arr.forEach(c=>{if(c)KEYMAP[c]=a}))}
buildKeyMap();
const keyName=c=>{if(!c)return '未設定';const m={Space:'空白鍵',ShiftLeft:'左 Shift',ShiftRight:'右 Shift',ControlLeft:'左 Ctrl',ControlRight:'右 Ctrl',AltLeft:'左 Alt',AltRight:'右 Alt',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Escape:'Esc',Enter:'Enter',Tab:'Tab',PageUp:'PgUp',PageDown:'PgDn',Backspace:'Backspace'};if(m[c])return m[c];if(c.startsWith('Key'))return c.slice(3);if(c.startsWith('Digit'))return c.slice(5);if(c.startsWith('Numpad'))return '數字鍵 '+c.slice(6);return c};
