'use strict';
/* Grid 2026 — Three.js 渲染器 */
/* ================= RENDERER ================= */
const canvas=$('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,logarithmicDepthBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0xb9c6cf,500,2800);
const camera=new THREE.PerspectiveCamera(62,1,0.3,9000);
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
scene.add(new THREE.HemisphereLight(0xdfe9f2,0x3b4a2c,0.85));
const sun=new THREE.DirectionalLight(0xfff1dc,1.15);sun.position.set(-400,600,300);scene.add(sun);scene.add(sun.target);{const sc=sun.shadow.camera;sc.left=-20;sc.right=20;sc.top=20;sc.bottom=-20;sc.near=10;sc.far=260;sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.04;sc.updateProjectionMatrix()}
const skyU={top:{value:new THREE.Color(.33,.53,.78)},hor:{value:new THREE.Color(.8,.86,.9)}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(6000,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 hor;varying vec3 p;void main(){float h=normalize(p).y;gl_FragColor=vec4(mix(hor,top,smoothstep(0.,.45,h)),1.);}'}));
scene.add(sky);
{const fill=new THREE.DirectionalLight(0xcfe0ff,0.45);fill.position.set(300,250,-400);scene.add(fill)}

function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}return t}
function noise(ctx,w,h,base,spread,n){ctx.fillStyle=base;ctx.fillRect(0,0,w,h);for(let i=0;i<n;i++){const v=(Math.random()-.5)*spread;ctx.fillStyle=`rgba(${v>0?255:0},${v>0?255:0},${v>0?255:0},${Math.abs(v)})`;ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2)}}
const texAsphalt=canvasTex(512,512,(c,w,h)=>{noise(c,w,h,'#373b41',0.2,52000);c.globalAlpha=0.05;for(let k=0;k<26;k++){c.fillStyle=k%2?'#000':'#9aa0a6';c.beginPath();c.ellipse(Math.random()*w,Math.random()*h,30+Math.random()*70,14+Math.random()*30,Math.random()*3,0,7);c.fill()}},true);
const texRubber=canvasTex(8,64,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(0.3,'rgba(0,0,0,.34)');g.addColorStop(0.5,'rgba(0,0,0,.2)');g.addColorStop(0.7,'rgba(0,0,0,.34)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h)},true);
const texFence=canvasTex(64,64,(c,w,h)=>{c.clearRect(0,0,w,h);c.strokeStyle='rgba(205,210,215,.6)';c.lineWidth=1.5;for(let k=0;k<=w;k+=8){c.beginPath();c.moveTo(k,0);c.lineTo(k,h);c.stroke();c.beginPath();c.moveTo(0,k);c.lineTo(w,k);c.stroke()}c.strokeStyle='rgba(120,126,132,.95)';c.lineWidth=4;c.strokeRect(0,0,w,h)},true);
const KEEP_TEX=[texAsphalt,texRubber,texFence];const GAR_TEX={};
function garageTex(t){const key=t?t.code:'n';if(GAR_TEX[key])return GAR_TEX[key];const tx=canvasTex(512,384,(c,w,h)=>{
  c.fillStyle='#d3d8dd';c.fillRect(0,0,w,h);c.fillStyle='#59626c';c.fillRect(0,0,w,14);
  c.fillStyle='#2b3d52';c.fillRect(18,44,w-36,82);c.fillStyle='rgba(255,255,255,.13)';c.fillRect(18,44,w-36,26);c.fillStyle='#d3d8dd';for(let x=18;x<w-18;x+=68)c.fillRect(x-3,44,6,82);
  c.fillStyle=t?t.base:'#6b7785';c.fillRect(0,150,w,52);c.fillStyle=t?t.acc:'#8a94a0';c.fillRect(0,194,w,8);
  if(t){c.fillStyle=t.acc;c.font='800 40px "Saira Condensed",Arial Narrow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(t.code,w/2,174)}
  c.fillStyle='#c0c6cc';c.fillRect(0,202,w,h-202);
  if(t){const g=c.createLinearGradient(0,202,0,h);g.addColorStop(0,'#090b0e');g.addColorStop(1,'#1c232c');c.fillStyle=g;c.fillRect(24,210,w-48,h-210);
    c.fillStyle='rgba(235,240,255,.75)';c.fillRect(44,220,w-88,5);c.fillStyle=t.base;c.globalAlpha=0.85;[60,170,330].forEach((x,k)=>c.fillRect(x,300-(k%2)*18,90,84+(k%2)*18));c.globalAlpha=1;
    c.fillStyle='#101214';[[452,356],[452,322],[452,288]].forEach(p=>{c.beginPath();c.ellipse(p[0],p[1],26,16,0,0,7);c.fill()});c.fillStyle=t.acc;c.fillRect(60,292,90,6);c.fillRect(330,292,90,6)}
  else{c.fillStyle='#98a0a8';c.fillRect(24,210,w-48,h-210);c.fillStyle='rgba(0,0,0,.16)';for(let y=214;y<h;y+=11)c.fillRect(24,y,w-48,2)}});KEEP_TEX.push(tx);return GAR_TEX[key]=tx}
const texKerb=canvasTex(64,16,(c,w,h)=>{c.fillStyle='#e8e8e8';c.fillRect(0,0,w,h);c.fillStyle='#d4282c';c.fillRect(0,0,w/2,h)},true);
const texCheck=canvasTex(64,64,(c,w,h)=>{for(let y=0;y<8;y++)for(let x=0;x<8;x++){c.fillStyle=(x+y)%2?'#111':'#f2f2f2';c.fillRect(x*8,y*8,8,8)}},true);
const texSeat=canvasTex(128,64,(c,w,h)=>{const cols=['#c9d3db','#556677','#d9a441','#8aa1b1','#3d4c5c'];for(let y=0;y<h;y+=4)for(let x=0;x<w;x+=3){c.fillStyle=cols[(Math.random()*cols.length)|0];c.fillRect(x,y,3,3)}c.fillStyle='rgba(0,0,0,.35)';for(let y=0;y<h;y+=4)c.fillRect(0,y+3,w,1)});
