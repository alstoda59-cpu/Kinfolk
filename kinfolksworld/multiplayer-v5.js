import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL = 'https://zojajuzmfjpvubzibzgg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1te_hrDXQciMD7Gp1EXmRw_dvQmszvi';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 20 } },
});

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const launcher = $('#mpLauncher');
const layer = $('#mpLayer');
const exitButton = $('#mpExit');
const stage = $('#mpCanvas');
const roster = $('#mpRoster');
const status = $('#mpStatus');
const roomName = $('#mpRoomName');
const toastNode = $('#mpToast');

const rooms = {
  skyline: { name: 'Skyline Lounge', vibe: 'loft' },
  afterglow: { name: 'Afterglow Club', vibe: 'club' },
  sunset: { name: 'Sunset Social', vibe: 'beach' },
};
let activeRoom = 'skyline';
let channel = null;
let localId = null;
let displayName = null;
let movementTimer = null;
let sendTimer = 0;
let activeAction = 'idle';
let isOpen = false;

const remotePlayers = new Map();
const pressed = new Set();
const localAvatar = readAvatar();

function readAvatar() {
  const keys = ['kinfolksworld-demo-v4','kinfolksworld-demo-v3','kinfolksworld-demo-v2','kinfolksworld-demo-v1'];
  for (const key of keys) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      if (parsed?.avatar) return parsed.avatar;
    } catch {}
  }
  return {
    skin: '#b97859', hairColor: '#141216', eyeColor: '#5d4736', hair: 'long',
    outfit: 'street', frame: 'classic', face: 'soft', makeup: 'natural', tattoo: 'none'
  };
}

function toast(message) {
  toastNode.textContent = message;
  toastNode.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastNode.classList.remove('show'), 1600);
}

function randomName() {
  const a = ['Nova','Mia','Jae','Ari','Lani','Kai','Sky','Rae','Zion','Lux'];
  const b = Math.floor(100 + Math.random() * 900);
  return `${a[Math.floor(Math.random()*a.length)]}${b}`;
}

async function resolveIdentity() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    localId = session.user.id;
    const { data } = await supabase.from('profiles').select('display_name,username').eq('id', localId).maybeSingle();
    displayName = data?.display_name || data?.username || 'Kinfolk';
    return;
  }
  localId = localStorage.getItem('kinfolksworld_guest_id') || crypto.randomUUID();
  localStorage.setItem('kinfolksworld_guest_id', localId);
  displayName = localStorage.getItem('kinfolksworld_guest_name') || randomName();
  localStorage.setItem('kinfolksworld_guest_name', displayName);
}

// ---------- THREE.JS ROOM --------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0e18');
scene.fog = new THREE.Fog('#0b0e18', 12, 32);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 4.2, 8.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 13;
controls.maxPolarAngle = Math.PI * .49;
controls.target.set(0, 1.8, 0);

scene.add(new THREE.HemisphereLight(0xdde8ff, 0x20161f, 1.8));
const sun = new THREE.DirectionalLight(0xfff4eb, 3.6);
sun.position.set(5, 9, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);
const rim = new THREE.PointLight(0x8764ff, 17, 18);
rim.position.set(-5, 5, -4);
scene.add(rim);
const cyan = new THREE.PointLight(0x4fd6ff, 12, 15);
cyan.position.set(5, 3, 1);
scene.add(cyan);

const roomRoot = new THREE.Group();
const playerRoot = new THREE.Group();
scene.add(roomRoot, playerRoot);

