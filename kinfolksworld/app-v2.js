import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const STORAGE_KEY = 'kinfolksworld-demo-v2';
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
  },
  owned: ['street-set', 'black-boots'],
  createdRooms: [],
};

function loadState() {
  try {
    const savedV2 = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const savedV1 = JSON.parse(localStorage.getItem('kinfolksworld-demo-v1') || 'null');
    const saved = savedV2 || savedV1;
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
  { id: 'loft-pack', name: 'Creator Loft Pack', creator: '@roomworks', price: 700, emoji: '🛋️', tag: 'Room', effect: {}, bg: 'linear-gradient(145deg,#5c5e67,#242a39)' },
  { id: 'pose-pack', name: 'Photo Pose Pack', creator: '@poseclub', price: 180, emoji: '📸', tag: 'Pose', effect: {}, bg: 'linear-gradient(145deg,#22475e,#17202d)' },
  { id: 'casual-fit', name: 'Cozy Day Fit', creator: '@softwear', price: 220, emoji: '👕', tag: 'Casual', effect: { outfit: 'casual' }, bg: 'linear-gradient(145deg,#315349,#172821)' },
];

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCoins(value) {
  return Number(value).toLocaleString();
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 1800);
}

function updateCoins() {
  $('#coinBalance').textContent = formatCoins(state.coins);
}

function renderWorldCard(world) {
  return `
    <button class="world-card" data-enter-world="${world.id}" style="--art:${world.art}">
      <span class="art"></span>
      <span class="live-count">● ${world.live} here</span>
      <span class="world-copy"><strong>${world.name}</strong><small>Hosted by ${world.host}</small></span>
    </button>`;
}

function renderWorlds() {
  const allWorlds = [...state.createdRooms.map((r, i) => ({
    id: `created-${i}`, name: r.name, vibe: r.vibe, live: 1, host: 'You', art: vibeGradient(r.vibe),
  })), ...worlds];
  $('#featuredWorlds').innerHTML = allWorlds.slice(0, 4).map(renderWorldCard).join('');
  $('#worldGrid').innerHTML = allWorlds.map(renderWorldCard).join('');
}

function renderFriends() {
  $('#friendRow').innerHTML = friends.map((f) => `
    <button class="friend-chip" data-friend="${f.name}">
      <span class="friend-avatar" style="--avatar:${f.colors}">${f.name[0]}</span><small>${f.name}</small>
    </button>`).join('');
}

function itemCard(item, closet = false) {
  const owned = state.owned.includes(item.id);
  const action = closet ? 'Equip' : owned ? 'Owned' : `◈ ${item.price}`;
  return `
    <article class="item-card">
      <div class="item-preview" style="--item-bg:${item.bg}"><span class="item-badge">${item.tag}</span><span aria-hidden="true">${item.emoji}</span></div>
      <div class="item-copy"><strong>${item.name}</strong><small>${item.creator}</small><button class="${owned && !closet ? 'owned' : ''}" data-item-action="${closet ? 'equip' : 'buy'}" data-item="${item.id}">${action}</button></div>
    </article>`;
}

function renderItems() {
  $('#shopGrid').innerHTML = items.map((item) => itemCard(item, false)).join('');
  const ownedItems = items.filter((item) => state.owned.includes(item.id));
  $('#closetGrid').innerHTML = ownedItems.length ? ownedItems.map((item) => itemCard(item, true)).join('') : '<p>No items yet.</p>';
}

function vibeGradient(vibe) {
  const map = {
    loft: 'linear-gradient(145deg,#151929,#665a70 55%,#c68d79)',
    club: 'radial-gradient(circle at 70% 25%,#ff44b6 0%,transparent 30%),linear-gradient(145deg,#071329,#392381 55%,#0b233c)',
    beach: 'linear-gradient(165deg,#5a9fd6,#d991bd 48%,#ffbc68 73%,#263944)',
    garden: 'linear-gradient(145deg,#0f2c2b,#315d4f 55%,#775888)',
  };
  return map[vibe] || map.loft;
}

