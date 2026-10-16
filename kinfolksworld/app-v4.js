import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const STORAGE_KEY = 'kinfolksworld-demo-v4';
const defaults = {
  coins: 2500,
  avatar: {
    skin: '#b97859', hair: 'long', hairColor: '#141216', eyeColor: '#5d4736', face: 'soft',
    outfit: 'street', height: 100, build: 100, eyeSize: 100, noseWidth: 100, lipFullness: 100,
    frame: 'classic', makeup: 'natural', tattoo: 'none', expression: 'neutral', action: 'idle'
  },
  owned: ['street-set', 'black-boots'],
  createdRooms: []
};

function loadState() {
  for (const key of [STORAGE_KEY, 'kinfolksworld-demo-v3', 'kinfolksworld-demo-v2', 'kinfolksworld-demo-v1']) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved) return {
        ...defaults, ...saved,
        avatar: { ...defaults.avatar, ...(saved.avatar || {}) },
        owned: Array.from(new Set([...(defaults.owned || []), ...(saved.owned || [])])),
        createdRooms: saved.createdRooms || []
      };
    } catch {}
  }
  return structuredClone(defaults);
}

const state = loadState();
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

const worlds = [
  { id:'skyline', name:'Skyline Lounge', vibe:'loft', live:128, host:'Mia', art:'linear-gradient(145deg,#17162d,#634bb7 45%,#ff7aa9)' },
  { id:'afterglow', name:'Afterglow Club', vibe:'club', live:246, host:'Jae', art:'radial-gradient(circle at 62% 25%,#ff4db8 0%,transparent 28%),linear-gradient(145deg,#10152f,#46218d 55%,#08203d)' },
  { id:'sunset', name:'Sunset Social', vibe:'beach', live:87, host:'Ari', art:'linear-gradient(160deg,#4f7bc5,#e68bc4 48%,#ffb760 74%,#183043)' },
  { id:'penthouse', name:'Midnight Penthouse', vibe:'loft', live:61, host:'Nova', art:'linear-gradient(145deg,#06070d,#1e2747 42%,#684b79)' },
  { id:'garden', name:'Moon Garden', vibe:'garden', live:102, host:'Lani', art:'linear-gradient(155deg,#091727,#1f5d57 58%,#43315c)' },
  { id:'arcade', name:'Retro Arcade', vibe:'club', live:174, host:'Kiko', art:'linear-gradient(135deg,#12142d,#17658e 40%,#d93f9d 72%,#ffbf55)' }
];
const friends = [
  {name:'Mia', colors:'linear-gradient(135deg,#ff8ac5,#7c5cff)'},{name:'Jae', colors:'linear-gradient(135deg,#65d6ff,#4368d8)'},
  {name:'Nova', colors:'linear-gradient(135deg,#f0a05e,#b44874)'},{name:'Ari', colors:'linear-gradient(135deg,#5de2b0,#246b91)'},{name:'Lani', colors:'linear-gradient(135deg,#bda6ff,#6e4ac5)'}
];
const items = [
  {id:'street-set',name:'Downtown Street Set',creator:'@kinfolkstyle',price:0,emoji:'🧥',tag:'Owned',effect:{outfit:'street'},bg:'linear-gradient(145deg,#2f3251,#171a28)'},
  {id:'black-boots',name:'Midnight Boots',creator:'@solecraft',price:0,emoji:'🥾',tag:'Owned',effect:{outfit:'street'},bg:'linear-gradient(145deg,#242733,#101218)'},
  {id:'luxe-fit',name:'Velvet Luxe Fit',creator:'@velvetroom',price:480,emoji:'👗',tag:'Trending',effect:{outfit:'luxe'},bg:'linear-gradient(145deg,#482b59,#1e1928)'},
  {id:'violet-hair',name:'Violet Wave Hair',creator:'@strandlab',price:325,emoji:'💇',tag:'New',effect:{hair:'long',hairColor:'#8d67d5'},bg:'linear-gradient(145deg,#6748a8,#211a34)'},
  {id:'tattoo-pack',name:'Ink Garden Pack',creator:'@inkhouse',price:350,emoji:'🌺',tag:'Tattoo',effect:{tattoo:'floral'},bg:'linear-gradient(145deg,#293447,#171a22)'},
  {id:'glam-pack',name:'Night Glam Makeup',creator:'@facecard',price:190,emoji:'💄',tag:'Makeup',effect:{makeup:'glam'},bg:'linear-gradient(145deg,#5b2648,#211722)'},
  {id:'pose-pack',name:'Motion + Pose Pack',creator:'@poseclub',price:180,emoji:'🕺',tag:'Animation',effect:{action:'dance'},bg:'linear-gradient(145deg,#22475e,#17202d)'},
  {id:'casual-fit',name:'Cozy Day Fit',creator:'@softwear',price:220,emoji:'👕',tag:'Casual',effect:{outfit:'casual'},bg:'linear-gradient(145deg,#315349,#172821)'}
];

