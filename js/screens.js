'use strict';
/* Grid 2026 — 選單畫面：車隊、賽道、設定 */
/* ================= SCREENS ================= */
const show=(id,on)=>{$(id).hidden=!on};
const HUDS=['tower','lap','cluster','mini'];
const SCREENS=['menu','trackScreen','pause','results'];
function screen(id){SCREENS.forEach(s=>show(s,s===id));if(id==='pause'&&typeof renderPauseLine==='function')renderPauseLine()}
// flying start: as far back as the start straight stays straight (80–420 m)
function flyDist(){let d=0;while(d<420&&Math.abs(KS[Math.floor(wrapS(-d-30)/DS)%N])<1/350)d+=DS;return Math.max(80,d)}
function startRace(){
  ls.set('grid26.team',opts.team);if(!tutSave)ls.set('grid26.track',TRACKS[opts.track].id);
  if(menuCar){disposeCar(menuCar);menuCar=null}
  ensureTrack();PROFILES=TEAMS.map(buildProfile);
  const tt=opts.mode==='tt';
  spawnCars();player.tyre=newTyres(tut?'M':settings.setup.tyre);raceT=tt?0:-1;state='race';
  if(tt){const c=player,fly=opts.ttStart==='fly',s0=fly?-flyDist():PIT.boxes[opts.team],i0=Math.floor(wrapS(s0)/DS)%N,d0=fly?LINE[i0]:PIT.side*PIT.mid,q=at(s0,d0,{});
    c.x=q.x;c.y=q.y;c.z=q.z;c.h=q.h;c.s=wrapS(s0);c.d=d0;c.idx=q.i;c.pitDone=true;c.pside=fly?0:1;
    if(fly){c.v=PROFILES[opts.team][i0]*0.92;const r=RATIO[settings.setup.gearing]||1;c.gear=8;for(let g=1;g<=8;g++)if(rpmFor(c.v*3.6,g,r)<11200){c.gear=g;break}}}lightsT=0;lightsOn=0;goT=1+Math.random()*1.5;paused=false;endTimer=-1;
  fastest={t:Infinity,car:null};bestSec=[Infinity,Infinity,Infinity];radioQ=[];radioCool={};
  const p=player;camPos.set(p.x-Math.sin(p.h)*8,p.y+2.4,p.z-Math.cos(p.h)*8);camera.fov=60;
  screen(null);HUDS.forEach(h=>show(h,true));show('startl',!tt);applyTouchVisibility();
  if(tt)radio(opts.ttStart==='fly'?'飛行圈，過線開始計時':'出維修道後自由暖胎，過線開始計時','tt',1);
  [...$('startl').children].forEach(e=>e.classList.remove('on'));gantryLamps.forEach(m=>m.color.setHex(0x2a0608));
  startAudio();
}
let endTimer=-1;
function endRaceSoon(){endTimer=3.5;radio('方格旗！比賽結束','fin',1)}
function showResults(){state='results';Object.assign(input,{thrK:0,brkK:0,left:0,right:0,ot:0,thrT:0,brkT:0});HUDS.forEach(h=>show(h,false));applyTouchVisibility();
  cars.forEach(c=>{if(!c.finished){const rem=(opts.laps*TL)-progress(c);c.estT=raceT+rem/Math.max(5,progress(c)/Math.max(raceT,1));c.lapsDown=Math.max(0,Math.floor(rem/TL))}else c.estT=c.finishT});
  const order=[...cars].sort((a,b)=>a.estT-b.estT);const win=order[0].estT;const tr=TRACKS[opts.track];
  $('resTrack').textContent=`正式成績 · ${tr.name} · ${opts.laps} 圈`;
  $('resTitle').textContent='P'+(order.indexOf(player)+1)+(player.penalty?' · +5s 偷跑罰時':'');
  $('resBody').innerHTML=order.map((c,k)=>`<tr class="${c.me?'me':''}"><td>${k+1}</td><td>#${c.num} ${c.name}</td><td>${c.team.name}</td><td class="r">${k===0?fmt(c.estT):(c.lapsDown?'+'+c.lapsDown+' 圈':'+'+(c.estT-win).toFixed(3)+'s')}${c.finished?'':'*'}</td><td class="r">${fmt(c.best)}${fastest.car===c?' ◆':''}</td></tr>`).join('');
  screen('results')}
function clearRace(){tutEnd();HUDS.forEach(h=>show(h,false));show('startl',false);cars.forEach(c=>disposeCar(c.model));cars=[];player=null;paused=false;applyTouchVisibility()}
// phone step flow: 0 name, 1 team + car, 2 track, 3 leaderboard (see mobileflow.js)
let mstep=0;
function toTeams(){mstep=1;clearRace();state='menu';ensureTrack();buildMenuCar();screen('menu')}
function toTracks(){mstep=2;revHold=false;previewT=0;clearRace();state='tracks';if(menuCar){disposeCar(menuCar);menuCar=null}ensureTrack();renderTrackDetail();screen('trackScreen')}