function addRealismControls() {
  const card = $('.customizer-card');
  if (!card || $('#faceStyles')) return;
  const outfitBlock = $('#outfitStyles')?.closest('.control-block');
  const faceBlock = document.createElement('div');
  faceBlock.className = 'control-block';
  faceBlock.innerHTML = `
    <label>Face shape</label>
    <div class="segmented" id="faceStyles">
      <button data-face="soft">Soft</button><button data-face="defined">Defined</button><button data-face="oval">Oval</button>
    </div>`;
  const eyeBlock = document.createElement('div');
  eyeBlock.className = 'control-block';
  eyeBlock.innerHTML = `
    <label>Eye color</label>
    <div class="swatches" id="eyeSwatches">
      <button class="swatch" data-eye-color="#3b261d" style="--swatch:#3b261d" aria-label="Dark brown eyes"></button>
      <button class="swatch" data-eye-color="#5d4736" style="--swatch:#5d4736" aria-label="Brown eyes"></button>
      <button class="swatch" data-eye-color="#47705a" style="--swatch:#47705a" aria-label="Green eyes"></button>
      <button class="swatch" data-eye-color="#577a9f" style="--swatch:#577a9f" aria-label="Blue eyes"></button>
      <button class="swatch" data-eye-color="#7d6c49" style="--swatch:#7d6c49" aria-label="Hazel eyes"></button>
    </div>`;
  card.insertBefore(faceBlock, outfitBlock || card.firstChild);
  card.insertBefore(eyeBlock, outfitBlock || card.firstChild);
}

renderWorlds();
renderFriends();
renderItems();
updateCoins();
addRealismControls();

// ----- Three.js portrait-quality avatar stage ------------------------------
const stage = $('#threeStage');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
camera.position.set(0, 2.55, 7.25);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
stage.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3.7;
controls.maxDistance = 10;
controls.minPolarAngle = Math.PI * 0.23;
controls.maxPolarAngle = Math.PI * 0.64;
controls.target.set(0, 1.95, 0);

const hemi = new THREE.HemisphereLight(0xe5ecff, 0x27191b, 1.55);
scene.add(hemi);
const keyLight = new THREE.DirectionalLight(0xfff7f1, 4.1);
keyLight.position.set(3.8, 6.4, 4.6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);
const fillLight = new THREE.PointLight(0xaecbff, 11, 12);
fillLight.position.set(-3.2, 3.1, 4.2);
scene.add(fillLight);
const rimLight = new THREE.PointLight(0xb17cff, 17, 11);
rimLight.position.set(-3.4, 4.7, -2.5);
scene.add(rimLight);
const warmLight = new THREE.PointLight(0xff9d7c, 8, 9);
warmLight.position.set(3.2, 1.6, -1.7);
scene.add(warmLight);

const stageRoot = new THREE.Group();
scene.add(stageRoot);
const avatarRoot = new THREE.Group();
scene.add(avatarRoot);
const bodyRoot = new THREE.Group();
avatarRoot.add(bodyRoot);
const faceRoot = new THREE.Group();
avatarRoot.add(faceRoot);
const hairRoot = new THREE.Group();
avatarRoot.add(hairRoot);

const mats = {};
const meshes = {};
let currentVibe = 'studio';

function standard(color, roughness = 0.7, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function physical(color, roughness = 0.65, metalness = 0, clearcoat = 0) {
  return new THREE.MeshPhysicalMaterial({ color, roughness, metalness, clearcoat, clearcoatRoughness: .6 });
}

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
  }
}

function ellipsoid(radius, sx, sy, sz, material, parent, x, y, z) {
  const m = addMesh(new THREE.SphereGeometry(radius, 32, 24), material, parent);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}

