'use strict';
/* Grid 2026 — 遊戲狀態、無線電／提示、計時 */
/* ================= GAME STATE ================= */
const opts={team:0,track:0,laps:3,diff:0.975,mode:'race',ttStart:'pit'};
{const dv=+ls.get('grid26.diff');if([0.88,0.92,0.95,0.975,0.99,1.005,1.02].includes(dv))opts.diff=dv;const t=ls.get('grid26.team');if(t!=null&&TEAMS[+t])opts.team=+t;const k=TRACKS.findIndex(x=>x.id===ls.get('grid26.track'));if(k>=0)opts.track=k}
let cars=[],player=null,PROFILES=[],state='menu',raceT=0,goT=0,lightsT=0,lightsOn=0,camMode=+ls.get('grid26.cam')||0,paused=false;
let fastest={t:Infinity,car:null},bestSec=[Infinity,Infinity,Infinity];
const input={tL:0,tR:0,clutchK:0,clutchT:0,thrK:0,brkK:0,left:0,right:0,ot:0,thrT:0,brkT:0,steerT:0,steerTOn:false,thr:0};
let menuCar=null,builtTrack=-1;
let builtTeam=-1;function ensureTrack(){if(builtTrack!==opts.track||builtTeam!==opts.team){buildTrackScene(TRACKS[opts.track]);applyGfx();builtTrack=opts.track;builtTeam=opts.team}}

function spawnCars(){
  cars.forEach(c=>disposeCar(c.model));cars=[];
  const order=[];TEAMS.forEach((t,ti)=>t.nums.forEach((n,k)=>order.push({ti,k})));
  const meIdx=order.findIndex(o=>o.ti===opts.team&&o.k===0);const me=order.splice(meIdx,1)[0];
  order.sort((a,b)=>TEAMS[b.ti].pace+(b.k?-0.004:0)-(TEAMS[a.ti].pace+(a.k?-0.004:0)));order.splice(7,0,me);
  if(opts.mode==='tt'){order.length=0;order.push(me)}
  const gl=Math.min(3,HW-2);
  order.forEach((o,gp)=>{const t=TEAMS[o.ti];const model=makeCar(t,t.nums[o.k]);scene.add(model.group);
    const isMe=o===me;const s0=-15-gp*8,d0=gp%2?-gl:gl;const p=at(s0,d0,{});
    const c={team:t,ti:o.ti,num:t.nums[o.k],name:isMe?'你':t.drivers[o.k],code:isMe?'YOU':t.code,me:isMe,model,
      x:p.x,y:p.y,z:p.z,h:p.h,v:0,s:wrapS(s0),d:d0,idx:p.i,laps:-1,lapStart:0,lapTimes:[],best:Infinity,secT:[0,0,0],pbS:[Infinity,Infinity,Infinity],secStart:0,secCol:['idle','idle','idle'],
      finished:false,finishT:0,hist:new Map(),aero:0,xmode:false,steer:0,yaw:0,soc:PHY.batt,wear:0,ersP:0,otAvail:false,otActive:false,otZone:-1,lrpm:4000,launchPend:false,lTr:1,lPw:1,lT:0,lDist:0,lSpin:0,penalty:0,
      gear:1,rpm:4000,shiftCut:0,skill:clamp(t.pace*opts.diff+(o.k?-0.006:0),0.8,1.012),lane:0,laneT:0,offT:0,wheelRot:0,lastPos:0};
    cars.push(c);if(isMe)player=c});
}
const progress=c=>c.laps*TL+c.s;
function record(c){const key=Math.floor(progress(c)/20);if(!c.hist.has(key))c.hist.set(key,raceT)}
function gapBehind(a,b){const t=a.hist.get(Math.floor(progress(b)/20));return t==null?null:raceT-t}

/* ================= RADIO / TOAST ================= */
let radioQ=[],radioT=0,radioCool={},toastT=0;
function radio(msg,key,cool=8){if(tut)return;if(key){if(radioCool[key]!=null&&raceT-radioCool[key]<cool)return;radioCool[key]=raceT}radioQ.push(msg)}
function tickRadio(dt){radioT-=dt;if(radioT<=0&&radioQ.length){$('radioT').textContent=radioQ.shift();$('radio').classList.add('on');radioT=3.6}else if(radioT<=0)$('radio').classList.remove('on');
  toastT-=dt;if(toastT<=0)$('toast').classList.remove('on')}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('on');toastT=0.9}

/* ================= TIMING ================= */
function sectorDone(c,k,st){c.secT[k]=st;const pb=c.pbS[k];if(c.me)c.secCol[k]=st<bestSec[k]?'purple':st<=pb?'green':'yellow';if(st<bestSec[k])bestSec[k]=st;if(st<pb)c.pbS[k]=st}
function crossLine(c){c.laps++;
  if(opts.mode==='tt'&&c.laps===0){c.lapStart=raceT;c.secStart=raceT}
  if(c.laps>=1){const lt=raceT-c.lapStart;sectorDone(c,2,raceT-c.secStart);c.lapTimes.push(lt);c.lapStart=raceT;
    if(lt<c.best){c.best=lt;if(c.me&&c.laps>1)radio(`個人最快圈 ${fmt(lt)}`,'pb',2)}
    if(lt<fastest.t){fastest={t:lt,car:c};if(c.me)radio(`全場最快圈！${fmt(lt)}`,'fl',2)}
    const leaderDone=cars.some(o=>o.finished);
    if(opts.mode==='tt'&&!tut){const rec=parseFloat(ls.get(ttKey()));if(!(rec<=lt)){ls.set(ttKey(),lt.toFixed(3));radio(`賽道新紀錄 ${fmt(lt)}`,'rec',1)}if(c.me){const k=lbAdd(lt,c);if(k===0)toast('NEW PB · '+fmt(lt));else if(k>0)toast('排行榜第 '+(k+1)+' 筆個人成績 · '+fmt(lt))}}
    else if(c.laps>=opts.laps||leaderDone){c.finished=true;c.finishT=raceT+c.penalty;if(c.me)endRaceSoon()}
    else if(c.me&&c.laps===opts.laps-1)radio('最後一圈，全力推進！','final',1);
    c.secStart=raceT;if(c.me){c.secCol[0]='idle';c.secCol[1]='idle'}}}
function carAhead(c){const pc=progress(c);let best=null,bd=Infinity;for(const o of cars){if(o===c)continue;const d=progress(o)-pc;if(d>0&&d<bd){bd=d;best=o}}return best}
function advanceTiming(c,prevS){const s=c.s;if(prevS>TL*0.8&&s<TL*0.2)crossLine(c);else if(prevS<TL*0.2&&s>TL*0.8)c.laps--;
  if(c.laps>=0)for(let k=0;k<2;k++)if(prevS<SECT[k]&&s>=SECT[k]&&s-prevS<200){sectorDone(c,k,raceT-c.secStart);c.secStart=raceT}
  if(OTDET>=0&&prevS<OTDET&&s>=OTDET&&s-prevS<200){const ahead=carAhead(c),g=ahead?gapBehind(ahead,c):null,was=c.otAvail;
    c.otAvail=g!=null&&g<1.0&&raceT>4;c.otBonus=c.otAvail?0.5e6:0;if(!c.me)c.otActive=false;
    if(c.me&&c.otAvail)radio(`偵測點差距 ${g.toFixed(2)} 秒 — 接下來一圈 OT 解鎖 350 kW`,'ot',3);else if(c.me&&was)radio('偵測點差距超過 1 秒，OT 回到 315 kW','otx',3)}}
