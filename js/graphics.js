'use strict';
/* Grid 2026 — 畫質分級、起跑 UI、賽車線 */
/* ================= GRAPHICS QUALITY ================= */
const GFX={low:{lv:0,pr:1,sh:0,trees:0.35,smoke:0,name:'低畫質'},mid:{lv:1,pr:1.5,sh:512,trees:0.7,smoke:0.5,name:'中畫質'},high:{lv:2,pr:2,sh:1024,trees:1,smoke:1,name:'高畫質'}};
const gfx=()=>GFX[settings.assist.gfx]||GFX.mid;
function applyGfx(){const q=gfx();renderer.setPixelRatio(Math.min(devicePixelRatio,q.pr));resize();
  sun.castShadow=q.sh>0;if(q.sh&&sun.shadow.mapSize.x!==q.sh){sun.shadow.mapSize.set(q.sh,q.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
  if(trackGroup){trackGroup.traverse(o=>{if(o.userData.q!=null)o.visible=q.lv>=o.userData.q;if(o.isMesh&&!o.isInstancedMesh&&o.material&&o.material.isMeshLambertMaterial)o.receiveShadow=true});
    (trackGroup.userData.inst||[]).forEach(m=>{if(m.userData.full==null)m.userData.full=m.count;m.count=Math.max(1,Math.ceil(m.userData.full*q.trees))})}
  smokePts.visible=q.smoke>0}
function sunFollow(){const p=state==='menu'?(menuCar&&menuCar.base):player;if(!p)return;sun.position.set(p.x-60,p.y+90,p.z+45);sun.target.position.set(p.x,p.y,p.z);sun.target.updateMatrixWorld()}
// tyre smoke: a small pool of soft points
const SM_N=48,smPos=new Float32Array(SM_N*3),smCol=new Float32Array(SM_N*4),smP=[];let smNext=0,smSkip=0;
for(let i=0;i<SM_N;i++){smP.push({life:0,vx:0,vy:0,vz:0});smPos[i*3+1]=-999}
const smokeTex=canvasTex(64,64,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h)});
const smokeGeo=new THREE.BufferGeometry();smokeGeo.setAttribute('position',new THREE.BufferAttribute(smPos,3));smokeGeo.setAttribute('color',new THREE.BufferAttribute(smCol,4));
const smokePts=new THREE.Points(smokeGeo,new THREE.PointsMaterial({size:1.5,map:smokeTex,transparent:true,depthWrite:false,vertexColors:true,sizeAttenuation:true}));smokePts.frustumCulled=false;smokePts.renderOrder=4;scene.add(smokePts);
function emitSmoke(x,y,z){const r=gfx().smoke;if(!r)return;smSkip+=r;if(smSkip<1)return;smSkip-=1;const i=smNext;smNext=(smNext+1)%SM_N;const p=smP[i];p.life=1;p.vx=(Math.random()-.5)*1.6;p.vy=0.9+Math.random()*0.8;p.vz=(Math.random()-.5)*1.6;smPos[i*3]=x;smPos[i*3+1]=y;smPos[i*3+2]=z}
const flame=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,color:0xffa24a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));flame.visible=false;flame.scale.set(0.9,0.9,1);scene.add(flame);
function tickFlame(dt){if(popFlash>0)popFlash-=dt;const on=popFlash>0&&gfx().lv>=2&&state==='race'&&!!player;flame.visible=on;if(on){const p=player;flame.position.set(p.x-Math.sin(p.h)*2.75,p.y+0.42,p.z-Math.cos(p.h)*2.75)}}
function tickSmoke(dt){let any=false;for(let i=0;i<SM_N;i++){const p=smP[i];if(p.life<=0)continue;any=true;p.life-=dt*0.9;smPos[i*3]+=p.vx*dt;smPos[i*3+1]+=p.vy*dt;smPos[i*3+2]+=p.vz*dt;const a=Math.max(0,p.life);smCol[i*4]=smCol[i*4+1]=smCol[i*4+2]=0.92;smCol[i*4+3]=a*0.38;if(p.life<=0)smPos[i*3+1]=-999}
  if(any){smokeGeo.attributes.position.needsUpdate=true;smokeGeo.attributes.color.needsUpdate=true}}