function capsule(radius, length, material, parent, x, y, z, rz = 0, rx = 0) {
  const m = addMesh(new THREE.CapsuleGeometry(radius, length, 8, 18), material, parent);
  m.position.set(x, y, z);
  m.rotation.z = rz;
  m.rotation.x = rx;
  return m;
}

function buildMaterials() {
  mats.skin = physical(state.avatar.skin, .58, 0, .035);
  mats.skin.side = THREE.FrontSide;
  mats.hair = physical(state.avatar.hairColor, .42, .01, .08);
  mats.top = physical('#272b3d', .56, .015, .03);
  mats.bottom = physical('#11141b', .72, .01, .01);
  mats.shoe = physical('#0d0e12', .38, .08, .16);
  mats.sclera = physical('#f2eee9', .34, 0, .08);
  mats.iris = physical(state.avatar.eyeColor, .28, .02, .22);
  mats.pupil = standard('#080809', .22, 0);
  mats.catch = new THREE.MeshBasicMaterial({ color: 0xffffff });
  mats.brow = physical(state.avatar.hairColor, .55, 0, 0);
  mats.lip = physical('#9d5365', .42, 0, .08);
  mats.nostril = standard('#3a2020', .8, 0);
}

function buildBody() {
  clearGroup(bodyRoot);
  const hipMat = mats.bottom;

  // Chest, waist and hips are separate soft volumes instead of one capsule.
  meshes.chest = ellipsoid(.72, 1.0, .78, .62, mats.top, bodyRoot, 0, 2.46, 0);
  meshes.waist = ellipsoid(.55, .9, .72, .58, mats.top, bodyRoot, 0, 1.87, 0);
  meshes.hips = ellipsoid(.67, 1.03, .54, .67, hipMat, bodyRoot, 0, 1.48, 0);

  meshes.neck = addMesh(new THREE.CylinderGeometry(.18, .205, .38, 24), mats.skin, bodyRoot);
  meshes.neck.position.set(0, 3.16, 0);

  // Shoulder caps soften the silhouette and keep arms from looking detached.
  ellipsoid(.25, 1.12, .92, .92, mats.top, bodyRoot, -.68, 2.67, 0);
  ellipsoid(.25, 1.12, .92, .92, mats.top, bodyRoot, .68, 2.67, 0);

  meshes.upperArmL = capsule(.16, .62, mats.skin, bodyRoot, -.78, 2.28, .015, -.08, .02);
  meshes.upperArmR = capsule(.16, .62, mats.skin, bodyRoot, .78, 2.28, .015, .08, -.02);
  meshes.elbowL = ellipsoid(.16, 1, .94, 1, mats.skin, bodyRoot, -.82, 1.86, .03);
  meshes.elbowR = ellipsoid(.16, 1, .94, 1, mats.skin, bodyRoot, .82, 1.86, .03);
  meshes.forearmL = capsule(.135, .57, mats.skin, bodyRoot, -.85, 1.54, .055, -.025, .04);
  meshes.forearmR = capsule(.135, .57, mats.skin, bodyRoot, .85, 1.54, .055, .025, -.04);

  meshes.handL = ellipsoid(.17, .78, 1.16, .46, mats.skin, bodyRoot, -.87, 1.15, .09);
  meshes.handR = ellipsoid(.17, .78, 1.16, .46, mats.skin, bodyRoot, .87, 1.15, .09);
  meshes.handL.rotation.z = -.05;
  meshes.handR.rotation.z = .05;
  const thumbL = capsule(.045, .14, mats.skin, bodyRoot, -.73, 1.17, .11, -.55);
  const thumbR = capsule(.045, .14, mats.skin, bodyRoot, .73, 1.17, .11, .55);
  thumbL.scale.z = .8; thumbR.scale.z = .8;

  // Legs are segmented and tapered for a less toy-like silhouette.
  meshes.thighL = capsule(.245, .77, mats.bottom, bodyRoot, -.29, .98, 0, -.018);
  meshes.thighR = capsule(.245, .77, mats.bottom, bodyRoot, .29, .98, 0, .018);
  meshes.kneeL = ellipsoid(.205, 1, .9, 1, mats.bottom, bodyRoot, -.29, .48, .015);
  meshes.kneeR = ellipsoid(.205, 1, .9, 1, mats.bottom, bodyRoot, .29, .48, .015);
  meshes.calfL = capsule(.18, .55, mats.bottom, bodyRoot, -.29, .12, .02, .012);
  meshes.calfR = capsule(.18, .55, mats.bottom, bodyRoot, .29, .12, .02, -.012);

  meshes.shoeL = addMesh(new THREE.SphereGeometry(.25, 22, 16), mats.shoe, bodyRoot);
  meshes.shoeR = addMesh(new THREE.SphereGeometry(.25, 22, 16), mats.shoe, bodyRoot);
  meshes.shoeL.scale.set(.86, .55, 1.55); meshes.shoeR.scale.copy(meshes.shoeL.scale);
  meshes.shoeL.position.set(-.29, -.27, .16); meshes.shoeR.position.set(.29, -.27, .16);

  // Collar bones add subtle anatomy at portrait distance.
  const collarMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .08 });
  const collarL = addMesh(new THREE.CapsuleGeometry(.018, .28, 4, 10), collarMat, bodyRoot);
  const collarR = addMesh(new THREE.CapsuleGeometry(.018, .28, 4, 10), collarMat, bodyRoot);
  collarL.position.set(-.18, 2.93, .49); collarR.position.set(.18, 2.93, .49);
  collarL.rotation.z = 1.2; collarR.rotation.z = -1.2;
}

