(()=>{if(window.__kinfolkPhase106)return;window.__kinfolkPhase106=true;const MAX=5*1024*1024,LIMIT=20,ACCEPT='image/jpeg,image/png,image/webp,image/gif',ALLOWED=new Set(ACCEPT.split(','));let busy=false;const safe=n=>(String(n||'photo').replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(-80)||'photo'),tell=(m,t='danger')=>{try{toast(m,t)}catch{console.warn(m)}};function validate(files){if(files.length>LIMIT)throw new Error(`Upload up to ${LIMIT} photos at a time.`);for(const f of files){if(!ALLOWED.has(f.type))throw new Error(`${f.name||'Photo'} must be JPG, PNG, WebP or GIF.`);if(f.size>MAX)throw new Error(`${f.name||'Photo'} must be 5 MB or smaller.`)}}function requireAlbumSession(accountId,form){
  if(!accountId||state?.user?.id!==accountId||document.getElementById(form.id)!==form||form.isConnected===false)
    throw new Error('Account or album editor changed during upload. Reopen your album and try again.');
}
async function cleanupAlbumUpload(path){
  try{
    const {error}=await sb.storage.from('kinfolk-media').remove([path]);
    if(error)console.warn('Kinfolk could not clean up an uncommitted album photo',error);
  }catch(error){console.warn('Kinfolk could not clean up an uncommitted album photo',error)}
}
async function addOne(albumId,file,accountId,form){
  requireAlbumSession(accountId,form);
  const path=accountId+'/albums/'+albumId+'/'+crypto.randomUUID()+'-'+safe(file.name);
  let uploaded=false,linked=false;
  try{
    const up=await sb.storage.from('kinfolk-media').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});
    if(up.error)throw up.error;
    uploaded=true;
    requireAlbumSession(accountId,form);
    // An error-free PostgREST response is not proof that RLS committed a row.
    // Ask for the exact affected-row count before reporting a linked photo.
    const ins=await sb.from('album_photos').insert({album_id:albumId,owner_id:accountId,storage_path:path,caption:''},{count:'exact'});
    if(ins.error)throw ins.error;
    if(ins.count!==1){
      if(ins.count===0)throw new Error('Album photo was not saved. Please try again.');
      // Missing/ambiguous counts may follow a committed insert. Preserve the
      // uploaded file rather than deleting media that could be referenced.
      linked=true;
      throw new Error('Album photo save could not be confirmed. Refresh the album before retrying.');
    }
    linked=true;
    requireAlbumSession(accountId,form);
    return path;
  }catch(error){
    // Never delete a photo after its database row was committed.
    if(uploaded&&!linked)await cleanupAlbumUpload(path);
    throw error;
  }
}async function hardCreate(e){
  e?.preventDefault?.();
  if(busy)return;
  const f=document.getElementById('albumForm');
  if(!f)return;
  const accountId=state?.user?.id;
  if(!accountId)return tell('Your session is not ready. Please log in again.');
  const btn=f.querySelector('button'),old=btn?.textContent||'Create album';
  busy=true;
  if(btn){btn.disabled=true;btn.textContent='Creating…'}
  try{
    requireAlbumSession(accountId,f);
    const title=f.querySelector('#albumTitle')?.value.trim()||'';
    const description=f.querySelector('#albumDesc')?.value.trim()||'';
    const visibility=f.querySelector('#albumVisibility')?.value||'public';
    const files=[...(f.querySelector('#albumFiles')?.files||[])];
    if(!title)throw new Error('Give your album a name.');
    validate(files);
    const q=await sb.from('photo_albums').insert({owner_id:accountId,title,description,visibility}).select().single();
    if(q.error)throw q.error;
    requireAlbumSession(accountId,f);
    if(!q.data?.id)throw new Error('Album creation could not be verified. Please try again.');
    for(let i=0;i<files.length;i++){
      requireAlbumSession(accountId,f);
      const pg=f.querySelector('#albumProgress');
      if(pg)pg.textContent='Uploading '+(i+1)+' of '+files.length+'…';
      await addOne(q.data.id,files[i],accountId,f);
    }
    requireAlbumSession(accountId,f);
    closeModal();
    state.profileTab='photos';
    await renderApp();
    if(state?.user?.id===accountId)tell('Album created','good');
  }catch(err){
    if(state?.user?.id===accountId&&document.getElementById('albumForm')===f)tell(err?.message||'Album could not be created');
  }finally{
    busy=false;
    if(btn&&document.contains(btn)&&state?.user?.id===accountId&&document.getElementById('albumForm')===f){
      btn.disabled=false;btn.textContent=old;
    }
  }
}async function hardAddSubmit(id,e){
  e?.preventDefault?.();
  if(busy)return;
  const f=document.getElementById('albumAddForm');
  if(!f)return;
  const accountId=state?.user?.id;
  if(!accountId)return tell('Your session is not ready. Please log in again.');
  const btn=f.querySelector('button'),old=btn?.textContent||'Upload photos';
  busy=true;
  if(btn){btn.disabled=true;btn.textContent='Uploading…'}
  try{
    requireAlbumSession(accountId,f);
    const files=[...(f.querySelector('#albumAddFiles')?.files||[])];
    if(!files.length)throw new Error('Choose at least one photo.');
    validate(files);
    for(let i=0;i<files.length;i++){
      requireAlbumSession(accountId,f);
      const pg=f.querySelector('#albumAddProgress');
      if(pg)pg.textContent='Uploading '+(i+1)+' of '+files.length+'…';
      await addOne(id,files[i],accountId,f);
    }
    requireAlbumSession(accountId,f);
    await viewAlbum(id);
    if(state?.user?.id===accountId)tell('Photos added','good');
  }catch(err){
    if(state?.user?.id===accountId&&document.getElementById('albumAddForm')===f)tell(err?.message||'Photos could not be added');
  }finally{
    busy=false;
    if(btn&&document.contains(btn)&&state?.user?.id===accountId&&document.getElementById('albumAddForm')===f){
      btn.disabled=false;btn.textContent=old;
    }
  }
}function bind(form,handler){if(!form)return;const file=form.querySelector('input[type=file]');if(file)file.accept=ACCEPT;form.onsubmit=handler;const btn=form.querySelector('button');if(!btn)return;btn.type='button';btn.dataset.kf106='1';const run=e=>{e.preventDefault();e.stopImmediatePropagation();handler(e)};btn.onpointerup=run;btn.ontouchend=run;btn.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopImmediatePropagation();handler(e)}}}const hardAddOpen=id=>{modal('Add photos','<form id="albumAddForm"><input class="field" id="albumAddFiles" type="file" accept="'+ACCEPT+'" multiple required><div class="muted" style="margin:6px 0">JPG, PNG, WebP or GIF · up to 5 MB each · '+LIMIT+' at a time</div><div id="albumAddProgress" class="muted" style="margin:8px 0"></div><button class="btn primary full" type="button">Upload photos</button></form>');setTimeout(()=>bind(document.getElementById('albumAddForm'),e=>hardAddSubmit(id,e)),10)};function enforce(){window.addPhotosToAlbum=hardAddOpen;const a=document.getElementById('albumForm');if(a)bind(a,hardCreate);const add=document.getElementById('albumAddForm');if(add&&add.dataset.kf106Album){const id=add.dataset.kf106Album;bind(add,e=>hardAddSubmit(id,e))}}let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(enforce,15)}).observe(document.documentElement,{subtree:true,childList:true});setInterval(()=>{if(document.visibilityState!=='hidden')enforce()},2000);setTimeout(enforce,0);console.log('Kinfolk Phase106 album form guard ready')})();