function material(color, rough=.62, metal=.01) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: metal, clearcoat: .03, clearcoatRoughness: .6 });
}
function mesh(geo, mat, parent, x=0,y=0,z=0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x,y,z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
function box(size, pos, color, parent=roomRoot) {
  return mesh(new THREE.BoxGeometry(...size), material(color,.78), parent, ...pos);
}
function clearGroup(group) {
  while (group.children.length) {
    const c = group.children.pop();
    c.traverse?.(n => { n.geometry?.dispose?.(); });
  }
}

function buildRoom(vibe='loft') {
  clearGroup(roomRoot);
  const palette = vibe === 'club'
    ? { floor:'#101524', wall:'#171329', accent:'#d03fbd', seat:'#34355c' }
    : vibe === 'beach'
    ? { floor:'#b59b70', wall:'#274a5e', accent:'#ffb168', seat:'#e2c39b' }
    : { floor:'#252a34', wall:'#313749', accent:'#9b72ff', seat:'#66596e' };
  box([18,.25,18],[0,-.16,0],palette.floor);
  box([18,6,.25],[0,2.85,-9],palette.wall);
  box([.25,6,18],[-9,2.85,0],palette.wall);
  box([.25,6,18],[9,2.85,0],palette.wall);
  box([4.4,.7,1.4],[3.3,.35,-4.8],palette.seat);
  box([4.4,1.1,.28],[3.3,.95,-5.35],palette.seat);
  box([2.3,.14,1.25],[-2,.5,-3.3],'#373a45');
  for (let i=0;i<5;i++) {
    const lamp = new THREE.PointLight(i%2 ? 0x4fd6ff : new THREE.Color(palette.accent), 8, 8);
    lamp.position.set(-6 + i*3, 4.5, -6.4);
    roomRoot.add(lamp);
  }
  if (vibe === 'beach') {
    scene.fog.color.set('#173349'); scene.background.set('#173349');
  } else if (vibe === 'club') {
    scene.fog.color.set('#090917'); scene.background.set('#090917');
  } else {
    scene.fog.color.set('#0b0e18'); scene.background.set('#0b0e18');
  }
}

function createAvatar(config = {}, isLocal=false) {
  const root = new THREE.Group();
  const skin = material(config.skin || '#b97859', .55);
  const hair = material(config.hairColor || '#141216', .42);
  const outfit = config.outfit === 'luxe' ? '#5b2f72' : config.outfit === 'casual' ? '#6d8878' : '#252a3c';
  const cloth = material(outfit,.62);
  const pants = material('#141720',.78);
  const eye = material(config.eyeColor || '#5d4736',.35);
  const white = material('#f3eee8',.3);
  const lip = material(config.makeup === 'glam' ? '#84254d' : '#915469',.48);

  const frameScale = config.frame === 'athletic' ? 1.08 : config.frame === 'slim' ? .92 : 1;
  const torso = mesh(new THREE.CapsuleGeometry(.42,.78,8,18), cloth, root,0,2.35,0); torso.scale.set(frameScale,1,.72);
  const pelvis = mesh(new THREE.SphereGeometry(.43,22,16), pants, root,0,1.55,0); pelvis.scale.set(frameScale,.58,.72);
  const neck = mesh(new THREE.CylinderGeometry(.14,.17,.3,18), skin, root,0,3.05,0);
  const head = mesh(new THREE.SphereGeometry(.48,32,24), skin, root,0,3.55,0); head.scale.set(.93,1.05,.88);

  for (const side of [-1,1]) {
    const arm = mesh(new THREE.CapsuleGeometry(.115,.85,6,14), skin, root,side*.62,2.28,0); arm.rotation.z = side*.05;
    const hand = mesh(new THREE.SphereGeometry(.13,16,12), skin, root,side*.63,1.73,.01); hand.scale.set(.75,1.15,.55);
    const leg = mesh(new THREE.CapsuleGeometry(.15,1.0,6,14), pants, root,side*.22,.78,0);
    const shoe = mesh(new THREE.BoxGeometry(.34,.19,.58), material('#0b0c11',.5,.08), root,side*.22,.08,.13);
    shoe.rotation.x = .03;
  }

  for (const side of [-1,1]) {
    const eyeWhite = mesh(new THREE.SphereGeometry(.075,18,12), white, root,side*.16,3.62,.42); eyeWhite.scale.set(1.25,.68,.36);
    const iris = mesh(new THREE.SphereGeometry(.037,14,10), eye, root,side*.16,3.62,.475); iris.scale.set(1,.9,.25);
    mesh(new THREE.SphereGeometry(.016,10,8), material('#08080b',.25), root,side*.16,3.62,.495);
  }
  const nose = mesh(new THREE.ConeGeometry(.055,.18,14), skin, root,0,3.48,.49); nose.rotation.x = Math.PI*.5;
  const lips = mesh(new THREE.SphereGeometry(.065,16,10), lip, root,0,3.31,.46); lips.scale.set(1.45,.42,.35);
  const hairCap = mesh(new THREE.SphereGeometry(.51,28,18,0,Math.PI*2,0,Math.PI*.58),hair,root,0,3.74,-.03); hairCap.scale.set(.96,.92,.92);
  if (config.hair !== 'short') {
    const back = mesh(new THREE.CapsuleGeometry(.39,1.0,6,16),hair,root,0,3.05,-.37); back.scale.set(1,.95,.52);
  }
  if (config.hair === 'buns') {
    mesh(new THREE.SphereGeometry(.24,18,14),hair,root,-.38,3.98,-.05);
    mesh(new THREE.SphereGeometry(.24,18,14),hair,root,.38,3.98,-.05);
  }

  root.userData = {
    id: null,
    name: '',
    targetPosition: new THREE.Vector3(),
    targetRotation: 0,
    action: 'idle',
    isLocal,
    parts: { torso },
  };
  return root;
}

const me = createAvatar(localAvatar, true);
me.position.set(0,0,1.5);
me.userData.targetPosition.copy(me.position);
playerRoot.add(me);

function rebuildRemote(id, payload) {
  if (id === localId) return;
  let p = remotePlayers.get(id);
  if (!p) {
    p = createAvatar(payload.avatar || {}, false);
    p.userData.id = id;
    p.userData.name = payload.name || 'Kinfolk';
    p.position.set(payload.x || 0,0,payload.z || 0);
    p.userData.targetPosition.copy(p.position);
    p.rotation.y = payload.r || 0;
    p.userData.targetRotation = payload.r || 0;
    playerRoot.add(p);
    remotePlayers.set(id,p);
  }
  return p;
}

function removeRemote(id) {
  const p = remotePlayers.get(id);
  if (!p) return;
  playerRoot.remove(p);
  remotePlayers.delete(id);
}

function renderRoster() {
  const people = [{ id: localId, name: displayName, action: activeAction, local:true }, ...[...remotePlayers.values()].map(p => ({ id:p.userData.id, name:p.userData.name, action:p.userData.action }))];
  roster.innerHTML = people.map(p => `<div class="person"><div class="personDot">${(p.name||'?').slice(0,1).toUpperCase()}</div><div class="personText"><div class="personName">${escapeHtml(p.name)}${p.local?' (you)':''}</div><div class="personState">${escapeHtml(p.action || 'idle')}</div></div></div>`).join('');
  status.textContent = `${people.length} ${people.length===1?'player':'players'} online`;
}
function escapeHtml(v='') { return String(v).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }

function presencePayload() {
  return { id: localId, name: displayName, avatar: localAvatar, joined_at: new Date().toISOString() };
}
function movementPayload() {
  return { id: localId, name: displayName, x:+me.position.x.toFixed(3), z:+me.position.z.toFixed(3), r:+me.rotation.y.toFixed(3), action:activeAction, avatar:localAvatar, t:Date.now() };
}

async function connectRoom(roomId) {
  activeRoom = rooms[roomId] ? roomId : 'skyline';
  roomName.textContent = rooms[activeRoom].name;
  buildRoom(rooms[activeRoom].vibe);
  await disconnectRoom();
  channel = supabase.channel(`kinfolksworld:${activeRoom}`, { config: { presence: { key: localId }, broadcast: { self: false, ack: false } } });
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const currentIds = new Set();
      Object.values(state).flat().forEach(p => {
        if (!p?.id || p.id === localId) return;
        currentIds.add(p.id);
        const remote = rebuildRemote(p.id, p);
        if (remote) remote.userData.name = p.name || remote.userData.name;
      });
      [...remotePlayers.keys()].forEach(id => { if (!currentIds.has(id)) removeRemote(id); });
      renderRoster();
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences?.forEach(p => { if (p.id && p.id !== localId) rebuildRemote(p.id,p); });
      renderRoster();
      toast('Someone joined the room');
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences?.forEach(p => { if (p.id) removeRemote(p.id); });
      renderRoster();
    })
    .on('broadcast', { event: 'move' }, ({ payload }) => {
      if (!payload?.id || payload.id === localId) return;
      const p = rebuildRemote(payload.id,payload);
      p.userData.name = payload.name || p.userData.name;
      p.userData.targetPosition.set(payload.x || 0,0,payload.z || 0);
      p.userData.targetRotation = payload.r || 0;
      p.userData.action = payload.action || 'idle';
      renderRoster();
    })
    .on('broadcast', { event: 'action' }, ({ payload }) => {
      if (!payload?.id || payload.id === localId) return;
      const p = rebuildRemote(payload.id,payload);
      p.userData.action = payload.action || 'idle';
      renderRoster();
    })
    .subscribe(async subStatus => {
      if (subStatus === 'SUBSCRIBED') {
        await channel.track(presencePayload());
        status.textContent = 'Live multiplayer connected';
        toast(`Joined ${rooms[activeRoom].name}`);
        renderRoster();
      } else if (subStatus === 'CHANNEL_ERROR') {
        status.textContent = 'Connection error';
      } else if (subStatus === 'TIMED_OUT') {
        status.textContent = 'Connection timed out';
      }
    });
}