function faceScaleForPreset() {
  if (state.avatar.face === 'defined') return { x: .88, y: 1.02, z: .88, jaw: .88, chin: .13 };
  if (state.avatar.face === 'oval') return { x: .84, y: 1.10, z: .89, jaw: .94, chin: .10 };
  return { x: .92, y: 1.04, z: .92, jaw: 1.02, chin: .08 };
}

function buildFace() {
  clearGroup(faceRoot);
  const p = faceScaleForPreset();

  meshes.head = addMesh(new THREE.SphereGeometry(.55, 40, 32), mats.skin, faceRoot);
  meshes.head.position.set(0, 3.72, 0);
  meshes.head.scale.set(p.x, p.y, p.z);

  // Jaw and chin bring the face away from the perfect-sphere mannequin look.
  meshes.jaw = ellipsoid(.39, p.jaw, .54, .72, mats.skin, faceRoot, 0, 3.49, .015);
  meshes.chin = ellipsoid(.16, .9, .62, .68, mats.skin, faceRoot, 0, 3.30 - p.chin * .15, .055);

  meshes.earL = ellipsoid(.13, .42, .82, .24, mats.skin, faceRoot, -.495 * p.x / .9, 3.69, -.005);
  meshes.earR = ellipsoid(.13, .42, .82, .24, mats.skin, faceRoot, .495 * p.x / .9, 3.69, -.005);

  // Eyes: sclera, iris, pupil and catchlights.
  const eyeY = 3.79;
  const eyeZ = .475 * p.z;
  [-1, 1].forEach((side) => {
    const x = side * .185 * p.x / .9;
    const sclera = ellipsoid(.092, 1.25, .62, .38, mats.sclera, faceRoot, x, eyeY, eyeZ);
    const iris = ellipsoid(.043, .88, 1.0, .32, mats.iris, faceRoot, x, eyeY, eyeZ + .052);
    const pupil = ellipsoid(.020, .9, 1.0, .28, mats.pupil, faceRoot, x, eyeY, eyeZ + .073);
    const catchlight = ellipsoid(.0085, 1, 1, .4, mats.catch, faceRoot, x - .010, eyeY + .014, eyeZ + .091);
    sclera.rotation.z = side * -.03;
    iris.rotation.z = sclera.rotation.z;
    pupil.rotation.z = sclera.rotation.z;
    catchlight.rotation.z = sclera.rotation.z;
  });

  // Eyebrows follow a gentle natural arc.
  const browL = capsule(.027, .24, mats.brow, faceRoot, -.19, 3.965, .47, 1.47);
  const browR = capsule(.027, .24, mats.brow, faceRoot, .19, 3.965, .47, 1.67);
  browL.scale.set(1, 1, .44); browR.scale.set(1, 1, .44);

  // Nose bridge, tip and nostrils.
  meshes.noseBridge = ellipsoid(.095, .42, 1.32, .52, mats.skin, faceRoot, 0, 3.67, .476);
  meshes.noseTip = ellipsoid(.095, .88, .64, .78, mats.skin, faceRoot, 0, 3.57, .535);
  ellipsoid(.019, 1.0, .55, .42, mats.nostril, faceRoot, -.046, 3.55, .596);
  ellipsoid(.019, 1.0, .55, .42, mats.nostril, faceRoot, .046, 3.55, .596);

  // Separate upper/lower lips create a readable mouth profile.
  meshes.upperLip = ellipsoid(.095, 1.13, .32, .38, mats.lip, faceRoot, 0, 3.405, .515);
  meshes.lowerLip = ellipsoid(.108, 1.05, .38, .42, mats.lip, faceRoot, 0, 3.365, .515);

  // Soft cheek volumes catch portrait lighting without looking painted on.
  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xf0a09b, transparent: true, opacity: .055, depthWrite: false });
  ellipsoid(.18, 1.1, .52, .20, cheekMat, faceRoot, -.255, 3.54, .46);
  ellipsoid(.18, 1.1, .52, .20, cheekMat, faceRoot, .255, 3.54, .46);
}

