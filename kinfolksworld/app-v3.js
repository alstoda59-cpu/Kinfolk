import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const STORAGE_KEY = 'kinfolksworld-demo-v3';
const defaults = {
  coins: 2500,
  avatar: {
    skin: '#b97859',
    hair: 'long',
    hairColor: '#141216',
    eyeColor: '#5d4736',
    face: 'soft',
    outfit: 'street',
    height: 100,
    build: 100,
    eyeSize: 100,
    noseWidth: 100,
    lipFullness: 100,
    frame: 'classic',
    makeup: 'natural',
    tattoo: 'none',
  },
  owned: ['street-set', 'black-boots'],
  createdRooms: [],
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      || JSON.parse(localStorage.getItem('kinfolksworld-demo-v2') || 'null')
      || JSON.parse(localStorage.getItem('kinfolksworld-demo-v1') || 'null');
    return saved ? {
      ...defaults,
      ...saved,
      avatar: { ...defaults.avatar, ...(saved.avatar || {}) },
      owned: Array.from(new Set([...(defaults.owned || []), ...(saved.owned || [])])),
      createdRooms: saved.createdRooms || [],
    } : structuredClone(defaults);
  } catch {
    return structuredClone(defaults);
  }
}

const state = loadState();
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const worlds = [
  { id: 'skyline', name: 'Skyline Lounge', vibe: 'loft', live: 128, host: 'Mia', art: 'linear-gradient(145deg,#17162d 0%,#634bb7 42%,#ff7aa9 100%)' },
  { id: 'afterglow', name: 'Afterglow Club', vibe: 'club', live: 246, host: 'Jae', art: 'radial-gradient(circle at 62% 25%,#ff4db8 0%,transparent 28%),linear-gradient(145deg,#10152f,#46218d 55%,#08203d)' },
  { id: 'sunset', name: 'Sunset Social', vibe: 'beach', live: 87, host: 'Ari', art: 'linear-gradient(160deg,#4f7bc5 0%,#e68bc4 48%,#ffb760 74%,#183043 100%)' },
  { id: 'penthouse', name: 'Midnight Penthouse', vibe: 'loft', live: 61, host: 'Nova', art: 'linear-gradient(145deg,#06070d,#1e2747 42%,#684b79)' },
  { id: 'garden', name: 'Moon Garden', vibe: 'garden', live: 102, host: 'Lani', art: 'radial-gradient(circle at 28% 20%,#d9ccff 0%,transparent 12%),linear-gradient(155deg,#091727,#1f5d57 58%,#43315c)' },
  { id: 'arcade', name: 'Retro Arcade', vibe: 'club', live: 174, host: 'Kiko', art: 'linear-gradient(135deg,#12142d,#17658e 40%,#d93f9d 72%,#ffbf55)' },
];

const friends = [
  { name: 'Mia', colors: 'linear-gradient(135deg,#ff8ac5,#7c5cff)' },
  { name: 'Jae', colors: 'linear-gradient(135deg,#65d6ff,#4368d8)' },
  { name: 'Nova', colors: 'linear-gradient(135deg,#f0a05e,#b44874)' },
  { name: 'Ari', colors: 'linear-gradient(135deg,#5de2b0,#246b91)' },
  { name: 'Lani', colors: 'linear-gradient(135deg,#bda6ff,#6e4ac5)' },
];

