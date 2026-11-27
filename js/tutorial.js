'use strict';
/* Grid 2026 — 新手教學 */
/* ================= TUTORIAL ================= */
// guided session on the practice track: info cards freeze the sim, task cards wait for the player to do the thing
let tut=null,tutSave=null;
const tutTouch=()=>!$('touch').hidden;
const tK=a=>{const k=settings.keys[a].filter(Boolean);return k.length?k.map(c=>'<kbd>'+keyName(c)+'</kbd>').join(' 或 '):'<kbd>未設定</kbd>'};
function tutPlace(s0){const c=player,q=at(s0,0,{});Object.assign(c,{x:q.x,y:q.y,z:q.z,h:q.h,s:wrapS(s0),d:0,idx:q.i,v:0,yaw:0,steer:0,gear:1,pside:0,xmode:false,aero:0})}
const tutZoneS=()=>ZONES.length?wrapS(ZONES[0].a+8):-30;
const TUT=[
 {t:'歡迎來到 Grid 2026',info:1,b:()=>'約 3 分鐘：開車、看儀表，再認識 2026 規則的<b>直道模式</b>、<b>電能部署</b>、<b>Overtake</b>。場上只有你一台車。'},
 {t:'看懂儀表',info:1,hi:()=>['cluster'],b:()=>'中間大數字是<b>檔位</b>，下面是<b>時速</b>；外圈白弧是<b>轉速</b>，內圈黃弧是<b>電量</b>。'},
 {t:'油門',hi:()=>tutTouch()?['tThr']:[],b:()=>(tutTouch()?'按住右下的<b>油門踏板</b>，手指放得越高踩得越深。':`按住 ${tK('throttle')} 踩油門。`)+'把時速拉到 <b>150 km/h</b>。',
  run:p=>{const v=Math.max(0,Math.round(p.v*3.6));return [v>=150,`目前 ${v} / 150 km/h`]}},
 {t:'煞車',hi:()=>tutTouch()?['tBrake']:[],b:()=>(tutTouch()?'按住<b>煞車踏板</b>':`按住 ${tK('brake')}`)+'，把時速降到 <b>60 km/h 以下</b>。賽車線變<b>紅色</b>就是該重煞的地方。',
  run:(p,dt,st)=>{if(Math.max(input.brkK,input.brkT)>0.3)st.b=1;const v=Math.max(0,Math.round(p.v*3.6));return [!!st.b&&v<60,`目前 ${v} km/h，目標 60 以下`]}},
 {t:'轉向',hi:()=>tutTouch()?['tWheel']:[],b:()=>(tutTouch()?({drag:'在左下的<b>正方形轉向區</b>按住後左右滑動，放開會自動回正。',rotate:'按住左下的<b>方向盤</b>，繞著中心轉動，放開會自動回正。',buttons:'左下的正方形分成<b>◀</b>、<b>▶</b>兩半，按住就會轉向，可以直接滑到另一邊。'})[steerMode()]:`用 ${tK('left')} 左轉、${tK('right')} 右轉。`)+'左右各轉一次。記得<b>先煞車、再進彎</b>。',
  run:(p,dt,st)=>{if(p.steer>0.5)st.l=(st.l||0)+dt;if(p.steer<-0.5)st.r=(st.r||0)+dt;const L=st.l>0.3,R=st.r>0.3;return [L&&R,`左轉 ${L?'✓':'—'}　右轉 ${R?'✓':'—'}`]}},
 {t:'換檔',info:()=>settings.assist.gearbox!=='manual',hi:()=>tutTouch()&&settings.assist.gearbox==='manual'?['tUp','tDn']:['cluster'],
  b:()=>settings.assist.gearbox==='manual'?`你用的是<b>手動換檔</b>：${tutTouch()?'「▲ 升」升檔、「▼ 降」降檔':`${tK('shiftUp')} 升檔、${tK('shiftDown')} 降檔`}。轉速弧線快滿時升檔。加速並升到 <b>3 檔</b>。`:`目前是<b>自動換檔</b>，不用管；想手動可到「設定 → 輔助與起跑」切換。`,
  run:p=>[p.gear>=3,`目前 ${p.gear} 檔，目標 3 檔`]},
 {t:'直道模式 X-MODE',hi:()=>tutTouch()?['mX','tX']:['mX'],enter:()=>tutPlace(tutZoneS()),
  b:()=>'2026 年沒有 DRS，改成<b>主動空力</b>：在直道區段放平前後翼提高極速，踩煞車自動收回。已移到直道起點，'+(settings.assist.aero==='auto'?'你的設定是自動展開，<b>踩油門加速</b>就會看到 X-MODE 亮起。':`踩油門後按 ${tutTouch()?'<b>X</b> 鈕':tK('aero')} 展開。`),
  run:(p,dt,st)=>{if(zoneAt(p.s)<0){tutPlace(tutZoneS());toast('再試一次');st.h=0}if(p.aero>0.6&&p.v>8)st.h=(st.h||0)+dt;return [st.h>1.5,p.aero>0.6?'X-MODE 已展開，繼續加速':'X-MODE 尚未展開']}},
 {t:'電能模式 ERS',hi:()=>tutTouch()?['mERS','mDep','tMode']:['mERS','mDep'],enter:(p,st)=>{const S=settings.setup;st.m0=S.mode;st.t0=S.trim.slice()},exit:(p,st)=>{if(st.t0){const S=settings.setup;S.mode=st.m0;S.trim=st.t0;saveSettings()}},
  b:()=>`電能四種模式：<b>無</b> 0、<b>中</b> 140、<b>快</b> 220、<b>超</b> 280 kW；輸出越低回收越多。${tutTouch()?'點「超／快／中／無」':`按 ${tK('ersUp')}／${tK('ersDown')}`}換一個模式試試。`,
  run:(p,dt,st)=>{const S=settings.setup;return [S.mode!==st.m0||S.trim.join()!==st.t0.join(),`目前：${ERS_MODES[S.mode].full} · ${deployKW()} kW`]}},
 {t:'Overtake 超車模式',hi:()=>tutTouch()?['mOT','tOT']:['mOT'],exit:p=>{p.otAvail=false;p.otActive=false;otOn=false},
  b:()=>`OT 平常 315 kW；在<b>偵測點</b>與前車差 <b>1 秒內</b>，下一圈解鎖 <b>350 kW</b>。開著只放電不回充。按 ${tutTouch()?'<b>OT</b> 鈕':tK('overtake')} 試試看。`,
  run:(p,dt,st)=>{if(!p.otActive)p.otAvail=true;else st.h=(st.h||0)+dt;return [st.h>2,p.otActive?'Overtake 啟動中，看儀表的電量環':'OVERTAKE 燈已亮，等你啟動']}},
 {t:'切換視角',hi:()=>tutTouch()?['tCam']:[],enter:(p,st)=>{st.c0=camMode},
  b:()=>`按 ${tutTouch()?'<b>視角</b>鈕':tK('camera')} 切換<b>追尾</b>、<b>駕駛艙</b>、<b>車頂</b>視角。`,
  run:(p,dt,st)=>[camMode!==st.c0,'目前：'+CAM_NAME[camMode]]},
 {t:'起跑與賽道界線',info:1,b:()=>`紅燈<b>全部熄滅</b>才能出發，偷跑罰 5 秒。出界會變滑、撞牆會掉速；卡住時${tutTouch()?'到暫停選單重新開始':`按 ${tK('reset')} 回到賽道`}。`},
 {t:'維修區與輪胎',info:1,b:()=>'輪胎會磨損、抓地變差。駛入維修道會自動限速 <b>80 km/h</b>，開著自動進站時車隊會幫你換胎。'},
 {t:'教學完成',final:1,b:()=>'完成！可以留下自由練習，或回主選單選車隊和賽道。'}
];
function tutHi(ids){document.querySelectorAll('.tutHi').forEach(e=>e.classList.remove('tutHi'));ids.forEach(id=>{const e=$(id);if(e)e.classList.add('tutHi')})}
function tutExit(){const s=tut&&TUT[tut.i];if(s&&s.exit&&player)s.exit(player,tut.st)}
function tutGo(i){tutExit();tut.i=i;tut.st={};tut.okT=0;const s=TUT[i];
  tut.info=typeof s.info==='function'?s.info():!!s.info;tut.frz=tut.info||!!s.final;
  if(s.enter)s.enter(player,tut.st);
  $('tutN').textContent=`步驟 ${i+1} / ${TUT.length}`;$('tutBar').style.width=(i+1)/TUT.length*100+'%';$('tutT').textContent=s.t;$('tutB').innerHTML=s.b();
  $('tutP').textContent='';$('tutP').className='';show('tutP',!tut.frz);
  $('tutNext').textContent=s.final?'自由練習':tut.info?'下一步':'略過這一步';$('tutNext').className=tut.frz?'pri':'';
  $('tutSkip').textContent=s.final?'回主選單':'跳過教學';
  tutHi(s.hi?s.hi():[]);show('tut',true)}
