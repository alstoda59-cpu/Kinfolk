import './room-studio-v9.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://zojajuzmfjpvubzibzgg.supabase.co';
const SUPABASE_KEY='sb_publishable_1te_hrDXQciMD7Gp1EXmRw_dvQmszvi';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const frame=document.getElementById('studioInner');
const MAX_AUDIO=6*1024*1024;
const ALLOWED=new Set(['audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm','audio/x-m4a']);
let enhanced=false;
function notify(){try{parent.postMessage({type:'kinfolksworld-layout-saved',at:Date.now()},'*')}catch{}}
function activeRoomId(doc){return doc.querySelector('.roomBtn.active')?.dataset.room||'local-draft'}
function safeName(v='audio'){return String(v).normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(-90)||'audio'}
function baseTitle(name='Room track'){return name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim().slice(0,120)||'Room track'}
async function uploadAudio(doc){
  const input=doc.getElementById('lifeAudioFile'),status=doc.getElementById('lifeAudioStatus'),upload=doc.getElementById('lifeUploadAudio');const file=input?.files?.[0],roomId=activeRoomId(doc);
  if(roomId==='local-draft'){status.textContent='Cloud audio uploads require a signed-in Kinfolk room.';return}if(!file){status.textContent='Choose an audio file first.';return}if(file.size>MAX_AUDIO){status.textContent='Audio must be 6 MB or smaller.';return}if(!ALLOWED.has(file.type)){status.textContent='Use MP3, M4A/MP4 audio, OGG, WAV, or WebM audio.';return}
  const {data:{session}}=await supabase.auth.getSession();if(!session?.user){status.textContent='Sign in through Kinfolk to upload room audio.';return}
  const {data:room,error:roomError}=await supabase.from('kinfolksworld_rooms').select('id,owner_id,room_audio_url').eq('id',roomId).maybeSingle();if(roomError||!room||room.owner_id!==session.user.id){status.textContent='Only the room owner can upload its music.';return}
  upload.disabled=true;upload.textContent='Uploading…';status.textContent='Uploading room audio…';const path=`${session.user.id}/${room.id}/${Date.now()}-${crypto.randomUUID()}-${safeName(file.name)}`;
  const {data:stored,error}=await supabase.storage.from('kinfolksworld-audio').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});if(error||!stored){upload.disabled=false;upload.textContent='Upload audio';status.textContent=error?.message||'Audio upload failed.';return}
  const {data:publicData}=supabase.storage.from('kinfolksworld-audio').getPublicUrl(stored.path);const publicUrl=publicData?.publicUrl||'';if(!publicUrl){await supabase.storage.from('kinfolksworld-audio').remove([stored.path]);upload.disabled=false;upload.textContent='Upload audio';status.textContent='Could not create audio URL.';return}
  const title=doc.getElementById('lifeAudioTitle');const newTitle=(title?.value||'').trim()||baseTitle(file.name);const {error:updateError}=await supabase.from('kinfolksworld_rooms').update({room_audio_url:publicUrl,room_audio_title:newTitle,updated_at:new Date().toISOString()}).eq('id',room.id).eq('owner_id',session.user.id);
  if(updateError){await supabase.storage.from('kinfolksworld-audio').remove([stored.path]);upload.disabled=false;upload.textContent='Upload audio';status.textContent='Uploaded file could not be attached to this room.';return}
  const urlInput=doc.getElementById('lifeAudioUrl');if(urlInput)urlInput.value=publicUrl;if(title&&!title.value.trim())title.value=newTitle;upload.disabled=false;upload.textContent='Replace audio';status.textContent='Audio uploaded and attached to this room.';notify();
}
function enhance(doc){if(!doc||enhanced)return;const status=doc.getElementById('lifeAudioStatus'),save=doc.getElementById('lifeSaveAudio');if(!status||!save){setTimeout(()=>enhance(doc),80);return}enhanced=true;const style=doc.createElement('style');style.textContent=`.lifeUploadBox{margin-top:10px;padding:10px;border:1px dashed rgba(255,255,255,.16);border-radius:14px;background:rgba(255,255,255,.025)}.lifeUploadBox input[type=file]{display:block;width:100%;font-size:10px;color:#cfd3df;margin:0 0 8px}.lifeUploadBox button{width:100%;border:0;border-radius:12px;padding:10px;background:#242b3c;color:#fff;font-weight:900}.lifeUploadBox button:disabled{opacity:.55}.lifeUploadHint{font-size:9px;color:#8f97aa;margin-top:7px;line-height:1.35}`;doc.head.appendChild(style);const box=doc.createElement('div');box.className='lifeUploadBox';box.innerHTML=`<input id="lifeAudioFile" type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm,audio/x-m4a"><button id="lifeUploadAudio">Upload audio</button><div class="lifeUploadHint">Owner uploads only · MP3/M4A/OGG/WAV/WebM · 6 MB max · use audio you have permission to share.</div>`;save.before(box);box.querySelector('#lifeUploadAudio').addEventListener('click',()=>uploadAudio(doc))}
frame.addEventListener('load',()=>{enhanced=false;let doc;try{doc=frame.contentDocument}catch{return}setTimeout(()=>enhance(doc),20)});