/* ---- team select ---- */
const teamsEl=$('teams');
TEAMS.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='team';b.id='team-'+t.code;b.setAttribute('aria-pressed',String(i===opts.team));
  b.style.setProperty('--tc',t.base);b.innerHTML=`<span class="sw" style="background:${t.base}"><i style="background:${t.acc}"></i></span><span><div class="tn">${t.name}</div><div class="tm">${t.tilt}</div></span><span class="tp">對應積分 P${t.rank}<b>${t.pts} 分</b></span>`;
  b.onclick=()=>{opts.team=i;[...teamsEl.children].forEach((e,k)=>e.setAttribute('aria-pressed',String(k===i)));renderStats();buildMenuCar();previewVoice();toast('引擎聲：'+VOICE_NOTE[i])};teamsEl.appendChild(b)});
function renderStats(){const t=TEAMS[opts.team];$('selName').textContent=t.name.toUpperCase()+' · #'+t.nums[0];
  $('selSw').style.background=`linear-gradient(180deg,${t.base} 0 62%,${t.acc} 62% 100%)`;
  const pw=Math.round(t.power*1000-900),gr=Math.round(t.grip*1000-900),ov=Math.round(t.pace*1000-860);
  $('stats').innerHTML=[['動力',pw,100],['下壓力',gr,100],['綜合',ov,112]].map(([n,v,mx])=>`<div class="stat"><span class="sl">${n}</span><div class="t"><div class="f" style="width:${v/mx*100}%"></div></div><span class="v">${v}<i>/${mx}</i></span></div>`).join('')+
   `<div class="kvgrid" style="margin-top:12px">${[['軸距','3,400','mm'],['車寬','1,900','mm'],['最低重量','768','kg'],['動力','400 + 350','kW'],['變速箱','8','速'],['電池可用','4.0','MJ']].map(([l,v,u])=>`<div><span>${l}</span><b>${v}<i>${u}</i></b></div>`).join('')}</div>`;
  $('selNote').textContent=`對應 2026 車隊積分榜第 ${t.rank} 名（${t.pts} 分，巴西站後）。動力與下壓力的取捨是遊戲平衡設定。`;renderCtaSum();
  $('mTeam').innerHTML=`<span class="selSw" style="background:linear-gradient(180deg,${t.base} 0 62%,${t.acc} 62% 100%)"></span><div class="mtx"><div class="mtn">${escHTML(t.name)} <span>#${t.nums[0]}</span></div><div class="mtm">${escHTML(t.tilt)}</div></div><div class="mtp">P${t.rank}<b>${t.pts} 分</b></div>`}
function renderCtaSum(){const t=TEAMS[opts.team],el=$('ctaSum');if(el)el.innerHTML=`已選 <b>${escHTML(t.name)} #${t.nums[0]}</b> · 車手 <b>${escHTML(playerName())}</b>`}
function renderSetupSummary(){const S=settings.setup,A=settings.assist;$('setupSum').innerHTML=[['下壓力',(S.df>0?'+':'')+S.df],['齒比',{short:'短',std:'標準',long:'長'}[S.gearing]],['煞車平衡',S.bias+'% 前'],['電能模式',ERS_MODES[S.mode].n+' · '+ERS_MODES[S.mode].kw+' kW'],['變速箱',A.gearbox==='auto'?'自動':'手動'],['能量回收','×'+S.charge]].map(([l,v])=>`<div><span>${l}</span><b>${v}</b></div>`).join('')}
// player name field on the team screen: saved as typed, shown everywhere through normalizePlayerName
{const inp=$('pName');inp.value=ls.get('grid26.name')||'';const upd=()=>{ls.set('grid26.name',Array.from(inp.value).slice(0,16).join(''));renderCtaSum()};inp.addEventListener('input',upd);inp.addEventListener('blur',()=>{if(!inp.value.trim()){inp.value='';ls.set('grid26.name','')}renderCtaSum()})}
$('goSetup').onclick=()=>{openSettings('menu');$('tab-setup').click()};$('goSetup2').onclick=()=>{openSettings('trackScreen');$('tab-setup').click()};
function buildMenuCar(){if(menuCar)disposeCar(menuCar);const t=TEAMS[opts.team];menuCar=makeCar(t,t.nums[0]);const p=at(-40,0,{});menuCar.group.position.set(p.x,p.y,p.z);menuCar.group.rotation.y=p.h;menuCar.base=p;scene.add(menuCar.group)}