function buildHair() {
  clearGroup(hairRoot);
  mats.hair.color.set(state.avatar.hairColor);
  mats.brow.color.set(state.avatar.hairColor);

  const cap = addMesh(new THREE.SphereGeometry(.57, 36, 26, 0, Math.PI * 2, 0, Math.PI * .62), mats.hair, hairRoot);
  cap.position.set(0, 3.91, -.04);
  cap.scale.set(.94, .94, .95);

  if (state.avatar.hair === 'long') {
    // Layered strands produce depth and highlights instead of one solid hair capsule.
    const back = ellipsoid(.64, .88, 1.72, .47, mats.hair, hairRoot, 0, 3.02, -.37);
    back.rotation.x = .03;
    for (let i = -3; i <= 3; i++) {
      const x = i * .135;
      const strand = capsule(.07, 1.34 + (3 - Math.abs(i)) * .07, mats.hair, hairRoot, x, 3.03, -.12 + Math.abs(i) * .012, i * -.012);
      strand.scale.z = .55;
    }
    const frontL = capsule(.085, 1.32, mats.hair, hairRoot, -.44, 3.12, .13, -.07);
    const frontR = capsule(.085, 1.32, mats.hair, hairRoot, .44, 3.12, .13, .07);
    frontL.scale.z = .58; frontR.scale.z = .58;
  } else if (state.avatar.hair === 'buns') {
    ellipsoid(.31, 1, .88, 1, mats.hair, hairRoot, -.39, 4.20, -.04);
    ellipsoid(.31, 1, .88, 1, mats.hair, hairRoot, .39, 4.20, -.04);
    const strandL = capsule(.055, .62, mats.hair, hairRoot, -.47, 3.53, .24, -.04);
    const strandR = capsule(.055, .62, mats.hair, hairRoot, .47, 3.53, .24, .04);
    strandL.scale.z = .55; strandR.scale.z = .55;
  } else {
    ellipsoid(.55, .94, .88, .77, mats.hair, hairRoot, 0, 3.80, -.23);
    for (let i = -2; i <= 2; i++) {
      const strand = capsule(.055, .38, mats.hair, hairRoot, i * .16, 3.68, .18, i * .04);
      strand.scale.z = .55;
    }
  }
}

