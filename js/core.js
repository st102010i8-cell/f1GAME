'use strict';
/* Grid 2026 — 核心：車隊、賽道運算、動力單元 */
// Performance spread scaled from the 2026 Constructors' standings after round 20 (São Paulo).
// Liveries and names are original; tilts between power and downforce are game balance.
const TEAMS=[
 {code:'HLD',name:'Halden Works',rank:1,pts:652,base:'#1f5a3d',acc:'#d1a64b',pat:'band',power:1.000,grip:1.000,pace:0.972,nums:[3,14],drivers:['Kade Ostrander','Mika Rautio'],tilt:'整體最強，動力與抓地兼備'},
 {code:'KST',name:'Kestrel Dynamics',rank:2,pts:510,base:'#4b3596',acc:'#e9e3f5',pat:'chevron',power:0.986,grip:1.000,pace:0.962,nums:[9,21],drivers:['Elio Varnier','Sander Holt'],tilt:'彎中抓地最好，直道稍慢'},
 {code:'ODN',name:'Ondine Racing',rank:3,pts:415,base:'#b51f5e',acc:'#151515',pat:'split',power:0.997,grip:0.984,pace:0.955,nums:[6,27],drivers:['Luka Brennan','Yusei Mori'],tilt:'直線速度快，高速彎較吃力'},
 {code:'VRG',name:'Varga Motorsport',rank:4,pts:398,base:'#b9d531',acc:'#22252b',pat:'stripe',power:0.982,grip:0.994,pace:0.953,nums:[11,33],drivers:['Teo Lindqvist','Ravi Anand'],tilt:'煞車與入彎穩定'},
 {code:'TSR',name:'Tessaro GP',rank:5,pts:114,base:'#8b6a48',acc:'#f1ece1',pat:'fade',power:0.972,grip:0.976,pace:0.930,nums:[17,40],drivers:['Noah Fairweather','Ilya Petrov'],tilt:'中段班，需要你把它開快'}
];
const PHY={m:800,g:9.81,rho:1.225,mu:1.62,ClA_Z:3.4,ClA_X:2.1,CdA_Z:1.25,CdA_X:0.86,Crr:0.014,ice:400e3,ers:350e3,wb:3.4,batt:4.0e6,rev:12000};
// Ordered by difficulty. Geometry: bacinger/f1-circuits (MIT), projected to metres.
const TRACKS=[
 {id:'park',name:'Grid Park',zh:'原創練習賽道',country:'虛構',km:4.14,turns:12,diff:1,hw:8,wall:30,run:17,theme:'green',desc:'兩段長直道加一個髮夾彎，用來熟悉換檔、直道模式與電池管理。'},
 {id:'at-1969',pit:-1,name:'Red Bull Ring',zh:'紅牛賽道',country:'奧地利 · 史匹堡',km:4.318,turns:10,diff:1,hw:8,wall:30,run:17,theme:'green',desc:'只有 10 個彎，三段長直道接重煞彎，最容易上手的正式賽道。'},
 {id:'it-1922',pit:-1,name:'Monza',zh:'蒙札',country:'義大利',km:5.793,turns:11,diff:2,hw:8,wall:28,run:16,theme:'park',desc:'速度神殿。長直道接減速彎，重點是煞車點和直道模式的時機。'},
 {id:'bh-2002',pit:-1,name:'Bahrain',zh:'巴林國際賽道',country:'巴林 · 薩基爾',km:5.412,turns:15,diff:2,hw:8.5,wall:30,run:18,theme:'desert',desc:'多個重煞髮夾彎，出彎加速與電量回收決定圈速。'},
 {id:'es-1991',pit:-1,name:'Barcelona-Catalunya',zh:'巴塞隆納－加泰隆尼亞',country:'西班牙 · 蒙梅洛',km:4.657,turns:14,diff:2,hw:8,wall:30,run:17,theme:'park',desc:'經典測試賽道。超長起跑直道接 T1–T2，T3 高速長右彎最吃下壓力與左前胎，T9 Campsa 是坡頂盲彎，最後兩個右彎全油門衝回直道。'},
 {id:'ca-1978',pit:1,name:'Gilles-Villeneuve',zh:'吉爾·維倫紐夫賽道',country:'加拿大 · 蒙特婁',km:4.361,turns:14,diff:3,hw:7.5,wall:17,run:8,theme:'park',desc:'島上的半永久賽道，牆很近，最後減速彎一碰就撞牆。'},
 {id:'gb-1948',pit:-1,name:'Silverstone',zh:'銀石',country:'英國',km:5.891,turns:18,diff:3,hw:8.5,wall:30,run:17,theme:'green',desc:'高速連續彎多，考驗下壓力設定與連續換向。'},
 {id:'br-1940',name:'Interlagos',zh:'英特拉格斯',country:'巴西 · 聖保羅',km:4.309,turns:15,diff:3,hw:7.5,wall:22,run:13,theme:'city',desc:'逆時針賽道，開場的 Senna S 是最好的超車點。'},
 {id:'be-1925',pit:-1,name:'Spa-Francorchamps',zh:'斯帕',country:'比利時',km:7.004,turns:19,diff:4,hw:8,wall:28,run:16,theme:'forest',desc:'7 公里，全年最長賽道。Kemmel 長直道和高速 Pouhon 左彎。'},
 {id:'hu-1986',pit:-1,name:'Hungaroring',zh:'匈牙利賽道',country:'匈牙利 · 布達佩斯',km:4.381,turns:14,diff:4,hw:7.5,wall:24,run:14,theme:'green',desc:'彎多直道少，幾乎沒有超車機會，排位就是一切。'},
 {id:'jp-1962',name:'Suzuka',zh:'鈴鹿',country:'日本',km:5.807,turns:18,diff:4,hw:7.5,wall:22,run:13,pit:-1,theme:'park',desc:'8 字形立體交叉，第一區的 S 字連續彎要一口氣串起來。'},
 {id:'es-2026',pit:-1,name:'Madring',zh:'馬德里環賽道',country:'西班牙 · 馬德里',km:5.474,turns:22,diff:4,hw:7.5,wall:18,run:9,theme:'city',bank:{a:0.41,b:0.49,deg:13.5},desc:'2026 年新加入的半街道賽道，穿過 IFEMA 展館區的連續技術彎，La Monumental 是路面帶傾斜角的長右彎，後段有連續重煞超車點。'},
 {id:'mc-1929',name:'Monaco',zh:'摩納哥',country:'摩納哥 · 蒙地卡羅',km:3.337,turns:19,diff:5,hw:5.5,wall:11.5,run:4,theme:'city',desc:'狹窄街道、全年最慢的髮夾彎，兩側都是護欄，沒有犯錯空間。'}
];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const fmt=t=>{if(t==null||!isFinite(t))return '—';const m=Math.floor(t/60),s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(3)};

