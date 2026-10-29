(()=>{
  if(window.__kfCommunities)return;
  window.__kfCommunities=true;

  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pendingCreates=new Set();
  let directoryRequest=0;
  let notice=null;
  const active=(uid,request,main)=>state.user?.id===uid&&state.view==='communities'&&directoryRequest===request&&main?.isConnected;
  const rowsHTML=(rows,empty)=>rows.length?rows.map(c=>
    '<article class="card" style="padding:14px;margin-top:10px"><b>'+esc(c.name)+'</b>'+
    (c.visibility==='private'?'<span class="muted" style="margin-left:8px">Private</span>':'')+
    '<p class="muted">'+esc(c.description||'A Kinfolk community')+'</p></article>'
  ).join(''):'<p class="muted">'+esc(empty)+'</p>';

  window.kfCreateCommunity=async form=>{
    const uid=state.user?.id;
    if(!uid||state.view!=='communities'||!form?.isConnected)return false;
    const status=form.querySelector('[data-community-status]');
    const button=form.querySelector('[type="submit"]');
    if(!status||!button)return false;
    if(pendingCreates.has(uid)){status.textContent='Your community is already being created.';return false;}
    const name=String(form.querySelector('[name="name"]')?.value||'').trim();
    const description=String(form.querySelector('[name="description"]')?.value||'').trim();
    const visibility=form.querySelector('[name="visibility"]')?.value;
    if(name.length<3||name.length>60||description.length>500||!['public','private'].includes(visibility)){
      status.textContent='Use a name of 3–60 characters and a description up to 500 characters.';
      return false;
    }
    pendingCreates.add(uid);
    button.disabled=true;
    status.textContent='Creating community…';
    try{
      const {error}=await sb.from('kinfolk_communities').insert({name,description,visibility,owner_id:uid});
      if(error)throw error;
      if(state.user?.id!==uid||state.view!=='communities'||!form.isConnected)return false;
      notice={uid,message:'Community created. You can find it under My communities.'};
      const main=document.getElementById('main');
      if(main?.isConnected)await window.kfRenderCommunities(main);
    }catch(error){
      if(state.user?.id===uid&&form.isConnected){
        status.textContent=error?.code==='42P01'||error?.code==='PGRST205'
          ?'The community database is not available in this test environment.'
          :'Community creation failed. Please try again after permissions are verified.';
      }
      console.warn('Kinfolk community creation',error);
    }finally{
      pendingCreates.delete(uid);
      if(form.isConnected&&state.user?.id===uid)button.disabled=false;
    }
    return false;
  };

  window.kfRenderCommunities=async main=>{
    const uid=state.user?.id,request=++directoryRequest;
    if(!uid||!main?.isConnected)return;
    const feedback=notice?.uid===uid?notice.message:'';
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
      if(!active(uid,request,main))return;
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
      if(!active(uid,request,main))return;
      publicRows=(publicResult.data||[]).filter(c=>c.visibility==='public');
      ownedRows=(ownedResult.data||[]).filter(c=>c.owner_id===uid);
      show();
      if(publicResult.error)publicList.textContent='Public community discovery is unavailable until the backend is configured.';
      if(ownedResult.error)owned.textContent='Your communities cannot be loaded until account permissions are configured.';
    }catch(error){
      if(active(uid,request,main)){
        owned.textContent='Your communities are unavailable in this test environment.';
        publicList.textContent='Community discovery is unavailable in this test environment.';
      }
      console.warn('Kinfolk communities read',error);
    }
  };
})();
