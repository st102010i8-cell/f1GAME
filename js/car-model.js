'use strict';
/* Grid 2026 — 賽車模型 */
/* ================= CAR MODEL ================= */
// 2026-regulation proportions: 3.4 m wheelbase, 1.9 m wide, narrower tyres, active front and rear wing flaps.
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function loft(sections,around,exp){const pos=[],uv=[],idx=[];sections.forEach((s,i)=>{for(let j=0;j<=around;j++){const a=j/around*Math.PI*2,c=Math.cos(a),sn=Math.sin(a);const x=Math.sign(c)*Math.pow(Math.abs(c),2/exp)*s[1]/2+(s[4]||0);const y=Math.sign(sn)*Math.pow(Math.abs(sn),2/exp)*s[2]/2+s[3];pos.push(x,y,s[0]);uv.push(j/around,i/(sections.length-1))}});
 for(let i=0;i<sections.length-1;i++)for(let j=0;j<around;j++){const a=i*(around+1)+j,b=a+around+1;idx.push(a,b,a+1,b,b+1,a+1)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g}
// wing element spanning x, leading edge towards +z; bend(xn) can sweep, lift or taper it along the span
function foil(span,chord,thick,camber,segs,bend){const prof=[[0,0],[0.25,camber+thick/2],[0.65,camber*0.9+thick/2],[1,thick*0.15],[0.65,camber*0.9-thick/2],[0.25,camber-thick/2]],n=prof.length,pos=[],uv=[],idx=[];
 for(let i=0;i<=segs;i++){const xn=i/segs*2-1,b=bend?bend(xn):{},sc=b.scale==null?1:b.scale;for(const p of prof){pos.push(xn*span/2,p[1]*sc+(b.dy||0),-(p[0]-0.5)*chord*sc+(b.dz||0));uv.push(0.12+0.2*p[0],i/segs)}}
 for(let i=0;i<segs;i++)for(let j=0;j<n;j++){const a=i*n+j,b2=i*n+(j+1)%n,c=a+n,d=b2+n;idx.push(a,c,b2,b2,c,d)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g}
// flat plate standing in the z-y plane (points are [z,y]), thickness along x
function plate(pts,thick){const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:thick,bevelEnabled:false});g.translate(0,0,-thick/2);g.rotateY(-Math.PI/2);return g}
function tyreGeo(w){const h=w/2,p=[[0.225,-h],[0.325,-h],[0.352,-h+0.025],[0.36,-h+0.07],[0.36,h-0.07],[0.352,h-0.025],[0.325,h],[0.225,h]].map(a=>new THREE.Vector2(a[0],a[1]));const g=new THREE.LatheGeometry(p,30);g.rotateZ(Math.PI/2);return g}
const liveryCache={},rimCache={};
function livery(t){if(liveryCache[t.code])return liveryCache[t.code];return liveryCache[t.code]=canvasTex(1024,512,(c,w,h)=>{
  // u runs around the body (0.25 = top centre, 0/0.5 = sides, 0.75 = underside); v runs nose→tail
  c.fillStyle=t.base;c.fillRect(0,0,w,h);c.fillStyle=t.acc;
  if(t.pat==='band'){c.fillRect(w*0.215,0,w*0.07,h);c.fillRect(0,h*0.56,w*0.6,h*0.05);c.fillRect(0,h*0.63,w*0.6,h*0.012)}
  if(t.pat==='chevron'){for(let k=0;k<3;k++){c.beginPath();const y=h*(0.25+k*0.18);c.moveTo(0,y);c.lineTo(w*0.25,y-h*0.08);c.lineTo(w*0.5,y);c.lineTo(w*0.5,y+h*0.05);c.lineTo(w*0.25,y-h*0.03);c.lineTo(0,y+h*0.05);c.fill()}}
  if(t.pat==='split'){c.fillRect(w*0.5,0,w*0.5,h);c.fillRect(0,h*0.78,w,h*0.22);c.fillStyle=t.base;c.fillRect(0,h*0.8,w*0.5,h*0.012)}
  if(t.pat==='stripe'){[0.17,0.23,0.29,0.33].forEach((u,k)=>c.fillRect(w*u,0,w*(k%2?0.012:0.03),h));c.fillRect(0,h*0.7,w*0.6,h*0.02)}
  if(t.pat==='fade'){const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,t.acc);c.fillStyle=gr;c.fillRect(0,h*0.3,w*0.5,h*0.7);c.fillStyle=t.acc;c.fillRect(w*0.245,0,w*0.01,h)}
  // bare-carbon lower flanks and underside
  const sh=c.createLinearGradient(0,0,w,0);sh.addColorStop(0.5,'rgba(18,20,23,0)');sh.addColorStop(0.56,'rgba(18,20,23,1)');sh.addColorStop(0.94,'rgba(18,20,23,1)');sh.addColorStop(1,'rgba(18,20,23,0)');c.fillStyle=sh;c.fillRect(0,0,w,h)})}
