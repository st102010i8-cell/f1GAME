'use strict';
/* Grid 2026 — 賽道場景 */
/* ================= TRACK SCENE ================= */
const THEMES={
 green:{ground:'#4e7a35',run:'#5c5f5a',top:[.33,.53,.78],hor:[.8,.86,.9],fog:0xb9c6cf,trees:650,tree:0x2f5a2c,hill:0x7d8f86,bld:0},
 park:{ground:'#5a8340',run:'#62655f',top:[.36,.56,.8],hor:[.84,.88,.9],fog:0xc3ccd2,trees:950,tree:0x355f2e,hill:0x86958a,bld:0},
 forest:{ground:'#3e6a2c',run:'#575a55',top:[.42,.5,.6],hor:[.78,.8,.8],fog:0xa9b2b4,trees:1500,tree:0x24461f,hill:0x5b6f58,bld:0},
 desert:{ground:'#c8a26a',run:'#a88c66',top:[.3,.48,.76],hor:[.95,.85,.7],fog:0xe3cda6,trees:70,tree:0x6f7d3a,hill:0xc09d6e,bld:0},
 city:{ground:'#80868b',run:'#9a9ea2',top:[.3,.52,.8],hor:[.84,.89,.92],fog:0xbcc8d0,trees:160,tree:0x3c6a35,hill:0x7b8c80,bld:420}
};
let trackGroup=null,gantryLamps=[],miniPath=null,miniZones=null;
function disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m.map&&![texKerb,texCheck,texSeat,...KEEP_TEX].includes(m.map))m.map.dispose();m.dispose()})}})}
// track surfaces are built with RIB_SUB rows per track sample; every surface (road, kerbs, run-off, gravel)
// goes through the same interpolation, so neighbouring strips share identical edge heights
const RIB_SUB=2;
const crY=(i,t)=>{const a=PY[(i-1+N)%N],b=PY[i],c=PY[(i+1)%N],d=PY[(i+2)%N];return 0.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)};
function ribbon(f0,f1,yo,uLen,filter,vs,cols){cols=cols||1;const pos=[],uv=[],idx=[],W=cols+1;let v=0,run=-1;
  for(let c=0;c<=N*RIB_SUB;c++){const i=Math.floor(c/RIB_SUB)%N,t=(c%RIB_SUB)/RIB_SUB,j=(i+1)%N;const on=!filter||(filter(i)&&(t===0||filter(j)));
    if(on){if(run<0)run=v;const d0=t?lerp(f0(i),f0(j),t):f0(i),d1=t?lerp(f1(i),f1(j),t):f1(i),y=(t?crY(i,t):PY[i])+yo,bk=t?lerp(BK[i],BK[j],t):BK[i],u=c*DS/RIB_SUB/uLen;
    let px=PX[i],pz=PZ[i],nx=NX[i],nz=NZ[i];if(t){px=lerp(PX[i],PX[j],t);pz=lerp(PZ[i],PZ[j],t);nx=lerp(NX[i],NX[j],t);nz=lerp(NZ[i],NZ[j],t);const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l}
    for(let q=0;q<=cols;q++){const d=d0+(d1-d0)*q/cols;pos.push(px+nx*d,y+bankY(bk,d),pz+nz*d);uv.push(u,vs?d/vs:q/cols)}
    v+=W;if(v-run>=2*W){const p=v-2*W;for(let q=0;q<cols;q++){const a=p+q,b=p+W+q;idx.push(a,b,a+1,a+1,b,b+1)}}}else run=-1}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g}
