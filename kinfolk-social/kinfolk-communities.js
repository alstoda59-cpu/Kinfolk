(()=>{
  if(window.__kfCommunities)return;
  window.__kfCommunities=true;

  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pendingCreates=new Map();
  // A logout/login of the same user ID is still a different auth lifecycle.
  const authEpoch=()=>typeof kf129Epoch==='undefined'?null:kf129Epoch;
  let directoryRequest=0;
  let notice=null;
  const active=(uid,request,main,epoch)=>authEpoch()===epoch&&state.user?.id===uid&&state.view==='communities'&&directoryRequest===request&&main?.isConnected;
  const rowsHTML=(rows,empty)=>rows.length?rows.map(c=>
    '<article class="card" data-community-id="'+esc(c.id||'')+'" data-owner-id="'+esc(c.owner_id||'')+'" data-name="'+esc(c.name||'')+'" data-description="'+esc(c.description||'')+'" data-visibility="'+esc(c.visibility||'')+'" style="padding:14px;margin-top:10px"><b>'+esc(c.name)+'</b>'+
    (c.visibility==='private'?'<span class="muted" style="margin-left:8px">Private</span>':'')+
    '<p class="muted">'+esc(c.description||'A Kinfolk community')+'</p></article>'
  ).join(''):'<p class="muted">'+esc(empty)+'</p>';

  window.kfCreateCommunity=async form=>{
    const uid=state.user?.id,epoch=authEpoch();
    if(!uid||state.view!=='communities'||!form?.isConnected)return false;
    const status=form.querySelector('[data-community-status]');
    const button=form.querySelector('[type="submit"]');
    if(!status||!button)return false;
    if(pendingCreates.get(uid)?.epoch===epoch){status.textContent='Your community is already being created.';return false;}
    const name=String(form.querySelector('[name="name"]')?.value||'').trim();
    const description=String(form.querySelector('[name="description"]')?.value||'').trim();
    const visibility=form.querySelector('[name="visibility"]')?.value;
    if(name.length<3||name.length>60||description.length>500||!['public','private'].includes(visibility)){
      status.textContent='Use a name of 3–60 characters and a description up to 500 characters.';
      return false;
    }
    const createToken={epoch};
    pendingCreates.set(uid,createToken);
    button.disabled=true;
    status.textContent='Creating community…';
    try{
      // An INSERT may succeed at the HTTP layer without returning a visible row.
      // Require an RLS-visible, owner-matching row before claiming creation.
      const {data,error}=await sb.from('kinfolk_communities')
        .insert({name,description,visibility,owner_id:uid})
        .select('id,owner_id,name,description,visibility');
      if(authEpoch()!==epoch||state.user?.id!==uid||state.view!=='communities'||!form.isConnected)return false;
      if(error)throw error;
      const row=Array.isArray(data)&&data.length===1?data[0]:null;
      if(!row||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id||'')||
         row.owner_id!==uid||row.name!==name||row.visibility!==visibility||String(row.description??'')!==description)
        throw Error('Community creation was not confirmed by the backend.');
      notice={uid,epoch,message:'Community created. You can find it under My communities.'};
      const main=document.getElementById('main');
      if(main?.isConnected)await window.kfRenderCommunities(main);
    }catch(error){
      if(authEpoch()===epoch&&state.user?.id===uid&&form.isConnected){
        status.textContent=error?.code==='42P01'||error?.code==='PGRST205'
          ?'The community database is not available in this test environment.'
          :'Community creation failed. Please try again after permissions are verified.';
      }
      console.warn('Kinfolk community creation',error);
    }finally{
      if(pendingCreates.get(uid)===createToken)pendingCreates.delete(uid);
      if(authEpoch()===epoch&&form.isConnected&&state.user?.id===uid)button.disabled=false;
    }
    return false;
  };

  window.kfRenderCommunities=async main=>{
    const uid=state.user?.id,epoch=authEpoch(),request=++directoryRequest;
    if(!uid||!main?.isConnected)return;
    const feedback=notice?.uid===uid&&notice.epoch===epoch?notice.message:'';
    main.innerHTML='<div class="card"><div class="cardpad">'+
      '<h2>Communities</h2><p class="muted">Find your people and create a space together.</p>'+
      '<p id="kfCommunityNotice" role="status" class="muted">'+esc(feedback)+'</p>'+
      '<form id="kfCreateCommunityForm" class="stack" style="margin:12px 0;padding:12px;border:1px solid #453646;border-radius:12px">'+
      '<b>Create a community</b><input class="field" name="name" maxlength="60" minlength="3" required placeholder="Community name" aria-label="Community name">'+
      '<textarea class="field" name="description" maxlength="500" placeholder="What is your community about?" aria-label="Community description"></textarea>'+
      '<select class="field" name="visibility" aria-label="Community privacy"><option value="public">Public</option><option value="private">Private</option></select>'+
      '<button type="submit" class="btn primary">Create community</button><div data-community-status role="status" class="muted"></div></form>'+
      '<label class="label" for="kfCommunitySearch">Search communities</label><input id="kfCommunitySearch" class="field" type="search" placeholder="Search communities">'+
      '<h3>My communities</h3><div id="kfOwnedCommunities" aria-live="polite">Loading…</div>'+
      '<h3>Discover public communities</h3><div id="kfCommunityResults" aria-live="polite">Loading…</div></div></div>';
    const form=main.querySelector('#kfCreateCommunityForm');
    const search=main.querySelector('#kfCommunitySearch');
    const owned=main.querySelector('#kfOwnedCommunities');
    const publicList=main.querySelector('#kfCommunityResults');
    form.addEventListener('submit',event=>{event.preventDefault();window.kfCreateCommunity(form)});
    let publicRows=[],ownedRows=[];
    const show=()=>{
      if(!active(uid,request,main,epoch))return;
      const q=search.value.trim().toLocaleLowerCase();
      const matches=c=>(c.name+' '+(c.description||'')).toLocaleLowerCase().includes(q);
      owned.innerHTML=rowsHTML(ownedRows.filter(matches),q?'No matching communities.':'You have not created a community yet.');
      publicList.innerHTML=rowsHTML(publicRows.filter(matches),q?'No matching public communities.':'No public communities yet.');
    };
    search.addEventListener('input',show);
    try{
      const [publicResult,ownedResult]=await Promise.all([
        sb.from('kinfolk_communities').select('id,name,description,visibility,owner_id,created_at').eq('visibility','public').order('created_at',{ascending:false}).limit(50),
        sb.from('kinfolk_communities').select('id,name,description,visibility,owner_id,created_at').eq('owner_id',uid).order('created_at',{ascending:false}).limit(50)
      ]);
      if(!active(uid,request,main,epoch))return;
      publicRows=(publicResult.data||[]).filter(c=>c.visibility==='public');
      ownedRows=(ownedResult.data||[]).filter(c=>c.owner_id===uid);
      show();
      if(publicResult.error)publicList.textContent='Public community discovery is unavailable until the backend is configured.';
      if(ownedResult.error)owned.textContent='Your communities cannot be loaded until account permissions are configured.';
    }catch(error){
      if(active(uid,request,main,epoch)){
        owned.textContent='Your communities are unavailable in this test environment.';
        publicList.textContent='Community discovery is unavailable in this test environment.';
      }
      console.warn('Kinfolk communities read',error);
    }
  };
})();
