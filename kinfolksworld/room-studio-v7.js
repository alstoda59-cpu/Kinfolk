import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://zojajuzmfjpvubzibzgg.supabase.co';
const SUPABASE_KEY='sb_publishable_1te_hrDXQciMD7Gp1EXmRw_dvQmszvi';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const inventory=[
  {type:'sofa',name:'Modern Sofa',emoji:'🛋️'},
  {type:'chair',name:'Accent Chair',emoji:'🪑'},
  {type:'table',name:'Coffee Table',emoji:'▰'},
  {type:'lamp',name:'Floor Lamp',emoji:'💡'},
  {type:'plant',name:'Plant',emoji:'🪴'},
  {type:'speaker',name:'Speaker',emoji:'🔊'},
  {type:'rug',name:'Rug',emoji:'🟪'},
  {type:'art',name:'Wall Art',emoji:'🖼️'}
];
let session=null,user=null,profile=null;
let rooms=[];
let activeRoom=null;
let objects=[];
let selectedId=null;
let scaleFactor=1;

const identityText=$('#identityText'),roomList=$('#roomList'),floor=$('#floor'),stageName=$('#stageName'),stageMeta=$('#stageMeta'),inviteCode=$('#inviteCode'),membersNode=$('#members');

function toast(msg){const n=$('#toast');n.textContent=msg;n.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>n.classList.remove('show'),1700)}
function esc(v=''){return String(v).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]))}
function uid(){return crypto.randomUUID()}
function slugify(v){return String(v||'room').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,28)||'room'}
function localDraft(){try{return JSON.parse(localStorage.getItem('kinfolksworld_room_draft_v7')||'null')}catch{return null}}
function saveLocal(){localStorage.setItem('kinfolksworld_room_draft_v7',JSON.stringify({room:activeRoom,objects}))}

async function init(){
  const {data:{session:s}}=await supabase.auth.getSession();session=s;user=s?.user||null;
  if(user){
    const {data}=await supabase.from('profiles').select('display_name,username').eq('id',user.id).maybeSingle();profile=data||null;
    identityText.innerHTML=`<span class="good">Signed in</span> as ${esc(profile?.display_name||profile?.username||'Kinfolk')}`;
  }else identityText.textContent='Guest preview • room designs save locally';
  renderInventory();
  await loadRooms();
  const draft=localDraft();
  if(!activeRoom&&draft?.room){activeRoom=draft.room;objects=draft.objects||[];syncControls();renderObjects()}
  if(!activeRoom){activeRoom={id:'local-draft',name:'Local Room Draft',vibe:'loft',access_mode:'public',max_players:20,allow_chat:true,local:true};objects=[];syncControls();renderObjects()}
  renderRooms();
}

async function loadRooms(){
  const {data,error}=await supabase.from('kinfolksworld_rooms').select('id,owner_id,name,slug,vibe,access_mode,description,max_players,allow_chat').order('updated_at',{ascending:false}).limit(30);
  if(error){console.warn(error);rooms=[];return}
  rooms=data||[];
  if(user){const own=rooms.find(r=>r.owner_id===user.id);if(own)await selectRoom(own)}
}
function renderRooms(){
  const rows=[{id:'local-draft',name:'Local Room Draft',access_mode:'local',vibe:'loft',local:true},...rooms];
  roomList.innerHTML=rows.map(r=>`<button class="roomBtn ${activeRoom?.id===r.id?'active':''}" data-room="${r.id}"><b>${esc(r.name)}</b><small>${r.local?'Device only':esc(r.access_mode)} • ${esc(r.vibe)}</small></button>`).join('');
  $$('.roomBtn').forEach(b=>b.onclick=()=>{const id=b.dataset.room;if(id==='local-draft'){const d=localDraft();activeRoom=d?.room||{id:'local-draft',name:'Local Room Draft',vibe:'loft',access_mode:'public',max_players:20,allow_chat:true,local:true};objects=d?.objects||[];syncControls();renderRooms();renderObjects()}else{const r=rooms.find(x=>x.id===id);if(r)selectRoom(r)}})
}
async function selectRoom(room){
  activeRoom={...room,local:false};selectedId=null;
  const {data,error}=await supabase.from('kinfolksworld_room_objects').select('id,item_type,item_name,position,rotation_y,scale').eq('room_id',room.id).order('created_at');
  objects=error?[]:(data||[]).map(o=>({id:o.id,type:o.item_type,name:o.item_name,emoji:inventory.find(i=>i.type===o.item_type)?.emoji||'◼',x:Number(o.position?.x||0),y:Number(o.position?.y||0),rotation:Number(o.rotation_y||0),scale:Number(o.scale||1),cloud:true}));
  syncControls();renderRooms();renderObjects();await loadMembers();
}
function syncControls(){
  stageName.textContent=activeRoom?.name||'Room';
  stageMeta.textContent=activeRoom?.local?'Drag furniture anywhere on the floor':'Cloud room • furniture saves to Kinfolk';
  $('#editAccess').value=activeRoom?.access_mode||'public';
  $('#maxPlayers').value=activeRoom?.max_players||20;
  $('#allowChat').value=String(activeRoom?.allow_chat!==false);
  inviteCode.value='';membersNode.innerHTML='';
}