function toast(message){const n=$('#toast');n.textContent=message;n.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>n.classList.remove('show'),1800)}
function vibeGradient(v){return({loft:'linear-gradient(145deg,#151929,#665a70 55%,#c68d79)',club:'linear-gradient(145deg,#071329,#392381 55%,#0b233c)',beach:'linear-gradient(165deg,#5a9fd6,#d991bd 48%,#ffbc68 73%,#263944)',garden:'linear-gradient(145deg,#0f2c2b,#315d4f 55%,#775888)'})[v]||'linear-gradient(145deg,#151929,#665a70 55%,#c68d79)'}
function worldCard(w){return `<button class="world-card" data-enter-world="${w.id}" style="--art:${w.art}"><span class="art"></span><span class="live-count">● ${w.live} here</span><span class="world-copy"><strong>${w.name}</strong><small>Hosted by ${w.host}</small></span></button>`}
function renderWorlds(){const all=[...state.createdRooms.map((r,i)=>({id:`created-${i}`,name:r.name,vibe:r.vibe,live:1,host:'You',art:vibeGradient(r.vibe)})),...worlds];$('#featuredWorlds').innerHTML=all.slice(0,4).map(worldCard).join('');$('#worldGrid').innerHTML=all.map(worldCard).join('')}
function renderFriends(){$('#friendRow').innerHTML=friends.map(f=>`<button class="friend-chip" data-friend="${f.name}"><span class="friend-avatar" style="--avatar:${f.colors}">${f.name[0]}</span><small>${f.name}</small></button>`).join('')}
function itemCard(i,closet=false){const owned=state.owned.includes(i.id);return `<article class="item-card"><div class="item-preview" style="--item-bg:${i.bg}"><span class="item-badge">${i.tag}</span><span>${i.emoji}</span></div><div class="item-copy"><strong>${i.name}</strong><small>${i.creator}</small><button class="${owned&&!closet?'owned':''}" data-item-action="${closet?'equip':'buy'}" data-item="${i.id}">${closet?'Equip':owned?'Owned':`◈ ${i.price}`}</button></div></article>`}
function renderItems(){$('#shopGrid').innerHTML=items.map(i=>itemCard(i)).join('');const owned=items.filter(i=>state.owned.includes(i.id));$('#closetGrid').innerHTML=owned.map(i=>itemCard(i,true)).join('')}
function updateCoins(){$('#coinBalance').textContent=Number(state.coins).toLocaleString()}

function addCreatorControls(){
  const card=$('.customizer-card'); if(!card||$('#v4CreatorControls'))return;
  const node=document.createElement('div');node.id='v4CreatorControls';node.innerHTML=`
    <div class="control-block"><label>Face shape</label><div class="segmented"><button data-face="soft">Soft</button><button data-face="defined">Defined</button><button data-face="oval">Oval</button></div></div>
    <div class="control-block"><label>Eye color</label><div class="swatches"><button class="swatch" data-eye-color="#3b261d" style="--swatch:#3b261d"></button><button class="swatch" data-eye-color="#5d4736" style="--swatch:#5d4736"></button><button class="swatch" data-eye-color="#47705a" style="--swatch:#47705a"></button><button class="swatch" data-eye-color="#577a9f" style="--swatch:#577a9f"></button><button class="swatch" data-eye-color="#7d6c49" style="--swatch:#7d6c49"></button></div></div>
    <div class="control-block"><label>Body frame</label><div class="segmented"><button data-frame="slim">Slim</button><button data-frame="classic">Classic</button><button data-frame="athletic">Athletic</button></div></div>
    <div class="control-block"><label>Makeup</label><div class="segmented"><button data-makeup="none">None</button><button data-makeup="natural">Natural</button><button data-makeup="glam">Glam</button></div></div>
    <div class="control-block"><label>Tattoo style</label><div class="segmented"><button data-tattoo="none">None</button><button data-tattoo="floral">Floral</button><button data-tattoo="geometric">Geo</button></div></div>
    <div class="control-block"><label for="eyeSizeRange">Eye size</label><input id="eyeSizeRange" type="range" min="86" max="118" value="100"></div>
    <div class="control-block"><label for="noseWidthRange">Nose width</label><input id="noseWidthRange" type="range" min="82" max="120" value="100"></div>
    <div class="control-block"><label for="lipFullnessRange">Lip fullness</label><input id="lipFullnessRange" type="range" min="78" max="125" value="100"></div>`;
  card.insertBefore(node,$('#outfitStyles')?.closest('.control-block')||card.firstChild);
}

