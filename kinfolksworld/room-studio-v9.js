import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';
const SUPABASE_URL='https://zojajuzmfjpvubzibzgg.supabase.co';
const SUPABASE_KEY='sb_publishable_1te_hrDXQciMD7Gp1EXmRw_dvQmszvi';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const frame=document.getElementById('studioInner');
const lifeItems=[
 {type:'bed',name:'Modern Bed',emoji:'🛏️'},
 {type:'tv',name:'Smart TV',emoji:'📺'},
 {type:'door',name:'Interior Door',emoji:'🚪'}
];
let injected=false;
function notify(){try{parent.postMessage({type:'kinfolksworld-layout-saved',at:Date.now()},'*')}catch{}}
function activeRoomId(doc){return doc.querySelector('.roomBtn.active')?.dataset.room||'local-draft'}
function readDraft(){try{return JSON.parse(localStorage.getItem('kinfolksworld_room_draft_v7')||'null')}catch{return null}}
function saveDraft(d){localStorage.setItem('kinfolksworld_room_draft_v7',JSON.stringify(d))}
function safeText(v=''){return String(v).replace(/[<>]/g,'').trim().slice(0,120)}
function httpsUrl(v=''){if(!v.trim())return'';try{const u=new URL(v.trim());return u.protocol==='https:'?u.href:''}catch{return''}}
function reloadSoon(){notify();setTimeout(()=>{frame.src='./room-studio-v7.html?life='+Date.now()},350)}

async function addLifeItem(doc,item){
 const id=activeRoomId(doc);
 if(id==='local-draft'){
   const draft=readDraft()||{room:{id:'local-draft',name:'Local Room Draft',vibe:'loft',access_mode:'public',max_players:20,allow_chat:true,local:true},objects:[]};
   draft.objects=draft.objects||[];draft.objects.push({id:crypto.randomUUID(),type:item.type,name:item.name,emoji:item.emoji,x:150+Math.random()*180,y:130+Math.random()*180,rotation:0,scale:1,cloud:false});saveDraft(draft);reloadSoon();return;
 }
 const {data:{session}}=await supabase.auth.getSession();if(!session?.user)return alert('Sign in to Kinfolk to add cloud furniture.');
 const {error}=await supabase.from('kinfolksworld_room_objects').insert({room_id:id,item_type:item.type,item_name:item.name,position:{x:170+Math.random()*150,y:150+Math.random()*150,z:0},rotation_y:0,scale:1,created_by:session.user.id});
 if(error)return alert('Could not add this item. Make sure you own the selected room.');reloadSoon();
}

async function loadAudio(doc){
 const id=activeRoomId(doc),url=doc.getElementById('lifeAudioUrl'),title=doc.getElementById('lifeAudioTitle'),vol=doc.getElementById('lifeAudioVolume'),auto=doc.getElementById('lifeAudioAutoplay'),status=doc.getElementById('lifeAudioStatus');if(!url)return;
 if(id==='local-draft'){const d=readDraft();const r=d?.room||{};url.value=r.room_audio_url||'';title.value=r.room_audio_title||'';vol.value=Number(r.room_audio_volume??60);auto.checked=Boolean(r.room_audio_autoplay);status.textContent='Device room audio';return}
 const {data,error}=await supabase.from('kinfolksworld_rooms').select('room_audio_url,room_audio_title,room_audio_volume,room_audio_autoplay,owner_id').eq('id',id).maybeSingle();if(error||!data){status.textContent='Audio settings unavailable';return}url.value=data.room_audio_url||'';title.value=data.room_audio_title||'';vol.value=Number(data.room_audio_volume??60);auto.checked=Boolean(data.room_audio_autoplay);status.textContent='Cloud room audio';
}

