import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL = 'https://zojajuzmfjpvubzibzgg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1te_hrDXQciMD7Gp1EXmRw_dvQmszvi';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 20 } },
});

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const launcher = $('#mpLauncher');
const layer = $('#mpLayer');
const stage = $('#mpCanvas');
const roster = $('#mpRoster');
const statusNode = $('#mpStatus');
const roomNameNode = $('#mpRoomName');
const toastNode = $('#mpToast');
const chatLog = $('#chatLog');
const chatForm = $('#chatForm');
const chatInput = $('#chatInput');
const roomList = $('#roomList');
const drawerBack = $('#drawerBack');
const saveState = $('#saveState');

const baseRooms = {
  skyline: { id:'skyline', name:'Skyline Lounge', vibe:'loft', max_players:20, source:'starter' },
  afterglow: { id:'afterglow', name:'Afterglow Club', vibe:'club', max_players:20, source:'starter' },
  sunset: { id:'sunset', name:'Sunset Social', vibe:'beach', max_players:20, source:'starter' },
};
let rooms = { ...baseRooms };
let activeRoom = 'skyline';
let channel = null;
let localId = null;
let displayName = null;
let signedIn = false;
let activeAction = 'idle';
let isOpen = false;
let lastSend = 0;
let lastPosition = new THREE.Vector3(999,0,999);
let me = null;
let localAvatar = readAvatar();
const remotePlayers = new Map();
const pressed = new Set();
const recentMessages = [];

function readAvatar() {
  const keys = ['kinfolksworld-demo-v4','kinfolksworld-demo-v3','kinfolksworld-demo-v2','kinfolksworld-demo-v1'];
  for (const key of keys) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      if (parsed?.avatar) return { ...parsed.avatar };
    } catch {}
  }
  return { skin:'#b97859', hairColor:'#141216', eyeColor:'#5d4736', hair:'long', outfit:'street', frame:'classic', face:'soft', makeup:'natural', tattoo:'none' };
}

function saveAvatarLocal(config) {
  const key = 'kinfolksworld-demo-v4';
  let data = {};
  try { data = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch {}
  data.avatar = { ...config };
  localStorage.setItem(key, JSON.stringify(data));
}

function randomName() {
  const a = ['Nova','Mia','Jae','Ari','Lani','Kai','Sky','Rae','Zion','Lux'];
  return `${a[Math.floor(Math.random()*a.length)]}${Math.floor(100+Math.random()*900)}`;
}

async function resolveIdentity() {
  const { data: { session } } = await supabase.auth.getSession();
  signedIn = Boolean(session?.user);
  if (session?.user) {
    localId = session.user.id;
    const [{ data: profile }, { data: cloudAvatar }] = await Promise.all([
      supabase.from('profiles').select('display_name,username').eq('id', localId).maybeSingle(),
      supabase.from('kinfolksworld_avatars').select('config').eq('user_id', localId).maybeSingle(),
    ]);
    displayName = profile?.display_name || profile?.username || 'Kinfolk';
    if (cloudAvatar?.config && typeof cloudAvatar.config === 'object') {
      localAvatar = { ...localAvatar, ...cloudAvatar.config };
      saveAvatarLocal(localAvatar);
    }
    saveState.textContent = 'Connected to your Kinfolk account. Avatar saves to the cloud.';
    return;
  }
  localId = localStorage.getItem('kinfolksworld_guest_id') || crypto.randomUUID();
  localStorage.setItem('kinfolksworld_guest_id', localId);
  displayName = localStorage.getItem('kinfolksworld_guest_name') || randomName();
  localStorage.setItem('kinfolksworld_guest_name', displayName);
  saveState.textContent = 'Guest mode. Avatar saves on this device until Kinfolksworld is opened from your signed-in Kinfolk account.';
}

async function loadRooms() {
  const { data, error } = await supabase.from('kinfolksworld_rooms').select('id,name,slug,vibe,is_public,max_players').eq('is_public', true).limit(40);
  if (!error && Array.isArray(data)) {
    for (const r of data) rooms[r.slug] = { id:r.slug, db_id:r.id, name:r.name, vibe:r.vibe || 'loft', max_players:r.max_players || 20, source:'community' };
  }
  renderRoomList();
}

function toast(message) {
  toastNode.textContent = message;
  toastNode.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastNode.classList.remove('show'), 1700);
}
function escapeHtml(v='') { return String(v).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }
function sanitizeText(v='') { return String(v).replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,180); }