async function disconnectRoom() {
  if (channel) {
    try { await channel.untrack(); } catch {}
    try { await supabase.removeChannel(channel); } catch {}
    channel = null;
  }
  [...remotePlayers.keys()].forEach(removeRemote);
}

function sendMove(force=false) {
  if (!channel) return;
  const now = performance.now();
  if (!force && now - sendTimer < 55) return;
  sendTimer = now;
  channel.send({ type:'broadcast', event:'move', payload:movementPayload() });
}
function sendAction() {
  if (!channel) return;
  channel.send({ type:'broadcast', event:'action', payload:movementPayload() });
}

function setAction(name) {
  activeAction = name;
  $$('[data-action]').forEach(b => b.classList.toggle('active', b.dataset.action === name));
  sendAction(); renderRoster();
}

function setMove(key,on) { on ? pressed.add(key) : pressed.delete(key); }
$$('[data-move]').forEach(btn => {
  const key = btn.dataset.move;
  ['pointerdown','touchstart'].forEach(ev => btn.addEventListener(ev,e => { e.preventDefault(); setMove(key,true); }));
  ['pointerup','pointercancel','pointerleave','touchend','touchcancel'].forEach(ev => btn.addEventListener(ev,e => { e.preventDefault(); setMove(key,false); }));
});
window.addEventListener('keydown', e => {
  if (!isOpen) return;
  if (e.key==='w'||e.key==='ArrowUp') pressed.add('forward');
  if (e.key==='s'||e.key==='ArrowDown') pressed.add('back');
  if (e.key==='a'||e.key==='ArrowLeft') pressed.add('left');
  if (e.key==='d'||e.key==='ArrowRight') pressed.add('right');
});
window.addEventListener('keyup', e => {
  if (e.key==='w'||e.key==='ArrowUp') pressed.delete('forward');
  if (e.key==='s'||e.key==='ArrowDown') pressed.delete('back');
  if (e.key==='a'||e.key==='ArrowLeft') pressed.delete('left');
  if (e.key==='d'||e.key==='ArrowRight') pressed.delete('right');
});
$$('[data-action]').forEach(b => b.addEventListener('click', () => setAction(b.dataset.action)));