const items = [
  { id: 'street-set', name: 'Downtown Street Set', creator: '@kinfolkstyle', price: 0, emoji: '🧥', tag: 'Owned', effect: { outfit: 'street' }, bg: 'linear-gradient(145deg,#2f3251,#171a28)' },
  { id: 'black-boots', name: 'Midnight Boots', creator: '@solecraft', price: 0, emoji: '🥾', tag: 'Owned', effect: { outfit: 'street' }, bg: 'linear-gradient(145deg,#242733,#101218)' },
  { id: 'luxe-fit', name: 'Velvet Luxe Fit', creator: '@velvetroom', price: 480, emoji: '👗', tag: 'Trending', effect: { outfit: 'luxe' }, bg: 'linear-gradient(145deg,#482b59,#1e1928)' },
  { id: 'violet-hair', name: 'Violet Wave Hair', creator: '@strandlab', price: 325, emoji: '💇', tag: 'New', effect: { hair: 'long', hairColor: '#8d67d5' }, bg: 'linear-gradient(145deg,#6748a8,#211a34)' },
  { id: 'double-buns', name: 'Double Bun Pack', creator: '@strandlab', price: 250, emoji: '🎀', tag: 'Popular', effect: { hair: 'buns' }, bg: 'linear-gradient(145deg,#594464,#211924)' },
  { id: 'tattoo-pack', name: 'Ink Garden Pack', creator: '@inkhouse', price: 350, emoji: '🌺', tag: 'Tattoo', effect: { tattoo: 'floral' }, bg: 'linear-gradient(145deg,#293447,#171a22)' },
  { id: 'glam-pack', name: 'Night Glam Makeup', creator: '@facecard', price: 190, emoji: '💄', tag: 'Makeup', effect: { makeup: 'glam' }, bg: 'linear-gradient(145deg,#5b2648,#211722)' },
  { id: 'loft-pack', name: 'Creator Loft Pack', creator: '@roomworks', price: 700, emoji: '🛋️', tag: 'Room', effect: {}, bg: 'linear-gradient(145deg,#5c5e67,#242a39)' },
  { id: 'pose-pack', name: 'Photo Pose Pack', creator: '@poseclub', price: 180, emoji: '📸', tag: 'Pose', effect: {}, bg: 'linear-gradient(145deg,#22475e,#17202d)' },
  { id: 'casual-fit', name: 'Cozy Day Fit', creator: '@softwear', price: 220, emoji: '👕', tag: 'Casual', effect: { outfit: 'casual' }, bg: 'linear-gradient(145deg,#315349,#172821)' },
];

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function formatCoins(value) { return Number(value).toLocaleString(); }
function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 1800);
}
function updateCoins() { $('#coinBalance').textContent = formatCoins(state.coins); }
function vibeGradient(vibe) {
  return ({
    loft: 'linear-gradient(145deg,#151929,#665a70 55%,#c68d79)',
    club: 'radial-gradient(circle at 70% 25%,#ff44b6 0%,transparent 30%),linear-gradient(145deg,#071329,#392381 55%,#0b233c)',
    beach: 'linear-gradient(165deg,#5a9fd6,#d991bd 48%,#ffbc68 73%,#263944)',
    garden: 'linear-gradient(145deg,#0f2c2b,#315d4f 55%,#775888)',
  })[vibe] || 'linear-gradient(145deg,#151929,#665a70 55%,#c68d79)';
}
function renderWorldCard(world) {
  return `<button class="world-card" data-enter-world="${world.id}" style="--art:${world.art}"><span class="art"></span><span class="live-count">● ${world.live} here</span><span class="world-copy"><strong>${world.name}</strong><small>Hosted by ${world.host}</small></span></button>`;
}
function renderWorlds() {
  const all = [...state.createdRooms.map((r, i) => ({ id: `created-${i}`, name: r.name, vibe: r.vibe, live: 1, host: 'You', art: vibeGradient(r.vibe) })), ...worlds];
  $('#featuredWorlds').innerHTML = all.slice(0, 4).map(renderWorldCard).join('');
  $('#worldGrid').innerHTML = all.map(renderWorldCard).join('');
}
function renderFriends() {
  $('#friendRow').innerHTML = friends.map((f) => `<button class="friend-chip" data-friend="${f.name}"><span class="friend-avatar" style="--avatar:${f.colors}">${f.name[0]}</span><small>${f.name}</small></button>`).join('');
}
function itemCard(item, closet = false) {
  const owned = state.owned.includes(item.id);
  const action = closet ? 'Equip' : owned ? 'Owned' : `◈ ${item.price}`;
  return `<article class="item-card"><div class="item-preview" style="--item-bg:${item.bg}"><span class="item-badge">${item.tag}</span><span aria-hidden="true">${item.emoji}</span></div><div class="item-copy"><strong>${item.name}</strong><small>${item.creator}</small><button class="${owned && !closet ? 'owned' : ''}" data-item-action="${closet ? 'equip' : 'buy'}" data-item="${item.id}">${action}</button></div></article>`;
}
function renderItems() {
  $('#shopGrid').innerHTML = items.map((item) => itemCard(item)).join('');
  const owned = items.filter((item) => state.owned.includes(item.id));
  $('#closetGrid').innerHTML = owned.length ? owned.map((item) => itemCard(item, true)).join('') : '<p>No items yet.</p>';
}

function addAdvancedControls() {
  const card = $('.customizer-card');
  if (!card || $('#advancedIdentityControls')) return;
  const anchor = $('#outfitStyles')?.closest('.control-block') || card.firstChild;
  const wrap = document.createElement('div');
  wrap.id = 'advancedIdentityControls';
  wrap.innerHTML = `
    <div class="control-block"><label>Face shape</label><div class="segmented" id="faceStyles"><button data-face="soft">Soft</button><button data-face="defined">Defined</button><button data-face="oval">Oval</button></div></div>
    <div class="control-block"><label>Eye color</label><div class="swatches" id="eyeSwatches"><button class="swatch" data-eye-color="#3b261d" style="--swatch:#3b261d"></button><button class="swatch" data-eye-color="#5d4736" style="--swatch:#5d4736"></button><button class="swatch" data-eye-color="#47705a" style="--swatch:#47705a"></button><button class="swatch" data-eye-color="#577a9f" style="--swatch:#577a9f"></button><button class="swatch" data-eye-color="#7d6c49" style="--swatch:#7d6c49"></button></div></div>
    <div class="control-block"><label>Body frame</label><div class="segmented" id="frameStyles"><button data-frame="slim">Slim</button><button data-frame="classic">Classic</button><button data-frame="athletic">Athletic</button></div></div>
    <div class="control-block"><label>Makeup</label><div class="segmented" id="makeupStyles"><button data-makeup="none">None</button><button data-makeup="natural">Natural</button><button data-makeup="glam">Glam</button></div></div>
    <div class="control-block"><label>Tattoos</label><div class="segmented" id="tattooStyles"><button data-tattoo="none">None</button><button data-tattoo="floral">Floral</button><button data-tattoo="geometric">Geo</button></div></div>
    <div class="control-block"><label for="eyeSizeRange">Eye size</label><input id="eyeSizeRange" type="range" min="86" max="118" value="100"></div>
    <div class="control-block"><label for="noseWidthRange">Nose width</label><input id="noseWidthRange" type="range" min="82" max="120" value="100"></div>
    <div class="control-block"><label for="lipFullnessRange">Lip fullness</label><input id="lipFullnessRange" type="range" min="78" max="125" value="100"></div>`;
  card.insertBefore(wrap, anchor);
}