function wallGeo(side){const pos=[],idx=[];for(let c=0;c<=N;c++){const i=c%N;const TG=side>0?TGL:TGR,d=TG[i]?side*(HW+2):(side>0?WL[i]:-WR[i])+side*0.5;const x=PX[i]+NX[i]*d,z=PZ[i]+NZ[i]*d;const by=bankY(BK[i],d),bot=PY[i]+by-(BR[i]?0.8:25);pos.push(x,bot,z,x,PY[i]+by+1.1,z);if(c>0&&!TG[i]&&!TG[(i-1+N)%N]){const v=c*2;idx.push(v-2,v,v-1,v-1,v,v+1)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g}
function signSpot(s0,side){const i=Math.floor(wrapS(s0)/DS)%N,r=pitRel(s0),pit=side===PIT.side&&(r<PIT.len+15||r>TL-15);
  if(pit){const onWall=r>PIT.T+10&&r<PIT.len-PIT.T-10;return onWall?{off:PIT.PW,lift:1.6,ok:true}:{ok:false}} // no wall on the entry / exit roads
  return {off:(side>0?WL[i]:WR[i])+SIGN_BACK,lift:0,ok:true}}
// trackside signs stand this far behind the wall face (clear of the 0.35 m ad boards and their posts);
// panels start SIGN_CLEAR above the ground, i.e. 0.3 m over the top of the 2.5 m advertising boards
const SIGN_BACK=1.75,SIGN_CLEAR=2.8;
function board(text,color){const t=canvasTex(256,128,(c,w,h)=>{c.fillStyle='#10161d';c.fillRect(0,0,w,h);c.fillStyle=color;c.font='800 74px "Saira Condensed",Arial Narrow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+4)});return new THREE.Mesh(new THREE.PlaneGeometry(4,2),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}))}
let rlMesh=null,rlCol=null,rlI0=0,rlN=0;
const cloudTex=canvasTex(256,96,(c,w,h)=>{for(let k=0;k<9;k++){const x=30+Math.random()*(w-60),y=38+Math.random()*26,r=22+Math.random()*24,g=c.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h)}});
function buildTrackScene(def){
  if(trackGroup){scene.remove(trackGroup);disposeGroup(trackGroup)}
  loadTrackCore(def);const th=THEMES[def.theme];const G=new THREE.Group();trackGroup=G;gantryLamps=[];
  skyU.top.value.setRGB(...th.top);skyU.hor.value.setRGB(...th.hor);scene.fog.color.setHex(th.fog);sky.position.set(CX,HAVG,CZ);
  const texGround=canvasTex(256,256,(c,w,h)=>{noise(c,w,h,th.ground,0.18,12000);c.globalAlpha=.07;for(let i=0;i<w;i+=32){c.fillStyle=i%64?'#fff':'#000';c.fillRect(i,0,32,h)}},true);
  const texRun=canvasTex(256,256,(c,w,h)=>noise(c,w,h,th.run,0.09,9000),true);
  {const mg=450,bx0=BB[0]-mg,bx1=BB[1]+mg,bz0=BB[2]-mg,bz1=BB[3]+mg;const nx=Math.ceil((bx1-bx0)/TCELL),nz=Math.ceil((bz1-bz0)/TCELL);
   const pos=new Float32Array((nx+1)*(nz+1)*3),uv=new Float32Array((nx+1)*(nz+1)*2),idx=new Uint32Array(nx*nz*6);let p=0,q=0,r=0;
   for(let a=0;a<=nz;a++)for(let b=0;b<=nx;b++){const x=bx0+b*(bx1-bx0)/nx,z=bz0+a*(bz1-bz0)/nz;pos[p++]=x;pos[p++]=terrainH(x,z)-0.35;pos[p++]=z;uv[q++]=x/50;uv[q++]=z/50}
   for(let a=0;a<nz;a++)for(let b=0;b<nx;b++){const i0=a*(nx+1)+b,i1=i0+1,i2=i0+nx+1,i3=i2+1;idx[r++]=i0;idx[r++]=i2;idx[r++]=i1;idx[r++]=i1;idx[r++]=i2;idx[r++]=i3}
   const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(pos,3));tg.setAttribute('uv',new THREE.BufferAttribute(uv,2));tg.setIndex(new THREE.BufferAttribute(idx,1));tg.computeVertexNormals();
   const gm=new THREE.MeshLambertMaterial({map:texGround});G.add(new THREE.Mesh(tg,gm));
   const far=5000,flat=(xa,xb,za,zb)=>{const g=new THREE.PlaneGeometry(xb-xa,zb-za);g.rotateX(-Math.PI/2);const u=g.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)*(xb-xa)/50,u.getY(i)*(zb-za)/50);const m=new THREE.Mesh(g,gm);m.position.set((xa+xb)/2,HAVG-0.35,(za+zb)/2);G.add(m)};
   flat(bx0-far,bx0,bz0-far,bz1+far);flat(bx1,bx1+far,bz0-far,bz1+far);flat(bx0,bx1,bz0-far,bz0);flat(bx0,bx1,bz1,bz1+far)}
  const DSIDE=THREE.DoubleSide;
  const runOut=i=>WL[i]+0.25,runIn=i=>-WR[i]-0.25;
  {const rm=new THREE.MeshLambertMaterial({map:texRun,side:DSIDE});G.add(new THREE.Mesh(ribbon(()=>HW-0.5,runOut,0.0,14,i=>!TGL[i],14,7),rm));G.add(new THREE.Mesh(ribbon(runIn,()=>-HW+0.5,0.0,14,i=>!TGR[i],14,7),rm));
   // infield fans for tight corners, with a tyre stack on the hub
   if(HUBS.length){const pos=[],uv=[],idx=[];let v=0;const o=new THREE.Object3D(),col=new THREE.Color(),cyl=new THREE.CylinderGeometry(1.25,1.25,0.4,14),im=new THREE.InstancedMesh(cyl,new THREE.MeshLambertMaterial({color:0xffffff}),HUBS.length*3);
     HUBS.forEach((h,hk)=>{const vs=v;
       // a ring that keeps the road's own height out past the kerb, then a fan from that ring to the hub
       const tri=(a,b,c)=>{const ax=pos[b*3]-pos[a*3],az=pos[b*3+2]-pos[a*3+2],bx=pos[c*3]-pos[a*3],bz=pos[c*3+2]-pos[a*3+2];if(az*bx-ax*bz>0)idx.push(a,b,c);else idx.push(a,c,b)};
       for(let q=-1;q<=h.len;q++){const i=(h.i0+q+N)%N,dh=Math.hypot(PX[i]-h.x,PZ[i]-h.z);for(const off of [HW-0.5,Math.min(HW+2.2,dh-1)]){const d=h.sd*off,x=PX[i]+NX[i]*d,z=PZ[i]+NZ[i]*d;pos.push(x,PY[i]+0.01,z);uv.push(x/6,z/6);v++}
         // each row gets its own hub vertex at that row's road height: on a climbing hairpin the infield rises with the road
         // (a ruled surface) instead of tilting towards one fixed hub height; the tyre stack covers the hub itself
         pos.push(h.x,PY[i]+0.01,h.z);uv.push(h.x/6,h.z/6);v++;
         if(q>-1){tri(v-6,v-3,v-5);tri(v-5,v-3,v-2);tri(v-4,v-5,v-2);tri(v-4,v-2,v-1)}}
       // the two open ends of the infield slope down and away like a small embankment, so there is no step to the ground
       const skirt=(r,i,dir)=>{const b=vs+r*3,n0=v;for(const k of [0,1,2]){pos.push(pos[(b+k)*3]+dir*TX[i]*4,pos[(b+k)*3+1]-2.4,pos[(b+k)*3+2]+dir*TZ[i]*4);uv.push(pos[(b+k)*3]/6,pos[(b+k)*3+2]/6);v++}
         tri(b,b+1,n0+1);tri(b,n0+1,n0);tri(b+1,b+2,n0+2);tri(b+1,n0+2,n0+1)};
       skirt(0,(h.i0-1+N)%N,-1);skirt(h.len+1,(h.i0+h.len+N)%N,1);
       for(let k=0;k<3;k++){o.position.set(h.x,h.y+0.2+k*0.4,h.z);o.updateMatrix();im.setMatrixAt(hk*3+k,o.matrix);col.setHex(k%2?0xeeeeee:0xd4282c);im.setColorAt(hk*3+k,col)}});
     const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
     const nrm=g.attributes.normal;for(let k=0;k<nrm.count;k++)nrm.setXYZ(k,0,1,0);
     G.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:canvasTex(128,128,(c,w,h)=>noise(c,w,h,'#c8b48c',0.16,5200),true),side:THREE.DoubleSide})));G.add(im)}}
  const roadMat=new THREE.MeshLambertMaterial({map:texAsphalt,side:DSIDE});G.add(new THREE.Mesh(ribbon(()=>-HW,()=>HW,0.03,8,null,8,8),roadMat));
  // rubbered-in racing line
  G.add(new THREE.Mesh(ribbon(i=>LINE[i]-1.7,i=>LINE[i]+1.7,0.055,16,null,0,3),new THREE.MeshBasicMaterial({map:texRubber,transparent:true,depthWrite:false,side:DSIDE})));
  // dynamic racing line: one ribbon over the whole lap, only a window ahead of the car is given alpha each frame
  {const g=ribbon(i=>LINE[i]-0.34,i=>LINE[i]+0.34,0.09,16);rlCol=new Float32Array((N+1)*8);g.setAttribute('color',new THREE.BufferAttribute(rlCol,4));
   rlMesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:DSIDE,fog:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));rlMesh.renderOrder=3;rlMesh.frustumCulled=false;rlMesh.visible=false;rlI0=0;rlN=0;G.add(rlMesh)}
  const lineMat=new THREE.MeshBasicMaterial({color:0xf0f0f0,side:DSIDE});
  G.add(new THREE.Mesh(ribbon(()=>HW-0.45,()=>HW-0.2,0.065,10),lineMat));
  G.add(new THREE.Mesh(ribbon(()=>-HW+0.2,()=>-HW+0.45,0.065,10),lineMat));
  const kerbOn=i=>Math.abs(KS[i])>1/260;const kerbMat=new THREE.MeshLambertMaterial({map:texKerb,side:DSIDE});
  G.add(new THREE.Mesh(ribbon(()=>HW,i=>Math.min(HW+1.3,WL[i]-0.2),0.075,3,kerbOn),kerbMat));
  G.add(new THREE.Mesh(ribbon(i=>-Math.min(HW+1.3,WR[i]-0.2),()=>-HW,0.075,3,kerbOn),kerbMat));
  const wallMat=new THREE.MeshLambertMaterial({color:def.theme==='city'?0xb9c1c8:0x2f3a46,side:DSIDE});
  G.add(new THREE.Mesh(wallGeo(1),wallMat),new THREE.Mesh(wallGeo(-1),wallMat));
  // bridge pillars at crossovers
  {const pm=new THREE.MeshLambertMaterial({color:0x9aa3ab});for(let i=0;i<N;i+=6)if(BR[i])[-1,1].forEach(sd=>{const off=(sd>0?WL[i]:WR[i])-0.4,x=PX[i]+NX[i]*off*sd,z=PZ[i]+NZ[i]*off*sd;let clear=true;forNear(x,z,30,j=>{if(clear&&!BR[j]&&Math.hypot(x-PX[j],z-PZ[j])<Math.max(WL[j],WR[j])+1.5)clear=false});if(!clear)return;const h=PY[i]-terrainH(x,z)+1;const b=new THREE.Mesh(new THREE.BoxGeometry(1,h,1),pm);b.position.set(x,PY[i]-0.6-h/2,z);G.add(b)})}
  // start line, grid slots, gantry
  {const g=new THREE.PlaneGeometry(HW*2,2.4);g.rotateX(-Math.PI/2);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*7,uv.getY(i)*1.2);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:texCheck}));const p=at(0,0,{});m.position.set(p.x,p.y+0.07,p.z);m.rotation.set(-Math.atan(GR[p.i]),p.h,0,'YXZ');G.add(m)}
  const gl=Math.min(3,HW-2);
  for(let k=0;k<10;k++){const p=at(-15-k*8+2.6,k%2?-gl:gl,{});const g=new THREE.PlaneGeometry(2.2,0.25);g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,lineMat);m.position.set(p.x,p.y+0.06,p.z);m.rotation.set(-Math.atan(GR[p.i]),p.h,0,'YXZ');G.add(m)}
  {const grp=new THREE.Group();const p=at(6,0,{});grp.position.set(p.x,p.y,p.z);grp.rotation.y=p.h;const mat=new THREE.MeshLambertMaterial({color:0x1b232c});
   const gxs=[PIT.side*(PIT.front-0.3),-PIT.side*(HW+3)].sort((a,b)=>b-a),beam=new THREE.Mesh(new THREE.BoxGeometry(gxs[0]-gxs[1]+0.6,1.2,0.8),mat);beam.position.set((gxs[0]+gxs[1])/2,7.2,0);grp.add(beam);
   gxs.forEach(x=>{const post=new THREE.Mesh(new THREE.BoxGeometry(0.6,7.8,0.6),mat);post.position.set(x,3.9,0);grp.add(post)});
   for(let k=0;k<5;k++){const lm=new THREE.MeshBasicMaterial({color:0x2a0608});const l=new THREE.Mesh(new THREE.CircleGeometry(0.34,16),lm);l.position.set((k-2)*1.1,7.2,-0.42);l.rotation.y=Math.PI;grp.add(l);gantryLamps.push(lm)}
   G.add(grp)}
  // pit complex: entry and exit roads, pit wall with debris fence, fast lane, working lane with team boxes, garages
  {const P=PIT,sd=P.side,rel=i=>pitRel(i*DS),sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)},tt=i=>{const r=rel(i);return sm(Math.min(r,P.len-r)/P.T)};
   const on=i=>rel(i)<=P.len,core=i=>{const r=rel(i);return r>=P.T&&r<=P.len-P.T},S2=(fa,fb)=>sd>0?[fa,fb]:[i=>-fb(i),i=>-fa(i)];
   const lin=i=>lerp(HW-0.2,P.L0,tt(i)),lout=i=>lerp(HW+3.2,P.L1,tt(i));
   G.add(new THREE.Mesh(ribbon(...S2(lin,lout),0.045,8,on,8),roadMat));
   G.add(new THREE.Mesh(ribbon(...S2(()=>P.L1,()=>P.front+0.3),0.045,20,core),new THREE.MeshLambertMaterial({color:0x878c92,side:DSIDE})));
   G.add(new THREE.Mesh(ribbon(...S2(i=>lin(i)-0.15,lin),0.062,10,on),lineMat));G.add(new THREE.Mesh(ribbon(...S2(lout,i=>lout(i)+0.15),0.062,10,on),lineMat));
   // pit wall and fence
   {const wp=[],wi=[],fp=[],fu=[],fi2=[];let n=0;for(let r=P.T;r<=P.len-P.T;r+=DS){const i=Math.floor(wrapS(P.a+r)/DS)%N,bx=PX[i]+NX[i]*sd*P.PW,bz=PZ[i]+NZ[i]*sd*P.PW,ox=NX[i]*sd*0.25,oz=NZ[i]*sd*0.25,y=PY[i];
      wp.push(bx-ox,y-0.4,bz-oz,bx-ox,y+1.05,bz-oz,bx+ox,y+1.05,bz+oz,bx+ox,y-0.4,bz+oz);fp.push(bx,y+1.05,bz,bx,y+3.1,bz);fu.push(r/1.3,0,r/1.3,1.6);
      if(n>0){const v=n*4;for(let k=0;k<3;k++)wi.push(v-4+k,v+k,v-3+k,v-3+k,v+k,v+1+k);const f=n*2;fi2.push(f-2,f,f-1,f-1,f,f+1)}n++}
    const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(wp,3));wg.setIndex(wi);wg.computeVertexNormals();G.add(new THREE.Mesh(wg,new THREE.MeshLambertMaterial({color:0xc6cace,side:DSIDE})));
    const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.setAttribute('uv',new THREE.Float32BufferAttribute(fu,2));fg.setIndex(fi2);G.add(new THREE.Mesh(fg,new THREE.MeshBasicMaterial({map:texFence,transparent:true,depthWrite:false,side:DSIDE})))}
   const mark=(s0,lat,across,along,mat,yo=0.075)=>{const p=at(s0,sd*lat,{});const g=new THREE.PlaneGeometry(across,along);g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,mat);m.position.set(p.x,p.y+yo,p.z);m.rotation.set(-Math.atan(GR[p.i]),p.h,0,'YXZ');G.add(m)};
   // speed-limit lines at both ends of the limited zone
   [P.T,P.len-P.T].forEach(r=>mark(P.a+r,(P.L0+P.L1)/2,P.L1-P.L0,0.45,lineMat));
   // team boxes, pit-wall stands
   const bw=Math.max(1.6,P.front-P.L1-0.7),dark=new THREE.MeshLambertMaterial({color:0x2b323a}),amber=new THREE.MeshBasicMaterial({color:new THREE.Color(0xf2b33d).convertSRGBToLinear()});
   P.boxes.forEach((bs,k)=>{const tm=new THREE.MeshBasicMaterial({color:new THREE.Color(TEAMS[k].base).convertSRGBToLinear()});
     mark(bs+5,P.mid,bw,0.16,lineMat);mark(bs-5,P.mid,bw,0.16,lineMat);mark(bs,P.mid-bw/2,0.16,10,lineMat);mark(bs,P.mid+bw/2,0.16,10,lineMat);mark(bs+5.5,P.mid,bw,0.7,tm);
     if(k===opts.team){mark(bs+4.7,P.mid,bw-0.4,0.3,amber,0.08);mark(bs-4.7,P.mid,bw-0.4,0.3,amber,0.08);mark(bs,P.mid-bw/2+0.35,0.3,9.1,amber,0.08);mark(bs,P.mid+bw/2-0.35,0.3,9.1,amber,0.08)}
     const p=at(bs,sd*P.PW,{}),grp=new THREE.Group();grp.position.set(p.x,p.y,p.z);grp.rotation.y=p.h+Math.PI/2;
     const roof=new THREE.Mesh(new THREE.BoxGeometry(4.4,0.1,1.7),new THREE.MeshLambertMaterial({color:new THREE.Color(TEAMS[k].base).convertSRGBToLinear()}));roof.position.y=2.9;grp.add(roof);
     const desk=new THREE.Mesh(new THREE.BoxGeometry(3.8,0.5,0.6),dark);desk.position.y=1.3;grp.add(desk);[-2,2].forEach(x=>{const po=new THREE.Mesh(new THREE.BoxGeometry(0.1,1.9,0.1),dark);po.position.set(x,1.95,0);grp.add(po)});G.add(grp)});
   // garages: one 12 m bay per segment, team bays directly behind their box
   {const wallM=new THREE.MeshLambertMaterial({color:0xcfd4d9}),roofM=new THREE.MeshLambertMaterial({color:0x59626c}),face=sd>0?5:4,gb=new THREE.BoxGeometry(12.05,9,P.dep),pl=new THREE.BoxGeometry(12.05,5,P.dep),fm={};
    for(let m=-11;m<=8;m++){const r=208+12*m;if(r<P.T+8||r>P.len-P.T-8)continue;const k=-m/2,t=Number.isInteger(k)&&k>=0&&k<TEAMS.length?TEAMS[k]:null,key=t?t.code:'n';
      const p=at(P.a+r,sd*(P.front+0.35+P.dep/2),{}),mats=[wallM,wallM,roofM,dark,wallM,wallM];mats[face]=fm[key]||(fm[key]=new THREE.MeshLambertMaterial({map:garageTex(t)}));
      const b=new THREE.Mesh(gb,mats);b.position.set(p.x,p.y+4.5,p.z);b.rotation.set(0,p.h+Math.PI/2,-Math.atan(GR[p.i]),'YXZ');G.add(b);
      const q=new THREE.Mesh(pl,dark);q.position.set(p.x,p.y-2.5,p.z);q.rotation.y=p.h+Math.PI/2;G.add(q)}}
   }
  // straight-mode boards
  const postMat=new THREE.MeshLambertMaterial({color:0x2f3a46});
  ZONES.forEach(z=>{[[z.a,'X MODE','#f2b33d'],[z.b,'Z MODE','#e8edf3']].forEach(([s,txt,col])=>{[1,-1].forEach(side=>{const sp=signSpot(s,side);if(!sp.ok)return;const p=at(s,side*sp.off,{});
    const b=board(txt,col);b.position.set(p.x,p.y+SIGN_CLEAR+1+sp.lift,p.z);b.rotation.y=p.h+Math.PI+side*0.26;G.add(b);
    const post=new THREE.Mesh(new THREE.BoxGeometry(0.15,SIGN_CLEAR+sp.lift,0.15),postMat);post.position.set(p.x,p.y+(SIGN_CLEAR+sp.lift)/2,p.z);G.add(post)})})});
  // overhead gantry: two posts off the racing surface, a beam and the sign above the lane
  const gantryOff=(s0,side)=>{const sp=signSpot(s0,side);if(sp.ok)return sp.off;const i=Math.floor(wrapS(s0)/DS)%N;return (side>0?WL[i]:WR[i])+SIGN_BACK};
  const gantry=(s0,dA,dB,txt,col,hgt)=>{const a=at(s0,dA,{}),b=at(s0,dB,{}),y=Math.max(a.y,b.y)+hgt,len=Math.hypot(a.x-b.x,a.z-b.z);
    for(const q of [a,b]){const ps=new THREE.Mesh(new THREE.BoxGeometry(0.3,y-q.y+0.3,0.3),postMat);ps.position.set(q.x,(y+q.y)/2,q.z);G.add(ps)}
    const bm=new THREE.Mesh(new THREE.BoxGeometry(len+0.3,0.3,0.3),postMat);bm.position.set((a.x+b.x)/2,y,(a.z+b.z)/2);bm.rotation.y=a.h;G.add(bm);
    const sg=board(txt,col);sg.position.set((a.x+b.x)/2,y+1.15,(a.z+b.z)/2);sg.rotation.y=a.h+Math.PI;G.add(sg)};
  if(OTDET>=0)gantry(OTDET,gantryOff(OTDET,1),-gantryOff(OTDET,-1),'DETECT','#ff5ad1',5.4);
  gantry(PIT.a+PIT.T,PIT.side*PIT.PW,PIT.side*(PIT.front+0.2),'PIT 80','#f2b33d',5.0);
  // grandstands and pit garages along the start straight, only where nothing else runs
  {const standMat=[0,1,2,3,4,5].map(k=>k===2?new THREE.MeshLambertMaterial({map:texSeat}):new THREE.MeshLambertMaterial({color:k<2?0x6b7785:0x56616d}));
   const pitMat=new THREE.MeshLambertMaterial({color:0xd7dde3});
   const place=(s,side,len,dep,hgt,mat)=>{const i0=Math.floor(wrapS(s)/DS)%N;const off=(side>0?WL[i0]:WR[i0])+dep/2+4;const p=at(s,side*off,{});const fx=Math.sin(p.h),fz=Math.cos(p.h);for(const e of [-len/2,0,len/2])if(trackDist(p.x+fx*e,p.z+fz*e,60)<dep/2+HW+3)return;const m=new THREE.Mesh(new THREE.BoxGeometry(len,hgt,dep),mat);m.position.set(p.x,terrainH(p.x,p.z)+hgt/2-0.6,p.z);m.rotation.y=p.h+Math.PI/2;m.userData.q=1;G.add(m)};
   for(let k=0;k<5;k++)place(-150+k*95,-PIT.side,80,18,14,standMat)}
  // extra trackside detail, switched by graphics quality (userData.q: 1 = medium and up, 2 = high only)
  {const o=new THREE.Object3D(),col=new THREE.Color(),hd=i=>Math.atan2(TX[i],TZ[i]);
   // impact barriers on the outside of corners
   {const L=[];for(let i=0;i<N;i++){if(BR[i]||Math.abs(KS[i])<1/150)continue;const sg=KS[i]>0?1:-1,W=sg>0?WL[i]:WR[i];if(W<HW+3)continue;if(sg===PIT.side&&pitRel(i*DS)<=PIT.len)continue;L.push([i,sg*(W-0.75)])}
    if(L.length){const bx=new THREE.BoxGeometry(0.7,1.0,2.3);bx.translate(0,0.5,0);const im=new THREE.InstancedMesh(bx,new THREE.MeshLambertMaterial({color:0xffffff}),L.length);
     L.forEach(([i,d],k)=>{o.position.set(PX[i]+NX[i]*d,PY[i],PZ[i]+NZ[i]*d);o.rotation.set(0,hd(i),0);o.scale.set(1,1,1);o.updateMatrix();im.setMatrixAt(k,o.matrix);col.setHex((i>>1)%2?0xd4282c:0xeeeeee);im.setColorAt(k,col)});im.userData.q=1;G.add(im)}}
   // advertising boards above the wall on the straights
   {const L=[],pal=[0xf2b33d,0x1f5a3d,0x4b3596,0xb51f5e,0xe8edf3,0x1e6fd9,0xd4282c];for(let i=0;i<N;i+=5){if(BR[i]||Math.abs(KS[i])>1/500)continue;for(const sd of [1,-1]){const r=pitRel(i*DS);if(sd===PIT.side&&(r<PIT.len+40||r>TL-40))continue;if((sd>0?WL[i]:WR[i])<def.wall-1.5)continue;L.push([i,sd*((sd>0?WL[i]:WR[i])+0.35)])}}
    if(L.length){const bx=new THREE.BoxGeometry(0.18,1.3,11.5);bx.translate(0,1.85,0);const im=new THREE.InstancedMesh(bx,new THREE.MeshLambertMaterial({color:0xffffff}),L.length);
     L.forEach(([i,d],k)=>{o.position.set(PX[i]+NX[i]*d,PY[i],PZ[i]+NZ[i]*d);o.rotation.set(0,hd(i),0);o.updateMatrix();im.setMatrixAt(k,o.matrix);col.setHex(pal[(i/5|0)%pal.length]);im.setColorAt(k,col)});im.userData.q=1;G.add(im)}}
   // gravel traps on the outside of corners
   {const tg=canvasTex(128,128,(c,w,h)=>noise(c,w,h,'#c8b48c',0.16,5200),true),gm=new THREE.MeshLambertMaterial({map:tg,side:THREE.DoubleSide});
    const gOn=sg=>i=>!BR[i]&&KS[i]*sg>1/170&&(sg>0?WL[i]:WR[i])>HW+6&&!(sg===PIT.side&&pitRel(i*DS)<=PIT.len);
    const a=new THREE.Mesh(ribbon(()=>HW+1.7,i=>Math.min(WL[i]-1.6,HW+16),0.025,6,gOn(1),6,4),gm),b=new THREE.Mesh(ribbon(i=>-Math.min(WR[i]-1.6,HW+16),()=>-HW-1.7,0.025,6,gOn(-1),6,4),gm);a.userData.q=b.userData.q=2;G.add(a,b)}
   // pit crew in front of each garage
   {const L=[];PIT.boxes.forEach((s0,t)=>{for(const e of [-3.4,-1.2,1.2,3.4])L.push([at(s0+e,PIT.side*(PIT.front-0.9),{}),t])});
    const body=new THREE.BoxGeometry(0.46,1.25,0.3);body.translate(0,0.78,0);const head=new THREE.SphereGeometry(0.17,8,6);head.translate(0,1.58,0);
    const ib=new THREE.InstancedMesh(body,new THREE.MeshLambertMaterial({color:0xffffff}),L.length),ih=new THREE.InstancedMesh(head,new THREE.MeshLambertMaterial({color:0x22262b}),L.length);
    L.forEach(([p,t],k)=>{o.position.set(p.x,p.y,p.z);o.rotation.set(0,p.h+Math.PI/2*PIT.side,0);o.updateMatrix();ib.setMatrixAt(k,o.matrix);ih.setMatrixAt(k,o.matrix);col.set(TEAMS[t].base);ib.setColorAt(k,col)});ib.userData.q=ih.userData.q=2;G.add(ib,ih)}
   // clouds and a second, hazier range of mountains
   {const mat=new THREE.SpriteMaterial({map:cloudTex,transparent:true,opacity:0.8,depthWrite:false,fog:false});for(let k=0;k<16;k++){const a=k/16*Math.PI*2+Math.random()*0.3,r=RAD+900+Math.random()*1900,sp=new THREE.Sprite(mat);sp.position.set(CX+Math.cos(a)*r,HAVG+520+Math.random()*520,CZ+Math.sin(a)*r);const w=650+Math.random()*650;sp.scale.set(w,w*0.36,1);sp.userData.q=2;G.add(sp)}
    const hm=new THREE.MeshLambertMaterial({color:new THREE.Color(th.hill).lerp(new THREE.Color(th.fog),0.45)});for(let k=0;k<14;k++){const a=(k+0.5)/14*Math.PI*2,r=RAD+2500+Math.random()*500,h=new THREE.Mesh(new THREE.ConeGeometry(520+Math.random()*380,420+Math.random()*380,6),hm);h.position.set(CX+Math.cos(a)*r,HAVG+90,CZ+Math.sin(a)*r);h.userData.q=2;G.add(h)}}}
  // scenery
  {const pts=[];let tries=0;const want=th.trees;while(pts.length<want&&tries<want*25){tries++;const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*(RAD+420);const x=CX+Math.cos(a)*r,z=CZ+Math.sin(a)*r;const d=trackDist(x,z,60);if(d>Math.min(def.wall,24)+14)pts.push([x,z,0.7+Math.random()*0.8])}
   if(pts.length){const cone=new THREE.ConeGeometry(4,11,7);cone.translate(0,9,0);const trunk=new THREE.CylinderGeometry(0.5,0.6,4,5);trunk.translate(0,2,0);
    const ic=new THREE.InstancedMesh(cone,new THREE.MeshLambertMaterial({color:0xffffff}),pts.length),it=new THREE.InstancedMesh(trunk,new THREE.MeshLambertMaterial({color:0x5b4532}),pts.length);const o=new THREE.Object3D(),col=new THREE.Color();const base=new THREE.Color(th.tree);
    G.userData.inst=[ic,it];pts.forEach((p,i)=>{o.position.set(p[0],terrainH(p[0],p[1])-0.5,p[1]);o.scale.setScalar(p[2]);o.rotation.y=Math.random()*6;o.updateMatrix();ic.setMatrixAt(i,o.matrix);it.setMatrixAt(i,o.matrix);col.copy(base).offsetHSL((Math.random()-.5)*0.05,0,(Math.random()-.5)*0.08);ic.setColorAt(i,col)});G.add(ic,it)}
   if(th.bld){const bp=[];let t2=0;while(bp.length<th.bld&&t2<th.bld*25){t2++;const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*(RAD+260);const x=CX+Math.cos(a)*r,z=CZ+Math.sin(a)*r;const d=trackDist(x,z,60);if(d>def.wall+18)bp.push([x,z,Math.min(d-def.wall-10,28)])}
    if(bp.length){const bx=new THREE.BoxGeometry(1,1,1);bx.translate(0,0.5,0);const im=new THREE.InstancedMesh(bx,new THREE.MeshLambertMaterial({color:0xffffff}),bp.length);const o=new THREE.Object3D(),col=new THREE.Color();const pal=[0xe9e1d3,0xd8cdb8,0xc9b79c,0xb7c0c6,0xf0ece4,0xd9a98a];
     (G.userData.inst=G.userData.inst||[]).push(im);bp.forEach((p,i)=>{const w=Math.max(5,Math.min(p[2]*0.9,14+Math.random()*16));o.position.set(p[0],terrainH(p[0],p[1])-1.5,p[1]);o.scale.set(w,10+Math.random()*38,w*(0.7+Math.random()*0.6));o.rotation.y=Math.random()*Math.PI;o.updateMatrix();im.setMatrixAt(i,o.matrix);col.setHex(pal[(Math.random()*pal.length)|0]);im.setColorAt(i,col)});G.add(im)}}
   const hillMat=new THREE.MeshLambertMaterial({color:th.hill});for(let k=0;k<18;k++){const a=k/18*Math.PI*2;const r=RAD+1600+Math.random()*700;const h=new THREE.Mesh(new THREE.ConeGeometry(320+Math.random()*320,160+Math.random()*300,6),hillMat);h.position.set(CX+Math.cos(a)*r,HAVG+60,CZ+Math.sin(a)*r);G.add(h)}}
  scene.fog.near=Math.max(500,RAD*0.6);scene.fog.far=RAD*2+2400;
  {const prof=buildProfile(TEAMS[0]),corners=[];let i0=0;while(prof[(i0+1)%N]<prof[i0]-0.01&&i0<N)i0++;
   let st=-1;for(let c=1;c<=N+1;c++){const i=(i0+c)%N,j=(i+1)%N,braking=prof[j]<prof[i]-0.01;if(braking&&st<0)st=i;if(!braking&&st>=0){if(prof[st]-prof[i]>18)corners.push(i);st=-1}}
   const dmat={},bmat=new THREE.MeshLambertMaterial({color:0x2f3a46});
   const signMat=n=>dmat[n]||(dmat[n]=new THREE.MeshBasicMaterial({map:canvasTex(256,192,(c,w,h)=>{c.fillStyle='#f4f5f2';c.fillRect(0,0,w,h);c.strokeStyle='#14181d';c.lineWidth=10;c.strokeRect(5,5,w-10,h-10);c.fillStyle='#14181d';c.font='800 116px "Saira Condensed",Arial Narrow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),w/2,h/2+8)}),side:THREE.DoubleSide}));
   const panel=new THREE.PlaneGeometry(1.6,1.2),post=new THREE.BoxGeometry(0.1,1,0.1);
   corners.forEach((ci,k)=>{const prev=corners[(k-1+corners.length)%corners.length],gap=corners.length>1?((ci-prev+N)%N)*DS:TL;const out=Math.sign(KS[(ci+8)%N])||1;
     for(const dist of [50,100,150,200]){if(dist>gap-40)break;const s0=ci*DS-dist;let side=out,sp=signSpot(s0,side);if(!sp.ok){side=-out;sp=signSpot(s0,side)}if(!sp.ok)continue;const k2=clamp(sp.off/9,1,1.9);
       const p=at(s0,side*sp.off,{}),b=new THREE.Mesh(panel,signMat(dist));b.scale.set(k2,k2,1);b.position.set(p.x,p.y+SIGN_CLEAR+0.6*k2+sp.lift,p.z);b.rotation.y=p.h+Math.PI+side*0.26;G.add(b);
       const ph=SIGN_CLEAR+sp.lift,ps=new THREE.Mesh(post,bmat);ps.scale.y=ph;ps.position.set(p.x,p.y+ph/2,p.z);G.add(ps)}})}
  scene.add(G);buildMiniPath();
}