/* ---- track select ---- */
function drawOutline(cv,def,big){const ctx=cv.getContext('2d');const pts=TRACK_PTS[def.id];let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(let i=0;i<pts.length;i+=2){x0=Math.min(x0,pts[i]);x1=Math.max(x1,pts[i]);z0=Math.min(z0,pts[i+1]);z1=Math.max(z1,pts[i+1])}
  const pad=big?30:6;const sc=Math.min((cv.width-pad*2)/(x1-x0),(cv.height-pad*2)/(z1-z0));const ox=(cv.width-(x1-x0)*sc)/2,oz=(cv.height-(z1-z0)*sc)/2;const P=i=>[ox+(pts[i]-x0)*sc,oz+(pts[i+1]-z0)*sc];
  ctx.clearRect(0,0,cv.width,cv.height);ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();for(let i=0;i<pts.length;i+=2){const [x,y]=P(i);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();
  ctx.strokeStyle=big?'#3a4552':'#e8edf3';ctx.lineWidth=big?10:2.2;ctx.stroke();if(big){ctx.strokeStyle='#e8edf3';ctx.lineWidth=3;ctx.stroke()}
  const [sx,sy]=P(0),[nx,ny]=P(2);const a=Math.atan2(ny-sy,nx-sx);ctx.save();ctx.translate(sx,sy);ctx.rotate(a);ctx.fillStyle='#f2b33d';ctx.beginPath();const r=big?11:5;ctx.moveTo(r,0);ctx.lineTo(-r*0.8,-r*0.7);ctx.lineTo(-r*0.8,r*0.7);ctx.closePath();ctx.fill();ctx.restore()}
const stars=n=>'★'.repeat(n)+'<i>'+'★'.repeat(5-n)+'</i>';
const trksEl=$('trks');
TRACKS.forEach((def,i)=>{const b=document.createElement('button');b.type='button';b.className='trk';b.id='trk-'+def.id;b.setAttribute('aria-pressed',String(i===opts.track));
  const cv=document.createElement('canvas');cv.width=144;cv.height=108;drawOutline(cv,def,false);
  const info=document.createElement('span');info.innerHTML=`<div class="n">${def.name}</div><div class="c">${def.zh} · ${def.country}</div><div class="m"><span class="stars">${stars(def.diff)}</span>${def.km.toFixed(3)} km</div>`;
  b.append(cv,info);b.onclick=()=>{opts.track=i;[...trksEl.children].forEach((e,k)=>e.setAttribute('aria-pressed',String(k===i)));ensureTrack();renderTrackDetail()};trksEl.appendChild(b)});
const DIFF_LBL=['','入門','簡單','中等','困難','極難'];
function renderTrackDetail(){const def=TRACKS[opts.track];drawOutline($('trkBig'),def,true);
  $('tdRank').textContent=`難度 ${opts.track+1} / ${TRACKS.length} · ${DIFF_LBL[def.diff]}`;$('tdName').textContent=def.name;$('tdRef').textContent=def.zh+' · '+def.country;$('tdDesc').textContent=def.desc;
  $('tdSpec').innerHTML=`<div>長度<b>${def.km.toFixed(3)} km</b></div><div>彎道<b>${def.turns}</b></div><div>直道模式區<b>${ZONES.length} 段</b></div><div>高低差<b>${HRANGE.toFixed(0)} m</b></div>`;
  $('raceKm').textContent=(def.km*opts.laps).toFixed(1)+' km';renderMode()}

function seg(id,key,parse,after){const el=$(id);[...el.children].forEach(b=>{b.setAttribute('aria-pressed',String(parse(b.dataset.v)===opts[key]));b.onclick=()=>{opts[key]=parse(b.dataset.v);[...el.children].forEach(x=>x.setAttribute('aria-pressed',String(x===b)));after&&after()}})}
const DIFF_NOTE={0.88:'AI 約慢 12%，會早煞車、出彎保守。適合第一次上手。',0.92:'AI 約慢 8%。',0.95:'AI 約慢 5%，用自動變速也追得上。',0.975:'接近真實車隊差距，前段車隊略快於你。',0.99:'頂尖車隊幾乎跑到極限，需要穩定的煞車點。',1.005:'AI 跑在理論極限，需要善用直道模式與 Overtake。',1.02:'AI 超出一般極限，排位第 8 起跑幾乎要完美才拿得到領獎台。'};
const renderDiff=()=>{$('diffNote').textContent=DIFF_NOTE[opts.diff]||'';ls.set('grid26.diff',opts.diff)};
const ttKey=()=>'grid26.tt.'+TRACKS[opts.track].id;
const renderMode=()=>{const tt=opts.mode==='tt';show('ttOpts',tt);show('raceOpts',!tt);const rec=parseFloat(ls.get(ttKey())),recBy=normalizePlayerName(ls.get(ttKey()+'.name'));$('trkBest').innerHTML=rec?`最佳單圈 <b>${fmt(rec)}</b> · ${escHTML(recBy)}`:'這條賽道還沒有最佳單圈';$('ttNote').textContent=(opts.ttStart==='pit'?'從你的維修站出發，跑一圈暖胎圈，過起跑線開始計時。維修道限速 80 km/h。':'直接在起跑線前以比賽速度進場，過線就開始計時。')+(rec?' 這條賽道的紀錄：'+fmt(rec)+'（'+recBy+'）':' 這條賽道還沒有紀錄。');$('go').textContent=tt?'開始計時':'上場'};
seg('optMode','mode',String,renderMode);seg('optTT','ttStart',String,renderMode);
seg('optLaps','laps',Number,renderTrackDetail);seg('optDiff','diff',Number,renderDiff);renderDiff();
$('toTracks').onclick=toTracks;$('backTeams').onclick=toTeams;$('go').onclick=startRace;
$('again').onclick=startRace;$('toTrackSel').onclick=toTracks;$('quit').onclick=toTeams;$('restart').onclick=()=>tut?startTutorial():startRace();
$('resume').onclick=()=>{paused=false;screen(null)};
const TY_NOTE={S:'抓地力最高（+8%）、升溫快，但大約 4 到 5 圈後明顯衰退。',M:'抓地力與壽命均衡。',H:'抓地力略低（−6%）、暖胎慢，但非常耐磨。'};
function renderTyrePick(){const S=settings.setup;[...$('optTyre').children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===S.tyre)));$('tyreNote').textContent=TY_NOTE[S.tyre]||'';
  [...$('pauseTyre').children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===(opts.mode==='tt'&&player&&player.tyre?player.tyre.comp:S.pitTyre))));
  $('tyreSwL').textContent=opts.mode==='tt'?'輪胎（計時賽：立刻換上一組新胎）':'下次進站要換上的輪胎';show('tyreSw',!tut);$('tyreSw').style.display=tut?'none':'grid';show('lbOpen2',opts.mode==='tt'&&!tut)}