renderWorlds();
renderFriends();
renderItems();
updateCoins();
addAdvancedControls();

const stage = $('#threeStage');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 2.6, 7.25);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
stage.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3.5;
controls.maxDistance = 10;
controls.minPolarAngle = Math.PI * 0.22;
controls.maxPolarAngle = Math.PI * 0.66;
controls.target.set(0, 2.0, 0);

scene.add(new THREE.HemisphereLight(0xeaf0ff, 0x25171a, 1.45));
const keyLight = new THREE.DirectionalLight(0xfff7f2, 4.15);
keyLight.position.set(3.8, 6.6, 4.8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);
const fillLight = new THREE.PointLight(0xa9c7ff, 12, 12);
fillLight.position.set(-3.2, 3.2, 4.0);
scene.add(fillLight);
const rimLight = new THREE.PointLight(0xb87cff, 18, 11);
rimLight.position.set(-3.6, 4.8, -2.6);
scene.add(rimLight);
const warmLight = new THREE.PointLight(0xff9b79, 7.5, 9);
warmLight.position.set(3.1, 1.7, -1.5);
scene.add(warmLight);

const stageRoot = new THREE.Group();
scene.add(stageRoot);
const avatarRoot = new THREE.Group();
scene.add(avatarRoot);
const bodyRoot = new THREE.Group();
const faceRoot = new THREE.Group();
const hairRoot = new THREE.Group();
const detailRoot = new THREE.Group();
avatarRoot.add(bodyRoot, faceRoot, hairRoot, detailRoot);

const mats = {};
const meshes = {};
let currentVibe = 'studio';

function physical(color, roughness = .62, metalness = 0, clearcoat = .02) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness: .55,
    sheen: .08,
    sheenRoughness: .7,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), .18),
  });
}
function standard(color, roughness = .72, metalness = .02) { return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }
function addMesh(geometry, material, parent = avatarRoot) {
  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    child.geometry?.dispose?.();
    if (child.material && !Object.values(mats).includes(child.material)) child.material.dispose?.();
  }
}
function ellipsoid(radius, sx, sy, sz, material, parent, x, y, z) {
  const m = addMesh(new THREE.SphereGeometry(radius, 36, 28), material, parent);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}
function capsule(radius, length, material, parent, x, y, z, rz = 0, rx = 0) {
  const m = addMesh(new THREE.CapsuleGeometry(radius, length, 8, 20), material, parent);
  m.position.set(x, y, z);
  m.rotation.z = rz;
  m.rotation.x = rx;
  return m;
}

function buildMaterials() {
  mats.skin = physical(state.avatar.skin, .56, 0, .025);
  mats.hair = physical(state.avatar.hairColor, .4, .005, .07);
  mats.top = physical('#292d42', .54, .01, .025);
  mats.bottom = physical('#11141b', .7, .01, .015);
  mats.shoe = physical('#0b0c10', .46, .08, .05);
  mats.white = physical('#f4f2ed', .28, 0, .18);
  mats.iris = physical(state.avatar.eyeColor, .35, .01, .14);
  mats.pupil = standard('#09090a', .32, .02);
  mats.brow = physical(state.avatar.hairColor, .48, .01, .02);
  mats.lip = physical('#925064', .38, 0, .14);
  mats.lash = standard('#171216', .4, .02);
  mats.tattoo = new THREE.MeshBasicMaterial({ color: '#27212b', transparent: true, opacity: .72, side: THREE.DoubleSide });
  mats.blush = new THREE.MeshBasicMaterial({ color: '#b95e72', transparent: true, opacity: .13, depthWrite: false });
  mats.shadow = new THREE.MeshBasicMaterial({ color: '#5a3559', transparent: true, opacity: .18, depthWrite: false });
}

