'use strict';
/* Grid 2026 — HUD */
/* ================= HUD ================= */
const rowsEl=$('rows');const rowEls=[];for(let k=0;k<10;k++){const r=document.createElement('div');r.className='trow';r.innerHTML='<span class="p"></span><span class="chip"></span><span class="code"></span><span class="gap"></span>';rowsEl.appendChild(r);rowEls.push(r)}
// phones: the timing tower shows the top 3 plus you until tapped; the map folds to a small tab when tapped
let towerFull=false;$('tower').addEventListener('click',()=>{towerFull=!towerFull});
$('mini').addEventListener('click',()=>{if(!touchEdit)document.body.classList.toggle('miniOff')});
const mini=$('miniC'),mctx=mini.getContext('2d');let mB;
function buildMiniPath(){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(let i=0;i<N;i++){x0=Math.min(x0,PX[i]);x1=Math.max(x1,PX[i]);z0=Math.min(z0,PZ[i]);z1=Math.max(z1,PZ[i])}const sc=Math.min((mini.width-40)/(x1-x0),(mini.height-40)/(z1-z0));mB={x0,z0,sc,ox:(mini.width-(x1-x0)*sc)/2,oz:(mini.height-(z1-z0)*sc)/2};
  miniPath=new Path2D();for(let i=0;i<=N;i+=3){const [x,y]=mp(PX[i%N],PZ[i%N]);i?miniPath.lineTo(x,y):miniPath.moveTo(x,y)}miniPath.closePath();
  miniZones=new Path2D();ZONES.forEach(z=>{const len=wrapS(z.b-z.a);for(let d=0;d<=len;d+=10){const p=at(z.a+d,0,{});const [x,y]=mp(p.x,p.z);d?miniZones.lineTo(x,y):miniZones.moveTo(x,y)}})}
const mp=(x,z)=>[mB.ox+(x-mB.x0)*mB.sc,mB.oz+(z-mB.z0)*mB.sc];
function drawMini(){const c=mctx;c.clearRect(0,0,mini.width,mini.height);c.lineCap='round';c.lineJoin='round';
  c.strokeStyle='#3a4552';c.lineWidth=7;c.stroke(miniPath);c.strokeStyle='#f2b33d';c.lineWidth=3;c.stroke(miniZones);
  {const [x,y]=mp(PX[0],PZ[0]);c.fillStyle='#e8edf3';c.fillRect(x-2,y-2,5,5)}
  cars.forEach(o=>{if(o.me)return;const [x,y]=mp(o.x,o.z);c.fillStyle=o.team.base;c.strokeStyle='#0b1016';c.lineWidth=1.5;c.beginPath();c.arc(x,y,4.5,0,7);c.fill();c.stroke()});
  {const [x,y]=mp(player.x,player.z);c.fillStyle='#f2b33d';c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(x,y,6,0,7);c.fill();c.stroke()}}