function addActionUI(){
  if($('#avatarActions'))return;
  const stageCard=$('.stage-card');
  const actions=document.createElement('div');actions.id='avatarActions';actions.style.cssText='position:absolute;left:12px;right:12px;bottom:46px;z-index:6;display:flex;gap:7px;overflow-x:auto;padding:7px;background:rgba(7,9,14,.48);backdrop-filter:blur(12px);border-radius:16px;border:1px solid rgba(255,255,255,.08)';
  actions.innerHTML=`<button class="chip" data-action="idle">Idle</button><button class="chip" data-action="walk">Walk</button><button class="chip" data-action="sit">Sit</button><button class="chip" data-action="dance">Dance</button><button class="chip" data-action="pose">Pose</button><button class="chip" data-expression="smile">Smile</button><button class="chip" data-expression="wink">Wink</button><button class="chip" data-expression="surprised">Surprised</button>`;
  stageCard.appendChild(actions);
  const pad=document.createElement('div');pad.id='movePad';pad.hidden=true;pad.style.cssText='position:absolute;right:14px;bottom:108px;z-index:7;display:grid;grid-template-columns:42px 42px 42px;grid-template-rows:42px 42px 42px;gap:4px;opacity:.92';
  pad.innerHTML=`<span></span><button class="glass-button" data-move="forward">▲</button><span></span><button class="glass-button" data-move="left">◀</button><button class="glass-button" data-move="back">▼</button><button class="glass-button" data-move="right">▶</button>`;
  stageCard.appendChild(pad);
}

renderWorlds();renderFriends();renderItems();updateCoins();addCreatorControls();addActionUI();

const stage=$('#threeStage');
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(0,2.55,7.2);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;stage.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.minDistance=3.2;controls.maxDistance=10;controls.target.set(0,1.95,0);
scene.add(new THREE.HemisphereLight(0xeaf0ff,0x24171a,1.5));
const key=new THREE.DirectionalLight(0xfff7f2,4.1);key.position.set(4,6.5,4.8);key.castShadow=true;scene.add(key);
const fill=new THREE.PointLight(0xa9c7ff,11,12);fill.position.set(-3.2,3.2,4);scene.add(fill);
const rim=new THREE.PointLight(0xb87cff,17,11);rim.position.set(-3.6,4.8,-2.6);scene.add(rim);

const stageRoot=new THREE.Group();scene.add(stageRoot);
const avatarRoot=new THREE.Group();scene.add(avatarRoot);
const bodyRoot=new THREE.Group(),faceRoot=new THREE.Group(),hairRoot=new THREE.Group(),detailRoot=new THREE.Group();avatarRoot.add(bodyRoot,faceRoot,hairRoot,detailRoot);
const mats={}, meshes={}; let currentVibe='studio'; let moveDir={x:0,z:0}; let action='idle'; let expression='neutral';

function skinTexture(base){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,128,128);for(let i=0;i<900;i++){const a=Math.random()*.055;ctx.fillStyle=Math.random()>.5?`rgba(255,225,205,${a})`:`rgba(70,30,28,${a})`;ctx.fillRect(Math.random()*128,Math.random()*128,1,1)}for(let i=0;i<30;i++){ctx.fillStyle='rgba(70,38,28,.15)';ctx.beginPath();ctx.arc(25+Math.random()*78,42+Math.random()*46,.5+Math.random()*.8,0,Math.PI*2);ctx.fill()}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function phys(color,rough=.62,metal=0,clear=.02,map=null){return new THREE.MeshPhysicalMaterial({color,roughness:rough,metalness:metal,clearcoat:clear,clearcoatRoughness:.6,map})}
function add(g,m,p=avatarRoot){const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;p.add(o);return o}
function ell(r,sx,sy,sz,m,p,x,y,z){const o=add(new THREE.SphereGeometry(r,32,24),m,p);o.scale.set(sx,sy,sz);o.position.set(x,y,z);return o}
function cap(r,l,m,p,x,y,z,rz=0,rx=0){const o=add(new THREE.CapsuleGeometry(r,l,8,18),m,p);o.position.set(x,y,z);o.rotation.z=rz;o.rotation.x=rx;return o}
function clear(g){while(g.children.length){const c=g.children.pop();c.geometry?.dispose?.()}}