function outfitPalette(style) {
  if (style === 'luxe') return { top: '#6b2b6e', bottom: '#24162d', shoe: '#21131f' };
  if (style === 'casual') return { top: '#768f7b', bottom: '#c8b99d', shoe: '#e8e2d5' };
  return { top: '#252b42', bottom: '#10131a', shoe: '#0a0b0e' };
}
function frameProfile() {
  if (state.avatar.frame === 'slim') return { shoulder: .91, torso: .9, hip: .9, limb: .88 };
  if (state.avatar.frame === 'athletic') return { shoulder: 1.12, torso: 1.05, hip: 1.0, limb: 1.08 };
  return { shoulder: 1, torso: 1, hip: 1, limb: 1 };
}

function buildBody() {
  clearGroup(bodyRoot);
  const fp = frameProfile();
  const build = state.avatar.build / 100;
  const shoulder = fp.shoulder * build;
  const torsoWidth = fp.torso * build;
  const hipWidth = fp.hip * build;
  const limb = fp.limb * Math.sqrt(build);

  meshes.pelvis = ellipsoid(.53, hipWidth, .68, .72, mats.bottom, bodyRoot, 0, 1.44, 0);
  meshes.waist = ellipsoid(.5, torsoWidth * .9, .72, .67, mats.top, bodyRoot, 0, 2.05, 0);
  meshes.chest = ellipsoid(.64, shoulder, .74, .62, mats.top, bodyRoot, 0, 2.55, 0);
  meshes.shoulderL = ellipsoid(.22, 1.1, .95, .92, mats.top, bodyRoot, -.68 * shoulder, 2.69, 0);
  meshes.shoulderR = ellipsoid(.22, 1.1, .95, .92, mats.top, bodyRoot, .68 * shoulder, 2.69, 0);

  meshes.armL = capsule(.13 * limb, .78, mats.skin, bodyRoot, -.77 * shoulder, 2.08, .01, .03);
  meshes.armR = capsule(.13 * limb, .78, mats.skin, bodyRoot, .77 * shoulder, 2.08, .01, -.03);
  meshes.foreL = capsule(.115 * limb, .68, mats.skin, bodyRoot, -.79 * shoulder, 1.37, .03, .02);
  meshes.foreR = capsule(.115 * limb, .68, mats.skin, bodyRoot, .79 * shoulder, 1.37, .03, -.02);
  meshes.handL = ellipsoid(.19, .68, 1.0, .45, mats.skin, bodyRoot, -.8 * shoulder, .87, .07);
  meshes.handR = ellipsoid(.19, .68, 1.0, .45, mats.skin, bodyRoot, .8 * shoulder, .87, .07);
  const thumbL = capsule(.045, .17, mats.skin, bodyRoot, -.68 * shoulder, .93, .11, -.6);
  const thumbR = capsule(.045, .17, mats.skin, bodyRoot, .68 * shoulder, .93, .11, .6);
  thumbL.rotation.x = thumbR.rotation.x = .15;

  meshes.thighL = capsule(.19 * limb, .88, mats.bottom, bodyRoot, -.29 * hipWidth, .87, 0);
  meshes.thighR = capsule(.19 * limb, .88, mats.bottom, bodyRoot, .29 * hipWidth, .87, 0);
  meshes.calfL = capsule(.15 * limb, .74, mats.bottom, bodyRoot, -.29 * hipWidth, .18, 0);
  meshes.calfR = capsule(.15 * limb, .74, mats.bottom, bodyRoot, .29 * hipWidth, .18, 0);
  meshes.shoeL = ellipsoid(.3, .72, .42, 1.18, mats.shoe, bodyRoot, -.29 * hipWidth, -.28, .17);
  meshes.shoeR = ellipsoid(.3, .72, .42, 1.18, mats.shoe, bodyRoot, .29 * hipWidth, -.28, .17);

  meshes.neck = capsule(.16, .24, mats.skin, bodyRoot, 0, 3.15, 0);
}