[...$('optTyre').children].forEach(b=>b.onclick=()=>{settings.setup.tyre=settings.setup.pitTyre=b.dataset.v;saveSettings();renderTyrePick()});
[...$('pauseTyre').children].forEach(b=>b.onclick=()=>{const S=settings.setup;S.pitTyre=b.dataset.v;if(opts.mode==='tt'&&player){S.tyre=b.dataset.v;player.tyre=newTyres(b.dataset.v);player.wear=0;toast('換上新的'+TYRES[b.dataset.v].n)}saveSettings();renderTyrePick()});
// time-trial leaderboard: the ten fastest laps per track (each keeps the driver name it was set with),
// plus four reference laps derived from the track's own speed profile
let lbNew=0,lbFilter=null,lbLastD=0;
const LB_KEEP=10;
const lbLoad=id=>{try{const a=JSON.parse(ls.get('grid26.lb.'+id)||'[]');return Array.isArray(a)?a.filter(e=>e&&isFinite(e.t)).map(e=>Object.assign({},e,{trk:id,name:normalizePlayerName(e.name)})):[]}catch(e){return []}};
function lbBench(id){try{const b=JSON.parse(ls.get('grid26.bench.'+id)||'null');if(b&&b.v===1&&Array.isArray(b.rows))return b.rows.map(r=>Object.assign({},r,{trk:id}))}catch(e){}
  if(id!==TRACKS[opts.track].id)return []; // reference laps need that track loaded; they appear once it has been driven or selected
  ensureTrack();const pr=buildProfile(TEAMS[0]);let acc=0,s1=0,s2=0;const i1=Math.floor(SECT[0]/DS),i2=Math.floor(SECT[1]/DS);for(let i=0;i<N;i++){if(i===i1)s1=acc;if(i===i2)s2=acc;acc+=DS/Math.max(5,pr[i])}
  const rows=[[1.03,0,'S'],[1.07,1,'S'],[1.12,2,'M'],[1.18,4,'H']].map(([f,tm,ty])=>({t:+(acc*f).toFixed(3),s:[s1*f,(s2-s1)*f,(acc-s2)*f].map(x=>+x.toFixed(2)),team:tm,ty,ai:1}));
  ls.set('grid26.bench.'+id,JSON.stringify({v:1,rows}));return rows.map(r=>Object.assign({},r,{trk:id}))}
function lbAdd(lt,c){const id=TRACKS[opts.track].id;let a;try{a=JSON.parse(ls.get('grid26.lb.'+id)||'[]');if(!Array.isArray(a))a=[]}catch(e){a=[]}
  const t=TEAMS[opts.team],e={t:+lt.toFixed(3),s:c.secT.map(x=>+x.toFixed(2)),team:opts.team,num:t.nums[0],name:playerName(),ty:c.tyre?c.tyre.comp:'M',d:(lbLastD=Math.max(Date.now(),lbLastD+1))};
  a.push(e);a.sort((x,y)=>x.t-y.t);const top=a.slice(0,LB_KEEP);ls.set('grid26.lb.'+id,JSON.stringify(top));
  const k=top.indexOf(e);if(k>=0)lbNew=e.d;return k}