function buildMaterials(){
  const skinMap=skinTexture(state.avatar.skin); mats.skin=phys(0xffffff,.58,0,.035,skinMap); mats.hair=phys(state.avatar.hairColor,.42,.01,.08);mats.top=phys('#262b3e',.56,.01,.03);mats.bottom=phys('#11141a',.72,.01,.01);mats.shoe=phys('#090b0e',.45,.08,.12);mats.white=phys('#f4f2ef',.3,0,.05);mats.iris=phys(state.avatar.eyeColor,.35,0,.08);mats.pupil=phys('#111015',.26,0,.06);mats.lip=phys('#8f5360',.4,0,.14);mats.brow=phys(state.avatar.hairColor,.55);mats.tattoo=new THREE.MeshBasicMaterial({color:'#33273b',transparent:true,opacity:.82});mats.blush=new THREE.MeshBasicMaterial({color:'#b85d72',transparent:true,opacity:.14});
}
function outfitPalette(){return state.avatar.outfit==='luxe'?{top:'#632f67',bottom:'#21162a',shoe:'#1d121e'}:state.avatar.outfit==='casual'?{top:'#708c79',bottom:'#c9bca3',shoe:'#ece6dc'}:{top:'#252a3c',bottom:'#0f1218',shoe:'#090b0e'}}
function frameScale(){return state.avatar.frame==='slim'?{x:.9,shoulder:.9,arm:.92,leg:.92}:state.avatar.frame==='athletic'?{x:1.09,shoulder:1.12,arm:1.08,leg:1.06}:{x:1,shoulder:1,arm:1,leg:1}}