function rimTex(t){if(rimCache[t.code])return rimCache[t.code];return rimCache[t.code]=canvasTex(128,128,c=>{c.fillStyle='#0d0f12';c.beginPath();c.arc(64,64,64,0,7);c.fill();c.strokeStyle=t.acc;c.lineWidth=5;c.beginPath();c.arc(64,64,57,0,7);c.stroke();c.strokeStyle='#2c323a';c.lineWidth=8;for(let k=0;k<5;k++){const a=k/5*Math.PI*2;c.beginPath();c.moveTo(64+Math.cos(a)*12,64+Math.sin(a)*12);c.lineTo(64+Math.cos(a)*52,64+Math.sin(a)*52);c.stroke()}c.fillStyle='#8b939c';c.beginPath();c.arc(64,64,10,0,7);c.fill();c.fillStyle=t.acc;c.beginPath();c.arc(64,64,4.5,0,7);c.fill()})}
const carbon=new THREE.MeshStandardMaterial({color:0x1b1e23,roughness:0.38,metalness:0.2,side:THREE.DoubleSide});
const floorMat=new THREE.MeshStandardMaterial({color:0x0b0c0e,roughness:0.75,metalness:0.1,side:THREE.DoubleSide});
const rubber=new THREE.MeshStandardMaterial({color:0x0d0e10,roughness:0.86,metalness:0});
const darkMat=new THREE.MeshBasicMaterial({color:0x040506});
const bandMat=new THREE.MeshBasicMaterial({color:0xf2c230,side:THREE.DoubleSide});
const visorMat=new THREE.MeshStandardMaterial({color:0x0c1016,roughness:0.08,metalness:0.3});
const lightMat=new THREE.MeshBasicMaterial({color:0xff2a2a});
const shadowTex=canvasTex(64,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,4,w/2,h/2,h/2);g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h)});
const shadowMat=new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false});
function numberTex(n,t){return canvasTex(128,128,(c,w,h)=>{c.fillStyle=t.acc;c.font='800 96px "Saira Condensed",Arial Narrow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),w/2,h/2+6)})}
let GEO=null;
function carGeo(){if(GEO)return GEO;const G={};const sw=span=>x=>({dz:-Math.abs(x)*span/2*0.13});
  G.tub=loft([[2.62,0.12,0.06,0.20],[2.54,0.20,0.10,0.22],[2.25,0.29,0.16,0.29],[1.80,0.39,0.26,0.37],[1.32,0.50,0.38,0.44],[0.95,0.60,0.46,0.47],[0.55,0.72,0.52,0.48],[0.10,0.78,0.56,0.48],[-0.45,0.70,0.52,0.46],[-1.00,0.52,0.44,0.42],[-1.55,0.34,0.32,0.38],[-2.05,0.20,0.20,0.36],[-2.30,0.09,0.09,0.36]],30,2.7);
  G.spine=loft([[0.20,0.20,0.20,0.86],[0.04,0.30,0.34,0.84],[-0.30,0.34,0.44,0.78],[-0.90,0.26,0.40,0.68],[-1.50,0.14,0.30,0.56],[-2.05,0.05,0.14,0.46]],22,2.4);
  G.pod=[-1,1].map(sd=>loft([[0.72,0.34,0.26,0.44,sd*0.58],[0.45,0.46,0.42,0.40,sd*0.56],[-0.10,0.50,0.42,0.38,sd*0.52],[-0.70,0.42,0.34,0.34,sd*0.44],[-1.25,0.26,0.24,0.30,sd*0.32],[-1.75,0.10,0.12,0.28,sd*0.2]],22,3.4));
  {const o=[[0.3,1.3],[0.74,1.0],[0.8,0.2],[0.8,-0.9],[0.64,-1.25],[0.5,-2.3]],s=new THREE.Shape();o.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));o.slice().reverse().forEach(p=>s.lineTo(-p[0],p[1]));s.closePath();G.floor=new THREE.ExtrudeGeometry(s,{depth:0.03,bevelEnabled:false});G.floor.rotateX(Math.PI/2)}
  G.fwMain=foil(1.86,0.30,0.022,-0.012,14,sw(1.86));
  G.fwFlap1=foil(1.80,0.17,0.016,0.012,14,x=>({dz:-Math.abs(x)*0.9*0.13,scale:Math.abs(x)<0.13?0.35:1}));
  G.fwFlap2=foil(1.56,0.14,0.014,0.014,14,x=>({dz:-Math.abs(x)*0.78*0.13,scale:Math.abs(x)<0.15?0.3:1}));
  G.fwEnd=plate([[-0.14,0],[0.24,0],[0.28,0.05],[0.16,0.2],[-0.14,0.24]],0.016);
  G.rwMain=foil(1.0,0.36,0.03,0.035,6);G.rwFlap=foil(1.0,0.22,0.02,0.02,6);G.beam=foil(0.92,0.16,0.016,0.02,4);
  G.rwEnd=plate([[0.3,0.52],[0.3,1.0],[-0.28,1.0],[-0.28,0.3],[-0.1,0.3],[0.04,0.5]],0.02);
  G.rwPylon=plate([[-1.92,0.48],[-1.8,0.48],[-2.1,0.89],[-2.2,0.89]],0.03);
  G.tyreF=tyreGeo(0.30);G.tyreR=tyreGeo(0.38);G.rimF=new THREE.CylinderGeometry(0.232,0.232,0.27,24);G.rimF.rotateZ(Math.PI/2);G.rimR=new THREE.CylinderGeometry(0.232,0.232,0.35,24);G.rimR.rotateZ(Math.PI/2);
  G.cover=new THREE.CircleGeometry(0.228,28);G.band=new THREE.RingGeometry(0.262,0.3,32);
  G.halo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-0.27,0.77,0.02),V3(-0.33,0.91,0.3),V3(-0.22,0.985,0.68),V3(0,1.0,0.88),V3(0.22,0.985,0.68),V3(0.33,0.91,0.3),V3(0.27,0.77,0.02)]),28,0.026,8);
  G.helmet=new THREE.SphereGeometry(0.125,20,14);G.visor=new THREE.SphereGeometry(0.129,16,6,Math.PI/2-1,2,Math.PI*0.36,Math.PI*0.2);
  G.sphere=new THREE.SphereGeometry(1,18,12);G.disc=new THREE.CircleGeometry(1,24);G.box=new THREE.BoxGeometry(1,1,1);G.cyl=new THREE.CylinderGeometry(1,1,1,7);
  G.fwFlap3=foil(1.3,0.1,0.012,0.014,12,x=>({dz:-Math.abs(x)*0.65*0.13,scale:Math.abs(x)<0.18?0.3:1}));
  G.fin=plate([[-0.25,0.98],[-0.6,1.0],[-1.95,0.66],[-1.95,0.52],[-0.25,0.8]],0.014);G.vane=plate([[-0.14,0.1],[0.14,0.1],[0.14,0.4],[-0.08,0.46]],0.012);
  G.torus=new THREE.TorusGeometry(1,0.09,8,32);G.torus.rotateX(Math.PI/2);
  G.num=new THREE.PlaneGeometry(1,1);G.shadow=new THREE.PlaneGeometry(2.4,5.8);G.shadow.rotateX(-Math.PI/2);
  return GEO=G}