/* ---- track runtime ---- */
let PIT,CAPH,TRK,N,DS,TL,PX,PZ,PY,TX,TZ,NX,NZ,KS,LINE,WL,WR,XN,BR,GR,VK,ZONES,SECT,HW,RUNOFF,HASH,CX,CZ,RAD,BB,HAVG,HRANGE,TCELL,TR0,TSX,TSZ,TSY;
function crSample(pts){const P=[];for(let i=0;i<pts.length;i+=2)P.push([pts[i],pts[i+1]]);const n=P.length,xs=[],zs=[];
  for(let i=0;i<n;i++){const p0=P[(i-1+n)%n],p1=P[i],p2=P[(i+1)%n],p3=P[(i+2)%n];
    const tj=(t,a,b)=>t+Math.sqrt(Math.max(Math.hypot(b[0]-a[0],b[1]-a[1]),1e-3));
    const t0=0,t1=tj(t0,p0,p1),t2=tj(t1,p1,p2),t3=tj(t2,p2,p3);
    const seg=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])));
    const f=(a,b,ta,tb,t)=>[(tb-t)/(tb-ta)*a[0]+(t-ta)/(tb-ta)*b[0],(tb-t)/(tb-ta)*a[1]+(t-ta)/(tb-ta)*b[1]];
    for(let k=0;k<seg;k++){const t=t1+(t2-t1)*k/seg;const A1=f(p0,p1,t0,t1,t),A2=f(p1,p2,t1,t2,t),A3=f(p2,p3,t2,t3,t),B1=f(A1,A2,t0,t2,t),B2=f(A2,A3,t1,t3,t),C=f(B1,B2,t1,t2,t);xs.push(C[0]);zs.push(C[1])}}
  return {xs,zs}}