function buildFace() {
  clearGroup(faceRoot);
  const face = state.avatar.face;
  const faceScale = face === 'oval' ? { x: .9, y: 1.1, z: .89 } : face === 'defined' ? { x: .96, y: 1.02, z: .9 } : { x: .98, y: 1.03, z: .92 };
  meshes.head = ellipsoid(.54, faceScale.x, faceScale.y, faceScale.z, mats.skin, faceRoot, 0, 3.72, 0);
  if (face === 'defined') {
    ellipsoid(.17, 1.7, .45, .55, mats.skin, faceRoot, 0, 3.44, .2);
  } else if (face === 'soft') {
    ellipsoid(.19, 1.55, .6, .52, mats.skin, faceRoot, 0, 3.48, .21);
  }

  const eyeScale = state.avatar.eyeSize / 100;
  const eyeY = 3.79;
  const eyeX = .18;
  const eyeZ = .475;
  for (const side of [-1, 1]) {
    const sclera = ellipsoid(.095, 1.22 * eyeScale, .58 * eyeScale, .38, mats.white, faceRoot, side * eyeX, eyeY, eyeZ);
    const iris = ellipsoid(.049, 1, 1, .36, mats.iris, faceRoot, side * eyeX, eyeY, eyeZ + .055);
    const pupil = ellipsoid(.022, 1, 1, .28, mats.pupil, faceRoot, side * eyeX, eyeY, eyeZ + .077);
    const glint = ellipsoid(.009, 1, 1, .3, new THREE.MeshBasicMaterial({ color: '#ffffff' }), faceRoot, side * eyeX - .012, eyeY + .015, eyeZ + .096);
    if (side < 0) { meshes.eyeL = sclera; meshes.irisL = iris; meshes.pupilL = pupil; meshes.glintL = glint; }
    else { meshes.eyeR = sclera; meshes.irisR = iris; meshes.pupilR = pupil; meshes.glintR = glint; }
  }

  meshes.browL = ellipsoid(.11, 1.2, .16, .2, mats.brow, faceRoot, -.18, 3.96, .475);
  meshes.browR = ellipsoid(.11, 1.2, .16, .2, mats.brow, faceRoot, .18, 3.96, .475);
  meshes.browL.rotation.z = .08;
  meshes.browR.rotation.z = -.08;

  const noseW = state.avatar.noseWidth / 100;
  meshes.nose = ellipsoid(.115, .48 * noseW, 1.0, .72, mats.skin, faceRoot, 0, 3.66, .49);
  meshes.nostrilL = ellipsoid(.026, 1.1, .36, .3, mats.pupil, faceRoot, -.035 * noseW, 3.57, .563);
  meshes.nostrilR = ellipsoid(.026, 1.1, .36, .3, mats.pupil, faceRoot, .035 * noseW, 3.57, .563);

  const fullness = state.avatar.lipFullness / 100;
  meshes.lipTop = ellipsoid(.082, 1.45, .34 * fullness, .3, mats.lip, faceRoot, 0, 3.46, .49);
  meshes.lipBottom = ellipsoid(.088, 1.5, .42 * fullness, .32, mats.lip, faceRoot, 0, 3.41, .49);
  ellipsoid(.085, 1.46, .09, .28, mats.pupil, faceRoot, 0, 3.435, .514);

  ellipsoid(.13, 1, 1.12, .56, mats.skin, faceRoot, -.52, 3.72, -.01);
  ellipsoid(.13, 1, 1.12, .56, mats.skin, faceRoot, .52, 3.72, -.01);

  buildLashesAndMakeup();
}

function makeLash(x, y, z, flip = 1) {
  const group = new THREE.Group();
  faceRoot.add(group);
  for (let i = -2; i <= 2; i++) {
    const lash = addMesh(new THREE.CylinderGeometry(.006, .002, .105, 5), mats.lash, group);
    lash.position.set(x + i * .035, y, z);
    lash.rotation.z = flip * (1.15 + i * .04);
    lash.rotation.x = .15;
  }
  return group;
}
function buildLashesAndMakeup() {
  meshes.lashL = makeLash(-.18, 3.85, .54, 1);
  meshes.lashR = makeLash(.18, 3.85, .54, -1);
  const mode = state.avatar.makeup;
  if (mode === 'none') return;
  const shadowOpacity = mode === 'glam' ? .28 : .12;
  const blushOpacity = mode === 'glam' ? .19 : .08;
  const shadowMat = mats.shadow.clone();
  shadowMat.opacity = shadowOpacity;
  const blushMat = mats.blush.clone();
  blushMat.opacity = blushOpacity;
  const shL = ellipsoid(.16, 1.1, .34, .18, shadowMat, faceRoot, -.18, 3.865, .515);
  const shR = ellipsoid(.16, 1.1, .34, .18, shadowMat, faceRoot, .18, 3.865, .515);
  shL.renderOrder = shR.renderOrder = 3;
  const blL = ellipsoid(.16, 1.25, .42, .2, blushMat, faceRoot, -.31, 3.57, .43);
  const blR = ellipsoid(.16, 1.25, .42, .2, blushMat, faceRoot, .31, 3.57, .43);
  blL.renderOrder = blR.renderOrder = 3;
  if (mode === 'glam') mats.lip.color.set('#8d315b');
  else mats.lip.color.set('#925064');
}

