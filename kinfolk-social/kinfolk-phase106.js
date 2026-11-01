(()=>{if(window.__kinfolkPhase106)return;window.__kinfolkPhase106=true;const MAX=5*1024*1024,LIMIT=20,ACCEPT='image/jpeg,image/png,image/webp,image/gif',ALLOWED=new Set(ACCEPT.split(','));let busy=false;const safe=n=>(String(n||'photo').replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(-80)||'photo'),tell=(m,t='danger')=>{try{toast(m,t)}catch{console.warn(m)}};function validate(files){if(files.length>LIMIT)throw new Error(`Upload up to ${LIMIT} photos at a time.`);for(const f of files){if(!ALLOWED.has(f.type))throw new Error(`${f.name||'Photo'} must be JPG, PNG, WebP or GIF.`);if(f.size>MAX)throw new Error(`${f.name||'Photo'} must be 5 MB or smaller.`)}}function requireAlbumSession(accountId,form,activation){
  if(!accountId||state?.user?.id!==accountId||(activation!==undefined&&kf129Epoch!==activation)||document.getElementById(form.id)!==form||form.isConnected===false)
    throw new Error('Account or album editor changed during upload. Reopen your album and try again.');
}
// Confirm album ownership before creating any storage object. A guessed album
// ID must never trigger a speculative upload, even if the eventual INSERT RLS
// would reject it. Recheck the initiating account after the network read.
async function requireOwnedAlbum(albumId,accountId,form,activation){
  requireAlbumSession(accountId,form,activation);
  const q=await sb.from('photo_albums').select('id,owner_id').eq('id',albumId).maybeSingle();
  requireAlbumSession(accountId,form,activation);
  if(q.error)throw q.error;
  if(!q.data||q.data.id!==albumId||q.data.owner_id!==accountId)
    throw new Error('Album is unavailable or not owned by this account. Reopen your album.');
}
async function cleanupAlbumUpload(path){
  try{
    const {error}=await sb.storage.from('kinfolk-media').remove([path]);
    if(error)console.warn('Kinfolk could not clean up an uncommitted album photo',error);
  }catch(error){console.warn('Kinfolk could not clean up an uncommitted album photo',error)}
}
async function addOne(albumId,file,accountId,form,activation){
  requireAlbumSession(accountId,form,activation);
  await requireOwnedAlbum(albumId,accountId,form,activation);
  const path=accountId+'/albums/'+albumId+'/'+crypto.randomUUID()+'-'+safe(file.name);
  let uploaded=false,linked=false,insertAttempted=false,confirmedNoRows=false;
  try{
    const up=await sb.storage.from('kinfolk-media').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});
    if(up.error)throw up.error;
    uploaded=true;
    requireAlbumSession(accountId,form,activation);
    // An error-free PostgREST response is not proof that RLS committed a row.
    // Ask for the exact affected-row count before reporting a linked photo.
    // Once the INSERT is sent, even an error or dropped response can follow a
    // committed row. Never delete its storage object on uncertain outcomes.
    insertAttempted=true;
    const ins=await sb.from('album_photos').insert({album_id:albumId,owner_id:accountId,storage_path:path,caption:''},{count:'exact'});
    if(ins.error){
      console.warn('Kinfolk album photo insert outcome could not be confirmed',ins.error);
      throw new Error('Album photo save could not be confirmed. Refresh the album before retrying.');
    }
    if(ins.count!==1){
      if(ins.count===0){
        confirmedNoRows=true;
        throw new Error('Album photo was not saved. Please try again.');
      }
      // Missing/ambiguous counts may follow a committed insert. Preserve the
      // uploaded file rather than deleting media that could be referenced.
      linked=true;
      throw new Error('Album photo save could not be confirmed. Refresh the album before retrying.');
    }
    linked=true;
    requireAlbumSession(accountId,form,activation);
    return path;
  }catch(error){
    // Only clean up before INSERT, or after an authoritative zero-row result.
    // Network exceptions, PostgREST errors and missing counts are ambiguous:
    // deleting their media could break a successfully committed album photo.
    if(uploaded&&!linked&&(!insertAttempted||confirmedNoRows))await cleanupAlbumUpload(path);
    throw error;
  }
}async function hardCreate(e){
  e?.preventDefault?.();
  if(busy&&busy.epoch===kf129Epoch)return;
  const f=document.getElementById('albumForm');
  if(!f)return;
  const accountId=state?.user?.id,activation=kf129Epoch;
  if(!accountId)return tell('Your session is not ready. Please log in again.');
  // A confirmed album must not be inserted twice from the same mounted form,
  // even if its photo upload or the final Photos render failed.
  if(f.__kf106Created?.accountId===accountId)
    return tell('This album was already created. Open Photos to add any missing photos instead of creating it again.');
  // A lost INSERT response can follow a committed album. Keep the original
  // editor one-shot until the member has checked the actual album list.
  if(f.__kf106CreateUncertain?.accountId===accountId)
    return tell('Album creation may already have completed. Open Photos and check for the album before creating another one.');
  const btn=f.querySelector('button'),old=btn?.textContent||'Create album';
  // A stale operation from a prior login must not block this activation.
  // Its finally block must also never unlock a newer operation.
  const operation={epoch:activation};
  busy=operation;
  if(btn){btn.disabled=true;btn.textContent='Creating…'}
  // A verified album row survives even if a later photo upload fails.
  // Keep that distinction so the member does not create duplicate albums.
  let confirmedAlbumId=null,partialFailure=false;
  try{
    requireAlbumSession(accountId,f,activation);
    const title=f.querySelector('#albumTitle')?.value.trim()||'';
    const description=f.querySelector('#albumDesc')?.value.trim()||'';
    const visibility=f.querySelector('#albumVisibility')?.value==='public'?'public':'private';
    const files=[...(f.querySelector('#albumFiles')?.files||[])];
    if(!title)throw new Error('Give your album a name.');
    validate(files);
    const uncertain='Album creation could not be confirmed. Refresh your albums before retrying.';
    // A returned album-shaped object is not proof of a committed, owned row.
    // A transport error can also arrive after commit: never encourage a blind
    // retry that may create a second album.
    let q;
    try{
      // Mark BEFORE dispatch: even a thrown transport response can follow a
      // committed INSERT. Preflight failures do not set this marker.
      f.__kf106CreateUncertain={accountId};
      q=await sb.from('photo_albums').insert({owner_id:accountId,title,description,visibility},{count:'exact'}).select().single();
    }catch(error){
      console.warn('Kinfolk album creation response failed',error);
      throw new Error(uncertain);
    }
    if(q.error){
      console.warn('Kinfolk album creation outcome could not be confirmed',q.error);
      throw new Error(uncertain);
    }
    requireAlbumSession(accountId,f,activation);
    // A successful authoritative zero-row acknowledgment means no album was
    // inserted; unlike an unknown result, this exact editor may retry.
    if(q.count===0)delete f.__kf106CreateUncertain;
    if(q.count!==1||!q.data?.id||q.data.owner_id!==accountId)
      throw new Error(uncertain);
    confirmedAlbumId=q.data.id;
    f.__kf106Created={accountId,id:confirmedAlbumId};
    for(let i=0;i<files.length;i++){
      requireAlbumSession(accountId,f,activation);
      const pg=f.querySelector('#albumProgress');
      if(pg)pg.textContent='Uploading '+(i+1)+' of '+files.length+'…';
      await addOne(q.data.id,files[i],accountId,f,activation);
    }
    requireAlbumSession(accountId,f,activation);
    closeModal();
    state.profileTab='photos';
    await renderApp();
    if(state?.user?.id===accountId&&kf129Epoch===activation)tell('Album created','good');
  }catch(err){
    if(state?.user?.id===accountId&&kf129Epoch===activation&&document.getElementById('albumForm')===f){
      if(confirmedAlbumId){
        partialFailure=true;
        console.warn('Kinfolk album was created but subsequent work failed',err);
        tell('Album created, but finishing it was interrupted. Open Photos and check this album before adding missing photos. Do not create it again.');
      }else tell(err?.message||'Album could not be created');
    }
  }finally{
    if(busy===operation)busy=false;
    if(btn&&document.contains(btn)&&state?.user?.id===accountId&&kf129Epoch===activation&&document.getElementById('albumForm')===f){
      // A partial failure is not a failed album creation. Keep this exact
      // editor from submitting a second INSERT; members can add photos
      // through the existing album in Photos.
      const created=f.__kf106Created?.accountId===accountId;
      const uncertainCreate=f.__kf106CreateUncertain?.accountId===accountId;
      btn.disabled=!!(partialFailure||created||uncertainCreate);
      btn.textContent=created?'Album created · Open Photos':uncertainCreate?'Check Photos before retrying':old;
    }
  }
}async function hardAddSubmit(id,e){
  e?.preventDefault?.();
  if(busy&&busy.epoch===kf129Epoch)return;
  const f=document.getElementById('albumAddForm');
  if(!f)return;
  const accountId=state?.user?.id,activation=kf129Epoch;
  if(!accountId)return tell('Your session is not ready. Please log in again.');
  // The same Add Photos editor must never replay files after a confirmed or
  // potentially partial upload. Reopen the album to inspect what was saved.
  if(f.__kf106AddOutcome?.accountId===accountId&&f.__kf106AddOutcome?.albumId===id)
    return tell('Photos may already have been added. Reopen this album and check its photos before uploading again.');
  const btn=f.querySelector('button'),old=btn?.textContent||'Upload photos';
  // A stale operation from a prior login must not block this activation.
  // Its finally block must also never unlock a newer operation.
  const operation={epoch:activation};
  busy=operation;
  if(btn){btn.disabled=true;btn.textContent='Uploading…'}
  let uploadAttempted=false;
  try{
    requireAlbumSession(accountId,f,activation);
    const files=[...(f.querySelector('#albumAddFiles')?.files||[])];
    if(!files.length)throw new Error('Choose at least one photo.');
    validate(files);
    for(let i=0;i<files.length;i++){
      requireAlbumSession(accountId,f,activation);
      const pg=f.querySelector('#albumAddProgress');
      if(pg)pg.textContent='Uploading '+(i+1)+' of '+files.length+'…';
      uploadAttempted=true;
      await addOne(id,files[i],accountId,f,activation);
    }
    requireAlbumSession(accountId,f,activation);
    f.__kf106AddOutcome={accountId,albumId:id};
    await window.viewAlbum(id);
    if(state?.user?.id===accountId&&kf129Epoch===activation)tell('Photos added','good');
  }catch(err){
    if(state?.user?.id===accountId&&kf129Epoch===activation&&document.getElementById('albumAddForm')===f){
      if(uploadAttempted){
        // A later file can fail after earlier files were committed, and even
        // the failing file may have committed before its response was lost.
        // Never replay the original selection from this mounted editor.
        f.__kf106AddOutcome={accountId,albumId:id};
        console.warn('Kinfolk Add Photos may have partially committed',err);
        tell('Photo upload may have partially completed. Reopen this album and check which photos are present before uploading missing photos. Do not submit this form again.');
      }else tell(err?.message||'Photos could not be added');
    }
  }finally{
    if(busy===operation)busy=false;
    if(btn&&document.contains(btn)&&state?.user?.id===accountId&&kf129Epoch===activation&&document.getElementById('albumAddForm')===f){
      const locked=f.__kf106AddOutcome?.accountId===accountId&&f.__kf106AddOutcome?.albumId===id;
      btn.disabled=!!locked;btn.textContent=locked?'Reopen album to review photos':old;
    }
  }
}
let albumViewRequest=0;
// The album modal may outlive a login, a same-user session activation, or a
// replacement modal. Never append signed private media after any of those.
async function guardedViewAlbum(id){
  const viewerId=state?.user?.id,activation=kf129Epoch,request=++albumViewRequest;
  const current=()=>!!viewerId&&state?.user?.id===viewerId&&kf129Epoch===activation&&request===albumViewRequest;
  if(!current())return;
  let albumResult,photoResult;
  try{
    [albumResult,photoResult]=await Promise.all([
      sb.from('photo_albums').select('*').eq('id',id).single(),
      sb.from('album_photos').select('*').eq('album_id',id).order('created_at',{ascending:true})
    ]);
  }catch(error){if(current())tell('Album could not be loaded.');return}
  if(!current())return;
  if(albumResult?.error||photoResult?.error){
    tell(albumResult?.error?.message||photoResult?.error?.message||'Album could not be loaded.');
    return;
  }
  const album=albumResult?.data,photos=photoResult?.data;
  if(!album||album.id!==id||!Array.isArray(photos)){
    tell('Album response could not be verified.');
    return;
  }
  const owner=album.owner_id===viewerId;
  modal(album.title,
    '<div class="muted" style="margin-bottom:10px">'+esc(album.description||'')+' · '+esc(album.visibility||'private')+'</div>'+
    '<div class="photoGrid" id="albumPhotoGrid"></div>'+
    (owner?'<div class="divider"></div><button id="albumAddPhotosAction" class="btn primary full" type="button">＋ Add photos</button>':'')
  );
  const modalRequest=kf300MessageRequest,root=document.getElementById('albumPhotoGrid');
  if(!root)return;
  const active=()=>current()&&kf300MessageRequest===modalRequest&&root.isConnected&&document.getElementById('albumPhotoGrid')===root;
  if(owner){
    const add=document.getElementById('albumAddPhotosAction');
    if(add)add.onclick=()=>{if(active())window.addPhotosToAlbum(id)};
  }
  // Match the exact owner/album storage namespace before requesting a signed
  // private-media URL. Row IDs alone must not authorize arbitrary object keys.
  const storagePrefix=String(album.owner_id)+'/albums/'+String(id)+'/';
  let rendered=0;
  for(const photo of photos){
    if(!active())return;
    // A mismatched result must never cause a signed URL request.
    if(!photo||photo.album_id!==id||photo.owner_id!==album.owner_id||!photo.id||typeof photo.storage_path!=='string')continue;
    const storagePath=photo.storage_path;
    if(!storagePath.startsWith(storagePrefix))continue;
    const filename=storagePath.slice(storagePrefix.length);
    // Uploads create one flat filename. Reject foreign, nested, or traversal
    // paths even if a compromised/malformed row has matching owner columns.
    if(!/^[A-Za-z0-9._-]+$/.test(filename)||filename==='.'||filename==='..')continue;
    let url;
    try{url=await signed('kinfolk-media',photo.storage_path)}
    catch(error){if(!active())return;continue}
    if(!active())return;
    if(typeof url!=='string'||!/^https?:\/\//i.test(url))continue;
    try{if(!['http:','https:'].includes(new URL(url).protocol))continue}catch{continue}
    const wrap=document.createElement('div');
    wrap.className='photoCommentWrap';
    const open=document.createElement('button');
    open.type='button';open.className='photoTile';
    open.onclick=()=>{if(active())window.open(url,'_blank','noopener,noreferrer')};
    const img=document.createElement('img');
    img.src=url;img.loading='lazy';img.alt='Album photo';
    open.appendChild(img);
    const comments=document.createElement('button');
    comments.type='button';comments.className='btn small';
    comments.textContent='◯ Comments & replies';
    comments.onclick=()=>{if(active())window.openMediaComments('photo',photo.id)};
    wrap.append(open,comments);
    if(!active())return;
    root.appendChild(wrap);
    rendered++;
  }
  if(active()&&!rendered)root.textContent='No photos yet.';
}
function bind(form,handler){if(!form)return;const file=form.querySelector('input[type=file]');if(file)file.accept=ACCEPT;form.onsubmit=handler;const btn=form.querySelector('button');if(!btn)return;btn.type='button';btn.dataset.kf106='1';const run=e=>{e.preventDefault();e.stopImmediatePropagation();handler(e)};btn.onpointerup=run;btn.ontouchend=run;btn.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopImmediatePropagation();handler(e)}}}const hardAddOpen=id=>{modal('Add photos','<form id="albumAddForm"><input class="field" id="albumAddFiles" type="file" accept="'+ACCEPT+'" multiple required><div class="muted" style="margin:6px 0">JPG, PNG, WebP or GIF · up to 5 MB each · '+LIMIT+' at a time</div><div id="albumAddProgress" class="muted" style="margin:8px 0"></div><button class="btn primary full" type="button">Upload photos</button></form>');setTimeout(()=>bind(document.getElementById('albumAddForm'),e=>hardAddSubmit(id,e)),10)};function enforce(){window.addPhotosToAlbum=hardAddOpen;window.viewAlbum=guardedViewAlbum;const a=document.getElementById('albumForm');if(a)bind(a,hardCreate);const add=document.getElementById('albumAddForm');if(add&&add.dataset.kf106Album){const id=add.dataset.kf106Album;bind(add,e=>hardAddSubmit(id,e))}}let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(enforce,15)}).observe(document.documentElement,{subtree:true,childList:true});setInterval(()=>{if(document.visibilityState!=='hidden')enforce()},2000);setTimeout(enforce,0);console.log('Kinfolk Phase106 album form guard ready')})();