function buildAvatar(){
  clear(bodyRoot);clear(faceRoot);clear(hairRoot);clear(detailRoot);buildMaterials();const f=frameScale();const pal=outfitPalette();mats.top.color.set(pal.top);mats.bottom.color.set(pal.bottom);mats.shoe.color.set(pal.shoe);
  meshes.pelvis=ell(.54,.92*f.x,.62,.68,mats.bottom,bodyRoot,0,1.36,0);meshes.waist=ell(.55,.86*f.x,.78,.62,mats.top,bodyRoot,0,2.02,0);meshes.chest=ell(.67,1.05*f.shoulder,.92,.66,mats.top,bodyRoot,0,2.57,0);
  meshes.neck=cap(.16,.22,mats.skin,bodyRoot,0,3.31,0);
  meshes.head=ell(.54,.92,1.05,.88,mats.skin,faceRoot,0,3.77,0);
  if(state.avatar.face==='defined')meshes.head.scale.x=.87;if(state.avatar.face==='oval'){meshes.head.scale.x=.88;meshes.head.scale.y=1.12}
  meshes.jaw=ell(.37,.88,.48,.7,mats.skin,faceRoot,0,3.55,.09);
  const armR=.15*f.arm; meshes.upperArmL=cap(armR,.58,mats.skin,bodyRoot,-.76*f.shoulder,2.64,0,-.1);meshes.upperArmR=cap(armR,.58,mats.skin,bodyRoot,.76*f.shoulder,2.64,0,.1);meshes.foreArmL=cap(armR*.9,.6,mats.skin,bodyRoot,-.83*f.shoulder,1.96,.02,.02);meshes.foreArmR=cap(armR*.9,.6,mats.skin,bodyRoot,.83*f.shoulder,1.96,.02,-.02);
  meshes.handL=ell(.18,.65,1,.45,mats.skin,bodyRoot,-.84*f.shoulder,1.45,.04);meshes.handR=ell(.18,.65,1,.45,mats.skin,bodyRoot,.84*f.shoulder,1.45,.04);
  const legR=.2*f.leg;meshes.thighL=cap(legR,.72,mats.bottom,bodyRoot,-.28*f.x,.88,0);meshes.thighR=cap(legR,.72,mats.bottom,bodyRoot,.28*f.x,.88,0);meshes.calfL=cap(legR*.84,.68,mats.bottom,bodyRoot,-.28*f.x,.28,.02);meshes.calfR=cap(legR*.84,.68,mats.bottom,bodyRoot,.28*f.x,.28,.02);meshes.footL=ell(.24,.82,.5,1.35,mats.shoe,bodyRoot,-.28*f.x,-.08,.16);meshes.footR=ell(.24,.82,.5,1.35,mats.shoe,bodyRoot,.28*f.x,-.08,.16);
  buildFace();buildHair();buildDetails();applyScale();
}
function buildFace(){
  const eyeS=state.avatar.eyeSize/100; for(const side of [-1,1]){const eye=ell(.11,1.28*eyeS,.58*eyeS,.36,mats.white,faceRoot,.18*side,3.82,.46);const iris=ell(.056,1,1,.35,mats.iris,faceRoot,.18*side,3.82,.515);const pupil=ell(.026,1,1,.3,mats.pupil,faceRoot,.18*side,3.82,.54);const shine=ell(.011,1,1,.3,new THREE.MeshBasicMaterial({color:'#fff'}),faceRoot,.165*side,3.845,.558);if(side<0){meshes.eyeL=eye;meshes.irisL=iris;meshes.pupilL=pupil}else{meshes.eyeR=eye;meshes.irisR=iris;meshes.pupilR=pupil}}
  const nw=state.avatar.noseWidth/100;meshes.nose=ell(.13,.55*nw,1.02,.68,mats.skin,faceRoot,0,3.66,.49);meshes.lips=ell(.105,1.42*(state.avatar.lipFullness/100),.42,.38,mats.lip,faceRoot,0,3.49,.515);
  meshes.browL=ell(.08,1.65,.22,.16,mats.brow,faceRoot,-.18,3.98,.49);meshes.browR=ell(.08,1.65,.22,.16,mats.brow,faceRoot,.18,3.98,.49);meshes.browL.rotation.z=.08;meshes.browR.rotation.z=-.08;
  meshes.earL=ell(.13,.55,1,.42,mats.skin,faceRoot,-.52,3.75,0);meshes.earR=ell(.13,.55,1,.42,mats.skin,faceRoot,.52,3.75,0);
  for(const side of [-1,1])for(let i=0;i<5;i++){const lash=add(new THREE.CylinderGeometry(.006,.004,.12,5),mats.brow,detailRoot);lash.position.set(.11*side+i*.035*side,3.87,.535);lash.rotation.z=side*(.36+(i*.05));lash.rotation.x=Math.PI/2.3}
}
function buildHair(){
  mats.hair.color.set(state.avatar.hairColor);const capM=ell(.58,.96,.92,.94,mats.hair,hairRoot,0,3.94,-.05);capM.scale.y=.75;
  if(state.avatar.hair==='long'){ell(.56,1,.98,.58,mats.hair,hairRoot,0,3.15,-.38);for(const side of [-1,1]){cap(.11,1.45,mats.hair,hairRoot,.47*side,3.05,.05);for(let i=0;i<5;i++){const strand=cap(.024,1.35,mats.hair,hairRoot,(.38+i*.035)*side,3.05,.18);strand.rotation.z=.02*side}}}
  else if(state.avatar.hair==='buns'){ell(.28,1,1,.95,mats.hair,hairRoot,-.4,4.24,-.02);ell(.28,1,1,.95,mats.hair,hairRoot,.4,4.24,-.02);cap(.055,.6,mats.hair,hairRoot,-.48,3.54,.24);cap(.055,.6,mats.hair,hairRoot,.48,3.54,.24)}
  else ell(.5,.94,.78,.74,mats.hair,hairRoot,0,3.83,-.28);
}
function buildDetails(){
  if(state.avatar.makeup!=='none'){const opacity=state.avatar.makeup==='glam'?.27:.12;for(const side of [-1,1]){const blush=ell(.1,1.55,.58,.16,mats.blush,detailRoot,.28*side,3.63,.48);blush.material=mats.blush.clone();blush.material.opacity=opacity}if(state.avatar.makeup==='glam'){mats.lip.color.set('#8e3159');meshes.lips.scale.y=1.08}}
  if(state.avatar.tattoo!=='none'){const geo=state.avatar.tattoo==='floral'?new THREE.TorusKnotGeometry(.085,.018,45,8):new THREE.TorusGeometry(.08,.014,6,16);for(let i=0;i<3;i++){const t=add(geo,mats.tattoo,detailRoot);t.position.set(-.82,2.25-i*.28,.14);t.rotation.x=Math.PI/2;t.scale.set(.8,.8,.8)}}
}
function applyScale(){const h=state.avatar.height/100,b=state.avatar.build/100;avatarRoot.scale.set(b,h,b)}
function syncUI(){
  $$('[data-skin]').forEach(b=>b.classList.toggle('active',b.dataset.skin?.toLowerCase()===state.avatar.skin.toLowerCase()));$$('[data-hair]').forEach(b=>b.classList.toggle('active',b.dataset.hair===state.avatar.hair));$$('[data-hair-color]').forEach(b=>b.classList.toggle('active',b.dataset.hairColor?.toLowerCase()===state.avatar.hairColor.toLowerCase()));$$('[data-outfit]').forEach(b=>b.classList.toggle('active',b.dataset.outfit===state.avatar.outfit));$$('[data-face]').forEach(b=>b.classList.toggle('active',b.dataset.face===state.avatar.face));$$('[data-frame]').forEach(b=>b.classList.toggle('active',b.dataset.frame===state.avatar.frame));$$('[data-makeup]').forEach(b=>b.classList.toggle('active',b.dataset.makeup===state.avatar.makeup));$$('[data-tattoo]').forEach(b=>b.classList.toggle('active',b.dataset.tattoo===state.avatar.tattoo));$$('[data-eye-color]').forEach(b=>b.classList.toggle('active',b.dataset.eyeColor?.toLowerCase()===state.avatar.eyeColor.toLowerCase()));$$('[data-action]').forEach(b=>b.classList.toggle('active',b.dataset.action===action));
  if($('#heightRange'))$('#heightRange').value=state.avatar.height;if($('#buildRange'))$('#buildRange').value=state.avatar.build;if($('#eyeSizeRange'))$('#eyeSizeRange').value=state.avatar.eyeSize;if($('#noseWidthRange'))$('#noseWidthRange').value=state.avatar.noseWidth;if($('#lipFullnessRange'))$('#lipFullnessRange').value=state.avatar.lipFullness;
}
function buildStudio(){clear(stageRoot);currentVibe='studio';const floor=add(new THREE.CircleGeometry(3.4,64),phys('#171824',.82,.05),stageRoot);floor.rotation.x=-Math.PI/2;floor.position.y=-.2;for(let i=0;i<4;i++){const p=add(new THREE.CylinderGeometry(.035,.035,4.7,8),new THREE.MeshBasicMaterial({color:i%2?0x58d9ff:0xa56dff,transparent:true,opacity:.2}),stageRoot);p.position.set((i-1.5)*1.8,2.2,-2.5)}avatarRoot.position.set(0,-.1,0);$('#movePad').hidden=true}
function box(size,pos,color){const o=add(new THREE.BoxGeometry(...size),phys(color,.75),stageRoot);o.position.set(...pos);return o}
function buildRoom(v='loft'){clear(stageRoot);currentVibe=v;const pal=v==='club'?['#111729','#16162a','#a029a6','#2f3158']:v==='beach'?['#bda57a','#d38d92','#70bdd1','#f2d7b0']:v==='garden'?['#263c34','#1c302c','#6e9666','#6c5f67']:['#292831','#403b46','#b98878','#6a5b65'];box([8,.18,6],[0,-.2,0],pal[0]);box([8,4.8,.18],[0,2.15,-3],pal[1]);box([.18,4.8,6],[-4,2.15,0],pal[1]);box([2.5,.65,.95],[1.65,.22,-1.65],pal[3]);box([2.5,.9,.28],[1.65,.72,-2.03],pal[3]);box([1.5,.12,.8],[-.2,.42,-1.25],'#34343d');const lamp=new THREE.PointLight(pal[2],11,6);lamp.position.set(-2,1.5,-1.8);stageRoot.add(lamp);avatarRoot.position.set(-1.1,-.1,-.3);$('#movePad').hidden=false;controls.target.set(0,1.6,-.5);camera.position.set(.5,2.35,8.6)}
function resetCamera(){if(currentVibe==='studio'){camera.position.set(0,2.55,7.2);controls.target.set(0,1.95,0);avatarRoot.position.set(0,-.1,0)}else{camera.position.set(.5,2.35,8.6);controls.target.set(avatarRoot.position.x,1.6,avatarRoot.position.z-.2)}controls.update()}
function resize(){const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(stage);window.addEventListener('resize',resize);

function setAction(a){action=a;state.avatar.action=a;save();syncUI();toast(`${a[0].toUpperCase()+a.slice(1)} animation`)}
function setExpression(e){expression=e;state.avatar.expression=e;save();toast(`${e[0].toUpperCase()+e.slice(1)} expression`)}
function applyExpression(t){if(!meshes.lips)return;meshes.lips.rotation.z=0;meshes.lips.scale.y=.42;if(expression==='smile'){meshes.lips.scale.y=.3;meshes.lips.rotation.z=.02;meshes.lips.position.y=3.51}else if(expression==='surprised'){meshes.lips.scale.set(.65,.95,.55);meshes.lips.position.y=3.5}else{meshes.lips.scale.x=1.42*(state.avatar.lipFullness/100);meshes.lips.position.y=3.49}if(expression==='wink'&&meshes.eyeL)meshes.eyeL.scale.y=.05;}
function animateBody(t,dt){
  const breathe=Math.sin(t*1.8)*.012;meshes.chest.position.y=2.57+breathe;
  for(const k of ['upperArmL','upperArmR','foreArmL','foreArmR','thighL','thighR','calfL','calfR'])if(meshes[k])meshes[k].rotation.x*=.82;
  avatarRoot.rotation.z*=.84;avatarRoot.rotation.x*=.84;
  if(action==='walk'){const s=Math.sin(t*7)*.48;meshes.thighL.rotation.x=s;meshes.thighR.rotation.x=-s;meshes.upperArmL.rotation.x=-s*.75;meshes.upperArmR.rotation.x=s*.75;meshes.calfL.rotation.x=Math.max(0,-s)*.45;meshes.calfR.rotation.x=Math.max(0,s)*.45}
  if(action==='dance'){const s=Math.sin(t*5.2);avatarRoot.rotation.z=s*.08;meshes.upperArmL.rotation.x=1.0+s*.42;meshes.upperArmR.rotation.x=1.0-s*.42;meshes.thighL.rotation.x=s*.18;meshes.thighR.rotation.x=-s*.18;avatarRoot.position.y=-.1+Math.abs(Math.sin(t*5.2))*.05}
  else if(action==='sit'){avatarRoot.position.y=-.66;meshes.thighL.rotation.x=-1.15;meshes.thighR.rotation.x=-1.15;meshes.calfL.rotation.x=1.15;meshes.calfR.rotation.x=1.15;meshes.upperArmL.rotation.x=-.22;meshes.upperArmR.rotation.x=-.22}
  else if(action==='pose'){avatarRoot.position.y=-.1;meshes.upperArmL.rotation.z=-.65;meshes.upperArmR.rotation.z=.18;meshes.thighL.rotation.z=.08;avatarRoot.rotation.z=-.035}
  else avatarRoot.position.y=currentVibe==='studio'?-.1:Math.max(-.1,avatarRoot.position.y);
  if(currentVibe!=='studio'&&(moveDir.x||moveDir.z)){setAction('walk');const speed=dt*1.15;avatarRoot.position.x=THREE.MathUtils.clamp(avatarRoot.position.x+moveDir.x*speed,-3.2,3.2);avatarRoot.position.z=THREE.MathUtils.clamp(avatarRoot.position.z+moveDir.z*speed,-2.4,2.2);if(moveDir.z<0)avatarRoot.rotation.y=0;if(moveDir.z>0)avatarRoot.rotation.y=Math.PI;if(moveDir.x<0)avatarRoot.rotation.y=-Math.PI/2;if(moveDir.x>0)avatarRoot.rotation.y=Math.PI/2;controls.target.lerp(new THREE.Vector3(avatarRoot.position.x,1.55,avatarRoot.position.z-.35),.08)}
}
function blink(t){if(!meshes.eyeR||!meshes.eyeL)return;const phase=t%4.7;const b=phase>.04&&phase<.12?Math.abs((phase-.08)/.04):1;meshes.eyeR.scale.y=.58*b*(state.avatar.eyeSize/100);if(expression!=='wink')meshes.eyeL.scale.y=.58*b*(state.avatar.eyeSize/100)}

buildAvatar();buildStudio();resize();syncUI();
const clock=new THREE.Clock();let last=0;function loop(){const t=clock.getElapsedTime(),dt=Math.min(.033,t-last||.016);last=t;blink(t);applyExpression(t);animateBody(t,dt);controls.update();renderer.render(scene,camera);requestAnimationFrame(loop)}loop();

function rebuild(){buildAvatar();syncUI();}
function navigate(name){$$('.screen').forEach(s=>s.classList.toggle('active-screen',s.id===`screen-${name}`));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));if(name==='avatar'||name==='closet'||name==='shop'||name==='home'){buildStudio();resetCamera()}if(name==='avatar'){$('#stageEyebrow').textContent='REALISTIC AVATAR STUDIO';$('#stageTitle').textContent='Build your Kinfolk'}if(name==='worlds'){$('#stageEyebrow').textContent='KIN FOLKS WORLD';$('#stageTitle').textContent='Choose your next world'}window.scrollTo({top:0,behavior:'smooth'})}
function enterWorld(id){const idx=id.startsWith('created-')?Number(id.replace('created-','')):-1;const w=idx>=0?{...state.createdRooms[idx],id,host:'You'}:worlds.find(x=>x.id===id);if(!w)return;buildRoom(w.vibe);$('#stageEyebrow').textContent='YOU ARE HERE';$('#stageTitle').textContent=w.name;$$('.screen').forEach(s=>s.classList.toggle('active-screen',s.id==='screen-worlds'));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav==='worlds'));toast(`Entered ${w.name}`)}
function buy(item){if(state.owned.includes(item.id))return toast('You already own this item');if(state.coins<item.price)return toast('Not enough Kin Coins');state.coins-=item.price;state.owned.push(item.id);save();updateCoins();renderItems();toast(`${item.name} added to your closet`)}
function equip(item){Object.assign(state.avatar,item.effect||{});if(item.effect?.action)setAction(item.effect.action);rebuild();save();toast(`${item.name} equipped`)}