const cdist=(i,j)=>{const d=Math.abs(i-j);return Math.min(d,N-d)};
function hashKey(x,z){return Math.floor(x/12)+','+Math.floor(z/12)}
function forNear(x,z,r,cb){const c=Math.ceil(r/12),gx=Math.floor(x/12),gz=Math.floor(z/12);for(let a=-c;a<=c;a++)for(let b=-c;b<=c;b++){const l=HASH.get((gx+a)+','+(gz+b));if(l)for(const j of l)cb(j)}}
function trackDist(x,z,maxR){let best=maxR*maxR;forNear(x,z,maxR,j=>{const d=(x-PX[j])**2+(z-PZ[j])**2;if(d<best)best=d});return Math.sqrt(best)}
function nearestGlobal(x,z){let best=1e18,bi=0;for(let r=24;r<5000&&best===1e18;r*=2)forNear(x,z,r,j=>{const d=(x-PX[j])**2+(z-PZ[j])**2;if(d<best){best=d;bi=j}});return bi}
const smooth=(src,w)=>{const o=new Float32Array(N);for(let i=0;i<N;i++){let s=0;for(let k=-w;k<=w;k++)s+=src[(i+k+N)%N];o[i]=s/(2*w+1)}return o};
// BK: road cross-slope (tan of the banking angle, signed so the outside of the corner is higher)
let BK=new Float32Array(0);
// the whole cross-section (road, kerbs, run-off, walls) shares one plane, so there is no crease at the kerb
const bankY=(bk,d)=>bk?bk*d:0;
let OTDET=-1,TGL=new Uint8Array(0),TGR=new Uint8Array(0),HUBS=[];
function loadTrackCore(def){
  TRK=def;HW=def.hw;RUNOFF=def.run;
  const raw=TRACK_PTS[def.id];const {xs,zs}=crSample(raw);
  const n0=xs.length,cs=new Float64Array(n0+1);for(let i=0;i<n0;i++){const j=(i+1)%n0;cs[i+1]=cs[i]+Math.hypot(xs[j]-xs[i],zs[j]-zs[i])}
  TL=cs[n0];N=Math.round(TL/2.5);DS=TL/N;
  PX=new Float32Array(N);PZ=new Float32Array(N);PY=new Float32Array(N);TX=new Float32Array(N);TZ=new Float32Array(N);NX=new Float32Array(N);NZ=new Float32Array(N);
  let k=0;for(let i=0;i<N;i++){const s=i*DS;while(cs[k+1]<s)k++;const t=(s-cs[k])/Math.max(1e-6,cs[k+1]-cs[k]),j=(k+1)%n0;PX[i]=lerp(xs[k],xs[j],t);PZ[i]=lerp(zs[k],zs[j],t)}
  for(let i=0;i<N;i++){const j=(i+1)%N,h=(i-1+N)%N;let tx=PX[j]-PX[h],tz=PZ[j]-PZ[h];const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;TX[i]=tx;TZ[i]=tz;NX[i]=tz;NZ[i]=-tx}
  const K=new Float32Array(N);for(let i=0;i<N;i++){const j=(i+1)%N;K[i]=Math.atan2(TX[i]*TZ[j]-TZ[i]*TX[j],TX[i]*TX[j]+TZ[i]*TZ[j])/DS}
  KS=smooth(K,8);const kl=smooth(K,22);LINE=new Float32Array(N);for(let i=0;i<N;i++)LINE[i]=clamp(-kl[i]*420,-(HW-1.8),HW-1.8);
  // relax a coarse copy of the line toward minimum bending (each point moves along its normal to the spot that
  // straightens its four neighbours), clamped to the track: this is what produces out-in-out
  {const M=Math.max(24,Math.round(N/Math.max(2,Math.round(12/DS)))),lim=HW-1.5,ix=new Int32Array(M),d=new Float64Array(M);
   for(let m=0;m<M;m++){ix[m]=Math.round(m*N/M)%N;d[m]=LINE[ix[m]]}
   const qx=m=>PX[ix[m]]+NX[ix[m]]*d[m],qz=m=>PZ[ix[m]]+NZ[ix[m]]*d[m];
   for(let it=0;it<900;it++)for(let m=0;m<M;m++){const a=(m-2+M)%M,b=(m-1+M)%M,c=(m+1)%M,e=(m+2)%M,i=ix[m];
     const tx=(4*(qx(b)+qx(c))-qx(a)-qx(e))/6,tz=(4*(qz(b)+qz(c))-qz(a)-qz(e))/6;
     const nd=(tx-PX[i])*NX[i]+(tz-PZ[i])*NZ[i];d[m]=clamp(d[m]+0.8*(nd-d[m]),-lim,lim)}
   const cr=(p0,p1,p2,p3,t)=>0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);
   const fine=new Float32Array(N);for(let i=0;i<N;i++){const f=i*M/N,m=Math.floor(f)%M,t=f-Math.floor(f);fine[i]=clamp(cr(d[(m-1+M)%M],d[m],d[(m+1)%M],d[(m+2)%M],t),-lim,lim)}
   LINE=smooth(fine,3)}
  HASH=new Map();for(let i=0;i<N;i++){const key=hashKey(PX[i],PZ[i]);let l=HASH.get(key);if(!l)HASH.set(key,l=[]);l.push(i)}
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(let i=0;i<N;i++){x0=Math.min(x0,PX[i]);x1=Math.max(x1,PX[i]);z0=Math.min(z0,PZ[i]);z1=Math.max(z1,PZ[i])}CX=(x0+x1)/2;CZ=(z0+z1)/2;RAD=Math.hypot(x1-x0,z1-z0)/2;BB=[x0,x1,z0,z1];
  // real elevation profile (from car-position telemetry), sampled at equal lap fractions
  {const ev=TRACK_ELEV[def.id];if(ev){const K=ev.length,rawY=new Float32Array(N);for(let i=0;i<N;i++){const f=i/N*K,a=Math.floor(f)%K,b=(a+1)%K;const t=f-Math.floor(f),e0=ev[(a-1+K)%K],e1=ev[a],e2=ev[b],e3=ev[(b+1)%K];rawY[i]=0.5*((2*e1)+(-e0+e2)*t+(2*e0-5*e1+4*e2-e3)*t*t+(-e0+3*e1-3*e2+e3)*t*t*t)}PY=smooth(smooth(rawY,5),5)}}
  // banked corners: def.bank {a,b} as lap fractions; 80 m ramps in and out
  BK=new Float32Array(N);if(def.bank){const B=def.bank,a=B.a*TL,b=B.b*TL,ramp=80;let ks=0;for(let i=Math.floor(a/DS);i<b/DS;i++)ks+=KS[i%N];const sg=Math.sign(ks)||1,tb=Math.tan(B.deg*Math.PI/180);
   for(let i=0;i<N;i++){const x=i*DS,w=clamp(Math.min(x-a,b-x)/ramp+0.5,0,1);if(w>0)BK[i]=sg*tb*w*w*(3-2*w)}}
  // crossovers (figure-8): the higher branch becomes a bridge; top up the real gap to a drivable clearance
  XN=new Uint8Array(N);BR=new Uint8Array(N);const centers=[];
  for(let i=0;i<N;i+=2)forNear(PX[i],PZ[i],5,j=>{if(j>i&&cdist(i,j)>300&&(PX[i]-PX[j])**2+(PZ[i]-PZ[j])**2<25&&!centers.some(c=>cdist(c[1],j)<120))centers.push([i,j])});
  centers.forEach(([a,b])=>{const hi=PY[a]>=PY[b]?a:b,lo=hi===a?b:a,need=7.5-(PY[hi]-PY[lo]);
    for(let i=0;i<N;i++){const dd=cdist(i,hi)*DS;if(need>0&&dd<250)PY[i]+=need*(dd<50?1:0.5+0.5*Math.cos(Math.PI*(dd-50)/200));if(dd<75)BR[i]=1}
    for(let i=0;i<N;i++)if(Math.hypot(PX[i]-PX[hi],PZ[i]-PZ[hi])<45)XN[i]=1});
  // barrier offsets, pulled in wherever another part of the circuit runs close by
  const sep=Math.ceil(1.7*(def.wall+HW+6)/DS),minW=HW+4;
  const hitAny=(i,side,d,r)=>{const px=PX[i]+NX[i]*d*side,pz=PZ[i]+NZ[i]*d*side;let hit=false;forNear(px,pz,r,j=>{if(!hit&&cdist(i,j)>sep&&!BR[j]&&(px-PX[j])**2+(pz-PZ[j])**2<r*r)hit=true});return hit};
  // a point at offset d belongs to this section only while it is closer to it than to any other section (plus a gap)
  const nearer=(i,side,d,m)=>{const px=PX[i]+NX[i]*d*side,pz=PZ[i]+NZ[i]*d*side,r=d+m;let hit=false;forNear(px,pz,r,j=>{if(!hit&&cdist(i,j)>sep&&!BR[j]&&(px-PX[j])**2+(pz-PZ[j])**2<r*r)hit=true});return hit};
  const wallFor=(i,side)=>{if(BR[i])return minW;
    let d=def.wall;while(d>minW&&nearer(i,side,d,1.6))d-=0.5;if(d>minW||!nearer(i,side,d,1.6))return Math.max(d,minW);
    // two sections really close (e.g. Monaco): share the gap with a barrier just off each road edge
    d=minW;while(d>HW+0.6&&nearer(i,side,d,0.7))d-=0.25;return Math.max(d,HW+0.6)};
  const wl=new Float32Array(N),wr=new Float32Array(N);for(let i=0;i<N;i++){wl[i]=wallFor(i,1);wr[i]=wallFor(i,-1)}
  const minf=a=>{const o=new Float32Array(N);for(let i=0;i<N;i++){let m=1e9;for(let k=-6;k<=6;k++)m=Math.min(m,a[(i+k+N)%N]);o[i]=m}return o};
  // width may only change gradually along the lap (0.3 m per metre), and never beyond the limits found
  const ero=a=>{const o=new Float32Array(N),sl=0.3*DS,K2=Math.ceil((def.wall-HW)/sl)+1;for(let i=0;i<N;i++){let m=1e9;for(let k=-K2;k<=K2;k++)m=Math.min(m,a[(i+k+N)%N]+Math.abs(k)*sl);o[i]=m}return o};
  // inside of a corner the barrier must stay short of the local centre of curvature, otherwise the run-off folds over itself
  // and the barrier ties itself in a knot. Beside the pit straight the gentler, smoothed limit is kept so the pit complex fits.
  // pit exit: as far down the start straight as it stays straight (30 m short of the first real corner), 150-320 m past the line
  if(!def.pitA){let d=150;for(let s0=0;s0<=420;s0+=DS){if(Math.abs(KS[Math.floor(s0/DS)%N])>1/170){d=s0-30;break}d=s0}def.pitA=Math.round(clamp(d,150,320)/5)*5}
  const Kl=smooth(K,1),inPitZone=i=>wrapS(i*DS+(def.pitB||230))<=(def.pitB||230)+(def.pitA||150);
  const limit=(raw,sgn,pitOld)=>{const a=Float32Array.from(raw);for(let i=0;i<N;i++){const old=pitOld&&inPitZone(i),src=old?KS:Kl,w=old?4:3;let km=0;for(let k=-w;k<=w;k++){const q=src[(i+k+N)%N];if(Math.abs(q)>Math.abs(km))km=q}
    if(Math.abs(km)>1e-4&&km*sgn<0){const R=1/Math.abs(km);a[i]=Math.min(a[i],old?Math.max(HW+1.2,0.85*R):Math.max(0.76*R,Math.min(HW+1.2,0.9*R)))}}return smooth(ero(a),2)};
  const WLn=limit(wl,1,false),WRn=limit(wr,-1,false);WL=limit(wl,1,true);WR=limit(wr,-1,true);
  // pit complex beside the start straight: pit wall, fast lane, working lane with team boxes, garages right behind
  {const a=wrapS(-(def.pitB||230)),len=(def.pitB||230)+(def.pitA||150),T=55,ix=s0=>Math.floor(wrapS(a+s0)/DS)%N,sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
   const hitCorr=(i,side,d,m)=>{const px=PX[i]+NX[i]*d*side,pz=PZ[i]+NZ[i]*d*side;let hit=false;forNear(px,pz,def.wall+m+2,j=>{if(!hit&&cdist(i,j)>sep&&!BR[j]&&Math.hypot(px-PX[j],pz-PZ[j])<Math.max(WL[j],WR[j])+m)hit=true});return hit};
   const room=side=>{const W=side>0?WL:WR;let m=HW+13;for(let s0=T;s0<=len-T;s0+=DS*2){const i=ix(s0);if(W[i]<def.wall-0.5)m=Math.min(m,W[i]);let d=m;while(d>HW+4&&hitCorr(i,side,d+6,1.5))d-=0.5;m=d}return m};
   const r1=room(1),r2=room(-1),side=def.pit||(r2>r1+1.5?-1:1),front=Math.min(HW+11.5,def.pit?(side>0?r1:r2):Math.max(r1,r2));if(side>0)WR=WRn;else WL=WLn;
   // tight corners: no barrier or strip run-off on the inside. The whole infield becomes one fan-shaped patch around a hub
   // (a tyre stack at the centre of the corner), so nothing can fold or curl up there.
   TGL=new Uint8Array(N);TGR=new Uint8Array(N);HUBS=[];
   for(const sd of [1,-1]){const W=sd>0?WL:WR,T=sd>0?TGL:TGR,cand=i=>!BR[i]&&KS[i]*sd<-1/200&&W[i]<HW+8&&!(sd===side&&inPitZone(i));
     let st=0;while(st<N&&cand(st))st++;if(st===N)continue;
     for(let c=1;c<=N;c++){const i0=(st+c)%N;if(!cand(i0))continue;let len=0;while(len<N&&cand((i0+len)%N))len++;
       let kmax=0;for(let q=0;q<len;q++)kmax=Math.max(kmax,Math.abs(KS[(i0+q)%N]));
       if(kmax>1/34&&len*DS>10){let hx=0,hz=0,hy=0,n=0;for(let q=0;q<len;q++){const i=(i0+q)%N,k=Math.abs(KS[i]);hy+=PY[i];if(k>0.6*kmax){const R=Math.min(1/k,60);hx+=PX[i]+NX[i]*sd*R;hz+=PZ[i]+NZ[i]*sd*R;n++}}
         hx/=n;hz/=n;hy/=len;let rmin=1e9;for(let q=0;q<len;q++){const i=(i0+q)%N;rmin=Math.min(rmin,Math.hypot(PX[i]-hx,PZ[i]-hz))}
         if(rmin>HW+3.2){for(let q=0;q<len;q++){const i=(i0+q)%N;T[i]=1;W[i]=Math.max(HW+2.4,Math.hypot(PX[i]-hx,PZ[i]-hz)-0.6)}HUBS.push({x:hx,y:hy,z:hz,sd,i0,len})}}
       c+=len-1}}
   let dep=5;{let ok=true;while(ok&&dep<12){for(let s0=T;s0<=len-T&&ok;s0+=DS*3)if(hitCorr(ix(s0),side,front+dep+1,1.5))ok=false;if(ok)dep+=1}}
   const PW=HW+1.5,L0=PW+0.7,fast=clamp((front-L0)*0.45,2.6,3.8),L1=L0+fast,W=side>0?WL:WR;
   for(let s0=0;s0<=len;s0+=DS){const i=ix(s0),t=sm(Math.min(s0,len-s0)/T),lim=W[i]<def.wall-0.5?W[i]:1e9;W[i]=t>=1?front:Math.min(lerp(W[i],front,t),Math.max(lim,HW+4))}
   PIT={side,a,len,T,PW,L0,L1,front,dep,mid:(L1+front)/2,boxes:TEAMS.map((t,k)=>wrapS(-22-24*k))}}
  // straight-mode (X) zones: long low-curvature runs
  ZONES=[];{let start=-1;const ok=i=>Math.abs(KS[i])<1/900;let i0=0;while(ok(i0)&&i0<N-1)i0++;for(let c=0;c<=N;c++){const i=(i0+c)%N;if(ok(i)&&c<N){if(start<0)start=c}else if(start>=0){const len=(c-start)*DS;if(len>280){const a=(i0+start)%N,b=(i0+c)%N;ZONES.push({a:wrapS(a*DS+25),b:wrapS(b*DS-70),det:wrapS(a*DS-120),len})}start=-1}}}
  ZONES.sort((a,b)=>b.len-a.len);ZONES=ZONES.slice(0,4);OTDET=ZONES.reduce((m,z)=>Math.max(m,z.det),-1);
  SECT=[TL/3,2*TL/3];
  // gradient and vertical curvature (crests unload the tyres, compressions load them)
  {const g0=new Float32Array(N),v0=new Float32Array(N),w=4;for(let i=0;i<N;i++){g0[i]=(PY[(i+1)%N]-PY[(i-1+N)%N])/(2*DS);v0[i]=clamp((PY[(i+w)%N]-2*PY[i]+PY[(i-w+N)%N])/((w*DS)*(w*DS)),-0.006,0.006)}GR=smooth(g0,2);VK=smooth(v0,4)}
  let ymin=1e9,ymax=-1e9,ysum=0;for(let i=0;i<N;i++){ymin=Math.min(ymin,PY[i]);ymax=Math.max(ymax,PY[i]);ysum+=PY[i]}HAVG=ysum/N;HRANGE=ymax-ymin;
  // terrain model: flat across each track corridor, inverse-distance blend between sections, fading to the mean far away
  TCELL=clamp((Math.max(BB[1]-BB[0],BB[3]-BB[2])+900)/300,6,12);TR0=def.wall+3+TCELL*1.5;
  CAPH=new Map();for(let i=0;i<N;i+=2)if(!BR[i]){const key=Math.floor(PX[i]/30)+','+Math.floor(PZ[i]/30);let l=CAPH.get(key);if(!l)CAPH.set(key,l=[]);l.push(PX[i],PZ[i],PY[i]-0.45-Math.abs(BK[i])*(Math.max(WL[i],WR[i])+1),Math.max(WL[i],WR[i])+3)}
  {const xs=[],zs=[],ys=[];for(let i=0;i<N;i+=6)if(!BR[i]){xs.push(PX[i]);zs.push(PZ[i]);ys.push(PY[i])}TSX=Float32Array.from(xs);TSZ=Float32Array.from(zs);TSY=Float32Array.from(ys)}
}
function terrainH(x,z){let best=1e18,sw=0,sy=0;const n=TSX.length;
  for(let k=0;k<n;k++){const dx=x-TSX[k],dz=z-TSZ[k],d2=dx*dx+dz*dz;if(d2<best)best=d2;const e=Math.sqrt(d2)+20;const w=1/(e*e*e*e);sw+=w;sy+=w*TSY[k]}
  const dn=Math.sqrt(best),f=clamp((dn-150)/300,0,1);let h=lerp(sy/sw,HAVG,f*f*(3-2*f));
  // never rise above any road within reach: the ground stays below the asphalt and slopes up gently away from it
  const gx=Math.floor(x/30),gz=Math.floor(z/30);for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++){const l=CAPH.get((gx+a)+','+(gz+b));if(l)for(let q=0;q<l.length;q+=4){const d=Math.hypot(x-l[q],z-l[q+1]);const cap=l[q+2]+0.3*Math.max(0,d-l[q+3]);if(cap<h)h=cap}}
  return h}
