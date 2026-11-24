'use strict';
/* Grid 2026 — 玩家車輛物理 */
/* ================= PLAYER PHYSICS ================= */
let xPress=false,shiftReq=0,offWarned=-99;
function shiftUp(c){if(c.gear<8){c.gear++;c.shiftCut=0.05}}
function shiftDown(c,ratio){if(c.gear<=1)return;const vk=Math.abs(c.v)*3.6;if(rpmFor(vk,c.gear-1,ratio)>PHY.rev+80){toast('降檔保護：轉速過高');return}c.gear--;c.shiftCut=0.04}
const LAUNCH_LO=10500,LAUNCH_HI=11500;
const clutchOn=()=>settings.assist.launch!=='auto'&&opts.mode==='race'&&!tut;
const clutchPhase=()=>state==='race'&&clutchOn()&&!!player&&(raceT<0||player.launchPend);
const TYRES={S:{k:'S',n:'軟胎',grip:1.08,wear:2.8,heat:1.25,col:'#e8353b'},M:{k:'M',n:'中性胎',grip:1,wear:1,heat:1,col:'#f2c230'},H:{k:'H',n:'硬胎',grip:0.94,wear:0.45,heat:0.8,col:'#e8edf3'}};
const TYK={h:6.5,c:0.022,w:0.0019};
const newTyres=k=>({comp:TYRES[k]?k:'M',w:[0,0,0,0],T:[80,80,80,80],warned:false});
// grip falls gently down to 40% life, then quickly; best between 85 and 105 degC
const tyWearF=w=>{const life=1-w;return life>0.4?1-0.06*(1-life)/0.6:0.94-0.22*(0.4-life)/0.4};
const tyTempF=T=>T<70?0.98-0.08*Math.min(1,(70-T)/30):T<85?0.98+0.02*(T-70)/15:T<=105?1:T<=115?1-0.02*(T-105)/10:Math.max(0.86,0.98-0.10*(T-115)/20);
function tyreGrip(c){const ty=c.tyre;if(!ty)return 1;let a=0;for(let w=0;w<4;w++)a+=tyWearF(ty.w[w])*tyTempF(ty.T[w]);return TYRES[ty.comp].grip*a/4}
// ---- auto pit: once the car leaves the track at the pit entry, the team drives it to the box and back out ----
// path in pit coordinates r = distance from the pit entry; dd = lateral offset towards the pit side
function autoPitPath(c,r){const P=PIT,fast=(P.L0+P.L1)/2,rb=pitRel(P.boxes[opts.team]),sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
  if(r<P.T)return lerp(c.apIn,fast,sm((r-c.apR0)/Math.max(8,P.T-c.apR0)));
  if(c.ap==='in'){if(r<rb-28)return fast;return lerp(fast,P.mid,sm((r-(rb-28))/22))}
  if(r<rb)return P.mid;if(r<rb+24)return lerp(P.mid,fast,sm((r-rb)/24));
  if(r<P.len-P.T)return fast;return lerp(fast,HW-2.5,sm((r-(P.len-P.T))/P.T))}
function autoPitCheck(c,live){if(!live||settings.assist.autoPit===false||!PIT||tut)return;const r=pitRel(c.s),dd=c.d*PIT.side;
  if(!c.ap){if(r<PIT.T+5&&dd>HW+0.6&&Math.abs(c.v)>2&&raceT>0){c.ap='in';c.apIn=dd;c.apR0=r;c.pitDone=false;radio('自動進站：交給車隊，保持雙手放鬆','pit',1);toast('自動進站中')}return}
  if(c.ap==='in'&&c.pitDone)c.ap='out';
  if(c.ap==='out'&&r>PIT.len-PIT.T*0.35&&dd<HW-1){c.ap=null;toast('回到賽道，交還控制');radio('出站完成，換你開了','pit',1)}
  if(r>PIT.len+40&&r<TL-40){c.ap=null}} // safety: never keep control outside the pit area