document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-nav]');if(nav)return navigate(nav.dataset.nav);
  const world=e.target.closest('[data-enter-world]');if(world)return enterWorld(world.dataset.enterWorld);
  const map=[['skin','skin'],['hair','hair'],['hairColor','hair-color'],['outfit','outfit'],['face','face'],['frame','frame'],['makeup','makeup'],['tattoo','tattoo'],['eyeColor','eye-color']];for(const [key,data] of map){const el=e.target.closest(`[data-${data}]`);if(el){state.avatar[key]=el.dataset[key]??el.dataset[data.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())];rebuild();return}}
  const a=e.target.closest('[data-action]');if(a)return setAction(a.dataset.action);
  const ex=e.target.closest('[data-expression]');if(ex)return setExpression(ex.dataset.expression);
  const ia=e.target.closest('[data-item-action]');if(ia){const item=items.find(i=>i.id===ia.dataset.item);return ia.dataset.itemAction==='equip'?equip(item):buy(item)}
  const fr=e.target.closest('[data-friend]');if(fr){const w=worlds.find(w=>w.host===fr.dataset.friend)||worlds[0];return enterWorld(w.id)}
});
for(const [id,key] of [['heightRange','height'],['buildRange','build'],['eyeSizeRange','eyeSize'],['noseWidthRange','noseWidth'],['lipFullnessRange','lipFullness']]){const el=$(`#${id}`);if(el)el.addEventListener('input',ev=>{state.avatar[key]=Number(ev.target.value);if(key==='height'||key==='build')applyScale();else rebuild()})}