let hudT=0,blink=0;
const REV_C=2*Math.PI*94*0.75,SOC_C=2*Math.PI*82*0.75;
{let h='';for(let k=0;k<=13;k++){const a=(135+270*k/13)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);h+=`<line x1="${(110+c*100.5).toFixed(1)}" y1="${(110+s*100.5).toFixed(1)}" x2="${(110+c*105).toFixed(1)}" y2="${(110+s*105).toFixed(1)}" stroke="${k>=12?'#ff4141':'#8794a3'}" stroke-width="${k%2?1:2}"/>`}$('ticks').innerHTML=h}
function updateHUD(dt){const p=player;const vk=Math.round(Math.abs(p.v)*3.6);blink+=dt;
  $('spd').textContent=vk;
  const man=settings.assist.gearbox==='manual';
  $('gear').textContent=p.v<-0.2?'R':String(p.gear);$('rpm').textContent=Math.round(p.rpm/100)*100+' RPM';$('gearMode').textContent=man?'MANUAL':'AUTO';
  const rev=$('revFg');rev.setAttribute('stroke-dasharray',(clamp(p.rpm/13000,0,1)*REV_C).toFixed(1)+' 600');rev.setAttribute('stroke',p.rpm>=11650?'#b45cff':p.rpm>=10800?'#ff4141':p.rpm>=9800?'#35d873':'#e8edf3');
  $('gear').classList.toggle('shift',man&&p.rpm>=11650&&(blink*10|0)%2===0);
  const sf=p.soc/PHY.batt,sa=$('socArc');sa.setAttribute('stroke-dasharray',(sf*SOC_C).toFixed(1)+' 600');sa.setAttribute('stroke',p.otActive?((blink*6|0)%2?'#ff5ad1':'#ff9be6'):sf<0.15?'#ff4141':p.ersP<-1?'#35d873':'#ffd23f');sa.setAttribute('stroke-width',p.otActive?7:4);
  $('thrB').style.height=Math.max(input.thr,input.thrT)*100+'%';$('brkB').style.height=Math.max(input.brkK,input.brkT)*100+'%';
  const zi=zoneAt(p.s);$('mX').textContent=p.inPit?'PIT 80':'X-MODE';$('mX').className='chip'+(p.inPit||p.aero>=0.5?' on':zi>=0?' ready':'');$('mOT').className='chip ot'+(otOn?' on':p.otAvail?' ready':'');
  {const S2=settings.setup,m=S2.mode;$('mERS').textContent=otOn?(p.otActive?'OT OVERRIDE 100% · 350 kW':'OT ACTIVE 90% · 315 kW')+' · 電量 '+Math.round(sf*100)+'%':'ERS '+Math.round(sf*100)+'% · '+deployKW()+' kW';$('mERS').classList.toggle('otc',p.otActive);const d=$('mDep'),tm=$('tMode');d.classList.toggle('otc',p.otActive);for(let k=0;k<4;k++){d.children[k].className=k===m?'on':'';tm.children[3-k].className=k===m?'cur':''}$('tOT').classList.toggle('act',otOn);$('tOT').classList.toggle('ovr',!!p.otAvail);$('mERS').classList.toggle('ota',otOn&&!p.otActive);}
  {const ty=p.tyre;if(ty){const cp=TYRES[ty.comp];let at=0;for(let w=0;w<4;w++){const T=ty.T[w],e=$('ty'+w);at+=T;e.textContent=Math.round((1-ty.w[w])*100);e.style.background=T<75?'#4aa3ff':T<=110?'#35d873':T<=118?'#f59a3c':'#ef4444'}$('tyC').textContent=cp.k;$('tyC').style.borderColor=cp.col;$('tyT').textContent=Math.round(at/4)+'°C'}}
  hudT-=dt;if(hudT>0)return;hudT=0.12;

  const order=[...cars].sort((a,b)=>(b.finished-a.finished)||(a.finished&&b.finished?a.finishT-b.finishT:progress(b)-progress(a)));
  const myPos=order.indexOf(p)+1;$('pos').textContent='P'+myPos;
  if(p.lastPos&&myPos<p.lastPos&&raceT>3)radio(`超車成功，現在 P${myPos}`,'pos',4);p.lastPos=myPos;
  {const cut=document.body.classList.contains('compact')&&!towerFull;rowEls.forEach((r,k)=>{r.hidden=k>=order.length||(cut&&k>=3&&!order[k].me)});$('tower').classList.toggle('cut',cut&&order.length>3)}
  order.forEach((c,k)=>{const r=rowEls[k];r.className='trow'+(c.me?' me':'');r.children[0].textContent=k+1;r.children[1].style.background=c.team.base;r.children[2].textContent=c.code;
    let g='';if(k===0)g=c.finished?'FINISH':'LEADER';else{const gg=gapBehind(order[k-1],c);g=gg==null?'—':'+'+gg.toFixed(1)}r.children[3].textContent=g});
  if(opts.mode==='tt'){$('tLap').textContent=p.laps<0?'暖胎':p.laps+1;$('tTot').textContent='計時'}else{$('tLap').textContent=clamp(p.laps+1,1,opts.laps);$('tTot').textContent=opts.laps}
  $('lapNow').textContent=raceT>0?fmt(raceT-p.lapStart):'0:00.000';
  $('lastLap').textContent=fmt(p.lapTimes[p.lapTimes.length-1]);$('bestLap').textContent=fmt(p.best);$('fastLap').textContent=fastest.car?fmt(fastest.t)+' '+fastest.car.code:'—';
  ['s1','s2','s3'].forEach((id,k)=>{const e=$(id);const col=p.secCol[k];e.className='sec '+col;e.textContent=col==='idle'?'S'+(k+1):p.secT[k].toFixed(2)});
  drawMini()}