function autoPitDrive(c){const r=pitRel(c.s),v=c.v,rb=pitRel(PIT.boxes[opts.team]);
  // speed: brake into the 80 km/h limit by the end of the entry, stop at the box, accelerate away at the exit
  let vt=r<PIT.T?Math.sqrt(22.2*22.2+2*11*Math.max(0,PIT.T-r)):21.5;
  if(c.ap==='in'){vt=Math.min(vt,Math.sqrt(2*4.5*Math.max(0,rb-r)));if(rb-r<1.2)vt=0}
  else if(r>PIT.len-PIT.T)vt=40;
  if(c.ap==='in'&&c.pitT>0)vt=0;
  const e=vt-v;let thr=e>0.3?clamp(e*0.35,0.15,1):0,brk=e<-0.3?clamp(-e*0.22,0.1,1):0;if(vt===0){thr=0;brk=v>0.7?Math.max(brk,0.6):0} // standing still: no brake (holding it would select reverse), hill hold keeps the car put
  // steering: pure pursuit towards a point on the path a little way ahead
  const Ld=clamp(Math.abs(v)*0.7,5,16),q=at(PIT.a+r+Ld,PIT.side*autoPitPath(c,r+Ld),{});
  let a=Math.atan2(q.x-c.x,q.z-c.z)-c.h;a=((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
  const kap=2*Math.sin(a)/Ld,steerMax=0.34*(settings.assist.steer||1)/(1+Math.abs(v)/24);
  c.steer=clamp(Math.atan(kap*PHY.wb)/steerMax,-1,1);return {thr,brk}}
function updatePlayer(c,dt){
  const A=settings.assist,S=settings.setup,ratio=RATIO[S.gearing]||1;
  const live=state==='race';const racing=live&&raceT>0;
  // inputs: keyboard (optionally ramped) or analog touch pedals
  const kt=input.thrK;input.thr=A.ramp?(kt?Math.min(1,input.thr+dt*3.5):Math.max(0,input.thr-dt*6)):kt;
  let thr=live?Math.max(input.thr,(A.guard!==false&&input.brkT>0.15)?0:input.thrT):0,brk=live?Math.max(input.brkK,input.brkT):0;
  // steering: speed-sensitive weight. hs = 0 below 80 km/h, 1 at 300 km/h
  {const hs=clamp((Math.abs(c.v)*3.6-80)/220,0,1),W=A.weight||1;let st=input.steerTOn?input.steerT:(Math.max(input.left,input.tL)-Math.max(input.right,input.tR));
   if(input.steerTOn){const dz=(A.dead==null?10:A.dead)/100+0.03*hs,a=Math.abs(st);st=a<dz?0:Math.sign(st)*Math.pow((a-dz)/(1-dz),1+0.45*hs)} // wider, softer centre at speed
   const k=(input.steerTOn?lerp(16,9,hs):st?lerp(6,3.4,hs):lerp(4.5,9,hs))/W,maxR=lerp(5.5,2.6,hs)/W; // lag + rate limit; key release = self-aligning, stronger at speed
   c.steer+=clamp((st-c.steer)*Math.min(1,dt*k),-maxR*dt,maxR*dt)}
  autoPitCheck(c,live);if(c.ap){const ap=autoPitDrive(c);thr=ap.thr;brk=ap.brk;c.xmode=false;otOn=false;input.clutchK=input.clutchT=0}
  let v=c.v;const prevS=c.s;
  // launch: hold the clutch on the grid, rev into the window, let go when the lights go out
  let clutchHold=false;{const cin=clutchOn()&&(input.clutchK||input.clutchT),thrIn=thr;
    if(cin&&raceT<0)c.launchPend=true;
    if(c.launchPend){if(cin){clutchHold=true;c.lrpm+=clamp(4000+thrIn*8500-c.lrpm,-5000*dt,7000*dt);thr=0;v=0;c.v=0}
      else{c.launchPend=false;if(raceT>=0&&thrIn>0.1){const r=c.lrpm;
        if(r>=LAUNCH_LO&&r<=LAUNCH_HI){c.lTr=1.3;c.lDist=100;toast(`完美起步！反應 ${raceT.toFixed(2)} 秒`);buzz([30,20,60])}
        else if(r>LAUNCH_HI){c.lTr=0.5;c.lT=1.8;c.lSpin=1.8;toast('轉速過高，後輪空轉')}
        else{c.lPw=0.55;c.lT=1.3;toast('轉速過低，起步無力')}}}}
    else c.lrpm=4000;
    if(c.lDist>0){c.lDist-=Math.abs(c.v)*dt;if(c.lDist<=0)c.lTr=1}
    if(c.lT>0){c.lT-=dt;if(c.lT<=0){c.lTr=1;c.lPw=1}}
    if(c.lSpin>0){c.lSpin-=dt;const fx=Math.sin(c.h),fz=Math.cos(c.h);for(const sd of [-0.8,0.8])emitSmoke(c.x-fx*1.75+fz*sd,c.y+0.25,c.z-fz*1.75-fx*sd)}}
  c.idx=nearest(c.x,c.z,c.idx,24);const i=c.idx;const dx=c.x-PX[i],dz=c.z-PZ[i];
  const along=dx*TX[i]+dz*TZ[i];c.d=dx*NX[i]+dz*NZ[i];c.s=wrapS(i*DS+along);{const f=clamp(along/DS,-1,1);c.y=f>=0?lerp(PY[i],PY[(i+1)%N],f):lerp(PY[i],PY[(i-1+N)%N],-f);c.y+=bankY(BK[i],c.d)}
  const slope=GR[i]*(Math.sin(c.h)*TX[i]+Math.cos(c.h)*TZ[i]);c.pitch=(c.pitch||0)+(-Math.atan(slope)-(c.pitch||0))*Math.min(1,dt*8);
  const ad=Math.abs(c.d);let surfMu=1,surfDrag=0;
  if(live&&gfx().lv>=2&&v>22&&((brk>0.9&&Math.abs(c.steer)>0.45)||ad>HW+1.4)){const fx=Math.sin(c.h),fz=Math.cos(c.h);emitSmoke(c.x-fx*1.75+fz*(Math.random()<.5?-0.8:0.8),c.y+0.2,c.z-fz*1.75)}
  if(ad>HW+1.4){surfMu=0.75;surfDrag=0.04}
  if(ad>HW+1.6&&(c.d>0?TGL:TGR)[c.idx]){surfMu=0.62;surfDrag=0.2}
  if(ad>HW+2.4&&v>15){c.offT+=dt;if(c.offT>1.2&&raceT-offWarned>10){offWarned=raceT;radio('出界了，回到賽道上','off',10)}}else c.offT=0;
  // active aero
  const zi=zoneAt(c.s);
  if(c.ap)c.xmode=false;else if(A.aero==='auto')c.xmode=zi>=0&&brk<0.05&&Math.abs(c.steer)<0.5;
  else{if(xPress&&zi>=0)c.xmode=!c.xmode;if(zi<0||brk>0.05)c.xmode=false}
  if(xPress&&zi<0&&live)toast('不在直道模式區');xPress=false;
  if(zi>=0&&!c.xmode&&A.aero==='manual'&&v>40)radio('直道模式區 — 展開前後翼','xm',25);
  c.aero+=((c.xmode?1:0)-c.aero)*Math.min(1,dt*5);
  {if(raceT<0&&!tut)otOn=false;if(otOn&&c.soc<=0){otOn=false;if(live)toast('電池用完，OT 關閉')}const was=c.otActive;c.otActive=otOn&&c.otAvail;if(live&&otOn&&was!==c.otActive)toast(otText())}
  const df=S.df||0;
  const ClA=lerp(PHY.ClA_Z*(1+0.05*df),PHY.ClA_X*(1+0.05*df),c.aero),CdA=lerp(PHY.CdA_Z*(1+0.04*df),PHY.CdA_X*(1+0.03*df),c.aero);
  const k=0.5*PHY.rho*ClA/PHY.m;const vabs=Math.abs(v),vk=vabs*3.6;const gN=Math.max(PHY.g*0.35,PHY.g+k*v*v+v*v*VK[i]);
  const mu=PHY.mu*c.team.grip*surfMu*tyreGrip(c);
  // gearbox
  if(shiftReq>0)shiftUp(c);else if(shiftReq<0)shiftDown(c,ratio);shiftReq=0;
  if(A.gearbox==='auto'||c.ap){if(c.rpm>11650&&c.gear<8&&thr>0.2)shiftUp(c);else if(c.gear>1&&rpmFor(vk,c.gear-1,ratio)<10600)shiftDown(c,ratio)}
  else if(vk<14&&c.gear>1)c.gear=1;
  c.shiftCut=Math.max(0,c.shiftCut-dt);
  let rpm=rpmFor(vk,c.gear,ratio);if(c.gear===1&&vk<60)rpm=Math.max(rpm,4000+thr*6500*(1-vk/60));
  c.rpm=Math.min(rpm,PHY.rev+200);if(clutchHold)c.rpm=c.lrpm;
  const limiter=rpm>=PHY.rev,cut=c.shiftCut>0||(limiter&&Math.random()<0.6);
  // energy: deploy cap by ERS mode; Overtake allows full 350 kW to 337 km/h
  const cap=deployKW()*1000;
  let ers=0;if(thr>0.05&&c.soc>0&&!cut&&c.v>=0)ers=thr*cap*ersTaper(vk,c.otActive)*clamp(c.soc/0.5e6,0,1);
  let clip=0;if(thr>0.9&&vk>275&&!c.otActive)clip=200e3*clamp((vk-275)/40,0,1); // "super-clipping": ICE charges the battery at the end of long straights
  const Pice=cut?0:Math.max(0,PHY.ice*c.team.power*powerFrac(rpm)*thr-clip*0.5);
  const trac=mu*gN*PHY.m*0.62*(c.lTr||1);
  const Fd=v<0?Math.min((PHY.ice*0.3*thr)/Math.max(vabs,3),trac):Math.min((Pice+ers)*(c.lPw||1)/Math.max(vabs,4),trac);
  const engBrake=thr<0.05&&v>3?PHY.m*PHY.g*0.07*(rpm/PHY.rev):0;
  const resist=vabs<0.05?0:0.5*PHY.rho*CdA*v*v+(PHY.Crr+surfDrag)*PHY.m*PHY.g+engBrake;
  const bias=S.bias||56,biasEff=1-0.012*Math.abs(bias-56);
  let Fb=0,reversing=false;
  if(brk){if(v>0.5)Fb=brk*mu*1.05*gN*PHY.m*biasEff;else if(thr<0.05&&racing)reversing=true}
  // harvest: braking (MGU-K), lift-off, part throttle, super-clipping; scaled by the charge assist
  let harvest=0;if(Fb>0)harvest+=Math.min(PHY.ers,Fb*vabs*0.9);
  if(thr<0.05&&vabs>12)harvest+=90e3+engBrake*vabs*0.5;else if(thr<0.7&&vabs>12)harvest+=50e3;
  harvest+=clip;harvest*=(S.charge||2)*(1+0.3*(1-deployKW()/350));if(otOn)harvest=0; // OT is pure discharge
  if(c.otBonus>0&&harvest>0){const ex=Math.min(c.otBonus,harvest*0.5*dt);c.otBonus-=ex;harvest+=ex/dt} // Overtake: +0.5 MJ extra recharge allowance for the lap
  c.soc=clamp(c.soc+(harvest-ers)*dt,0,PHY.batt);c.ersP=ers>1?ers:-harvest;
  if(c.soc<PHY.batt*0.12&&racing)radio('電量偏低 — 鬆油或重煞來回收能量','soc',30);
  // lateral: kinematic yaw, capped by tyre grip (friction circle with braking)
  const steerMax=0.34*(A.steer||1)/(1+vabs/24);const delta=c.steer*steerMax;
  let yaw=v*Math.tan(delta)/PHY.wb;
  const brkUse=Fb/(mu*1.05*gN*PHY.m+1e-6);const turnInBias=1+0.02*(56-bias)*brkUse;
  const aLatMax=mu*gN*Math.sqrt(Math.max(0.15,1-0.7*brkUse*brkUse))*turnInBias+PHY.g*Math.abs(BK[i]);
  let latA=Math.abs(yaw*v),slide=0;
  if(latA>aLatMax&&vabs>1){slide=(latA-aLatMax)/aLatMax;yaw=Math.sign(yaw)*aLatMax/vabs;latA=aLatMax}
  const Fscrub=Math.min(slide,1.5)*PHY.m*3.2;
  const acc=(Fd-Math.sign(v)*(resist+Fb+Fscrub))/PHY.m-PHY.g*slope;
  let vNew=v+acc*dt;if(v>0&&vNew<0)vNew=0;if(v<0&&vNew>0&&thr<0.05)vNew=0;
  if(reversing)vNew=Math.max(vNew-6*dt,-5);else if(thr<0.05&&Math.abs(v)<0.6&&Math.abs(vNew)<0.6)vNew=0; // hill hold
  v=vNew;
  c.yaw+=(yaw-c.yaw)*Math.min(1,dt*10);c.h+=c.yaw*dt;
  c.x+=Math.sin(c.h)*v*dt;c.z+=Math.cos(c.h)*v*dt;
  // tyres: each wheel heats and wears with its own load (fronts under braking, rears under power, outside pair in corners)
  if(c.tyre){const ty=c.tyre,cp=TYRES[ty.comp],latN=Math.min(1.3,latA/45),sg=yaw>0?1:-1,bu=Math.min(1,brkUse);let aw=0,worst=0;
    for(let w=0;w<4;w++){const fr=w<2,ld=1+(w%2?1:-1)*0.4*sg*latN,E=(fr?0.55:0.5)*latN*ld+(fr?0.5*bu:0.5*thr*clamp(1-vabs/50,0,1))+Math.min(slide,1)*0.6;
      ty.T[w]+=dt*(TYK.h*cp.heat*E-TYK.c*(ty.T[w]-40)*(1+vabs/90));
      ty.w[w]=Math.min(1,ty.w[w]+dt*E*TYK.w*cp.wear*(ty.T[w]>105?1+(ty.T[w]-105)/20:1));aw+=ty.w[w];worst=Math.max(worst,ty.w[w])}
    c.wear=aw/4;if(live&&!tut&&!ty.warned&&worst>0.6){ty.warned=true;radio('Box, box：輪胎壽命剩不到 40%，進站換新胎','box',99)}}
  // barrier
  const bump=()=>{const th=Math.atan2(TX[i],TZ[i]);let dh=((c.h-th+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;if(Math.abs(dh)>Math.PI/2)dh=dh>0?Math.PI-dh:-Math.PI-dh;const imp=Math.abs(Math.sin(dh));if(c.wallT==null||raceT-c.wallT>0.4)v*=1-0.3*imp;else v-=Math.sign(v)*Math.min(Math.abs(v),2.5*dt);c.wallT=raceT;c.h=th+dh*0.3;c.yaw=0};
  const d2=(c.x-PX[i])*NX[i]+(c.z-PZ[i])*NZ[i];const W=(d2>0?WL[i]:WR[i])-1.2;
  if(Math.abs(d2)>W){const sg=Math.sign(d2),ex=Math.abs(d2)-W;c.x-=NX[i]*ex*sg;c.z-=NZ[i]*ex*sg;bump()}
  // pit wall between the track and the pit lane
  {const r=pitRel(c.s),dd=d2*PIT.side,g=1.2;if(c.pside==null||r<PIT.T||r>PIT.len-PIT.T)c.pside=dd>PIT.PW?1:0;
   else if(dd<PIT.PW-g)c.pside=0;else if(dd>PIT.PW+g)c.pside=1;else{const ex=((c.pside?PIT.PW+g:PIT.PW-g)-dd)*PIT.side;c.x+=NX[i]*ex;c.z+=NZ[i]*ex;bump()}}
  // pit lane: speed limiter, and a tyre change when stopped in your own box
  {const pin=inPit(c);c.inPit=pin;if(pin&&v>22.2)v=Math.max(22.2,v-30*dt);
   let db=c.s-PIT.boxes[opts.team];if(db>TL/2)db-=TL;if(db<-TL/2)db+=TL;
   if(pin&&Math.abs(v)<0.6&&Math.abs(db)<6){c.pitT=(c.pitT||0)+dt;if(c.pitT>2.2&&!c.pitDone){c.pitDone=true;c.tyre=newTyres(settings.setup.pitTyre||c.tyre.comp);c.wear=0;toast('換上新的'+TYRES[c.tyre.comp].n);radio('新胎裝好了，出發！','pit',1)}}else{c.pitT=0;if(Math.abs(db)>8)c.pitDone=false}}
  c.v=v;c.slide=slide;
  if(live)advanceTiming(c,prevS);
}
// four deployment modes; each keeps its own ±20% trim. Overtake needs the 1-second detection (see advanceTiming)
const ERS_MODES=[{n:'無',full:'無 · 全力回收',kw:0},{n:'中',full:'中 · 均衡',kw:140},{n:'快',full:'快 · 最快圈',kw:220},{n:'超',full:'超 · 常規上限',kw:280}];
const OT_KW=315;let otOn=false;
const deployKW=()=>otOn?(player&&player.otAvail?350:OT_KW):ERS_MODES[settings.setup.mode].kw;
const otText=()=>player&&player.otAvail?'OT OVERRIDE · 100% · 350 kW · 不回充':'OT ACTIVE · 90% · 315 kW · 不回充';
const buzz=p=>{try{if(navigator.vibrate)navigator.vibrate(p)}catch(e){}};
function setMode(m){const S=settings.setup;m=clamp(m|0,0,3);if(m===S.mode)return;S.mode=m;saveSettings();buzz(15);toast(ERS_MODES[m].full+' · '+ERS_MODES[m].kw+' kW'+(otOn?'（OT 開啟中）':''))}
function cycleMode(d){setMode(settings.setup.mode+d)}
function toggleOT(){if(!otOn&&player&&player.soc<=PHY.batt*0.01){toast('電池沒電，OT 開不了');buzz(20);return}otOn=!otOn;buzz(otOn?[40,30,90]:15);toast(otOn?otText():'OT 關閉 · 回到「'+ERS_MODES[settings.setup.mode].n+'」'+ERS_MODES[settings.setup.mode].kw+' kW')}

function resetPlayer(){wAng=wTgt=0;const c=player;c.pside=0;c.ap=null;const p=at(c.s,0,{});c.x=p.x;c.z=p.z;c.h=p.h;c.v=0;c.yaw=0;c.steer=0;c.d=0;c.gear=1}