const wrapS=s=>((s%TL)+TL)%TL;
const pitRel=s=>wrapS(s-PIT.a);
const inPit=c=>{const r=pitRel(c.s);return r>PIT.T&&r<PIT.len-PIT.T&&c.d*PIT.side>PIT.PW};
function at(s,d,out){s=wrapS(s);const f=s/DS,i=Math.floor(f)%N,j=(i+1)%N,t=f-Math.floor(f);const x=lerp(PX[i],PX[j],t),z=lerp(PZ[i],PZ[j],t);let tx=lerp(TX[i],TX[j],t),tz=lerp(TZ[i],TZ[j],t);const l=Math.hypot(tx,tz);tx/=l;tz/=l;out.x=x+tz*d;out.z=z-tx*d;out.y=lerp(PY[i],PY[j],t)+bankY(lerp(BK[i],BK[j],t),d);out.h=Math.atan2(tx,tz);out.i=i;return out}
function nearest(x,z,guess,win){let best=1e18,bi=guess;for(let k=-win;k<=win;k++){const i=(guess+k+N)%N;const dx=x-PX[i],dz=z-PZ[i];const d=dx*dx+dz*dz;if(d<best){best=d;bi=i}}return bi}
const inZone=(s,z)=>z.a<z.b?(s>=z.a&&s<=z.b):(s>=z.a||s<=z.b);
const zoneAt=s=>{for(let k=0;k<ZONES.length;k++)if(inZone(s,ZONES[k]))return k;return -1};