// ---------- THREE.JS -------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0e18');
scene.fog = new THREE.Fog('#0b0e18', 12, 34);
const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
camera.position.set(0,4.2,8.8);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 4; controls.maxDistance = 14; controls.maxPolarAngle = Math.PI*.49; controls.target.set(0,1.8,0);
scene.add(new THREE.HemisphereLight(0xdde8ff,0x20161f,1.8));
const sun = new THREE.DirectionalLight(0xfff4eb,3.5); sun.position.set(5,9,6); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);
const rim = new THREE.PointLight(0x8764ff,16,18); rim.position.set(-5,5,-4); scene.add(rim);
const cyan = new THREE.PointLight(0x4fd6ff,11,15); cyan.position.set(5,3,1); scene.add(cyan);
const roomRoot = new THREE.Group();
const playerRoot = new THREE.Group();
scene.add(roomRoot,playerRoot);

function material(color,rough=.62,metal=.01){ return new THREE.MeshPhysicalMaterial({color,roughness:rough,metalness:metal,clearcoat:.03,clearcoatRoughness:.6}); }
function mesh(geo,mat,parent,x=0,y=0,z=0){ const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o; }
function box(size,pos,color,parent=roomRoot){ return mesh(new THREE.BoxGeometry(...size),material(color,.78),parent,...pos); }
function clearGroup(group){ while(group.children.length){ const c=group.children.pop();c.traverse?.(n=>{n.geometry?.dispose?.();if(n.material?.map)n.material.map.dispose?.();}); } }

function buildRoom(vibe='loft') {
  clearGroup(roomRoot);
  const palette = vibe==='club' ? {floor:'#101524',wall:'#171329',accent:'#d03fbd',seat:'#34355c'} : vibe==='beach' ? {floor:'#b59b70',wall:'#274a5e',accent:'#ffb168',seat:'#e2c39b'} : {floor:'#252a34',wall:'#313749',accent:'#9b72ff',seat:'#66596e'};
  box([18,.25,18],[0,-.16,0],palette.floor); box([18,6,.25],[0,2.85,-9],palette.wall); box([.25,6,18],[-9,2.85,0],palette.wall); box([.25,6,18],[9,2.85,0],palette.wall);
  box([4.4,.7,1.4],[3.3,.35,-4.8],palette.seat); box([4.4,1.1,.28],[3.3,.95,-5.35],palette.seat); box([2.3,.14,1.25],[-2,.5,-3.3],'#373a45');
  for(let i=0;i<5;i++){ const lamp=new THREE.PointLight(i%2?0x4fd6ff:new THREE.Color(palette.accent),8,8);lamp.position.set(-6+i*3,4.5,-6.4);roomRoot.add(lamp); }
  if(vibe==='beach'){scene.fog.color.set('#173349');scene.background.set('#173349');} else if(vibe==='club'){scene.fog.color.set('#090917');scene.background.set('#090917');} else {scene.fog.color.set('#0b0e18');scene.background.set('#0b0e18');}
}