function renderInventory(){
  $('#inventory').innerHTML=inventory.map(i=>`<button data-item="${i.type}"><span>${i.emoji}</span><small>${esc(i.name)}</small></button>`).join('');
  $$('#inventory button').forEach(b=>b.onclick=()=>addObject(b.dataset.item));
}
function addObject(type){
  const item=inventory.find(i=>i.type===type);if(!item)return;
  const obj={id:uid(),type:item.type,name:item.name,emoji:item.emoji,x:46+Math.random()*120,y:90+Math.random()*100,rotation:0,scale:1,cloud:false};
  objects.push(obj);selectedId=obj.id;renderObjects();if(activeRoom?.local)saveLocal();
}
function renderObjects(){
  $$('.obj',floor).forEach(n=>n.remove());
  objects.forEach(o=>{
    const el=document.createElement('div');el.className='obj'+(o.id===selectedId?' selected':'');el.dataset.id=o.id;el.style.left=`${o.x}px`;el.style.top=`${o.y}px`;el.style.transform=`rotate(${o.rotation}rad) scale(${o.scale*scaleFactor})`;el.innerHTML=`<span>${o.emoji}</span><small>${esc(o.name)}</small>`;floor.appendChild(el);wireDrag(el,o)
  })
}
function wireDrag(el,obj){
  let sx=0,sy=0,ox=0,oy=0,drag=false;
  el.onpointerdown=e=>{selectedId=obj.id;renderObjects();const n=$(`.obj[data-id="${obj.id}"]`);if(!n)return;drag=true;sx=e.clientX;sy=e.clientY;ox=obj.x;oy=obj.y;n.setPointerCapture?.(e.pointerId)};
  el.onpointermove=e=>{if(!drag)return;obj.x=Math.max(0,Math.min(floor.clientWidth-68,ox+e.clientX-sx));obj.y=Math.max(0,Math.min(floor.clientHeight-68,oy+e.clientY-sy));el.style.left=`${obj.x}px`;el.style.top=`${obj.y}px`};
  el.onpointerup=()=>{drag=false;if(activeRoom?.local)saveLocal()};
}

$('#rotateItem').onclick=()=>{const o=objects.find(x=>x.id===selectedId);if(!o)return toast('Select furniture first');o.rotation=(o.rotation+Math.PI/4)%(Math.PI*2);renderObjects();if(activeRoom.local)saveLocal()};
$('#deleteItem').onclick=async()=>{const o=objects.find(x=>x.id===selectedId);if(!o)return toast('Select furniture first');if(o.cloud&&user&&!activeRoom.local){const {error}=await supabase.from('kinfolksworld_room_objects').delete().eq('id',o.id);if(error)return toast('Could not delete item')}objects=objects.filter(x=>x.id!==selectedId);selectedId=null;renderObjects();if(activeRoom.local)saveLocal()};
$('#clearLayout').onclick=async()=>{if(!activeRoom)return;if(activeRoom.local){objects=[];saveLocal();renderObjects();return toast('Local room cleared')}if(!user||activeRoom.owner_id!==user.id)return toast('Only the room owner can clear it');const {error}=await supabase.from('kinfolksworld_room_objects').delete().eq('room_id',activeRoom.id);if(error)return toast('Could not clear room');objects=[];renderObjects();toast('Room cleared')};
$('#zoomIn').onclick=()=>{scaleFactor=Math.min(1.5,scaleFactor+.1);renderObjects()};$('#zoomOut').onclick=()=>{scaleFactor=Math.max(.7,scaleFactor-.1);renderObjects()};

$('#createRoom').onclick=async()=>{
  const name=$('#roomName').value.trim()||'My Kinfolksworld Room',description=$('#roomDescription').value.trim(),vibe=$('#roomVibe').value,access=$('#roomAccess').value;
  if(!user){activeRoom={id:'local-draft',name,description,vibe,access_mode:access,max_players:20,allow_chat:true,local:true};objects=[];saveLocal();syncControls();renderRooms();renderObjects();return toast('Local room created')}
  const payload={owner_id:user.id,name,description,vibe,access_mode:access,is_public:access==='public',slug:`${slugify(name)}-${Math.random().toString(36).slice(2,7)}`,max_players:20,allow_chat:true};
  const {data,error}=await supabase.from('kinfolksworld_rooms').insert(payload).select().single();
  if(error)return toast('Could not create room');
  rooms.unshift(data);await selectRoom(data);toast('Cloud room created')
};