function outfitPalette(style) {
  if (style === 'luxe') return { top: '#6b2b6e', bottom: '#24162d', shoe: '#20131f' };
  if (style === 'casual') return { top: '#6f8e78', bottom: '#d2c2a3', shoe: '#eee6d9' };
  return { top: '#252a3f', bottom: '#10131a', shoe: '#0b0c0f' };
}

function buildAvatar() {
  buildMaterials();
  buildBody();
  buildFace();
  buildHair();
  applyAvatarState(false);
}

function rebuildFaceAndHair() {
  buildFace();
  buildHair();
}

function applyAvatarState(rebuild = true) {
  const { skin, hairColor, eyeColor, height, build, outfit } = state.avatar;
  mats.skin.color.set(skin);
  mats.hair.color.set(hairColor);
  mats.brow.color.set(hairColor);
  mats.iris.color.set(eyeColor);
  const palette = outfitPalette(outfit);
  mats.top.color.set(palette.top);
  mats.bottom.color.set(palette.bottom);
  mats.shoe.color.set(palette.shoe);

  const h = height / 100;
  const b = build / 100;
  const bodyWidth = .88 + (b - .88) * .72;
  avatarRoot.scale.set(bodyWidth, h, bodyWidth);
  avatarRoot.position.y = -.02;
  if (rebuild) rebuildFaceAndHair();
  syncCustomizerUI();
}

function buildStudio() {
  clearGroup(stageRoot);
  currentVibe = 'studio';
  scene.background = null;
  const floorMat = physical('#171824', .56, .08, .15);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.4, 72), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.55;
  floor.receiveShadow = true;
  stageRoot.add(floor);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0x8a63ff, transparent: true, opacity: .22 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.35, 2.42, 72), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -.535;
  stageRoot.add(ring);

  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 5.2), physical('#131622', .78, 0, 0));
  backdrop.position.set(0, 2.0, -2.8);
  stageRoot.add(backdrop);

  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, 4.9, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x58d9ff : 0xa56dff, transparent: true, opacity: .15 }));
    p.position.set((i - 2) * 1.42, 1.9, -2.68);
    stageRoot.add(p);
  }
  avatarRoot.visible = true;
}

function addBox(parent, size, pos, color, roughness = .8) {
  const obj = new THREE.Mesh(new THREE.BoxGeometry(...size), standard(color, roughness, .02));
  obj.position.set(...pos);
  obj.castShadow = true;
  obj.receiveShadow = true;
  parent.add(obj);
  return obj;
}