function makeTextSprite(text,{fontSize=42,bg='rgba(8,10,16,.78)',fg='#ffffff',pad=18}={}) {
  const canvas=document.createElement('canvas'); const ctx=canvas.getContext('2d'); ctx.font=`800 ${fontSize}px Inter,Arial`; const width=Math.ceil(ctx.measureText(text).width+pad*2); const height=fontSize+pad*1.6; canvas.width=Math.max(64,width);canvas.height=Math.max(42,height);
  ctx.font=`800 ${fontSize}px Inter,Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=bg;roundRect(ctx,2,2,canvas.width-4,canvas.height-4,18);ctx.fill();ctx.fillStyle=fg;ctx.fillText(text,canvas.width/2,canvas.height/2+1);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});const sp=new THREE.Sprite(mat);const aspect=canvas.width/canvas.height;sp.scale.set(1.4*aspect,.36,1);sp.renderOrder=20;return sp;
}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

function createAvatar(config={},name='Kinfolk',isLocal=false) {
  const root=new THREE.Group(); const skin=material(config.skin||'#b97859',.55); const hair=material(config.hairColor||'#141216',.42); const outfit=config.outfit==='luxe'?'#5b2f72':config.outfit==='casual'?'#6d8878':'#252a3c'; const cloth=material(outfit,.62); const pants=material('#141720',.78); const eye=material(config.eyeColor||'#5d4736',.35); const white=material('#f3eee8',.3); const lip=material(config.makeup==='glam'?'#84254d':'#915469',.48);
  const frameScale=config.frame==='athletic'?1.08:config.frame==='slim'?.92:1;
  const torso=mesh(new THREE.CapsuleGeometry(.42,.78,8,18),cloth,root,0,2.35,0);torso.scale.set(frameScale,1,.72); const pelvis=mesh(new THREE.SphereGeometry(.43,22,16),pants,root,0,1.55,0);pelvis.scale.set(frameScale,.58,.72); mesh(new THREE.CylinderGeometry(.14,.17,.3,18),skin,root,0,3.05,0); const head=mesh(new THREE.SphereGeometry(.48,32,24),skin,root,0,3.55,0);head.scale.set(.93,1.05,.88);
  const arms=[],legs=[];
  for(const side of [-1,1]){ const arm=mesh(new THREE.CapsuleGeometry(.115,.85,6,14),skin,root,side*.62,2.28,0);arm.rotation.z=side*.05;arms.push(arm);const hand=mesh(new THREE.SphereGeometry(.13,16,12),skin,root,side*.63,1.73,.01);hand.scale.set(.75,1.15,.55);const leg=mesh(new THREE.CapsuleGeometry(.15,1,6,14),pants,root,side*.22,.78,0);legs.push(leg);mesh(new THREE.BoxGeometry(.34,.19,.58),material('#0b0c11',.5,.08),root,side*.22,.08,.13); }
  for(const side of [-1,1]){const ew=mesh(new THREE.SphereGeometry(.075,18,12),white,root,side*.16,3.62,.42);ew.scale.set(1.25,.68,.36);const iris=mesh(new THREE.SphereGeometry(.037,14,10),eye,root,side*.16,3.62,.475);iris.scale.set(1,.9,.25);mesh(new THREE.SphereGeometry(.016,10,8),material('#08080b',.25),root,side*.16,3.62,.495);} const nose=mesh(new THREE.ConeGeometry(.055,.18,14),skin,root,0,3.48,.49);nose.rotation.x=Math.PI*.5;const lips=mesh(new THREE.SphereGeometry(.065,16,10),lip,root,0,3.31,.46);lips.scale.set(1.45,.42,.35);
  const cap=mesh(new THREE.SphereGeometry(.51,28,18,0,Math.PI*2,0,Math.PI*.58),hair,root,0,3.74,-.03);cap.scale.set(.96,.92,.92);if(config.hair!=='short'){const back=mesh(new THREE.CapsuleGeometry(.39,1,6,16),hair,root,0,3.05,-.37);back.scale.set(1,.95,.52);}if(config.hair==='buns'){mesh(new THREE.SphereGeometry(.24,18,14),hair,root,-.38,3.98,-.05);mesh(new THREE.SphereGeometry(.24,18,14),hair,root,.38,3.98,-.05);}
  const tag=makeTextSprite(name,{fontSize:38});tag.position.set(0,4.45,0);root.add(tag);
  root.userData={id:null,name,targetPosition:new THREE.Vector3(),targetRotation:0,action:'idle',isLocal,parts:{torso,head,arms,legs,lips},nameTag:tag,bubble:null,bubbleUntil:0};return root;
}

function updateNameTag(p,name){p.userData.name=name;const old=p.userData.nameTag;if(old){p.remove(old);old.material?.map?.dispose?.();old.material?.dispose?.();}const tag=makeTextSprite(name,{fontSize:38});tag.position.set(0,4.45,0);p.add(tag);p.userData.nameTag=tag;}
function showBubble(p,text){if(p.userData.bubble){p.remove(p.userData.bubble);p.userData.bubble.material?.map?.dispose?.();p.userData.bubble.material?.dispose?.();}const bubble=makeTextSprite(text.length>42?text.slice(0,39)+'…':text,{fontSize:30,bg:'rgba(246,245,251,.94)',fg:'#151722',pad:16});bubble.position.set(0,4.9,0);p.add(bubble);p.userData.bubble=bubble;p.userData.bubbleUntil=Date.now()+4200;}

function rebuildRemote(id,payload){if(id===localId)return null;let p=remotePlayers.get(id);if(!p){p=createAvatar(payload.avatar||{},payload.name||'Kinfolk',false);p.userData.id=id;p.position.set(payload.x||0,0,payload.z||0);p.userData.targetPosition.copy(p.position);p.rotation.y=payload.r||0;p.userData.targetRotation=payload.r||0;playerRoot.add(p);remotePlayers.set(id,p);}if(payload.name&&payload.name!==p.userData.name)updateNameTag(p,payload.name);return p;}
function removeRemote(id){const p=remotePlayers.get(id);if(!p)return;playerRoot.remove(p);remotePlayers.delete(id);}
function clearRemotes(){[...remotePlayers.keys()].forEach(removeRemote);}

function renderRoster(){const people=[{id:localId,name:displayName,action:activeAction,local:true},...[...remotePlayers.values()].map(p=>({id:p.userData.id,name:p.userData.name,action:p.userData.action}))];roster.innerHTML=people.map(p=>`<div class="person"><div class="personDot">${escapeHtml((p.name||'?').slice(0,1).toUpperCase())}</div><div class="personText"><div class="personName">${escapeHtml(p.name)}${p.local?' (you)':''}</div><div class="personState">${escapeHtml(p.action||'idle')}</div></div></div>`).join('');statusNode.textContent=`${people.length} ${people.length===1?'player':'players'} online`;}

function addChat(name,text,{system=false,time=Date.now()}={}){const clean=sanitizeText(text);if(!clean)return;recentMessages.push({name,text:clean,system,time});if(recentMessages.length>60)recentMessages.shift();const node=document.createElement('div');if(system){node.className='systemMsg';node.textContent=clean;}else{node.className='msg';node.innerHTML=`<b>${escapeHtml(name)}</b><small>${new Date(time).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</small><br>${escapeHtml(clean)}`;}chatLog.appendChild(node);while(chatLog.children.length>60)chatLog.firstChild.remove();chatLog.scrollTop=chatLog.scrollHeight;}

function presencePayload(){return{id:localId,name:displayName,avatar:localAvatar,joined_at:new Date().toISOString()};}
function movementPayload(){return{id:localId,name:displayName,x:+me.position.x.toFixed(3),z:+me.position.z.toFixed(3),r:+me.rotation.y.toFixed(3),action:activeAction,avatar:localAvatar,t:Date.now()};}

async function disconnectRoom(){if(!channel)return;try{await channel.untrack();}catch{}try{await supabase.removeChannel(channel);}catch{}channel=null;clearRemotes();}

async function connectRoom(roomId){const target=rooms[roomId]||rooms.skyline;await disconnectRoom();activeRoom=target.id;roomNameNode.textContent=target.name;buildRoom(target.vibe);if(me){me.position.set(0,0,1.5);me.rotation.y=0;me.userData.targetPosition.copy(me.position);}
  chatLog.innerHTML='';addChat('',`Welcome to ${target.name}`,{system:true});renderRoomList();
  channel=supabase.channel(`kinfolksworld:${activeRoom}`,{config:{presence:{key:localId},broadcast:{self:false,ack:false}}});
  channel
    .on('presence',{event:'sync'},()=>{const state=channel.presenceState();const current=new Set();Object.values(state).flat().forEach(p=>{if(!p?.id||p.id===localId)return;current.add(p.id);const remote=rebuildRemote(p.id,p);if(remote)remote.userData.name=p.name||remote.userData.name;});[...remotePlayers.keys()].forEach(id=>{if(!current.has(id))removeRemote(id);});renderRoster();})
    .on('presence',{event:'join'},({newPresences})=>{for(const p of newPresences||[]){if(!p?.id||p.id===localId)continue;rebuildRemote(p.id,p);addChat('',`${p.name||'A player'} joined the room`,{system:true});}renderRoster();})
    .on('presence',{event:'leave'},({leftPresences})=>{for(const p of leftPresences||[]){if(p?.id){removeRemote(p.id);addChat('',`${p.name||'A player'} left the room`,{system:true});}}renderRoster();})
    .on('broadcast',{event:'movement'},({payload})=>{if(!payload?.id||payload.id===localId)return;const p=rebuildRemote(payload.id,payload);if(!p)return;p.userData.targetPosition.set(payload.x||0,0,payload.z||0);p.userData.targetRotation=payload.r||0;p.userData.action=payload.action||'idle';renderRoster();})
    .on('broadcast',{event:'chat'},({payload})=>{if(!payload?.id||payload.id===localId)return;const text=sanitizeText(payload.text);if(!text)return;addChat(payload.name||'Kinfolk',text,{time:payload.t||Date.now()});const p=remotePlayers.get(payload.id);if(p)showBubble(p,text);})
    .subscribe(async state=>{if(state==='SUBSCRIBED'){await channel.track(presencePayload());statusNode.textContent='Connected';sendMovement(true);renderRoster();toast(`Entered ${target.name}`);}else if(state==='CHANNEL_ERROR'){statusNode.textContent='Connection error';toast('Room connection failed');}});
  try{history.replaceState(null,'',`#room=${encodeURIComponent(activeRoom)}`);}catch{}
}

async function saveAvatar(){saveAvatarLocal(localAvatar);if(!signedIn){toast('Avatar saved on this device');return;}const {error}=await supabase.from('kinfolksworld_avatars').upsert({user_id:localId,config:localAvatar,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error){toast('Could not save avatar');console.error(error);return;}toast('Avatar saved to your Kinfolk account');}

function renderRoomList(){roomList.innerHTML=Object.values(rooms).map(r=>`<button class="roomCard ${r.id===activeRoom?'active':''}" data-room="${escapeHtml(r.id)}"><b>${escapeHtml(r.name)}</b><small>${r.source==='community'?'Community room':'Official Kinfolksworld room'} · ${escapeHtml(r.vibe)} · up to ${Number(r.max_players||20)} players</small></button>`).join('');}

function sendMovement(force=false){if(!channel||!me)return;const now=performance.now();const moved=me.position.distanceToSquared(lastPosition)>.0002;if(!force&&!moved&&now-lastSend<1000)return;if(!force&&now-lastSend<75)return;lastSend=now;lastPosition.copy(me.position);channel.send({type:'broadcast',event:'movement',payload:movementPayload()});}

function setAction(action){activeAction=action;$$('[data-action]').forEach(b=>b.classList.toggle('active',b.dataset.action===action));sendMovement(true);renderRoster();if(action!=='idle'&&action!=='sit')setTimeout(()=>{if(activeAction===action)setAction('idle');},action==='dance'?6500:3000);}

function applyAnimation(p,t){const parts=p.userData.parts;if(!parts)return;const action=p.userData.isLocal?activeAction:p.userData.action;const speed=6;parts.torso.rotation.z=0;parts.head.rotation.z=0;parts.arms.forEach(a=>{a.rotation.x=0;a.rotation.z*=.8;});parts.legs.forEach(l=>l.rotation.x=0);p.position.y=THREE.MathUtils.lerp(p.position.y,action==='sit'?-.55:0,.12);
  if(action==='wave'){parts.arms[1].rotation.z=-1.15;parts.arms[1].rotation.x=Math.sin(t*10)*.25;}
  else if(action==='dance'){parts.torso.rotation.z=Math.sin(t*5)*.12;parts.arms[0].rotation.z=.7+Math.sin(t*7)*.3;parts.arms[1].rotation.z=-.7-Math.sin(t*7)*.3;parts.legs[0].rotation.x=Math.sin(t*6)*.25;parts.legs[1].rotation.x=-Math.sin(t*6)*.25;}
  else if(action==='sit'){parts.legs.forEach(l=>l.rotation.x=-1.05);parts.arms[0].rotation.x=-.35;parts.arms[1].rotation.x=-.35;}
  else {const moving=p.userData.isLocal?pressed.size>0:p.position.distanceToSquared(p.userData.targetPosition)>.002;if(moving){parts.legs[0].rotation.x=Math.sin(t*speed)*.38;parts.legs[1].rotation.x=-Math.sin(t*speed)*.38;parts.arms[0].rotation.x=-Math.sin(t*speed)*.22;parts.arms[1].rotation.x=Math.sin(t*speed)*.22;}}
  if(p.userData.bubble&&Date.now()>p.userData.bubbleUntil){p.remove(p.userData.bubble);p.userData.bubble.material?.map?.dispose?.();p.userData.bubble.material?.dispose?.();p.userData.bubble=null;}
}

function updateLocal(dt){if(!me||activeAction==='sit')return;let dx=0,dz=0;if(pressed.has('forward'))dz-=1;if(pressed.has('back'))dz+=1;if(pressed.has('left'))dx-=1;if(pressed.has('right'))dx+=1;if(!dx&&!dz)return;const len=Math.hypot(dx,dz)||1;dx/=len;dz/=len;const speed=2.6;me.position.x=THREE.MathUtils.clamp(me.position.x+dx*speed*dt,-8.2,8.2);me.position.z=THREE.MathUtils.clamp(me.position.z+dz*speed*dt,-8.2,8.2);me.rotation.y=Math.atan2(dx,dz);me.userData.targetPosition.copy(me.position);sendMovement(false);}

function updateRemotes(){for(const p of remotePlayers.values()){p.position.x=THREE.MathUtils.lerp(p.position.x,p.userData.targetPosition.x,.16);p.position.z=THREE.MathUtils.lerp(p.position.z,p.userData.targetPosition.z,.16);let d=p.userData.targetRotation-p.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));p.rotation.y+=d*.16;}}

