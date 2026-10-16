import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://zojajuzmfjpvubzibzgg.supabase.co';
const SUPABASE_KEY='sb_publishable_1te_hrDXQciMD7Gp1EXmRw_dvQmszvi';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const frame=document.getElementById('worldInner');
let doc=null, win=null, session=null, localUserId=null, selectedId=null, selectedName='Kinfolk', socialChannel=null, activeSocialTopic='', activeRoom=null;

const uuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const safe=v=>String(v??'').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
function roomSlug(){try{return new URLSearchParams(win.location.hash.replace(/^#/,'' )).get('room')||'skyline'}catch{return'skyline'}}
function toast(msg){const n=doc?.getElementById('socialToast')||doc?.getElementById('mpToast');if(!n)return;n.textContent=msg;n.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>n.classList.remove('show'),2200)}
function clickAction(action){doc?.querySelector(`#mpActions [data-action="${action}"]`)?.click()}
function sparkle(label='✨'){const host=doc?.getElementById('v11Burst');if(!host)return;host.innerHTML='';for(let i=0;i<12;i++){const s=doc.createElement('span');s.textContent=i%3===0?label:'✨';s.style.setProperty('--x',`${(Math.random()-.5)*210}px`);s.style.setProperty('--y',`${-50-Math.random()*160}px`);s.style.setProperty('--r',`${(Math.random()-.5)*80}deg`);s.style.animationDelay=`${i*20}ms`;host.appendChild(s)}setTimeout(()=>host.innerHTML='',1200)}

async function refreshIdentity(){const {data:{session:s}}=await supabase.auth.getSession();session=s;localUserId=s?.user?.id||null}
await refreshIdentity();
supabase.auth.onAuthStateChange((_e,s)=>{session=s;localUserId=s?.user?.id||null;refreshSelected()});

async function currentRoom(){const slug=roomSlug();if(['skyline','afterglow','sunset','local-draft'].includes(slug))return null;if(activeRoom?.slug===slug)return activeRoom;const {data}=await supabase.from('kinfolksworld_rooms').select('id,slug,owner_id,name,access_mode').eq('slug',slug).maybeSingle();activeRoom=data||null;return activeRoom}

function rosterPerson(id){const el=doc?.querySelector(`#mpRoster .person[data-player="${CSS.escape(String(id))}"]`);return el?{id,name:el.querySelector('.personName')?.textContent?.replace(/\s+\(you\)$/,'').trim()||'Kinfolk'}:null}
async function isBlocked(targetId){if(!localUserId||!uuid(targetId))return false;const {data}=await supabase.from('blocks').select('blocked_id').eq('blocker_id',localUserId).eq('blocked_id',targetId).maybeSingle();return Boolean(data)}
async function isRoomOwner(){const room=await currentRoom();return Boolean(room&&localUserId&&room.owner_id===localUserId)}

async function connectSocialChannel(){const slug=roomSlug(),topic=`kinfolksworld-social:${slug}`;if(topic===activeSocialTopic&&socialChannel)return;if(socialChannel){try{await supabase.removeChannel(socialChannel)}catch{}}activeSocialTopic=topic;socialChannel=supabase.channel(topic);
socialChannel
 .on('broadcast',{event:'player_interaction'},({payload})=>handleInteraction(payload))
 .on('broadcast',{event:'room_remove'},({payload})=>handleRoomRemove(payload))
 .subscribe();}

async function sendInteraction(kind,targetId){if(!socialChannel)await connectSocialChannel();if(!localUserId)return toast('Sign in through Kinfolk to interact');if(!uuid(targetId)||targetId===localUserId)return;
 if(kind==='wave'){clickAction('wave');sparkle('👋');toast(`You waved at ${selectedName}`)}
 if(kind==='highfive'){clickAction('wave');sparkle('✋');toast(`High five sent to ${selectedName}`)}
 await socialChannel?.send({type:'broadcast',event:'player_interaction',payload:{from:localUserId,to:targetId,kind,name:localDisplayName(),t:Date.now()}})}
function localDisplayName(){const row=[...doc?.querySelectorAll('#mpRoster .person')||[]].find(x=>/\(you\)/.test(x.querySelector('.personName')?.textContent||''));return row?.querySelector('.personName')?.textContent?.replace(/\s+\(you\)$/,'').trim()||'Kinfolk'}
function handleInteraction(p){if(!p||p.from===localUserId||p.to!==localUserId)return;const name=safe(p.name||'A player');if(p.kind==='wave'){sparkle('👋');toast(`${name} waved at you`)}else if(p.kind==='highfive'){clickAction('wave');sparkle('✋');toast(`${name} high-fived you`)}}
function handleRoomRemove(p){if(!p||p.to!==localUserId)return;toast('The room owner removed you from this room');setTimeout(()=>{doc?.getElementById('roomButton')?.click();setTimeout(()=>doc?.querySelector('[data-room="skyline"]')?.click(),150)},650)}

async function toggleBlock(targetId){if(!localUserId||!uuid(targetId))return toast('Sign in through Kinfolk first');const blocked=await isBlocked(targetId);if(blocked){const {error}=await supabase.from('blocks').delete().eq('blocker_id',localUserId).eq('blocked_id',targetId);toast(error?'Could not unblock':'Player unblocked')}else{const {error}=await supabase.from('blocks').insert({blocker_id:localUserId,blocked_id:targetId});toast(error?'Could not block player':'Player blocked')}await refreshSelected()}

function openReport(targetId,name){const modal=doc?.getElementById('v11Report');if(!modal)return;modal.dataset.target=targetId;modal.dataset.name=name||'Kinfolk';modal.classList.add('open')}
function closeReport(){doc?.getElementById('v11Report')?.classList.remove('open')}
async function submitReport(){const modal=doc?.getElementById('v11Report');if(!modal||!localUserId)return toast('Sign in through Kinfolk first');const target=modal.dataset.target,reason=safe(doc.getElementById('v11ReportReason')?.value||'other');if(!uuid(target))return;const {error}=await supabase.from('kinfolk_reports').insert({reporter_id:localUserId,target_type:'profile',target_id:target,reason,status:'open'});closeReport();toast(error?'Could not submit report':'Report submitted for review')}

async function removeFromRoom(targetId){const room=await currentRoom();if(!room||room.owner_id!==localUserId)return toast('Only the room owner can do that');if(!uuid(targetId)||targetId===localUserId)return;
 const {error}=await supabase.from('kinfolksworld_room_members').upsert({room_id:room.id,user_id:targetId,role:'guest',status:'removed',invited_by:localUserId},{onConflict:'room_id,user_id'});
 if(error)return toast('Could not update room member state');if(!socialChannel)await connectSocialChannel();await socialChannel.send({type:'broadcast',event:'room_remove',payload:{to:targetId,room_id:room.id,by:localUserId,t:Date.now()}});toast(`${selectedName} removed from this session`)}

async function actionBar(targetId){if(!uuid(targetId)||targetId===localUserId)return'';if(!localUserId)return'<div class="v11Note">Sign in through Kinfolk to wave, high-five, block, or report.</div>';const [blocked,owner]=await Promise.all([isBlocked(targetId),isRoomOwner()]);return `<div class="v11ActionGrid"><button data-v11-action="wave">👋 Wave</button><button data-v11-action="highfive">✋ High five</button><button data-v11-action="block" class="${blocked?'':'dangerLite'}">${blocked?'Unblock':'Block'}</button><button data-v11-action="report" class="dangerLite">Report</button>${owner?'<button data-v11-action="remove" class="dangerLite wide">Remove from room</button>':''}</div><div class="v11Note">Block and report use your real Kinfolk account. Room removal is immediate for this session.</div>`}

async function refreshSelected(){if(!doc||!selectedId)return;const card=doc.getElementById('socialProfileCard');if(!card)return;card.querySelector('.v11Extras')?.remove();const wrap=doc.createElement('div');wrap.className='v11Extras';wrap.innerHTML=await actionBar(selectedId);card.appendChild(wrap)}
function selectPlayer(id,name){selectedId=id;selectedName=name||rosterPerson(id)?.name||'Kinfolk';setTimeout(refreshSelected,120)}

function installAtmosphere(){if(doc.getElementById('v11Atmosphere'))return;const a=doc.createElement('div');a.id='v11Atmosphere';a.innerHTML='<div class="v11Vignette"></div><div class="v11Dust"></div><div id="v11Burst"></div>';doc.getElementById('mpLayer')?.appendChild(a);const dust=a.querySelector('.v11Dust');for(let i=0;i<20;i++){const p=doc.createElement('i');p.style.left=`${Math.random()*100}%`;p.style.top=`${20+Math.random()*70}%`;p.style.animationDelay=`${Math.random()*7}s`;p.style.animationDuration=`${5+Math.random()*6}s`;dust.appendChild(p)}}
function injectStyles(){if(doc.getElementById('v11Styles'))return;const s=doc.createElement('style');s.id='v11Styles';s.textContent=`
.v11Extras{margin-top:14px;padding-top:13px;border-top:1px solid rgba(255,255,255,.1)}.v11ActionGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.v11ActionGrid button{border:1px solid rgba(255,255,255,.11);background:#1a2030;color:#fff;border-radius:13px;padding:10px;font-weight:850}.v11ActionGrid .wide{grid-column:1/-1}.v11ActionGrid .dangerLite{background:#2a1820;border-color:rgba(255,105,135,.25)}.v11Note{font-size:9px;color:#8f98ad;line-height:1.35;margin-top:9px}.v11ReportBack{position:fixed;inset:0;z-index:170;background:rgba(0,0,0,.62);display:none;place-items:center;padding:20px;pointer-events:auto}.v11ReportBack.open{display:grid}.v11ReportCard{width:min(360px,94vw);background:#131824;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:16px;box-shadow:0 22px 60px rgba(0,0,0,.45)}.v11ReportCard h3{margin:0 0 8px}.v11ReportCard p{font-size:11px;color:#9da5b9;line-height:1.4}.v11ReportCard select{width:100%;background:#0d111a;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:11px}.v11ReportBtns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.v11ReportBtns button{border:0;border-radius:12px;padding:10px;font-weight:900}.v11Cancel{background:#262c3a;color:#fff}.v11Submit{background:linear-gradient(135deg,#d84970,#8a63ff);color:#fff}#v11Atmosphere{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1}.mpHud{z-index:3}.v11Vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,transparent 45%,rgba(0,0,0,.28) 100%),linear-gradient(180deg,rgba(80,92,150,.06),transparent 30%,rgba(0,0,0,.1));mix-blend-mode:screen}.v11Dust{position:absolute;inset:0}.v11Dust i{position:absolute;width:2px;height:2px;border-radius:50%;background:rgba(255,255,255,.55);box-shadow:0 0 8px rgba(150,175,255,.55);animation:v11Float 8s linear infinite;opacity:0}.v11Dust i:nth-child(3n){width:3px;height:3px}.v11Dust i:nth-child(4n){background:rgba(180,150,255,.7)}#v11Burst{position:fixed;left:50%;top:52%;z-index:180;pointer-events:none}#v11Burst span{position:absolute;font-size:22px;animation:v11Pop .9s ease-out forwards}@keyframes v11Float{0%{transform:translateY(35px);opacity:0}20%{opacity:.35}80%{opacity:.18}100%{transform:translateY(-85px);opacity:0}}@keyframes v11Pop{0%{transform:translate(0,0) scale(.4) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(var(--x),var(--y)) scale(1.25) rotate(var(--r));opacity:0}}`;
doc.head.appendChild(s)}
function injectReport(){if(doc.getElementById('v11Report'))return;const m=doc.createElement('div');m.id='v11Report';m.className='v11ReportBack';m.innerHTML=`<div class="v11ReportCard"><h3>Report player</h3><p>Choose the closest reason. This sends the report to Kinfolk moderation for review.</p><select id="v11ReportReason"><option value="harassment">Harassment or bullying</option><option value="hate_or_abuse">Hate or abusive behavior</option><option value="sexual_content">Sexual or explicit content</option><option value="spam_or_scam">Spam or scam</option><option value="impersonation">Impersonation</option><option value="other">Other</option></select><div class="v11ReportBtns"><button class="v11Cancel" id="v11ReportCancel">Cancel</button><button class="v11Submit" id="v11ReportSubmit">Submit report</button></div></div>`;doc.body.appendChild(m);doc.getElementById('v11ReportCancel').addEventListener('click',closeReport);doc.getElementById('v11ReportSubmit').addEventListener('click',submitReport);m.addEventListener('click',e=>{if(e.target===m)closeReport()})}

function wire(){
 const card=doc.getElementById('socialProfileCard'), list=doc.getElementById('socialPlayerList'), roster=doc.getElementById('mpRoster');
 const capture=e=>{const p=e.target.closest?.('[data-social-player],.person[data-player]');if(!p)return;const id=p.dataset.socialPlayer||p.dataset.player;const name=p.querySelector('.personName')?.textContent?.replace(/\s+\(you\)$/,'').trim()||p.querySelector('b')?.textContent||'Kinfolk';selectPlayer(id,name)};
 list?.addEventListener('click',capture,true);roster?.addEventListener('click',capture,true);
 card?.addEventListener('click',async e=>{const b=e.target.closest('[data-v11-action]');if(!b)return;const a=b.dataset.v11Action;if(a==='wave'||a==='highfive')await sendInteraction(a,selectedId);else if(a==='block')await toggleBlock(selectedId);else if(a==='report')openReport(selectedId,selectedName);else if(a==='remove')await removeFromRoom(selectedId)});
 win.addEventListener('hashchange',async()=>{activeRoom=null;selectedId=null;await connectSocialChannel()});
 new MutationObserver(()=>{if(selectedId&&doc.getElementById('socialProfileCard')&&!doc.querySelector('.v11Extras'))refreshSelected()}).observe(card||doc.body,{childList:true,subtree:true});
}

async function boot(){try{doc=frame.contentDocument;win=frame.contentWindow}catch{return}if(!doc||!win)return;injectStyles();injectReport();installAtmosphere();wire();await connectSocialChannel();}
frame.addEventListener('load',boot);
if(frame.contentDocument?.readyState==='complete')boot();
