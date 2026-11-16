'use strict';
/* Grid 2026 — 攝影機 */
/* ================= CAMERA ================= */
const camPos=new THREE.Vector3(),camLook=new THREE.Vector3();
const CAM_NAME=['追尾視角','第一人稱 · 駕駛艙','車頂視角'],_cv=new THREE.Vector3();
function cycleCam(){camMode=(camMode+1)%3;ls.set('grid26.cam',camMode);toast(CAM_NAME[camMode])}
function updateCamera(dt){const p=player;const fx=Math.sin(p.h),fz=Math.cos(p.h);
  const sp=Math.sin(p.pitch||0);
  if(camMode===0){const back=7,up=p.y+2.25+sp*back;camPos.set(p.x-fx*back,up,p.z-fz*back);camera.position.copy(camPos);camLook.set(p.x+fx*6,p.y+0.85-sp*6,p.z+fz*6);camera.lookAt(camLook);camera.fov=62;camera.near=0.3}
  else{const g=p.model.group,fp=camMode===1;g.updateMatrixWorld(true);camera.position.copy(_cv.set(0,fp?0.875:1.17,fp?0.3:-0.32)).applyMatrix4(g.matrixWorld);camLook.set(fp?p.steer*2.4:0,fp?0.8:0.95,30).applyMatrix4(g.matrixWorld);camera.lookAt(camLook);camera.fov=fp?76:70;camera.near=fp?0.06:0.2}
  camera.updateProjectionMatrix()}
function syncModels(dt){cars.forEach(c=>{const g=c.model.group;g.position.set(c.x,c.y,c.z);g.rotation.set(c.pitch||0,c.h,0,'YXZ');c.model.head.visible=!(c.me&&camMode===1&&state!=='menu');setAero(c.model,c.aero);
  c.wheelRot+=c.v*dt/0.36;c.model.wheels.forEach(w=>w.rotation.x=c.wheelRot);
  const sa=c.me?c.steer*0.34/(1+Math.abs(c.v)/24):clamp(c.yaw*PHY.wb/Math.max(c.v,5),-0.3,0.3);c.model.steer.forEach(s=>s.rotation.y=sa);c.model.sw.rotation.z=-sa*4.2})}