function buildRoom(vibe = 'loft') {
  clearGroup(stageRoot);
  currentVibe = vibe;
  let palette = { floor: '#292831', wall: '#403b46', accent: '#b98878', sofa: '#6a5b65' };
  if (vibe === 'club') palette = { floor: '#111729', wall: '#16162a', accent: '#a029a6', sofa: '#2f3158' };
  if (vibe === 'beach') palette = { floor: '#bda57a', wall: '#d38d92', accent: '#70bdd1', sofa: '#f2d7b0' };
  if (vibe === 'garden') palette = { floor: '#263c34', wall: '#1c302c', accent: '#6e9666', sofa: '#6c5f67' };

  addBox(stageRoot, [7.6, .18, 5.7], [0, -.55, -.25], palette.floor);
  addBox(stageRoot, [7.6, 4.8, .18], [0, 1.82, -3], palette.wall);
  addBox(stageRoot, [.18, 4.8, 5.7], [-3.8, 1.82, -.25], palette.wall);
  addBox(stageRoot, [2.3, .64, .9], [1.55, -.12, -1.65], palette.sofa, .65);
  addBox(stageRoot, [2.3, .8, .25], [1.55, .37, -2.03], palette.sofa, .65);
  addBox(stageRoot, [.18, 1.35, .18], [-1.9, .13, -1.8], palette.accent, .35);
  const lamp = new THREE.PointLight(new THREE.Color(palette.accent), 12, 6);
  lamp.position.set(-1.9, 1.10, -1.8);
  stageRoot.add(lamp);
  const table = addBox(stageRoot, [1.55, .12, .8], [-.1, .10, -1.3], '#35343b', .4);
  addBox(stageRoot, [.08, .45, .08], [-.65, -.15, -1.55], '#202027');
  addBox(stageRoot, [.08, .45, .08], [.45, -.15, -1.55], '#202027');
  table.material.metalness = .12;

  if (vibe === 'club') {
    for (let i = -2; i <= 2; i++) {
      const beam = new THREE.PointLight(i % 2 ? 0x4fd6ff : 0xff4fb8, 8, 5);
      beam.position.set(i * 1.35, 3.35, -2.3);
      stageRoot.add(beam);
    }
  }

  avatarRoot.visible = true;
  avatarRoot.position.set(-1.15, -.02, -.35);
  controls.target.set(0, 1.55, -.6);
  camera.position.set(.6, 2.35, 8.2);
}

