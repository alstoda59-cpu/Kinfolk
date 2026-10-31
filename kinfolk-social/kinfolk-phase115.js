(()=>{if(window.__kinfolkPhase115)return;window.__kinfolkPhase115=true;
const BUCKETS=['kinfolk-media','kinfolk-video','kinfolk-wallpapers'];let savedApp=null,deleting=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function setText(id,t){const e=document.getElementById(id);if(e)e.textContent=t||''}
function errText(e){const m=String(e?.message||e||'');if(/kinfolk_delete_my_account|Could not find the function|schema cache/i.test(m))return 'Account deletion backend is not enabled on this preview yet. Your account and media were not changed.';return m||'Account deletion could not be completed.'}
async function walk(bucket,prefix,out,depth=0){if(depth>10)throw new Error('Media folder nesting is too deep.');let off=0;for(;;){const{data,error}=await sb.storage.from(bucket).list(prefix,{limit:100,offset:off,sortBy:{column:'name',order:'asc'}});if(error)throw error;const rows=data||[];for(const item of rows){const full=prefix?prefix+'/'+item.name:item.name;if(item.id)out.push(full);else await walk(bucket,full,out,depth+1)}if(rows.length<100)break;off+=rows.length}}
async function collect(bucket,uid){const out=[];await walk(bucket,uid,out);return[...new Set(out)].filter(p=>p===uid||p.startsWith(uid+'/'))}
async function remove(bucket,paths){for(let i=0;i<paths.length;i+=100){const part=paths.slice(i,i+100);if(!part.length)continue;const{error}=await sb.storage.from(bucket).remove(part);if(error)throw error}}
function closeModal(){if(deleting)return;document.getElementById('kf115-delete-overlay')?.remove();const app=document.getElementById('app');if(app&&savedApp){app.style.pointerEvents=savedApp.pointer;app.style.visibility=savedApp.visibility}savedApp=null;document.body.style.overflow=''}
function openModal(){if(deleting)return;document.getElementById('kf78-overlay')?.remove();document.getElementById('kf115-delete-overlay')?.remove();const app=document.getElementById('app');if(app){savedApp={pointer:app.style.pointerEvents,visibility:app.style.visibility};app.style.pointerEvents='none'}document.body.style.overflow='hidden';const ov=document.createElement('div');ov.id='kf115-delete-overlay';ov.dataset.kf115Owner=state?.user?.id||'';ov.dataset.kf115Epoch=String(typeof kf129Epoch==='undefined'?'':kf129Epoch);ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.style.cssText='position:fixed;inset:0;z-index:2147483646;background:rgba(5,5,10,.82);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;pointer-events:auto';ov.innerHTML='<div style="width:min(520px,100%);max-height:88vh;overflow:auto;background:#211f29;border:1px solid #514b61;border-radius:22px;padding:20px;box-sizing:border-box;box-shadow:0 24px 80px rgba(0,0,0,.6)"><h2 style="margin:0 0 8px">Delete account</h2><p style="color:#c8c3d1;line-height:1.45">Permanently delete your Kinfolk account, profile, messages, posts, photos, videos, wallpapers and other member data. This cannot be undone.</p><p style="color:#ffb6ca;font-weight:700">Type DELETE to continue.</p><input id="kf115-word" autocomplete="off" spellcheck="false" placeholder="DELETE" style="width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:1px solid #5a5368;background:#17151c;color:white;font:inherit"><label style="display:flex;gap:10px;align-items:flex-start;margin:14px 0;color:#ddd"><input id="kf115-understand" type="checkbox" style="margin-top:3px"> <span>I understand this permanently deletes my account and associated data.</span></label><div id="kf115-status" style="min-height:22px;color:#ffb6ca;margin:8px 0"></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="kf115-confirm" type="button" disabled style="background:#c92f5f">Delete my account</button><button id="kf115-cancel" type="button" style="background:#454050">Cancel</button></div></div>';document.body.appendChild(ov);const sync=()=>{document.getElementById('kf115-confirm').disabled=!(document.getElementById('kf115-word').value.trim()==='DELETE'&&document.getElementById('kf115-understand').checked)};document.getElementById('kf115-word').addEventListener('input',sync);document.getElementById('kf115-understand').addEventListener('change',sync);document.getElementById('kf115-cancel').onclick=closeModal;document.getElementById('kf115-confirm').onclick=doDelete}
// Recovery347: account deletion must never continue after a different login,
// session epoch, token or confirmation modal replaces the initiating account.
async function doDelete(){
  const btn=document.getElementById('kf115-confirm');
  if(!btn||btn.disabled||deleting)return;
  const overlay=document.getElementById('kf115-delete-overlay');
  const uid=state?.user?.id;
  const epoch=typeof kf129Epoch==='undefined'?null:kf129Epoch;
  const current=()=>!!uid&&!!overlay&&overlay.isConnected!==false
    &&document.getElementById('kf115-delete-overlay')===overlay
    &&overlay.dataset.kf115Owner===uid
    &&overlay.dataset.kf115Epoch===String(epoch??'')
    &&state?.user?.id===uid
    &&(epoch===null||kf129Epoch===epoch);
  if(!current()){
    setText('kf115-status','Your login changed. Reopen account deletion while signed in.');
    btn.disabled=true;
    return;
  }
  deleting=true;
  btn.disabled=true;
  let accessToken=null,refreshToken=null;
  async function verifySession(){
    if(!current())throw new Error('Your login changed. Account deletion stopped.');
    const {data,error}=await sb.auth.getSession();
    if(error)throw error;
    if(!current()||data?.session?.user?.id!==uid||!data.session.access_token)
      throw new Error('Your login changed. Account deletion stopped.');
    if(accessToken===null){
      accessToken=data.session.access_token;
      refreshToken=data.session.refresh_token||'';
    }else if(data.session.access_token!==accessToken||(data.session.refresh_token||'')!==refreshToken){
      throw new Error('Your login session was refreshed. Reopen account deletion to confirm again.');
    }
  }
  setText('kf115-status','Verifying your account…');
  try{
    await verifySession();
    const check=await sb.rpc('kinfolk_delete_my_account',{p_confirm:'CHECK'});
    if(check.error)throw check.error;
    await verifySession();
    if(check.data?.ready!==true)throw new Error('Account deletion was not explicitly approved by the backend. No private media was removed.');
    // Resolve every required storage bucket before removing any object. A late
    // missing/denied bucket must not leave earlier buckets partially deleted.
    setText('kf115-status','Checking private Kinfolk media folders…');
    const stagedMedia=[];
    for(const bucket of BUCKETS){
      await verifySession();
      const paths=await collect(bucket,uid);
      await verifySession();
      stagedMedia.push({bucket,paths});
    }
    setText('kf115-status','Removing your private Kinfolk media…');
    for(const {bucket,paths} of stagedMedia){
      for(let i=0;i<paths.length;i+=100){
        await verifySession();
        const {error}=await sb.storage.from(bucket).remove(paths.slice(i,i+100));
        if(error)throw error;
        await verifySession();
      }
    }
    await verifySession();
    setText('kf115-status','Deleting your account…');
    const del=await sb.rpc('kinfolk_delete_my_account',{p_confirm:'DELETE'});
    if(del.error)throw del.error;
    if(del.data?.deleted!==true)throw new Error('Account deletion was not confirmed by the backend. Check your account status before retrying.');
    // The server may have removed the auth user; never sign out a newer login.
    if(!current())return;
    setText('kf115-status','Account deleted. Signing out…');
    try{await sb.auth.signOut({scope:'local'})}catch{}
    await sleep(250);
    if(state?.user?.id===uid||!state?.user?.id)location.replace(location.origin);
  }catch(e){
    if(current()){
      setText('kf115-status',errText(e));
      btn.disabled=false;
    }
  }finally{
    deleting=false;
  }
}
function mount(){const sheet=document.getElementById('kf78-sheet');if(!sheet)return false;document.getElementById('kf114-danger')?.setAttribute('hidden','');if(document.getElementById('kf115-danger'))return true;const sec=document.createElement('section');sec.id='kf115-danger';sec.style.cssText='margin-top:18px;padding-top:16px;border-top:1px solid #4b4655';sec.innerHTML='<h3 style="margin:0 0 6px">Account</h3><p style="margin:0 0 12px;color:#bbb5c6;line-height:1.4">Delete your Kinfolk account and private member media. The deletion check runs before any file is removed.</p><button id="kf115-open" type="button" style="background:#a82d52">Delete account</button>';sheet.appendChild(sec);document.getElementById('kf115-open').onclick=openModal;return true}
function wrap(){const fn=window.openKinfolkAgeSafetySettings;if(typeof fn!=='function'||fn.__kf115)return false;const w=async function(...a){const r=await fn.apply(this,a);for(let i=0;i<10;i++){if(mount())break;await sleep(80)}return r};w.__kf115=true;w.__kf115Base=fn;window.openKinfolkAgeSafetySettings=w;return true}
new MutationObserver(()=>{wrap();mount()}).observe(document.documentElement,{childList:true,subtree:true});let n=0;const t=setInterval(()=>{wrap();mount();if(++n>40)clearInterval(t)},100);
})();