function buildHair() {
  clearGroup(hairRoot);
  mats.hair.color.set(state.avatar.hairColor);
  mats.brow.color.set(state.avatar.hairColor);
  const cap = ellipsoid(.57, .96, .9, .94, mats.hair, hairRoot, 0, 3.94, -.06);
  cap.geometry = new THREE.SphereGeometry(.57, 36, 26, 0, Math.PI * 2, 0, Math.PI * .64);
  if (state.avatar.hair === 'long') {
    const back = ellipsoid(.72, .84, 1.55, .42, mats.hair, hairRoot, 0, 3.12, -.42);
    const sideL = capsule(.105, 1.48, mats.hair, hairRoot, -.48, 3.12, .02);
    const sideR = capsule(.105, 1.48, mats.hair, hairRoot, .48, 3.12, .02);
    back.rotation.x = -.02; sideL.rotation.z = .025; sideR.rotation.z = -.025;
    for (let i = -2; i <= 2; i++) {
      const strand = capsule(.022, 1.3, mats.hair, hairRoot, i * .18, 3.1, -.7 + Math.abs(i) * .03);
      strand.material = mats.hair;
    }
  } else if (state.avatar.hair === 'buns') {
    ellipsoid(.28, 1, 1, 1, mats.hair, hairRoot, -.4, 4.23, -.04);
    ellipsoid(.28, 1, 1, 1, mats.hair, hairRoot, .4, 4.23, -.04);
    capsule(.055, .62, mats.hair, hairRoot, -.47, 3.52, .2);
    capsule(.055, .62, mats.hair, hairRoot, .47, 3.52, .2);
  } else {
    ellipsoid(.51, .97, .78, .74, mats.hair, hairRoot, 0, 3.87, -.25);
  }
}

function buildTattoo() {
  clearGroup(detailRoot);
  if (state.avatar.tattoo === 'none') return;
  const baseX = -.805 * frameProfile().shoulder * (state.avatar.build / 100);
  if (state.avatar.tattoo === 'floral') {
    for (let i = 0; i < 4; i++) {
      const y = 2.25 - i * .22;
      const ring = addMesh(new THREE.TorusGeometry(.075 - i * .006, .011, 6, 18), mats.tattoo, detailRoot);
      ring.position.set(baseX - .125, y, .02);
      ring.rotation.y = Math.PI / 2;
      for (let p = 0; p < 4; p++) {
        const petal = ellipsoid(.035, 1.7, .7, .25, mats.tattoo, detailRoot, baseX - .125 + Math.cos(p * Math.PI / 2) * .07, y + Math.sin(p * Math.PI / 2) * .07, .035);
        petal.rotation.z = p * Math.PI / 2;
      }
    }
    const stem = addMesh(new THREE.CylinderGeometry(.009, .009, .72, 6), mats.tattoo, detailRoot);
    stem.position.set(baseX - .12, 1.92, .02);
    stem.rotation.z = .06;
  } else {
    for (let i = 0; i < 5; i++) {
      const diamond = addMesh(new THREE.TorusGeometry(.07, .009, 5, 4), mats.tattoo, detailRoot);
      diamond.position.set(baseX - .12, 2.26 - i * .18, .02);
      diamond.rotation.set(Math.PI / 2, 0, Math.PI / 4);
      diamond.scale.set(1, .72, 1);
    }
  }
}

function applyAvatarState() {
  const palette = outfitPalette(state.avatar.outfit);
  mats.skin.color.set(state.avatar.skin);
  mats.hair.color.set(state.avatar.hairColor);
  mats.brow.color.set(state.avatar.hairColor);
  mats.iris.color.set(state.avatar.eyeColor);
  mats.top.color.set(palette.top);
  mats.bottom.color.set(palette.bottom);
  mats.shoe.color.set(palette.shoe);
  const h = state.avatar.height / 100;
  avatarRoot.scale.set(1, h, 1);
  buildBody();
  buildFace();
  buildHair();
  buildTattoo();
  syncUI();
}