function tutTick(dt){const s=TUT[tut.i];if(!s||tut.frz||!s.run)return;
  if(tut.okT>0){tut.okT-=dt;if(tut.okT<=0)tutGo(tut.i+1);return}
  const r=s.run(player,dt,tut.st),el=$('tutP');
  if(r[0]){el.textContent='✓ 完成';el.className='ok';tut.okT=1.1}else if(el.textContent!==r[1])el.textContent=r[1]}
function tutNext(){if(!tut)return;if(TUT[tut.i].final)tutFree();else tutGo(tut.i+1)}
// leave the guided part but stay on track; options are restored when the session is cleared
function tutFree(){tutExit();tut=null;show('tut',false);tutHi([]);if(player)player.laps=-1;show('tower',true);radio('自由練習。按暫停可以回到主選單','free',1)}
function tutEnd(){tutExit();tut=null;show('tut',false);tutHi([]);if(tutSave){Object.assign(opts,tutSave);tutSave=null}}
function startTutorial(){tutAskClose();tutExit();
  if(!tutSave)tutSave={track:opts.track,mode:opts.mode,ttStart:opts.ttStart};
  opts.track=0;opts.mode='tt';opts.ttStart='pit';
  tut={i:-1,st:{},frz:true,okT:0};
  startRace();show('tower',false);$('radio').classList.remove('on');
  tutPlace(-30);player.laps=-1;tutGo(0)}
$('tutNext').onclick=e=>{e.currentTarget.blur();tutNext()};
$('tutSkip').onclick=e=>{e.currentTarget.blur();toTeams()};
$('openTut').onclick=startTutorial;$('tutYes').onclick=startTutorial;
function tutAskClose(){if($('tutNever').checked)ls.set('grid26.tutNoAsk','1');show('tutAsk',false)}
$('tutNo').onclick=tutAskClose;
