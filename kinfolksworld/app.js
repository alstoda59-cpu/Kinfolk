import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const STORAGE_KEY = 'kinfolksworld-demo-v1';
const defaults = {
  coins: 2500,
  avatar: {
    skin: '#b97859',
    hair: 'long',
    hairColor: '#141216',
    outfit: 'street',
    height: 100,
    build: 100,
  },
  owned: ['street-set', 'black-boots'],
  createdRooms: [],
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
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
      <span class="world-copy">
        <strong>${world.name}</strong>
        <small>Hosted by ${world.host}</small>
      </span>
    </button>`;
}

function renderWorlds() {
  const allWorlds = [...state.createdRooms.map((r, i) => ({
    id: `created-${i}`,
    name: r.name,
    vibe: r.vibe,
    live: 1,
    host: 'You',
    art: vibeGradient(r.vibe),
  })), ...worlds];
  $('#featuredWorlds').innerHTML = allWorlds.slice(0, 4).map(renderWorldCard).join('');
  $('#worldGrid').innerHTML = allWorlds.map(renderWorldCard).join('');
}

function renderFriends() {
  $('#friendRow').innerHTML = friends.map((f) => `
    <button class="friend-chip" data-friend="${f.name}">
      <span class="friend-avatar" style="--avatar:${f.colors}">${f.name[0]}</span>
      <small>${f.name}</small>
    </button>`).join('');
}

function itemCard(item, closet = false) {
  const owned = state.owned.includes(item.id);
  const action = closet ? 'Equip' : owned ? 'Owned' : `◈ ${item.price}`;
  return `
    <article class="item-card">
      <div class="item-preview" style="--item-bg:${item.bg}">
        <span class="item-badge">${item.tag}</span>
        <span aria-hidden="true">${item.emoji}</span>
      </div>
      <div class="item-copy">
        <strong>${item.name}</strong>
        <small>${item.creator}</small>
        <button class="${owned && !closet ? 'owned' : ''}" data-item-action="${closet ? 'equip' : 'buy'}" data-item="${item.id}">${action}</button>
      </div>
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

renderWorlds();
renderFriends();
renderItems();
updateCoins();

// ----- Three.js stage -------------------------------------------------------
const stage = $('#threeStage');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 2.5, 8.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 4.2;
controls.maxDistance = 11;
controls.minPolarAngle = Math.PI * 0.25;
controls.maxPolarAngle = Math.PI * 0.62;
controls.target.set(0, 1.75, 0);

scene.add(new THREE.HemisphereLight(0xcbd8ff, 0x15111a, 2.4));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.3);
keyLight.position.set(4, 7, 5);
keyLight.castShadow = true;
scene.add(keyLight);
const rimLight = new THREE.PointLight(0x9e6bff, 20, 12);
rimLight.position.set(-4, 4, -2);
scene.add(rimLight);
const blueLight = new THREE.PointLight(0x58d9ff, 14, 10);
blueLight.position.set(3, 2, 2);
scene.add(blueLight);

const stageRoot = new THREE.Group();
scene.add(stageRoot);
const avatarRoot = new THREE.Group();
scene.add(avatarRoot);

const mats = {};
const meshes = {};
let hairGroup;
let currentVibe = 'studio';