const UP=new THREE.Vector3(0,1,0);
const exhMat=new THREE.MeshStandardMaterial({color:0x2c2723,roughness:0.5,metalness:0.6}),screenMat=new THREE.MeshBasicMaterial({color:0x1b4a63});
const btnMats=[0xff4141,0x35d873,0xffd23f,0x4aa3ff].map(c=>new THREE.MeshBasicMaterial({color:c}));
const codeCache={};function codeTex(t){return codeCache[t.code]||(codeCache[t.code]=canvasTex(256,96,(c,w,h)=>{c.fillStyle=t.acc;c.font='800 84px "Saira Condensed",Arial Narrow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(t.code,w/2,h/2+6)}))}
function makeCar(t,num){const m=makeCar0(t,num);m.group.traverse(o=>{if(o.isMesh&&o.material!==shadowMat)o.castShadow=true});return m}
function makeCar0(t,num){
  const G=carGeo(),g=new THREE.Group();
  const paint=new THREE.MeshPhysicalMaterial({map:livery(t),roughness:0.3,metalness:0.08,clearcoat:1,clearcoatRoughness:0.06,side:THREE.DoubleSide});
  const base=new THREE.MeshPhysicalMaterial({color:new THREE.Color(t.base).convertSRGBToLinear(),roughness:0.3,metalness:0.08,clearcoat:1,clearcoatRoughness:0.06,side:THREE.DoubleSide});
  const accent=new THREE.MeshPhysicalMaterial({color:new THREE.Color(t.acc).convertSRGBToLinear(),roughness:0.32,metalness:0.08,clearcoat:1,clearcoatRoughness:0.08,side:THREE.DoubleSide});
  const nt=numberTex(num,t),numMat=new THREE.MeshBasicMaterial({map:nt,transparent:true,depthWrite:false});
  const rimM=new THREE.MeshStandardMaterial({map:rimTex(t),roughness:0.4,metalness:0.15});
  const codeMat=new THREE.MeshBasicMaterial({map:codeTex(t),transparent:true,depthWrite:false});
  const add=(geo,mat,x=0,y=0,z=0,par=g)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);par.add(m);return m};
  const rod=(a,b,r,mat=carbon)=>{const d=b.clone().sub(a),m=new THREE.Mesh(G.cyl,mat);m.scale.set(r,d.length(),r);m.position.copy(a).addScaledVector(d,0.5);m.quaternion.setFromUnitVectors(UP,d.normalize());g.add(m)};
  // body
  add(G.tub,paint);add(G.spine,paint);G.pod.forEach(p=>add(p,paint));add(G.floor,floorMat,0,0.085,0);
  {const d=add(G.box,floorMat,0,0.19,-2.22);d.scale.set(0.98,0.018,0.5);d.rotation.x=0.36;
   for(const x of [-0.42,-0.2,0,0.2,0.42]){const st=add(G.box,carbon,x,0.17,-2.2);st.scale.set(0.012,0.1,0.48);st.rotation.x=0.36}
   [-1,1].forEach(sd=>{const e=add(G.box,floorMat,sd*0.49,0.18,-2.2);e.scale.set(0.014,0.14,0.5);e.rotation.x=0.36})}
  {const cs=add(G.box,carbon,0,0.37,-2.28);cs.scale.set(0.16,0.12,0.22)}
  [-1,1].forEach(sd=>{const fe=add(G.box,floorMat,sd*0.79,0.13,-0.3);fe.scale.set(0.02,0.09,2.6)});
  add(G.sphere,darkMat,0,0.735,0.42).scale.set(0.2,0.045,0.4);            // cockpit opening
  add(G.disc,darkMat,0,0.86,0.203).scale.set(0.085,0.085,1);              // airbox intake
  [-1,1].forEach(sd=>{add(G.disc,darkMat,sd*0.58,0.44,0.722).scale.set(0.15,0.11,1);   // sidepod inlets
    add(G.box,paint,sd*0.56,0.77,0.72).scale.set(0.15,0.07,0.05);rod(V3(sd*0.34,0.7,0.72),V3(sd*0.5,0.76,0.72),0.012);   // mirrors
    const n=add(G.num,numMat,sd*0.152,0.7,-0.72);n.scale.set(0.27,0.27,1);n.rotation.y=sd*Math.PI/2});
  {const n=add(G.num,numMat,0,0.545,1.68);n.scale.set(0.22,0.22,1);n.rotation.x=-Math.PI/2+0.26;n.rotation.z=Math.PI}
  add(G.box,carbon,0,0.985,-0.06).scale.set(0.06,0.05,0.18);              // T-cam
  const head=new THREE.Group();g.add(head);add(G.helmet,accent,0,0.83,0.36,head);add(G.visor,visorMat,0,0.83,0.36,head);add(G.box,base,0,0.955,0.36,head).scale.set(0.03,0.02,0.2);
  add(G.torus,carbon,0,0.752,0.44).scale.set(0.215,0.5,0.4);add(G.box,carbon,0,0.8,0.1).scale.set(0.3,0.14,0.16);       // cockpit rim, headrest
  // steering wheel with display, buttons and gloves
  const swT=new THREE.Group();swT.position.set(0,0.755,0.64);swT.rotation.x=0.38;g.add(swT);const sw=new THREE.Group();swT.add(sw);
  add(G.box,carbon,0,0,0,sw).scale.set(0.2,0.11,0.03);add(G.box,screenMat,0,0.012,-0.017,sw).scale.set(0.085,0.05,0.004);
  [-1,1].forEach(sd=>{add(G.box,carbon,sd*0.125,-0.005,0,sw).scale.set(0.045,0.14,0.04);add(G.sphere,base,sd*0.128,-0.005,-0.028,sw).scale.set(0.03,0.045,0.035)});
  [[-0.072,0.036],[0.072,0.036],[-0.072,-0.03],[0.072,-0.03]].forEach((q,k)=>add(G.box,btnMats[k],q[0],q[1],-0.017,sw).scale.set(0.016,0.016,0.005));
  rod(V3(0,0.74,0.67),V3(0,0.66,0.95),0.02);
  // shark fin, exhaust, flap actuator, turning vanes, nose cameras, endplate lights, team lettering, antennas
  add(G.fin,paint);rod(V3(0,0.5,-2.0),V3(0,0.52,-2.27),0.05,exhMat);add(G.box,carbon,0,0.955,-2.2).scale.set(0.07,0.05,0.2);
  [-1,1].forEach(sd=>{const v=add(G.vane,carbon,sd*0.44,0,0.98);v.rotation.y=sd*0.12;add(G.box,carbon,sd*0.2,0.45,1.5).scale.set(0.05,0.035,0.12);add(G.box,lightMat,sd*0.5,0.74,-2.535).scale.set(0.02,0.1,0.015);
    const d=add(G.num,codeMat,sd*0.782,0.41,-0.05);d.scale.set(0.36,0.135,1);d.rotation.y=sd*Math.PI/2;const e=add(G.num,codeMat,sd*0.513,0.8,-2.24);e.scale.set(0.42,0.158,1);e.rotation.y=sd*Math.PI/2});
  rod(V3(0.04,0.49,1.45),V3(0.04,0.6,1.43),0.006);rod(V3(-0.05,0.5,1.3),V3(-0.05,0.58,1.3),0.005);
  add(G.halo,carbon);rod(V3(0,1.0,0.88),V3(0,0.7,1.02),0.022);
  // front wing: main plane fixed, two flaps on the active pivot
  add(G.fwMain,carbon,0,0.1,2.5);[-1,1].forEach(sd=>{add(G.fwEnd,accent,sd*0.93,0.07,2.36);add(G.box,carbon,sd*0.09,0.15,2.5).scale.set(0.03,0.1,0.2)});
  const fFlap=new THREE.Group();fFlap.position.set(0,0.15,2.46);g.add(fFlap);add(G.fwFlap1,base,0,0.03,-0.09,fFlap);add(G.fwFlap2,accent,0,0.085,-0.2,fFlap);add(G.fwFlap3,base,0,0.13,-0.29,fFlap);
  // rear wing: main plane fixed, upper flap on the active pivot
  add(G.rwMain,carbon,0,0.9,-2.25);add(G.beam,carbon,0,0.46,-2.3);add(G.rwPylon,carbon);[-1,1].forEach(sd=>add(G.rwEnd,base,sd*0.5,0,-2.25));
  const rFlap=new THREE.Group();rFlap.position.set(0,0.99,-2.38);g.add(rFlap);add(G.rwFlap,accent,0,0,0.11,rFlap);
  add(G.box,lightMat,0,0.34,-2.33).scale.set(0.14,0.08,0.04);
  // suspension
  [-1,1].forEach(sd=>{const fu=V3(sd*0.66,0.5,1.75),fl=V3(sd*0.66,0.22,1.75);
    rod(V3(sd*0.15,0.5,2.0),fu,0.014);rod(V3(sd*0.2,0.55,1.45),fu,0.014);rod(V3(sd*0.13,0.3,2.0),fl,0.014);rod(V3(sd*0.18,0.3,1.45),fl,0.014);rod(V3(sd*0.16,0.5,1.72),V3(sd*0.64,0.25,1.75),0.012);rod(V3(sd*0.16,0.4,1.95),V3(sd*0.66,0.38,1.87),0.01);
    const ru=V3(sd*0.58,0.5,-1.65),rl=V3(sd*0.58,0.22,-1.65);
    rod(V3(sd*0.14,0.48,-1.3),ru,0.014);rod(V3(sd*0.08,0.44,-1.95),ru,0.014);rod(V3(sd*0.16,0.24,-1.3),rl,0.014);rod(V3(sd*0.08,0.26,-1.95),rl,0.014);rod(V3(0,0.36,-1.65),V3(sd*0.6,0.36,-1.65),0.026)});
  // wheels
  const wheels=[],steer=[];
  [[1.75,0.80,0.30,G.tyreF,G.rimF,true],[-1.65,0.76,0.38,G.tyreR,G.rimR,false]].forEach(([z,x,w,tg,rg,front])=>{[-1,1].forEach(sd=>{const piv=new THREE.Group();piv.position.set(sd*x,0.36,z);const wh=new THREE.Group();piv.add(wh);g.add(piv);
    add(tg,rubber,0,0,0,wh);add(rg,carbon,0,0,0,wh);add(G.box,carbon,-sd*(w/2+0.03),0,0,piv).scale.set(0.05,0.34,0.3);
    [1,-1].forEach(o=>{const c=add(G.cover,rimM,sd*o*(w/2-0.012),0,0,wh);c.rotation.y=sd*o*Math.PI/2;const b=add(G.band,bandMat,sd*o*(w/2+0.002),0,0,wh);b.rotation.y=Math.PI/2});
    wheels.push(wh);if(front)steer.push(piv)})});
  add(G.shadow,shadowMat,0,0.08,0);
  return {group:g,fFlap,rFlap,wheels,steer,head,sw,own:[paint,base,accent,nt,numMat,rimM,codeMat]};
}
function setAero(model,a){model.fFlap.rotation.x=lerp(0.34,0.05,a);model.rFlap.rotation.x=lerp(0.6,0.08,a)}
function disposeCar(m){scene.remove(m.group);m.own.forEach(o=>o.dispose())}
