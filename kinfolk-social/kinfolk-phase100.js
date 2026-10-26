(()=>{if(window.__kinfolkPhase100)return;window.__kinfolkPhase100=true;const BUCKET='kinfolk-media',MAX=5*1024*1024,ACCEPT='image/jpeg,image/png,image/webp,image/gif',ALLOWED=new Set(ACCEPT.split(','));const wait=ms=>new Promise(r=>setTimeout(r,ms));const notify=(m,t='danger')=>{try{toast(m,t)}catch{console.warn('Kinfolk',m)}};const cleanName=n=>{const v=String(n||'image').replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(-70);return v||'image'};const extFor=t=>t==='image/jpeg'?'jpg':t==='image/png'?'png':t==='image/webp'?'webp':t==='image/gif'?'gif':'img';const toBlob=(c,t,q)=>new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare this image.')),t,q));async function compress(file,label){const url=URL.createObjectURL(file),img=new Image();try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error(label+' could not be read. Try another image.'));img.src=url});const ow=img.naturalWidth||img.width,oh=img.naturalHeight||img.height;if(!ow||!oh)throw new Error(label+' could not be read. Try another image.');const type=file.type==='image/jpeg'?'image/jpeg':'image/webp',limits=[2400,2000,1600,1280,1024],qs=[.88,.8,.72,.64,.58];for(let i=0;i<limits.length;i++){const scale=Math.min(1,limits[i]/Math.max(ow,oh)),w=Math.max(1,Math.round(ow*scale)),h=Math.max(1,Math.round(oh*scale)),c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{alpha:true});if(!ctx)throw new Error('Image preparation is not available on this device.');ctx.drawImage(img,0,0,w,h);let b;try{b=await toBlob(c,type,qs[i])}catch{b=await toBlob(c,'image/jpeg',qs[i])}if(b.size<=MAX){const base=cleanName(file.name).replace(/\.[^.]+$/,'')||'image',ext=b.type==='image/webp'?'webp':'jpg';return new File([b],base+'.'+ext,{type:b.type,lastModified:Date.now()})}}throw new Error(label+' is still larger than 5 MB after optimization. Choose a smaller image.')}finally{URL.revokeObjectURL(url)}}async function prepare(file,label){if(!file)return null;if(!ALLOWED.has(file.type))throw new Error(label+' must be JPG, PNG, WebP or GIF.');if(file.size<=MAX)return file;if(file.type==='image/gif')throw new Error(label+' GIF must be 5 MB or smaller.');return compress(file,label)}async function removeUploaded(paths){if(!paths.length)return;try{await sb.storage.from(BUCKET).remove(paths)}catch{}}function sameEditor(accountId,editor){
  return state?.user?.id===accountId && document.getElementById('profileForm')===editor && editor.isConnected!==false;
}
function requireEditor(accountId,editor){
  if(!sameEditor(accountId,editor))throw new Error('Account or profile editor changed during save. Reopen Edit Profile and try again.');
}
async function upload(file,folder,paths,accountId,editor){
  requireEditor(accountId,editor);
  const base=cleanName(file.name).replace(/\.[^.]+$/,'')||'image';
  const path=accountId+'/'+folder+'/'+crypto.randomUUID()+'-'+base+'.'+extFor(file.type);
  const {error}=await sb.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});
  if(error)throw error;
  paths.push(path);
  requireEditor(accountId,editor);
  return path;
}function form(){return document.getElementById('profileForm')}function saveButton(f=form()){return f?[...f.querySelectorAll('button')].find(b=>/save profile|saving/i.test((b.textContent||'').trim())):null}function patch(){const f=form();if(!f)return;for(const id of ['editAvatar','editWallpaper']){const input=document.getElementById(id);if(!input)continue;input.setAttribute('accept',ACCEPT);try{Object.defineProperty(input,'accept',{configurable:true,get:()=>ACCEPT,set:()=>{}})}catch{}}f.onsubmit=save;window.saveProfile=save;f.dataset.kf100='1'}async function save(e){
  e?.preventDefault?.();
  e?.stopPropagation?.();
  const f=form();
  if(!f||f.dataset.kf100Busy==='1')return;
  const accountId=state?.user?.id;
  if(!accountId)return notify('Your session is not ready. Please log in again.');
  f.dataset.kf100Busy='1';
  const btn=saveButton(f),old=btn?.textContent||'Save profile',uploaded=[];
  if(btn){btn.disabled=true;btn.textContent='Saving…'}
  let profileSaved=false;
  try{
    requireEditor(accountId,f);
    patch();
    // Capture all fields and files before the first asynchronous operation.
    // A new account must never supply values to an old account's save.
    const read=id=>(f.querySelector('#'+id)?.value||'').trim();
    const avatarFile=f.querySelector('#editAvatar')?.files?.[0];
    const wallpaperFile=f.querySelector('#editWallpaper')?.files?.[0];
    const po={display_name:read('editDisplay'),username:read('editUsername'),bio:read('editBio')};
    const ex={user_id:accountId,location_text:read('editLocation')||null,website_url:read('editWebsite')||null,music_url:read('editMusic')||null,gender:read('editGender')||null,orientation:read('editOrientation')||null,relationship_status:read('editRelationship')||null,birthday:read('editBirthday')||null,updated_at:new Date().toISOString()};
    const avatar=await prepare(avatarFile,'Profile photo');
    requireEditor(accountId,f);
    const wallpaper=await prepare(wallpaperFile,'Wallpaper');
    requireEditor(accountId,f);
    if(avatar)po.avatar_url=await upload(avatar,'avatars',uploaded,accountId,f);
    if(wallpaper)po.wallpaper_url=await upload(wallpaper,'wallpapers',uploaded,accountId,f);
    requireEditor(accountId,f);
    const x=await sb.from('kinfolk_profile_extras').upsert(ex,{onConflict:'user_id',count:'exact'});
    if(x.error)throw x.error;
    // RLS can silently filter an upsert without raising an API error.
    // Treat a missing count as unverified rather than reporting a partial save.
    if(x.count!==1)throw new Error('Profile preferences could not be saved. Please sign in again and retry.');
    requireEditor(accountId,f);
    const p=await sb.from('profiles').update(po,{count:'exact'}).eq('id',accountId);
    if(p.error)throw p.error;
    // Supabase may report no error when RLS filters out every matching row.
    // Never announce a successful save unless the original profile was updated.
    if(p.count!==1)throw new Error('Profile could not be verified as updated. Please sign in again and retry.');
    // The database update may finish after logout or account switching.
    // Never hydrate, render or show success for a different account.
    profileSaved=true;
    requireEditor(accountId,f);
    try{
      closeModal();
      if(state?.user?.id===accountId){
        await hydrateUser();
        if(state?.user?.id===accountId){
          state.profiles.set(accountId,state.profile);
          await loadCore();
          if(state?.user?.id===accountId)await renderApp();
        }
      }
    }catch(renderErr){console.warn('Kinfolk profile refresh',renderErr)}
    if(state?.user?.id===accountId)notify('Profile updated','good');
  }catch(err){
    if(!profileSaved)await removeUploaded(uploaded);
    if(state?.user?.id===accountId && form()===f)notify(err?.message||'Profile update failed');
  }finally{
    f.dataset.kf100Busy='0';
    if(btn&&document.contains(btn)&&form()===f&&state?.user?.id===accountId){
      btn.disabled=false;btn.textContent=old;
    }
  }
}document.addEventListener('click',e=>{const b=e.target?.closest?.('button');if(!b)return;const f=b.closest?.('#profileForm');if(!f||!/save profile/i.test((b.textContent||'').trim()))return;e.preventDefault();e.stopImmediatePropagation();save(e)},true);document.addEventListener('submit',e=>{if(e.target?.id!=='profileForm')return;e.preventDefault();e.stopImmediatePropagation();save(e)},true);let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(patch,20)}).observe(document.documentElement,{subtree:true,childList:true});setInterval(patch,120);setTimeout(patch,0);setTimeout(patch,300);console.log('Kinfolk Phase100 profile media guard ready')})();