function mat(color, roughness = 0.74, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function mesh(geometry, material, parent = avatarRoot) {
  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function buildAvatar() {
  mats.skin = mat(state.avatar.skin, .8, 0);
  mats.hair = mat(state.avatar.hairColor, .6, .02);
  mats.top = mat('#272b3d', .68, .02);
  mats.bottom = mat('#11141b', .8, .01);
  mats.shoe = mat('#0d0e12', .5, .08);
  mats.eye = mat('#16131a', .4, .04);
  mats.lip = mat('#8f485b', .55, .02);

  meshes.torso = mesh(new THREE.CapsuleGeometry(.56, .9, 6, 14), mats.top);
  meshes.torso.position.y = 2.25;
  meshes.torso.scale.set(1.05, 1, .72);

  meshes.neck = mesh(new THREE.CylinderGeometry(.18, .2, .34, 18), mats.skin);
  meshes.neck.position.y = 3.22;

  meshes.head = mesh(new THREE.SphereGeometry(.54, 32, 24), mats.skin);
  meshes.head.position.y = 3.72;
  meshes.head.scale.set(.92, 1.06, .88);

  const eyeGeo = new THREE.SphereGeometry(.048, 12, 10);
  meshes.eyeL = mesh(eyeGeo, mats.eye);
  meshes.eyeR = mesh(eyeGeo, mats.eye);
  meshes.eyeL.position.set(-.18, 3.79, .47);
  meshes.eyeR.position.set(.18, 3.79, .47);
  meshes.eyeL.scale.set(1.25, .65, .5);
  meshes.eyeR.scale.copy(meshes.eyeL.scale);

  meshes.lips = mesh(new THREE.SphereGeometry(.075, 14, 8), mats.lip);
  meshes.lips.position.set(0, 3.52, .47);
  meshes.lips.scale.set(1.35, .45, .34);

  const armGeo = new THREE.CapsuleGeometry(.16, 1.02, 5, 12);
  meshes.armL = mesh(armGeo, mats.skin);
  meshes.armR = mesh(armGeo, mats.skin);
  meshes.armL.position.set(-.78, 2.26, 0);
  meshes.armR.position.set(.78, 2.26, 0);
  meshes.armL.rotation.z = -.06;
  meshes.armR.rotation.z = .06;

  const legGeo = new THREE.CapsuleGeometry(.22, 1.25, 5, 12);
  meshes.legL = mesh(legGeo, mats.bottom);
  meshes.legR = mesh(legGeo, mats.bottom);
  meshes.legL.position.set(-.28, .93, 0);
  meshes.legR.position.set(.28, .93, 0);

  meshes.shoeL = mesh(new THREE.BoxGeometry(.42, .25, .72), mats.shoe);
  meshes.shoeR = mesh(new THREE.BoxGeometry(.42, .25, .72), mats.shoe);
  meshes.shoeL.position.set(-.28, .12, .12);
  meshes.shoeR.position.set(.28, .12, .12);
  meshes.shoeL.geometry.translate(0, 0, .08);
  meshes.shoeR.geometry.translate(0, 0, .08);

  hairGroup = new THREE.Group();
  avatarRoot.add(hairGroup);
  buildHair();
  applyAvatarState();
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    child.geometry?.dispose?.();
    if (child.material && child.material !== mats.hair) child.material.dispose?.();
  }
}

function buildHair() {
  clearGroup(hairGroup);
  mats.hair.color.set(state.avatar.hairColor);

  const cap = mesh(new THREE.SphereGeometry(.57, 28, 18, 0, Math.PI * 2, 0, Math.PI * .59), mats.hair, hairGroup);
  cap.position.set(0, 3.9, -.02);
  cap.scale.set(.94, .92, .92);

  if (state.avatar.hair === 'long') {
    const back = mesh(new THREE.CapsuleGeometry(.5, 1.45, 6, 16), mats.hair, hairGroup);
    back.position.set(0, 3.05, -.42);
    back.scale.set(1.02, 1.03, .55);
    const sideL = mesh(new THREE.CapsuleGeometry(.12, 1.55, 5, 12), mats.hair, hairGroup);
    const sideR = sideL.clone();
    sideR.material = mats.hair;
    hairGroup.add(sideR);
    sideL.position.set(-.48, 3.08, .07);
    sideR.position.set(.48, 3.08, .07);
  } else if (state.avatar.hair === 'buns') {
    const bunL = mesh(new THREE.SphereGeometry(.28, 18, 14), mats.hair, hairGroup);
    const bunR = mesh(new THREE.SphereGeometry(.28, 18, 14), mats.hair, hairGroup);
    bunL.position.set(-.42, 4.2, -.05);
    bunR.position.set(.42, 4.2, -.05);
    const strandL = mesh(new THREE.CapsuleGeometry(.055, .58, 4, 10), mats.hair, hairGroup);
    const strandR = mesh(new THREE.CapsuleGeometry(.055, .58, 4, 10), mats.hair, hairGroup);
    strandL.position.set(-.49, 3.55, .29);
    strandR.position.set(.49, 3.55, .29);
  } else {
    const back = mesh(new THREE.SphereGeometry(.52, 24, 16), mats.hair, hairGroup);
    back.position.set(0, 3.82, -.28);
    back.scale.set(.95, .9, .7);
  }
}

function outfitPalette(style) {
  if (style === 'luxe') return { top: '#6b2b6e', bottom: '#24162d', shoe: '#20131f' };
  if (style === 'casual') return { top: '#6f8e78', bottom: '#d2c2a3', shoe: '#eee6d9' };
  return { top: '#252a3f', bottom: '#10131a', shoe: '#0b0c0f' };
}

function applyAvatarState() {
  const { skin, hairColor, height, build, outfit } = state.avatar;
  mats.skin.color.set(skin);
  mats.hair.color.set(hairColor);
  const palette = outfitPalette(outfit);
  mats.top.color.set(palette.top);
  mats.bottom.color.set(palette.bottom);
  mats.shoe.color.set(palette.shoe);

  const h = height / 100;
  const b = build / 100;
  avatarRoot.scale.set(b, h, b);
  avatarRoot.position.y = -.1;
  buildHair();
  syncCustomizerUI();
}

function buildStudio() {
  clearGroup(stageRoot);
  currentVibe = 'studio';
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x171824, roughness: .82, metalness: .08 });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.4, 64), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.18;
  floor.receiveShadow = true;
  stageRoot.add(floor);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0x8a63ff, transparent: true, opacity: .25 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.46, 64), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -.16;
  stageRoot.add(ring);

  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 4.8, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x58d9ff : 0xa56dff, transparent: true, opacity: .22 }));
    p.position.set((i - 1.5) * 1.8, 2.2, -2.5);
    stageRoot.add(p);
  }
  avatarRoot.visible = true;
}