function lbRender(){const cur=playerName(),all=lbFilter==='all',ids=all?TRACKS.map(t=>t.id):[lbFilter];
  const own=[].concat(...ids.map(lbLoad)),bestOf={};own.forEach(r=>{if(r.name===cur&&(!bestOf[r.trk]||r.t<bestOf[r.trk]))bestOf[r.trk]=r.t});
  const bench=all?[]:lbBench(lbFilter),rows=own.concat(bench).sort((a,b)=>a.t-b.t),trkName=id=>{const t=TRACKS.find(x=>x.id===id);return t?t.zh:id};
  $('lbTitle').textContent=all?'全部賽道 · 總榜':(()=>{const t=TRACKS.find(x=>x.id===lbFilter);return t.zh+' '+t.name})();
  $('lbCur').textContent=cur;
  $('lbHead').innerHTML=`<tr><th>#</th><th>車手</th>${all?'<th>賽道</th>':''}<th>單圈</th>${all?'':'<th>S1 / S2 / S3</th>'}<th>車隊</th><th>輪胎</th></tr>`;
  const cols=all?6:6;
  $('lbBody').innerHTML=rows.length?rows.map((r,k)=>{const mine=!r.ai&&r.name===cur,tm=TEAMS[r.team]||TEAMS[0],ty=TYRES[r.ty]||TYRES.M,isNew=r.d&&r.d===lbNew,isPB=mine&&r.t===bestOf[r.trk];
    const tag=isNew&&isPB?'<span class="tag">NEW PB</span>':isNew?'<span class="tag">NEW</span>':isPB?'<span class="tag">PB</span>':'';
    const who=r.ai?`<span class="lbName">基準 · ${escHTML(tm.drivers[0])}</span>`:`<span class="lbName">${escHTML(r.name)}</span>${mine?'<span class="meTag">目前玩家</span>':''}`;
    return `<tr class="${r.ai?'ai':'me'}${mine?' mine':''}${isNew?' new':''}"><td>${k+1}</td><td>${who}</td>${all?`<td>${escHTML(trkName(r.trk))}</td>`:''}<td>${fmt(r.t)}${tag}</td>${all?'':`<td>${(r.s||[]).map(x=>(+x).toFixed(2)).join(' / ')}</td>`}<td><i class="tdot" style="background:${tm.base}"></i>${tm.code}${r.num?' #'+r.num:''}</td><td><i class="tdot" style="background:${ty.col}"></i>${ty.n}</td></tr>`}).join('')
   :`<tr class="empty"><td colspan="${cols}">${all?'還沒有任何單圈紀錄。選一條賽道跑一圈計時賽，成績就會出現在這裡。':'這條賽道還沒有紀錄。'}</td></tr>`;
  const mineN=own.filter(r=>r.name===cur).length;
  $('lbNote').textContent=all?(own.length?`共 ${own.length} 筆成績，依單圈時間排序（不同賽道的時間僅供參考）。亮框是「${cur}」的成績。`:'')
    :(own.length?`每條賽道保留最快 ${LB_KEEP} 筆成績，亮框是「${cur}」的成績${mineN?'':'（目前車手在這條賽道還沒有成績）'}${bench.length?'；灰色是基準成績':''}。`:bench.length?'還沒有成績。灰色是依這條賽道算出來的基準成績，跑一圈計時賽就會上榜。':'跑一圈計時賽就會上榜；選過這條賽道後也會列出基準成績。')}
function showLB(){const sel=$('lbTrack');if(!sel.options.length){sel.innerHTML='<option value="all">全部賽道（總榜）</option>'+TRACKS.map(t=>`<option value="${t.id}">${escHTML(t.zh)} ${escHTML(t.name)}</option>`).join('');sel.onchange=()=>{lbFilter=sel.value;lbRender()}}
  lbFilter=TRACKS[opts.track].id;sel.value=lbFilter;lbRender();show('lb',true);if(state==='tracks')mstep=3}
$('lbOpen1').onclick=showLB;$('lbOpen2').onclick=showLB;$('lbClose').onclick=()=>{show('lb',false);if(mstep===3)mstep=2};
// settings code: everything in grid26.settings (assists, car setup, keys, touch layout) as one string
const cfgCode=()=>'G26.'+btoa(unescape(encodeURIComponent(JSON.stringify({v:1,assist:settings.assist,setup:settings.setup,keys:settings.keys,touchLayout:settings.touchLayout||null,touchLayoutM:settings.touchLayoutM||null,name:ls.get('grid26.name')||''}))));
function cfgApply(txt){try{const o=JSON.parse(decodeURIComponent(escape(atob(String(txt).trim().replace(/^G26\./,'')))));if(!o||typeof o!=='object'||!o.assist)throw 0;ls.set('grid26.settings',JSON.stringify({assist:o.assist,setup:o.setup||{},keys:o.keys||{},touchLayout:o.touchLayout||undefined,touchLayoutM:o.touchLayoutM||undefined}));if(typeof o.name==='string')ls.set('grid26.name',o.name.slice(0,16));return true}catch(e){return false}}
function ttSwitchRender(){renderTyrePick();const on=opts.mode==='tt'&&!tut;$('ttSwitch').hidden=!on;$('ttSwitch').style.display=on?'grid':'none';if(!on)return;
  $('ttSel').innerHTML=TRACKS.map((t,i)=>`<option value="${i}"${i===opts.track?' selected':''}>${i===opts.track?'▶ ':''}${t.zh} ${t.name} · 難度 ${t.diff}/5</option>`).join('')}