async function saveAudio(doc){
 const id=activeRoomId(doc),raw=doc.getElementById('lifeAudioUrl').value,url=httpsUrl(raw),title=safeText(doc.getElementById('lifeAudioTitle').value),volume=Math.max(0,Math.min(100,Number(doc.getElementById('lifeAudioVolume').value)||0)),autoplay=doc.getElementById('lifeAudioAutoplay').checked,status=doc.getElementById('lifeAudioStatus');
 if(raw.trim()&&!url){status.textContent='Use a direct HTTPS audio link';return}
 if(id==='local-draft'){const d=readDraft()||{room:{id:'local-draft',name:'Local Room Draft',vibe:'loft',access_mode:'public',max_players:20,allow_chat:true,local:true},objects:[]};d.room={...(d.room||{}),room_audio_url:url,room_audio_title:title,room_audio_volume:volume,room_audio_autoplay:autoplay};saveDraft(d);status.textContent='Audio saved on this device';notify();return}
 const {data:{session}}=await supabase.auth.getSession();if(!session?.user){status.textContent='Sign in to save cloud audio';return}
 const {error}=await supabase.from('kinfolksworld_rooms').update({room_audio_url:url,room_audio_title:title,room_audio_volume:volume,room_audio_autoplay:autoplay,updated_at:new Date().toISOString()}).eq('id',id);status.textContent=error?'Could not save. Only the room owner can change audio.':'Room audio saved';if(!error)notify();
}

function inject(doc){
 if(!doc||injected)return;injected=true;
 const side=doc.querySelector('.side'),inventory=doc.getElementById('inventory');if(!side||!inventory)return;
 const style=doc.createElement('style');style.textContent=`.lifeCard{background:rgba(21,25,37,.92);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:14px;margin-bottom:12px}.lifeCard h3{margin:0 0 10px;font-size:14px}.lifeGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.lifeGrid button{border:1px solid rgba(255,255,255,.1);background:#10141e;color:#fff;border-radius:14px;min-height:72px;padding:8px}.lifeGrid span{display:block;font-size:24px}.lifeGrid small{display:block;color:#aab0c2;font-size:9px}.lifeField{display:grid;gap:6px;margin:9px 0;font-size:10px;color:#d9dce7}.lifeField input{width:100%;border:1px solid rgba(255,255,255,.1);background:#0d1018;color:#fff;border-radius:12px;padding:10px}.lifeRow{display:grid;grid-template-columns:1fr 90px;gap:8px}.lifeSave{width:100%;border:0;background:linear-gradient(135deg,#8a63ff,#5e87ff);color:#fff;border-radius:13px;padding:10px;font-weight:900}.lifeStatus{font-size:9px;color:#aab0c2;margin-top:7px}.lifeCheck{display:flex;align-items:center;gap:7px;font-size:10px;color:#d9dce7}`;doc.head.appendChild(style);
 const life=doc.createElement('section');life.className='lifeCard';life.innerHTML=`<h3>Room Life</h3><div class="lifeGrid">${lifeItems.map(i=>`<button data-life-item="${i.type}"><span>${i.emoji}</span><small>${i.name}</small></button>`).join('')}</div><div class="lifeStatus">Beds, TVs and doors become interactive inside multiplayer.</div>`;
 const furnitureCard=inventory.closest('.card');furnitureCard?.after(life);
 life.querySelectorAll('[data-life-item]').forEach(b=>b.addEventListener('click',()=>addLifeItem(doc,lifeItems.find(i=>i.type===b.dataset.lifeItem))));
 const audio=doc.createElement('section');audio.className='lifeCard';audio.innerHTML=`<h3>Room music</h3><label class="lifeField">Track title<input id="lifeAudioTitle" maxlength="120" placeholder="Late Night Lounge"></label><label class="lifeField">Direct HTTPS audio URL<input id="lifeAudioUrl" inputmode="url" placeholder="https://.../song.mp3"></label><div class="lifeRow"><label class="lifeField">Volume<input id="lifeAudioVolume" type="number" min="0" max="100" value="60"></label><label class="lifeCheck"><input id="lifeAudioAutoplay" type="checkbox">Start on entry</label></div><button class="lifeSave" id="lifeSaveAudio">Save room audio</button><div class="lifeStatus" id="lifeAudioStatus">Use audio you have permission to play. Browsers may require a tap before sound starts.</div>`;
 life.after(audio);audio.querySelector('#lifeSaveAudio').addEventListener('click',()=>saveAudio(doc));
 const roomList=doc.getElementById('roomList');roomList?.addEventListener('click',()=>setTimeout(()=>loadAudio(doc),300));
 for(const id of ['saveLayout','saveSettings','clearLayout','createRoom'])doc.getElementById(id)?.addEventListener('click',()=>{setTimeout(notify,700);setTimeout(notify,1500)});
 const back=doc.getElementById('backWorld');if(back)back.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();notify();parent.postMessage('kinfolksworld-close-studio','*')},{capture:true});
 loadAudio(doc);
}
frame.addEventListener('load',()=>{injected=false;let doc;try{doc=frame.contentDocument}catch{return}inject(doc)});