$('#saveSettings').onclick=async()=>{
  if(activeRoom.local){activeRoom.access_mode=$('#editAccess').value;activeRoom.max_players=Number($('#maxPlayers').value)||20;activeRoom.allow_chat=$('#allowChat').value==='true';saveLocal();renderRooms();return toast('Local settings saved')}
  if(!user||activeRoom.owner_id!==user.id)return toast('Only the room owner can change settings');
  const access=$('#editAccess').value,max=Math.max(2,Math.min(50,Number($('#maxPlayers').value)||20)),chat=$('#allowChat').value==='true';
  const {data,error}=await supabase.from('kinfolksworld_rooms').update({access_mode:access,is_public:access==='public',max_players:max,allow_chat:chat,updated_at:new Date().toISOString()}).eq('id',activeRoom.id).select().single();
  if(error)return toast('Could not save settings');activeRoom={...activeRoom,...data};rooms=rooms.map(r=>r.id===data.id?data:r);renderRooms();toast('Room settings saved')
};

$('#saveLayout').onclick=async()=>{
  if(activeRoom.local){saveLocal();return toast('Layout saved on this device')}
  if(!user||activeRoom.owner_id!==user.id)return toast('Only the room owner can save furniture');
  const unsaved=objects.filter(o=>!o.cloud);let failed=false;
  for(const o of unsaved){const {data,error}=await supabase.from('kinfolksworld_room_objects').insert({room_id:activeRoom.id,item_type:o.type,item_name:o.name,position:{x:o.x,y:o.y,z:0},rotation_y:o.rotation,scale:o.scale,created_by:user.id}).select().single();if(error){failed=true;continue}o.id=data.id;o.cloud=true}
  for(const o of objects.filter(o=>o.cloud)){await supabase.from('kinfolksworld_room_objects').update({position:{x:o.x,y:o.y,z:0},rotation_y:o.rotation,scale:o.scale,updated_at:new Date().toISOString()}).eq('id',o.id)}
  renderObjects();toast(failed?'Some furniture could not save':'Furniture saved to Kinfolk')
};

$('#makeInvite').onclick=async()=>{
  if(!user||activeRoom?.local)return toast('Sign in and select your cloud room first');
  if(activeRoom.owner_id!==user.id)return toast('Only the owner can create invites');
  const code=`KF-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  const {error}=await supabase.from('kinfolksworld_room_invites').insert({room_id:activeRoom.id,created_by:user.id,code,max_uses:25});
  if(error)return toast('Could not create invite');inviteCode.value=code;try{await navigator.clipboard.writeText(code);toast('Invite copied')}catch{toast('Invite created')}
};

$('#joinInvite').onclick=async()=>{
  const code=prompt('Enter Kinfolksworld invite code');if(!code)return;if(!user)return toast('Sign in to Kinfolk to redeem invites');
  const {data,error}=await supabase.rpc('kinfolksworld_redeem_room_invite',{p_code:code.trim()});if(error)return toast('Invite invalid or expired');await loadRooms();const r=rooms.find(x=>x.id===data);if(r)await selectRoom(r);renderRooms();toast('Room unlocked')
};

async function loadMembers(){
  if(!user||activeRoom?.local||activeRoom.owner_id!==user.id){membersNode.innerHTML='';return}
  const {data}=await supabase.from('kinfolksworld_room_members').select('user_id,role,status').eq('room_id',activeRoom.id).order('created_at');
  if(!data?.length){membersNode.innerHTML='';return}
  const ids=data.map(x=>x.user_id);const {data:profiles}=await supabase.from('profiles').select('id,display_name,username').in('id',ids);const names=new Map((profiles||[]).map(p=>[p.id,p.display_name||p.username||'Kinfolk']));
  membersNode.innerHTML='<div style="margin-top:12px;font-size:10px;font-weight:900;color:#b7a6ff">MEMBERS</div>'+data.map(m=>`<div class="member"><div><b style="font-size:11px">${esc(names.get(m.user_id)||m.user_id.slice(0,8))}</b><small>${esc(m.role)} • ${esc(m.status)}</small></div>${m.user_id!==user.id?`<button class="ghost" data-promote="${m.user_id}">${m.role==='moderator'?'Make member':'Make mod'}</button>`:''}</div>`).join('');
  $$('[data-promote]').forEach(b=>b.onclick=async()=>{const row=data.find(x=>x.user_id===b.dataset.promote);if(!row)return;const role=row.role==='moderator'?'member':'moderator';const {error}=await supabase.from('kinfolksworld_room_members').update({role}).eq('room_id',activeRoom.id).eq('user_id',row.user_id);if(error)return toast('Could not update role');toast(role==='moderator'?'Moderator added':'Moderator removed');loadMembers()})
}

$('#backWorld').onclick=()=>{location.href='./realistic-v6.html'};

init();