function addBox(parent, size, pos, color, roughness = .8) {
  const obj = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color, roughness, .02));
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

  addBox(stageRoot, [7.6, .18, 5.7], [0, -.2, -.25], palette.floor);
  addBox(stageRoot, [7.6, 4.8, .18], [0, 2.15, -3], palette.wall);
  addBox(stageRoot, [.18, 4.8, 5.7], [-3.8, 2.15, -.25], palette.wall);

  addBox(stageRoot, [2.3, .64, .9], [1.55, .23, -1.65], palette.sofa, .65);
  addBox(stageRoot, [2.3, .8, .25], [1.55, .72, -2.03], palette.sofa, .65);
  addBox(stageRoot, [.18, 1.35, .18], [-1.9, .48, -1.8], palette.accent, .35);
  const lamp = new THREE.PointLight(new THREE.Color(palette.accent), 12, 6);
  lamp.position.set(-1.9, 1.45, -1.8);
  stageRoot.add(lamp);
  const table = addBox(stageRoot, [1.55, .12, .8], [-.1, .45, -1.3], '#35343b', .4);
  addBox(stageRoot, [.08, .45, .08], [-.65, .2, -1.55], '#202027');
  addBox(stageRoot, [.08, .45, .08], [.45, .2, -1.55], '#202027');
  table.material.metalness = .12;

  if (vibe === 'club') {
    for (let i = -2; i <= 2; i++) {
      const beam = new THREE.PointLight(i % 2 ? 0x4fd6ff : 0xff4fb8, 8, 5);
      beam.position.set(i * 1.35, 3.7, -2.3);
      stageRoot.add(beam);
    }
  }

  avatarRoot.visible = true;
  avatarRoot.position.set(-1.15, -.1, -.35);
  controls.target.set(0, 1.55, -.6);
  camera.position.set(0.6, 2.4, 8.8);
}