function resetCamera() {
  if (currentVibe === 'studio') {
    camera.position.set(0, 2.55, 7.25);
    controls.target.set(0, 1.95, 0);
    avatarRoot.position.set(0, -.02, 0);
  } else {
    camera.position.set(.6, 2.35, 8.2);
    controls.target.set(0, 1.55, -.6);
    avatarRoot.position.set(-1.15, -.02, -.35);
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

buildAvatar();
buildStudio();
resize();
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(stage);

const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  const breath = Math.sin(t * 1.35) * .006;
  if (meshes.chest) meshes.chest.scale.y = .78 + breath;
  if (currentVibe === 'studio') {
    avatarRoot.rotation.y = Math.sin(t * .38) * .045;
    faceRoot.rotation.y = Math.sin(t * .27) * .012;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// ----- UI behavior ---------------------------------------------------------
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
  const createdIndex = id.startsWith('created-') ? Number(id.replace('created-', '')) : -1;
  const world = createdIndex >= 0 ? { ...state.createdRooms[createdIndex], id, host: 'You', live: 1 } : worlds.find((w) => w.id === id);
  if (!world) return;
  $('#stageEyebrow').textContent = 'YOU ARE HERE';
  $('#stageTitle').textContent = world.name;
  buildRoom(world.vibe);
  resetCamera();
  navigateWithoutStageReset('worlds');
  toast(`Entered ${world.name}`);
}

function navigateWithoutStageReset(name) {
  $$('.screen').forEach((screen) => screen.classList.toggle('active-screen', screen.id === `screen-${name}`));
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.nav === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function syncCustomizerUI() {
  $$('[data-skin]').forEach((b) => b.classList.toggle('active', b.dataset.skin.toLowerCase() === state.avatar.skin.toLowerCase()));
  $$('[data-hair]').forEach((b) => b.classList.toggle('active', b.dataset.hair === state.avatar.hair));
  $$('[data-hair-color]').forEach((b) => b.classList.toggle('active', b.dataset.hairColor.toLowerCase() === state.avatar.hairColor.toLowerCase()));
  $$('[data-eye-color]').forEach((b) => b.classList.toggle('active', b.dataset.eyeColor.toLowerCase() === state.avatar.eyeColor.toLowerCase()));
  $$('[data-face]').forEach((b) => b.classList.toggle('active', b.dataset.face === state.avatar.face));
  $$('[data-outfit]').forEach((b) => b.classList.toggle('active', b.dataset.outfit === state.avatar.outfit));
  $('#heightRange').value = state.avatar.height;
  $('#buildRange').value = state.avatar.build;
}

function equipItem(item) {
  if (!item?.effect) return;
  Object.assign(state.avatar, item.effect);
  applyAvatarState(); persist();
  toast(`${item.name} equipped`);
}

function buyItem(item) {
  if (!item) return;
  if (state.owned.includes(item.id)) { toast('You already own this item'); return; }
  if (state.coins < item.price) { toast('Not enough Kin Coins'); return; }
  state.coins -= item.price;
  state.owned.push(item.id);
  persist(); updateCoins(); renderItems();
  toast(`${item.name} added to your closet`);
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]');
  if (nav) { navigate(nav.dataset.nav); return; }
  const worldButton = event.target.closest('[data-enter-world]');
  if (worldButton) { enterWorld(worldButton.dataset.enterWorld); return; }
  const skin = event.target.closest('[data-skin]');
  if (skin) { state.avatar.skin = skin.dataset.skin; applyAvatarState(); return; }
  const hair = event.target.closest('[data-hair]');
  if (hair) { state.avatar.hair = hair.dataset.hair; applyAvatarState(); return; }
  const hairColor = event.target.closest('[data-hair-color]');
  if (hairColor) { state.avatar.hairColor = hairColor.dataset.hairColor; applyAvatarState(); return; }
  const eyeColor = event.target.closest('[data-eye-color]');
  if (eyeColor) { state.avatar.eyeColor = eyeColor.dataset.eyeColor; applyAvatarState(); return; }
  const face = event.target.closest('[data-face]');
  if (face) { state.avatar.face = face.dataset.face; applyAvatarState(); return; }
  const outfit = event.target.closest('[data-outfit]');
  if (outfit) { state.avatar.outfit = outfit.dataset.outfit; applyAvatarState(); return; }
  const itemAction = event.target.closest('[data-item-action]');
  if (itemAction) {
    const item = items.find((x) => x.id === itemAction.dataset.item);
    if (itemAction.dataset.itemAction === 'equip') equipItem(item); else buyItem(item);
    return;
  }
  const friend = event.target.closest('[data-friend]');
  if (friend) {
    const world = worlds.find((w) => w.host === friend.dataset.friend) || worlds[0];
    enterWorld(world.id);
  }
});

$('#heightRange').addEventListener('input', (event) => { state.avatar.height = Number(event.target.value); applyAvatarState(false); });
$('#buildRange').addEventListener('input', (event) => { state.avatar.build = Number(event.target.value); applyAvatarState(false); });
$('#saveAvatar').addEventListener('click', () => { persist(); toast('Realistic avatar saved to this device'); });
$('#resetCamera').addEventListener('click', resetCamera);
$('#coinPill').addEventListener('click', () => toast(`${formatCoins(state.coins)} Kin Coins available`));
$('.back-button').addEventListener('click', () => toast('Kinfolk account bridge is the next connection step'));
$('#creatorStudio').addEventListener('click', () => toast('Creator Studio is queued for the creator-tools phase'));

$$('.filter-row').forEach((row) => {
  row.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    $$('.chip', row).forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    toast(`${chip.textContent.trim()} selected`);
  });
});

const modalBackdrop = $('#modalBackdrop');
$('#createWorld').addEventListener('click', () => { modalBackdrop.hidden = false; setTimeout(() => $('#roomName').focus(), 30); });
$('#modalClose').addEventListener('click', () => { modalBackdrop.hidden = true; });
modalBackdrop.addEventListener('click', (event) => { if (event.target === modalBackdrop) modalBackdrop.hidden = true; });
$('#buildRoom').addEventListener('click', () => {
  const name = $('#roomName').value.trim() || 'My Hangout';
  const vibe = $('#roomVibe').value;
  state.createdRooms.unshift({ name, vibe });
  persist(); renderWorlds(); modalBackdrop.hidden = true; $('#roomName').value = '';
  toast(`${name} created`); enterWorld('created-0');
});

syncCustomizerUI();
