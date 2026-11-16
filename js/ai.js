'use strict';
/* Grid 2026 — 電腦車 */
/* ================= AI ================= */
const tmp={};
function updateAI(c,dt){
  const prof=PROFILES[c.ti];const prevS=c.s;const racing=raceT>0;
  const i=Math.floor(c.s/DS)%N;const look=(i+Math.round(Math.max(c.v,10)*0.25/DS))%N;
  let target=Math.min(prof[i],prof[look])*c.skill;
  const zi=zoneAt(c.s);c.xmode=zi>=0&&c.v>30;c.otActive=c.otAvail&&zi>=0;if(c.otActive)target*=1.015;
  let block=null,bg=Infinity;const pc=progress(c);
  for(const o of cars){if(o===c||Math.abs(o.y-c.y)>2.5)continue;const g=progress(o)-pc;if(g>0&&g<Math.max(18,c.v*0.9)&&Math.abs(o.d-c.d)<2.3&&g<bg){bg=g;block=o}}
  if(block&&!block.finished){const desired=block.d>0?block.d-3.4:block.d+3.4;const alt=block.d>0?block.d+3.4:block.d-3.4;
    const free=dd=>Math.abs(dd)<HW-1.2&&!cars.some(o=>o!==c&&o!==block&&Math.abs(progress(o)-pc)<10&&Math.abs(o.d-dd)<2.4);
    if(c.laneT<=0){if(free(desired)){c.lane=desired-LINE[i];c.laneT=2.5}else if(free(alt)){c.lane=alt-LINE[i];c.laneT=2.5}}
    if(bg<9)target=Math.min(target,block.v*(bg<6?0.92:0.99))}
  c.laneT-=dt;if(c.laneT<=0)c.lane*=Math.pow(0.5,dt);
  if(!racing)target=0;if(c.finished&&raceT-c.finishT>2)target=Math.min(target,35);
  const v=c.v;const ClA=c.xmode?PHY.ClA_X:PHY.ClA_Z,CdA=c.xmode?PHY.CdA_X:PHY.CdA_Z;const k=0.5*PHY.rho*ClA/PHY.m;
  if(v<target){const P=(PHY.ice+PHY.ers*ersTaper(v*3.6,c.otActive)*0.85)*c.team.power;const a=Math.min(P/Math.max(v,4)/PHY.m,PHY.mu*c.team.grip*(PHY.g+k*v*v)*0.62)-0.5*PHY.rho*CdA*v*v/PHY.m-PHY.g*GR[i];c.v=Math.min(target,v+Math.max(0,a)*dt*c.skill)}
  else{const a=PHY.mu*c.team.grip*(PHY.g+k*v*v)+0.5*PHY.rho*CdA*v*v/PHY.m;c.v=Math.max(target,v-a*dt)}
  c.s=wrapS(c.s+c.v*dt);
  const dT=clamp(LINE[i]+c.lane,-(HW-1.1),HW-1.1);c.d+=(dT-c.d)*Math.min(1,dt*1.4*Math.min(1,c.v/14));
  at(c.s,c.d,tmp);const ph=c.h;c.x=tmp.x;c.z=tmp.z;c.y=tmp.y;let dh=tmp.h-ph;dh=((dh+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;c.h=ph+dh*Math.min(1,dt*12);c.yaw=dh/Math.max(dt,1e-4);
  c.aero+=((c.xmode?1:0)-c.aero)*Math.min(1,dt*5);c.idx=i;c.pitch=-Math.atan(GR[i]);
  advanceTiming(c,prevS);
}
function collide(){const p=player;const fx=Math.sin(p.h),fz=Math.cos(p.h);
  for(const c of cars){if(c===p||Math.abs(c.y-p.y)>2.5)continue;const rx=c.x-p.x,rz=c.z-p.z;if(rx*rx+rz*rz>49)continue;
    const lon=rx*fx+rz*fz,lat=rx*fz-rz*fx;const ol=4.9-Math.abs(lon),oa=1.95-Math.abs(lat);
    if(ol>0&&oa>0){if(oa<ol){const s=Math.sign(lat)||1;p.x-=fz*s*oa*0.4;p.z+=fx*s*oa*0.4;c.d=clamp(c.d+(Math.sign(c.d-p.d)||1)*oa*0.8,-(HW-1),HW-1)}
      else if(lon>0){c.s=wrapS(c.s+ol);c.v=Math.max(c.v,p.v)}   // player runs into a car ahead: it is shoved forward
      else{c.s=wrapS(c.s-ol);c.v=Math.min(c.v,p.v*0.97)}}}}     // a car hits the player from behind: it backs off