function buildStudio() {
  clearGroup(stageRoot);
  currentVibe = 'studio';
  const floor = addMesh(new THREE.CircleGeometry(3.45, 72), standard('#171824', .83, .08), stageRoot);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.48;
  floor.receiveShadow = true;
  const ring = addMesh(new THREE.RingGeometry(2.4, 2.47, 72), new THREE.MeshBasicMaterial({ color: 0x8a63ff, transparent: true, opacity: .26 }), stageRoot);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -.465;
  for (let i = 0; i < 5; i++) {
    const p = addMesh(new THREE.CylinderGeometry(.025, .025, 5.1, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x58d9ff : 0xa56dff, transparent: true, opacity: .16 }), stageRoot);
    p.position.set((i - 2) * 1.4, 2.0, -2.65);
  }
  avatarRoot.position.set(0, 0, 0);
}
function addBox(parent, size, pos, color, roughness = .8) {
  const obj = addMesh(new THREE.BoxGeometry(...size), standard(color, roughness, .02), parent);
  obj.position.set(...pos);
  return obj;
}
function buildRoom(vibe = 'loft') {
  clearGroup(stageRoot);
  currentVibe = vibe;
  let palette = { floor: '#292831', wall: '#403b46', accent: '#b98878', sofa: '#6a5b65' };
  if (vibe === 'club') palette = { floor: '#111729', wall: '#16162a', accent: '#a029a6', sofa: '#2f3158' };
  if (vibe === 'beach') palette = { floor: '#bda57a', wall: '#d38d92', accent: '#70bdd1', sofa: '#f2d7b0' };
  if (vibe === 'garden') palette = { floor: '#263c34', wall: '#1c302c', accent: '#6e9666', sofa: '#6c5f67' };
  addBox(stageRoot, [7.6, .18, 5.7], [0, -.5, -.25], palette.floor);
  addBox(stageRoot, [7.6, 4.8, .18], [0, 1.85, -3], palette.wall);
  addBox(stageRoot, [.18, 4.8, 5.7], [-3.8, 1.85, -.25], palette.wall);
  addBox(stageRoot, [2.3, .64, .9], [1.55, -.08, -1.65], palette.sofa, .65);
  addBox(stageRoot, [2.3, .8, .25], [1.55, .41, -2.03], palette.sofa, .65);
  addBox(stageRoot, [1.55, .12, .8], [-.1, .14, -1.3], '#35343b', .4);
  const lamp = new THREE.PointLight(new THREE.Color(palette.accent), 12, 6);
  lamp.position.set(-1.9, 1.15, -1.8);
  stageRoot.add(lamp);
  avatarRoot.position.set(-1.05, 0, -.35);
  controls.target.set(0, 1.5, -.6);
  camera.position.set(.65, 2.25, 8.5);
}
function resetCamera() {
  if (currentVibe === 'studio') {
    camera.position.set(0, 2.6, 7.25);
    controls.target.set(0, 2.0, 0);
    avatarRoot.position.set(0, 0, 0);
  } else {
    camera.position.set(.65, 2.25, 8.5);
    controls.target.set(0, 1.5, -.6);
    avatarRoot.position.set(-1.05, 0, -.35);
  }
  controls.update();
}
function resize() {
  const rect = stage.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

buildMaterials();
applyAvatarState();
buildStudio();
resize();
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(stage);

const clock = new THREE.Clock();
let nextBlink = 2.5 + Math.random() * 2.5;
let blinkStart = -1;
function animate() {
  const t = clock.getElapsedTime();
  const breathing = 1 + Math.sin(t * 1.35) * .007;
  if (meshes.chest) meshes.chest.scale.y *= breathing / (meshes.chest.userData.lastBreath || 1);
  if (meshes.chest) meshes.chest.userData.lastBreath = breathing;
  avatarRoot.rotation.y = currentVibe === 'studio' ? Math.sin(t * .32) * .045 : 0;
  faceRoot.rotation.z = Math.sin(t * .43) * .006;

  if (t > nextBlink && blinkStart < 0) blinkStart = t;
  if (blinkStart >= 0) {
    const d = t - blinkStart;
    const phase = Math.min(1, d / .16);
    const close = phase < .5 ? phase * 2 : (1 - phase) * 2;
    const eyeScale = Math.max(.1, 1 - close * .88);
    if (meshes.eyeL) meshes.eyeL.scale.y = .58 * (state.avatar.eyeSize / 100) * eyeScale;
    if (meshes.eyeR) meshes.eyeR.scale.y = .58 * (state.avatar.eyeSize / 100) * eyeScale;
    if (d > .16) { blinkStart = -1; nextBlink = t + 2.8 + Math.random() * 3.2; }
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

function navigate(name) {
  $$('.screen').forEach((screen) => screen.classList.toggle('active-screen', screen.id === `screen-${name}`));
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.nav === name));
  if (name === 'avatar') {
    $('#stageEyebrow').textContent = 'REALISTIC AVATAR STUDIO';
    $('#stageTitle').textContent = 'Build your Kinfolk';
    buildStudio(); resetCamera();
  } else if (name === 'worlds') {
    $('#stageEyebrow').textContent = 'KIN FOLK 3D';
    $('#stageTitle').textContent = 'Choose your next world';
  } else if (name === 'closet') {
    $('#stageEyebrow').textContent = 'YOUR LOOK';
    $('#stageTitle').textContent = 'Style your avatar';
    buildStudio(); resetCamera();
  } else if (name === 'shop') {
    $('#stageEyebrow').textContent = 'MARKETPLACE';
    $('#stageTitle').textContent = 'Creator-made drops';
    buildStudio(); resetCamera();
  } else {
    $('#stageEyebrow').textContent = 'REALISTIC AVATAR STUDIO';
    $('#stageTitle').textContent = 'Welcome to Kinfolksworld';
    buildStudio(); resetCamera();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function enterWorld(id) {
  const idx = id.startsWith('created-') ? Number(id.replace('created-', '')) : -1;
  const world = idx >= 0 ? { ...state.createdRooms[idx], id, host: 'You', live: 1 } : worlds.find((w) => w.id === id);
  if (!world) return;
  $('#stageEyebrow').textContent = 'YOU ARE HERE';
  $('#stageTitle').textContent = world.name;
  buildRoom(world.vibe);
  $$('.screen').forEach((screen) => screen.classList.toggle('active-screen', screen.id === 'screen-worlds'));
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.nav === 'worlds'));
  toast(`Entered ${world.name}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function syncUI() {
  $$('[data-skin]').forEach((b) => b.classList.toggle('active', b.dataset.skin.toLowerCase() === state.avatar.skin.toLowerCase()));
  $$('[data-hair]').forEach((b) => b.classList.toggle('active', b.dataset.hair === state.avatar.hair));
  $$('[data-hair-color]').forEach((b) => b.classList.toggle('active', b.dataset.hairColor.toLowerCase() === state.avatar.hairColor.toLowerCase()));
  $$('[data-eye-color]').forEach((b) => b.classList.toggle('active', b.dataset.eyeColor.toLowerCase() === state.avatar.eyeColor.toLowerCase()));
  $$('[data-face]').forEach((b) => b.classList.toggle('active', b.dataset.face === state.avatar.face));
  $$('[data-outfit]').forEach((b) => b.classList.toggle('active', b.dataset.outfit === state.avatar.outfit));
  $$('[data-frame]').forEach((b) => b.classList.toggle('active', b.dataset.frame === state.avatar.frame));
  $$('[data-makeup]').forEach((b) => b.classList.toggle('active', b.dataset.makeup === state.avatar.makeup));
  $$('[data-tattoo]').forEach((b) => b.classList.toggle('active', b.dataset.tattoo === state.avatar.tattoo));
  $('#heightRange').value = state.avatar.height;
  $('#buildRange').value = state.avatar.build;
  $('#eyeSizeRange').value = state.avatar.eyeSize;
  $('#noseWidthRange').value = state.avatar.noseWidth;
  $('#lipFullnessRange').value = state.avatar.lipFullness;
}
function equipItem(item) {
  if (!item?.effect) return;
  Object.assign(state.avatar, item.effect);
  applyAvatarState(); persist(); toast(`${item.name} equipped`);
}
function buyItem(item) {
  if (!item) return;
  if (state.owned.includes(item.id)) { toast('You already own this item'); return; }
  if (state.coins < item.price) { toast('Not enough Kin Coins'); return; }
  state.coins -= item.price;
  state.owned.push(item.id);
  persist(); updateCoins(); renderItems(); toast(`${item.name} added to your closet`);
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]'); if (nav) { navigate(nav.dataset.nav); return; }
  const worldButton = event.target.closest('[data-enter-world]'); if (worldButton) { enterWorld(worldButton.dataset.enterWorld); return; }
  const maps = [
    ['skin', 'skin'], ['hair', 'hair'], ['hairColor', 'hair-color'], ['eyeColor', 'eye-color'], ['face', 'face'], ['outfit', 'outfit'], ['frame', 'frame'], ['makeup', 'makeup'], ['tattoo', 'tattoo'],
  ];
  for (const [prop, dataName] of maps) {
    const el = event.target.closest(`[data-${dataName}]`);
    if (el) { state.avatar[prop] = el.dataset[prop] ?? el.dataset[dataName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())]; applyAvatarState(); return; }
  }
  const itemAction = event.target.closest('[data-item-action]');
  if (itemAction) {
    const item = items.find((x) => x.id === itemAction.dataset.item);
    itemAction.dataset.itemAction === 'equip' ? equipItem(item) : buyItem(item);
    return;
  }
  const friend = event.target.closest('[data-friend]');
  if (friend) enterWorld((worlds.find((w) => w.host === friend.dataset.friend) || worlds[0]).id);
});

[['heightRange','height'],['buildRange','build'],['eyeSizeRange','eyeSize'],['noseWidthRange','noseWidth'],['lipFullnessRange','lipFullness']].forEach(([id, prop]) => {
  $(`#${id}`).addEventListener('input', (event) => { state.avatar[prop] = Number(event.target.value); applyAvatarState(); });
});
$('#saveAvatar').addEventListener('click', () => { persist(); toast('Avatar look saved'); });
$('#resetCamera').addEventListener('click', resetCamera);
$('#coinPill').addEventListener('click', () => toast(`${formatCoins(state.coins)} Kin Coins available`));
$('.back-button').addEventListener('click', () => toast('Kinfolk account bridge is the next connection step'));
$('#creatorStudio').addEventListener('click', () => toast('Creator Studio is queued for the creator-tools phase'));
$$('.filter-row').forEach((row) => row.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip'); if (!chip) return;
  $$('.chip', row).forEach((c) => c.classList.remove('active')); chip.classList.add('active'); toast(`${chip.textContent.trim()} selected`);
}));
const modalBackdrop = $('#modalBackdrop');
$('#createWorld').addEventListener('click', () => { modalBackdrop.hidden = false; setTimeout(() => $('#roomName').focus(), 30); });
$('#modalClose').addEventListener('click', () => { modalBackdrop.hidden = true; });
modalBackdrop.addEventListener('click', (event) => { if (event.target === modalBackdrop) modalBackdrop.hidden = true; });
$('#buildRoom').addEventListener('click', () => {
  const name = $('#roomName').value.trim() || 'My Hangout';
  const vibe = $('#roomVibe').value;
  state.createdRooms.unshift({ name, vibe }); persist(); renderWorlds(); modalBackdrop.hidden = true; $('#roomName').value = ''; toast(`${name} created`); enterWorld('created-0');
});

syncUI();