'use strict';
/* Grid 2026 — 主迴圈與啟動 */
/* ================= LOOP ================= */
let last=performance.now(),menuAng=0;
let fpsT=0;
function frame(now){requestAnimationFrame(frame);{const cap=+settings.assist.fps||0;if(cap){if(now-fpsT<1000/cap-2)return;fpsT=now}}{const d=now-fpsL;fpsL=now;if(d>0&&d<2000)fpsAvg+=(1000/d-fpsAvg)*0.08;if(now-fpsShown>500){fpsShown=now;if(!$('settings').hidden)$('setStat').textContent=Math.round(fpsAvg)+' FPS | '+gfx().name}}sunFollow();updateLine();if(state==='menu')tickAudio();{const th=state!=='race'&&!touchEdit,te=$('tyreHud');if(te.hidden!==th)te.hidden=th}{const h=(state==='race'&&!paused)||!$('menu').hidden,e=$('verTag');if(e.hidden!==h)e.hidden=h}let dt=Math.min(0.05,(now-last)/1000);last=now;menuAng+=dt;
  if(state==='menu'){if(menuCar){const b=menuCar.base;const r=7.5,a=menuAng*0.35;camera.position.set(b.x+Math.cos(a)*r,b.y+2.0+Math.sin(a*0.7)*0.4,b.z+Math.sin(a)*r);camera.lookAt(b.x,b.y+0.5,b.z);camera.fov=40;camera.updateProjectionMatrix();setAero(menuCar,(Math.sin(a*1.3)+1)/2)}renderer.render(scene,camera);return}
  if(state==='tracks'){const a=menuAng*0.06,r=RAD*1.05+250;camera.position.set(CX+Math.cos(a)*r,HAVG+RAD*0.75+250,CZ+Math.sin(a)*r);camera.lookAt(CX,HAVG,CZ);camera.fov=45;camera.updateProjectionMatrix();renderer.render(scene,camera);return}
  if(state==='race'&&!paused){
    const steps=2,h=dt/steps;
    for(let s=0;s<(tut&&tut.frz?0:steps);s++){
      if(raceT<0){lightsT+=h;const n=Math.min(5,Math.floor(lightsT));if(n!==lightsOn){lightsOn=n;[...$('startl').children].forEach((e,k)=>e.classList.toggle('on',k<n));gantryLamps.forEach((m,k)=>m.color.setHex(k<n?0xff2a2a:0x2a0608))}
        if(player.v>2&&!player.penalty){player.penalty=5;radio('偷跑！5 秒罰時','jump',99)}
        if(lightsT>5+goT){raceT=0;lightsOn=0;[...$('startl').children].forEach(e=>e.classList.remove('on'));gantryLamps.forEach(m=>m.color.setHex(0x2a0608));show('startl',false);radio('燈號熄滅，衝！','go',99)}}
      else raceT+=h;
      updatePlayer(player,h);if(raceT>=0||opts.mode!=='race'){for(const c of cars)if(!c.me)updateAI(c,h);collide()}
      if(raceT>0)cars.forEach(record);
    }
    if(endTimer>0){endTimer-=dt;if(endTimer<=0)showResults()}
    syncModels(dt);updateCamera(dt);updateHUD(dt);tickRadio(dt);tickWheel(dt);tickAudio();tickSmoke(dt);tickFlame(dt);tickLaunchUI();if(tut)tutTick(dt);
  }else if(state==='results'&&player){updatePlayer(player,dt);cars.forEach(c=>{if(!c.me)updateAI(c,dt)});raceT+=dt;syncModels(dt);updateCamera(dt);tickAudio()}
  else tickAudio();
  renderer.render(scene,camera)}

/* ================= BOOT ================= */
renderTyrePick();renderStats();renderSetupSummary();ensureTrack();buildMenuCar();drawDz();applyGfx();applySteerMode();
if(ls.get('grid26.tutNoAsk')!=='1')show('tutAsk',true);
document.querySelectorAll('.ver').forEach(e=>e.textContent='(v '+VERSION+')');
requestAnimationFrame(frame);