const moveButtons=$$('[data-move]');const setMove=(dir,on)=>{const v={forward:[0,-1],back:[0,1],left:[-1,0],right:[1,0]}[dir];if(!v)return;if(on){moveDir.x=v[0];moveDir.z=v[1]}else{moveDir.x=0;moveDir.z=0;if(action==='walk')setAction('idle')}};for(const b of moveButtons){for(const ev of ['pointerdown','touchstart'])b.addEventListener(ev,x=>{x.preventDefault();setMove(b.dataset.move,true)},{passive:false});for(const ev of ['pointerup','pointercancel','touchend','mouseleave'])b.addEventListener(ev,x=>{x.preventDefault();setMove(b.dataset.move,false)},{passive:false})}
window.addEventListener('keydown',e=>{if(e.key==='w'||e.key==='ArrowUp')setMove('forward',true);if(e.key==='s'||e.key==='ArrowDown')setMove('back',true);if(e.key==='a'||e.key==='ArrowLeft')setMove('left',true);if(e.key==='d'||e.key==='ArrowRight')setMove('right',true)});window.addEventListener('keyup',()=>{moveDir={x:0,z:0};if(action==='walk')setAction('idle')});
$('#saveAvatar').addEventListener('click',()=>{save();toast('Avatar saved')});$('#resetCamera').addEventListener('click',resetCamera);$('#coinPill').addEventListener('click',()=>toast(`${state.coins.toLocaleString()} Kin Coins available`));$('.back-button').addEventListener('click',()=>toast('Kinfolk account bridge is next'));
const modal=$('#modalBackdrop');$('#createWorld').addEventListener('click',()=>{modal.hidden=false;setTimeout(()=>$('#roomName').focus(),20)});$('#modalClose').addEventListener('click',()=>modal.hidden=true);modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});$('#buildRoom').addEventListener('click',()=>{const name=$('#roomName').value.trim()||'My Hangout',vibe=$('#roomVibe').value;state.createdRooms.unshift({name,vibe});save();renderWorlds();modal.hidden=true;$('#roomName').value='';enterWorld('created-0')});