$('ttSel').onchange=e=>{const i=+e.target.value;if(i===opts.track||!(i>=0))return;opts.track=i;paused=false;screen(null);toast('載入 '+TRACKS[i].zh+'…');setTimeout(startRace,30)};
$('pauseBtn').onclick=()=>{if(state==='race'){paused=true;screen('pause');ttSwitchRender()}};

/* ---- settings ---- */
let setReturn=null,capture=null;
function openSettings(from){setReturn=from;show('settings',true);renderSettings()}
function closeSettings(){capture=null;show('settings',false)}
$('openSet1').onclick=()=>openSettings('menu');$('openSet2').onclick=()=>openSettings('trackScreen');$('openSet3').onclick=()=>openSettings('pause');$('closeSet').onclick=closeSettings;
let curTab='keys';
['keys','assist','setup','aids'].forEach(t=>{$('tab-'+t).onclick=()=>{curTab=t;['keys','assist','setup','aids'].forEach(x=>{$('tab-'+x).setAttribute('aria-selected',String(x===t));show('pane-'+x,x===t)});renderSettings()}});
function segHTML(id,cur,opts2){return `<div class="seg" id="${id}">`+opts2.map(([v,l])=>`<button type="button" id="${id}-${v}" data-v="${v}" aria-pressed="${String(v)===String(cur)}">${l}</button>`).join('')+'</div>'}
function bindSeg(id,fn){const el=$(id);if(!el)return;[...el.children].forEach(b=>b.onclick=()=>{fn(b.dataset.v);saveSettings();renderSettings()})}
function renderSettings(){
  if(curTab==='keys'){
    $('pane-keys').innerHTML=`<p class="note" style="margin-bottom:8px">點一下按鍵格子，再按下新的鍵即可更換。Esc 取消，Backspace 清除。同一個鍵只能對應一個動作。</p>`+
     ACTIONS.map(([a,l])=>`<div class="krow"><span>${l}</span>${[0,1].map(sl=>{const c=settings.keys[a][sl];const w=capture&&capture.a===a&&capture.sl===sl;return `<button type="button" class="keyb${w?' wait':''}${c?'':' empty'}" id="key-${a}-${sl}" data-a="${a}" data-sl="${sl}">${w?'按下按鍵…':keyName(c)}</button>`}).join('')}</div>`).join('')+
     `<div class="row2" style="margin-top:14px"><button class="btn ghost" id="resetKeys" type="button">恢復預設按鍵</button></div>`+
     `<div class="srow" style="margin-top:18px"><div class="lbl">設定備份</div><p>設定存在這個瀏覽器；換裝置或無痕視窗時用代碼還原。</p><div class="row2"><button class="btn ghost" id="cfgCopy" type="button">複製設定代碼</button><button class="btn ghost" id="cfgUse" type="button">套用下方代碼</button></div><textarea id="cfgBox" rows="3" placeholder="把設定代碼貼在這裡，再按「套用下方代碼」" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea><p class="note" id="cfgMsg" style="margin-top:6px"></p></div>`;
    $('cfgCopy').onclick=()=>{const code=cfgCode(),bx=$('cfgBox');bx.value=code;bx.focus();bx.select();const ok=()=>{$('cfgMsg').textContent='已複製到剪貼簿，貼到備忘錄保存即可。'},no=()=>{$('cfgMsg').textContent='代碼已放在上面的框裡，請全選後複製。'};try{navigator.clipboard.writeText(code).then(ok,no)}catch(e){no()}};
    $('cfgUse').onclick=()=>{if(cfgApply($('cfgBox').value)){$('cfgMsg').textContent='已套用，重新載入中…';setTimeout(()=>location.reload(),400)}else $('cfgMsg').textContent='這不是有效的設定代碼。'};
    $('pane-keys').querySelectorAll('.keyb').forEach(b=>b.onclick=()=>{capture={a:b.dataset.a,sl:+b.dataset.sl};renderSettings()});
    $('resetKeys').onclick=()=>{settings.keys=JSON.parse(JSON.stringify(DEF_KEYS));capture=null;saveSettings();renderSettings()};
  }else if(curTab==='assist'){const A=settings.assist;
    $('pane-assist').innerHTML=
     `<div class="srow"><div class="lbl">引擎聲 <b id="volV">${A.vol==null?70:A.vol}%</b></div>${segHTML('sMute',muted?'off':'on',[['on','開'],['off','關']])}<input type="range" id="sVol" min="0" max="100" step="5" value="${A.vol==null?70:A.vol}" style="margin-top:10px"><p>各車隊引擎聲不同；選車時可試聽，比賽中按 M 開關。</p></div>`+
     `<div class="srow"><div class="lbl">畫面畫質</div>${segHTML('sGfx',A.gfx||'mid',[['low','低 省電流暢'],['mid','中 均衡'],['high','高 高畫質']])}<p><b>低</b> 1 倍解析度、無陰影特效，最省電 · <b>中</b> 1.5 倍、基本陰影與看台 · <b>高</b> 2 倍、完整陰影特效與環境。</p></div>`+
     `<div class="srow"><div class="lbl">畫面更新率上限</div>${segHTML('sFps',A.fps||0,[['0','不限制'],['60','60 FPS'],['30','30 FPS 省電']])}<p>發熱或想省電時選 30／60。</p></div>`+
     `<div class="srow"><div class="lbl">轉向靈敏度 <b id="steerV">${A.steer.toFixed(2)}×</b></div><input type="range" id="sSteer" min="0.6" max="1.4" step="0.05" value="${A.steer}"></div>`+
     `<div class="srow"><div class="lbl">方向盤重量 <b id="wgtV">${(A.weight||1).toFixed(2)}×</b></div><input type="range" id="sWgt" min="0.6" max="1.6" step="0.1" value="${A.weight||1}"><p>越大越沉穩、跟手越慢；車速越快本來就越重。</p></div>`+
     `<div class="srow"><div class="lbl">方向盤死區 <b id="deadV">${A.dead==null?10:A.dead}%</b></div><input type="range" id="sDead" min="0" max="25" step="1" value="${A.dead==null?10:A.dead}"><p>此角度內的晃動不轉向（方向盤上方的黃弧）。</p></div>`+
     `<div class="srow"><div class="lbl">鍵盤油門漸進</div>${segHTML('sRamp',A.ramp?'on':'off',[['off','關（一按全油門）'],['on','開（約 0.3 秒到全油門）']])}<p>出彎較不易打滑。</p></div>`+
     `<div class="srow"><div class="lbl">觸控操作</div>${segHTML('sTouch',A.touch,[['auto','自動偵測'],['on','永遠顯示'],['off','隱藏']])}<p>按得越高踩得越深，兩個踏板之間可直接滑過。</p></div>`+
     `<div class="srow"><div class="lbl">觸控轉向模式</div>${segHTML('sSteerMode',A.steerMode||'drag',[['drag','左右滑動'],['rotate','旋轉方向盤'],['buttons','左右按鍵']])}<p><b>滑動</b> 按住左右拖 · <b>旋轉</b> 繞中心轉 · <b>按鍵</b> 按住 ◀ ▶ 兩半。</p></div>`+
     `<div class="srow"><div class="lbl">方向盤轉角（轉到底需要的角度）</div>${segHTML('sLock',A.wheelLock,[['90','90° 靈敏'],['120','120° 預設'],['180','180° 細膩']])}</div>`+
     `<div class="srow"><div class="lbl">觸控按鈕配置</div><button class="btn ghost" id="editTouch" type="button">調整按鈕與儀表位置、大小</button><p>拖曳按鈕、儀表與地圖到順手的位置，並調整大小。</p></div>`;
    bindSeg('sGear',v=>A.gearbox=v);bindSeg('sLine',v=>A.line=v);bindSeg('sFps',v=>A.fps=+v);bindSeg('sMute',v=>setMuted(v==='off'));$('sVol').oninput=e=>{A.vol=+e.target.value;$('volV').textContent=A.vol+'%';saveSettings()};bindSeg('sGfx',v=>{A.gfx=v;applyGfx()});bindSeg('sLock',v=>{A.wheelLock=+v;drawDz()});$('sDead').oninput=e=>{A.dead=+e.target.value;$('deadV').textContent=A.dead+'%';drawDz();saveSettings()};bindSeg('sAero',v=>A.aero=v);bindSeg('sRamp',v=>A.ramp=v==='on');bindSeg('sTouch',v=>A.touch=v);bindSeg('sSteerMode',v=>{A.steerMode=v;applySteerMode()});$('editTouch').onclick=openTouchEdit;
    $('sWgt').oninput=e=>{A.weight=+e.target.value;$('wgtV').textContent=A.weight.toFixed(2)+'×';saveSettings()};
    $('sSteer').oninput=e=>{A.steer=+e.target.value;$('steerV').textContent=A.steer.toFixed(2)+'×';saveSettings()};
  }else if(curTab==='aids'){const A=settings.assist;
    $('pane-aids').innerHTML=`<p class="note" style="margin-bottom:8px">可以依習慣開關的輔助都集中在這裡。</p>`+
     `<div class="srow"><div class="lbl">賽車線顯示</div>${segHTML('sLine',A.line||'full',[['full','完整顯示'],['corner','僅限彎道'],['off','關閉']])}<p><b>綠</b> 全油門 · <b>黃</b> 準備煞車 · <b>紅</b> 立刻重煞；按 L 切換。</p></div>`+
     `<div class="srow"><div class="lbl">起跑方式</div>${segHTML('sLaunch',A.launch||'manual',[['manual','手動離合器彈射'],['auto','自動起步']])}<p>手動：紅燈時按住離合器、轉速停在綠區，燈滅放開（完美起步抓地 +30%）。自動：燈滅踩油門。</p></div>`+
     `<div class="srow"><div class="lbl">自動進站</div>${segHTML('sAutoPit',A.autoPit===false?'off':'on',[['on','開'],['off','關']])}<p>駛入維修道後由車隊限速、換胎、出站，再交還控制。</p></div>`+
     `<div class="srow"><div class="lbl">變速箱</div>${segHTML('sGear',A.gearbox,[['auto','自動換檔'],['manual','手動換檔']])}<p>手動用 E／Q 換檔；換檔燈閃紫色時升檔。</p></div>`+
     `<div class="srow"><div class="lbl">直道模式（主動空力）</div>${segHTML('sAero',A.aero,[['manual','手動'],['auto','自動']])}<p>只在直道模式區可用，踩煞車會自動收翼。</p></div>`+
     `<div class="srow"><div class="lbl">煞車優先（防誤觸）</div>${segHTML('sGuard',A.guard===false?'off':'on',[['on','開'],['off','關']])}<p>觸控煞車超過 15% 時切斷油門，避免兩指誤觸。</p></div>`;
    bindSeg('sLine',v=>A.line=v);bindSeg('sLaunch',v=>A.launch=v);bindSeg('sGear',v=>A.gearbox=v);bindSeg('sAero',v=>A.aero=v);bindSeg('sGuard',v=>A.guard=v==='on');bindSeg('sAutoPit',v=>A.autoPit=v==='on');
  }else{const S=settings.setup;
    const ratio=RATIO[S.gearing];const est=(df)=>{const CdA=PHY.CdA_X*(1+0.03*df);return Math.round(Math.cbrt((PHY.ice+PHY.ers*0.15)/(0.5*PHY.rho*CdA))*3.6)};
    $('pane-setup').innerHTML=
     `<div class="srow"><div class="lbl">下壓力（前後翼角度） <b id="dfV">${S.df>0?'+':''}${S.df}</b></div><input type="range" id="sDf" min="-3" max="3" step="1" value="${S.df}"><p id="dfNote">彎道抓地 ${Math.round((1+0.05*S.df)*100)}%，估計直道模式極速約 ${est(S.df)} km/h。高下壓力適合摩納哥、匈牙利；低下壓力適合蒙札、斯帕。</p></div>`+
     `<div class="srow"><div class="lbl">齒比</div>${segHTML('sRatio',S.gearing,[['short','短（加速快）'],['std','標準'],['long','長（極速高）']])}<p>8 檔撞到轉速上限的時速約 ${Math.round(gearTop(8,ratio))} km/h，1 檔約 ${Math.round(gearTop(1,ratio))} km/h。</p></div>`+
     `<div class="srow"><div class="lbl">煞車平衡 <b id="biasV">${S.bias}% 前</b></div><input type="range" id="sBias" min="50" max="62" step="1" value="${S.bias}"><p>往後：轉向靈活 · 往前：穩定但轉向遲鈍。</p></div>`+
     `<div class="srow"><div class="lbl">起跑時的電能模式</div>${segHTML('sMode',S.mode,[['0','無 0'],['1','中 140'],['2','快 220'],['3','超 280 kW']])}<p>F／V 切換，輸出越低回收越多。OT（Shift）315 kW，前車 1 秒內 350 kW，開啟時不回充。</p></div>`+
     `<div class="srow"><div class="lbl">能量回收倍率（遊戲輔助）</div>${segHTML('sCharge',S.charge,[['1','×1 擬真'],['1.5','×1.5'],['2','×2 預設'],['3','×3 輕鬆']])}<p>重煞、鬆油與直道末端都會充電；×2 時多數賽道可整場不斷電。</p></div>`;
    $('sDf').oninput=e=>{S.df=+e.target.value;saveSettings();renderSettings()};
    $('sBias').oninput=e=>{S.bias=+e.target.value;$('biasV').textContent=S.bias+'% 前';saveSettings()};
    bindSeg('sRatio',v=>S.gearing=v);bindSeg('sMode',v=>S.mode=+v);bindSeg('sCharge',v=>S.charge=+v);
  }}