/* ---- powertrain ---- */
const ersTaper=(vk,ot)=>ot?(vk<337?1:Math.max(0,1-(vk-337)/18)):(vk<290?1:Math.max(0,1-(vk-290)/50));
const RATIO={short:0.94,std:1,long:1.06};
const gearTop=(g,ratio)=>352*ratio*Math.pow(g/8,0.7);            // km/h at the 12,000 rpm limiter
const rpmFor=(vk,g,ratio)=>Math.max(4000,vk/gearTop(g,ratio)*PHY.rev);
const powerFrac=rpm=>rpm>=PHY.rev+60?0:clamp(0.32+0.68*(rpm-4000)/6500,0.32,1);
const ERS_CAP={save:220e3,balance:290e3,attack:350e3};
function cornerSpeed(R,mu,ClA){const k=0.5*PHY.rho*ClA/PHY.m;const den=1-mu*k*R;return den<=0.02?200:Math.sqrt(mu*PHY.g*R/den)}
function buildProfile(team){const prof=new Float32Array(N);const mu=PHY.mu*team.grip;
  for(let i=0;i<N;i++){const R=Math.abs(KS[i])>1e-6?1.3/Math.abs(KS[i]):1e6;prof[i]=Math.min(cornerSpeed(R,mu+Math.abs(BK[i]),PHY.ClA_Z),100)}
  for(let pass=0;pass<2;pass++)for(let c=0;c<N;c++){const i=c,j=(c+1)%N;const v=prof[i];const z=zoneAt(i*DS)>=0;const CdA=z?PHY.CdA_X:PHY.CdA_Z;const P=(PHY.ice+PHY.ers*ersTaper(v*3.6,false)*0.85)*team.power;const k=0.5*PHY.rho*PHY.ClA_Z/PHY.m;const trac=mu*(PHY.g+k*v*v)*0.62;const a=Math.min(P/Math.max(v,4)/PHY.m,trac)-0.5*PHY.rho*CdA*v*v/PHY.m-PHY.Crr*PHY.g-PHY.g*GR[i];const vn=Math.sqrt(Math.max(1,v*v+2*a*DS));if(prof[j]>vn)prof[j]=vn}
  for(let pass=0;pass<2;pass++)for(let c=N-1;c>=0;c--){const i=c,j=(c+1)%N;const v=prof[j];const k=0.5*PHY.rho*PHY.ClA_Z/PHY.m;const a=Math.max(3,mu*(PHY.g+k*v*v)+0.5*PHY.rho*PHY.CdA_Z*v*v/PHY.m+PHY.g*GR[i]);const vp=Math.sqrt(v*v+2*a*DS);if(prof[i]>vp)prof[i]=vp}
  return prof}

const $=id=>document.getElementById(id);
const VERSION='2.4.1';
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