function updateMovement(dt) {
  if (!isOpen) return;
  let dx=0,dz=0;
  if (pressed.has('forward')) dz -= 1;
  if (pressed.has('back')) dz += 1;
  if (pressed.has('left')) dx -= 1;
  if (pressed.has('right')) dx += 1;
  if (!dx && !dz) return;
  activeAction = 'walk';
  const len = Math.hypot(dx,dz); dx/=len; dz/=len;
  const speed = 2.15;
  me.position.x = THREE.MathUtils.clamp(me.position.x + dx*speed*dt,-7.4,7.4);
  me.position.z = THREE.MathUtils.clamp(me.position.z + dz*speed*dt,-7.4,7.4);
  me.rotation.y = Math.atan2(dx,dz);
  controls.target.lerp(new THREE.Vector3(me.position.x,1.8,me.position.z),.08);
  sendMove();
}

function animateAvatar(p,t,dt) {
  p.position.lerp(p.userData.targetPosition || p.position, p.userData.isLocal ? 1 : Math.min(1,dt*9));
  if (!p.userData.isLocal) p.rotation.y = THREE.MathUtils.lerp(p.rotation.y,p.userData.targetRotation || 0,Math.min(1,dt*10));
  const action = p.userData.isLocal ? activeAction : p.userData.action;
  if (action === 'dance') {
    p.rotation.z = Math.sin(t*5)*.08;
    p.position.y = Math.abs(Math.sin(t*5))*0.06;
  } else if (action === 'wave') {
    p.rotation.z = Math.sin(t*6)*.025;
    p.position.y = Math.sin(t*3)*.015;
  } else if (action === 'sit') {
    p.position.y = -.56;
    p.scale.y = .88;
  } else {
    p.rotation.z = 0;
    p.position.y = Math.sin(t*1.7)*.012;
    p.scale.y = 1;
  }
}

function resize() {
  const r = stage.getBoundingClientRect();
  if (!r.width || !r.height) return;
  renderer.setSize(r.width,r.height,false);
  camera.aspect = r.width/r.height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
window.addEventListener('resize',resize);

let last = performance.now();
function loop(now) {
  const dt = Math.min(.05,(now-last)/1000); last=now;
  updateMovement(dt);
  animateAvatar(me,now/1000,dt);
  remotePlayers.forEach(p => animateAvatar(p,now/1000,dt));
  controls.update();
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

launcher.addEventListener('click', async () => {
  if (!localId) await resolveIdentity();
  isOpen = true;
  layer.classList.add('open');
  resize();
  me.userData.id = localId;
  me.userData.name = displayName;
  renderRoster();
  await connectRoom(activeRoom);
});
exitButton.addEventListener('click', async () => {
  isOpen = false;
  layer.classList.remove('open');
  pressed.clear();
  activeAction = 'idle';
  await disconnectRoom();
});

// Let base-app world cards open the corresponding multiplayer room if both frames are same-origin.
window.addEventListener('message', event => {
  if (event.data?.type === 'kinfolksworld-enter-room' && rooms[event.data.room]) {
    activeRoom = event.data.room;
  }
});

resolveIdentity().then(() => renderRoster()).catch(() => {
  localId = localStorage.getItem('kinfolksworld_guest_id') || crypto.randomUUID();
  localStorage.setItem('kinfolksworld_guest_id',localId);
  displayName = localStorage.getItem('kinfolksworld_guest_name') || randomName();
  localStorage.setItem('kinfolksworld_guest_name',displayName);
  renderRoster();
});