function resetCamera() {
  if (currentVibe === 'studio') {
    camera.position.set(0, 2.5, 8.2);
    controls.target.set(0, 1.75, 0);
    avatarRoot.position.set(0, -.1, 0);
  } else {
    camera.position.set(.6, 2.4, 8.8);
    controls.target.set(0, 1.55, -.6);
    avatarRoot.position.set(-1.15, -.1, -.35);
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
  if (currentVibe === 'studio') avatarRoot.rotation.y = Math.sin(t * .45) * .06;
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
    $('#stageEyebrow').textContent = 'AVATAR STUDIO';
    $('#stageTitle').textContent = 'Build your Kinfolk';
    buildStudio();
    resetCamera();
  } else if (name === 'worlds') {
    $('#stageEyebrow').textContent = 'KIN FOLK 3D';
    $('#stageTitle').textContent = 'Choose your next world';
  } else if (name === 'closet') {
    $('#stageEyebrow').textContent = 'YOUR LOOK';
    $('#stageTitle').textContent = 'Style your avatar';
    buildStudio();
    resetCamera();
  } else if (name === 'shop') {
    $('#stageEyebrow').textContent = 'MARKETPLACE';
    $('#stageTitle').textContent = 'Creator-made drops';
    buildStudio();
    resetCamera();
  } else {
    $('#stageEyebrow').textContent = 'AVATAR STUDIO';
    $('#stageTitle').textContent = 'Welcome to Kinfolksworld';
    buildStudio();
    resetCamera();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function enterWorld(id) {
  const createdIndex = id.startsWith('created-') ? Number(id.replace('created-', '')) : -1;
  const world = createdIndex >= 0
    ? { ...state.createdRooms[createdIndex], id, host: 'You', live: 1 }
    : worlds.find((w) => w.id === id);
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
  $$('[data-outfit]').forEach((b) => b.classList.toggle('active', b.dataset.outfit === state.avatar.outfit));
  $('#heightRange').value = state.avatar.height;
  $('#buildRange').value = state.avatar.build;
}

function equipItem(item) {
  if (!item?.effect) return;
  Object.assign(state.avatar, item.effect);
  applyAvatarState();
  persist();
  toast(`${item.name} equipped`);
}

function buyItem(item) {
  if (!item) return;
  if (state.owned.includes(item.id)) {
    toast('You already own this item');
    return;
  }
  if (state.coins < item.price) {
    toast('Not enough Kin Coins');
    return;
  }
  state.coins -= item.price;
  state.owned.push(item.id);
  persist();
  updateCoins();
  renderItems();
  toast(`${item.name} added to your closet`);
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]');
  if (nav) {
    navigate(nav.dataset.nav);
    return;
  }

  const worldButton = event.target.closest('[data-enter-world]');
  if (worldButton) {
    enterWorld(worldButton.dataset.enterWorld);
    return;
  }

  const skin = event.target.closest('[data-skin]');
  if (skin) {
    state.avatar.skin = skin.dataset.skin;
    applyAvatarState();
    return;
  }

  const hair = event.target.closest('[data-hair]');
  if (hair) {
    state.avatar.hair = hair.dataset.hair;
    applyAvatarState();
    return;
  }

  const hairColor = event.target.closest('[data-hair-color]');
  if (hairColor) {
    state.avatar.hairColor = hairColor.dataset.hairColor;
    applyAvatarState();
    return;
  }

  const outfit = event.target.closest('[data-outfit]');
  if (outfit) {
    state.avatar.outfit = outfit.dataset.outfit;
    applyAvatarState();
    return;
  }

  const itemAction = event.target.closest('[data-item-action]');
  if (itemAction) {
    const item = items.find((x) => x.id === itemAction.dataset.item);
    if (itemAction.dataset.itemAction === 'equip') equipItem(item);
    else buyItem(item);
    return;
  }

  const friend = event.target.closest('[data-friend]');
  if (friend) {
    const world = worlds.find((w) => w.host === friend.dataset.friend) || worlds[0];
    enterWorld(world.id);
  }
});

$('#heightRange').addEventListener('input', (event) => {
  state.avatar.height = Number(event.target.value);
  applyAvatarState();
});
$('#buildRange').addEventListener('input', (event) => {
  state.avatar.build = Number(event.target.value);
  applyAvatarState();
});

$('#saveAvatar').addEventListener('click', () => {
  persist();
  toast('Avatar saved to this device');
});

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
$('#createWorld').addEventListener('click', () => {
  modalBackdrop.hidden = false;
  setTimeout(() => $('#roomName').focus(), 30);
});
$('#modalClose').addEventListener('click', () => { modalBackdrop.hidden = true; });
modalBackdrop.addEventListener('click', (event) => {
  if (event.target === modalBackdrop) modalBackdrop.hidden = true;
});
$('#buildRoom').addEventListener('click', () => {
  const name = $('#roomName').value.trim() || 'My Hangout';
  const vibe = $('#roomVibe').value;
  state.createdRooms.unshift({ name, vibe });
  persist();
  renderWorlds();
  modalBackdrop.hidden = true;
  $('#roomName').value = '';
  toast(`${name} created`);
  enterWorld('created-0');
});

syncCustomizerUI();