let fpsAvg=60,fpsL=0,fpsShown=0;
/* ================= LAUNCH UI ================= */
{const C=2*Math.PI*102*0.75;$('launchArc').setAttribute('stroke-dasharray',`0 ${(LAUNCH_LO/13000*C).toFixed(1)} ${((LAUNCH_HI-LAUNCH_LO)/13000*C).toFixed(1)} 2000`)}
let launchShown=null;
function tickLaunchUI(){const on=clutchPhase(),held=on&&(input.clutchK||input.clutchT),key=on?(held?2:1):0;
  if(!touchEdit)show('tClutch',on);
  if(key===launchShown)return;launchShown=key;show('launchTip',on);$('launchArc').setAttribute('visibility',on?'visible':'hidden');
  if(on)$('launchTip').innerHTML=held?'踩油門，把轉速停在<b>綠色區</b>，燈滅就放開':(tutTouch()?'彈射起步：按住<b>離合器</b>再踩油門':`彈射起步：按住 ${tK('aero')} 再踩油門`)}
/* ================= RACING LINE ================= */
// colour = how hard the car would have to brake, from its speed right now, to make the slowest point still ahead
const RL_W=150,RL_LA=230,rlSev=new Float32Array(RL_W);
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function rlSet(i,r,g,b,a){const put=o=>{rlCol[o]=r;rlCol[o+1]=g;rlCol[o+2]=b;rlCol[o+3]=a;rlCol[o+4]=r;rlCol[o+5]=g;rlCol[o+6]=b;rlCol[o+7]=a};put(i*8);if(i===0)put(N*8)}
function cycleLine(){const A=settings.assist,o=['full','corner','off'];A.line=o[(o.indexOf(A.line||'full')+1)%3];saveSettings();renderPauseLine();toast('賽車線：'+{full:'完整顯示',corner:'僅限彎道',off:'關閉'}[A.line])}
function renderPauseLine(){const el=$('pauseLine');if(!el)return;const m=settings.assist.line||'full';[...el.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===m)))}
{const el=$('pauseLine');if(el)[...el.children].forEach(b=>b.onclick=()=>{settings.assist.line=b.dataset.v;saveSettings();renderPauseLine()})}
function updateLine(){if(!rlMesh)return;const mode=settings.assist.line||'full',p=player,prof=PROFILES[opts.team];
  const show=mode!=='off'&&state==='race'&&!!p&&!!prof&&prof.length===N&&!p.ap; // shown in the pit lane too (time trial starts there); hidden only while the team drives the car
  if(rlMesh.visible!==show)rlMesh.visible=show;if(!show)return;
  for(let c=0;c<rlN;c++)rlSet((rlI0+c)%N,0,0,0,0);
  const v=Math.max(p.v,0),k=0.5*PHY.rho*PHY.ClA_Z/PHY.m,aMax=PHY.mu*p.team.grip*(PHY.g+k*v*v)+0.5*PHY.rho*PHY.CdA_Z*v*v/PHY.m;
  const i0=(p.idx+2)%N;let run=0;
  for(let c=RL_LA;c>=0;c--){const j=(i0+c)%N,vp=prof[j],r=(v*v-vp*vp)/(2*(c+2)*DS)/aMax;if(r>run)run=r;if(c<RL_W)rlSev[c]=run}
  const flash=p.aero>0.5&&((performance.now()/110|0)&1);
  for(let c=0;c<RL_W;c++){const j=(i0+c)%N,sv=rlSev[c],y=sstep(0.26,0.38,sv),rd=sstep(0.58,0.72,sv);
    const r=lerp(lerp(0.16,1,y),1,rd),g=lerp(lerp(1,0.84,y),0.16,rd),b=lerp(lerp(0.42,0.1,y),0.14,rd);
    let a=0.66*Math.min(1,c/4)*Math.min(1,(RL_W-c)/36);
    if(mode==='corner')a*=Math.max(sstep(0.14,0.28,sv),clamp(Math.abs(KS[j])*320-0.6,0,1));
    if(flash&&rd>0.5)a*=0.25;
    rlSet(j,r,g,b,a)}
  rlI0=i0;rlN=RL_W;rlMesh.geometry.attributes.color.needsUpdate=true}