function resize(){const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);window.addEventListener('resize',resize);
const clock=new THREE.Clock();
function animate(){const dt=Math.min(clock.getDelta(),.05);const t=clock.elapsedTime;updateLocal(dt);updateRemotes();if(me)applyAnimation(me,t);for(const p of remotePlayers.values())applyAnimation(p,t);if(me&&isOpen){const target=new THREE.Vector3(me.position.x,1.7,me.position.z);controls.target.lerp(target,.05);}controls.update();renderer.render(scene,camera);requestAnimationFrame(animate);}animate();

async function openWorld(){if(isOpen)return;isOpen=true;layer.classList.add('open');resize();if(!localId)await resolveIdentity();if(!me){me=createAvatar(localAvatar,displayName,true);me.position.set(0,0,1.5);me.userData.targetPosition.copy(me.position);playerRoot.add(me);}await loadRooms();const hash=new URLSearchParams(location.hash.replace(/^#/,'')).get('room');await connectRoom(hash&&rooms[hash]?hash:'skyline');}
async function closeWorld(){isOpen=false;layer.classList.remove('open');pressed.clear();await disconnectRoom();}

launcher.addEventListener('click',openWorld);$('#mpExit').addEventListener('click',closeWorld);$('#roomButton').addEventListener('click',()=>drawerBack.classList.add('open'));$('#drawerClose').addEventListener('click',()=>drawerBack.classList.remove('open'));drawerBack.addEventListener('click',e=>{if(e.target===drawerBack)drawerBack.classList.remove('open');});
roomList.addEventListener('click',async e=>{const b=e.target.closest('[data-room]');if(!b)return;drawerBack.classList.remove('open');await connectRoom(b.dataset.room);});
$('#saveAvatar').addEventListener('click',saveAvatar);$('#drawerSaveAvatar').addEventListener('click',saveAvatar);
$('#shareRoom').addEventListener('click',async()=>{const direct=`${location.href.split('#')[0]}#room=${encodeURIComponent(activeRoom)}`;try{if(navigator.share){await navigator.share({title:`Join me in ${rooms[activeRoom]?.name||'Kinfolksworld'}`,text:'Join my Kinfolksworld room',url:direct});}else{await navigator.clipboard.writeText(direct);toast('Room invite link copied');}}catch{}});
$('#chatToggle').addEventListener('click',()=>{const p=$('#chatPanel');p.classList.toggle('collapsed');$('#chatToggle').textContent=p.classList.contains('collapsed')?'+':'−';});
chatForm.addEventListener('submit',e=>{e.preventDefault();const text=sanitizeText(chatInput.value);if(!text||!channel)return;chatInput.value='';addChat(displayName,text);showBubble(me,text);channel.send({type:'broadcast',event:'chat',payload:{id:localId,name:displayName,text,t:Date.now()}});});
$('#mpActions').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)setAction(b.dataset.action);});

for(const b of $$('[data-move]')){const key=b.dataset.move;const down=e=>{e.preventDefault();pressed.add(key);if(activeAction==='sit')setAction('idle');};const up=e=>{e.preventDefault();pressed.delete(key);sendMovement(true);};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',e=>{if(e.buttons===0)up(e);});}
window.addEventListener('keydown',e=>{if(document.activeElement===chatInput)return;const map={w:'forward',ArrowUp:'forward',s:'back',ArrowDown:'back',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'};const k=map[e.key]||map[e.key.toLowerCase?.()];if(k){pressed.add(k);e.preventDefault();}});window.addEventListener('keyup',e=>{const map={w:'forward',ArrowUp:'forward',s:'back',ArrowDown:'back',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'};const k=map[e.key]||map[e.key.toLowerCase?.()];if(k){pressed.delete(k);sendMovement(true);}});
window.addEventListener('beforeunload',()=>{try{channel?.untrack?.();}catch{}});

renderRoomList();
