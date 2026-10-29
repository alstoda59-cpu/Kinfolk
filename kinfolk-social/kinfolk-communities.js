(()=>{
 if(window.__kfCommunities)return;window.__kfCommunities=true;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let request=0,publicCommunities=[],creating=false;
 const current=(uid,n,main)=>state.user?.id===uid&&state.view==='communities'&&request===n&&main.isConnected;
 window.kfCreateCommunity=async form=>{
  if(creating)return false;
  const uid=state.user?.id,session=state.user?.id;
  if(!uid||state.view!=='communities')return false;
  const name=String(form.querySelector('[name="name"]')?.value||'').trim();
  const description=String(form.querySelector('[name="description"]')?.value||'').trim();
  const visibility=form.querySelector('[name="visibility"]')?.value;
  const status=form.querySelector('[data-community-status]');
  if(name.length<3||name.length>60||description.length>500||!['public','private'].includes(visibility)){status.textContent='Use a name of 3–60 characters and a description up to 500 characters.';return false;}
  creating=true;const submit=form.querySelector('[type="submit"]');submit.disabled=true;status.textContent='Creating community…';
  try{
    const {error}=await sb.from('kinfolk_communities').insert({name,description,visibility,owner_id:uid});
    if(error)throw error;
    if(state.user?.id!==session||state.view!=='communities'||!form.isConnected)return false;
    status.textContent='Community created.';
    await window.kfRenderCommunities(document.getElementById('main'));
  }catch(e){if(state.user?.id===session&&form.isConnected)status.textContent='Could not create community. '+(e?.code==='42P01'?'The test database is not configured yet.':'Check your permissions and try again.');console.warn('Kinfolk community creation',e)}
  finally{creating=false;if(form.isConnected)submit.disabled=false}
  return false;
 };
 window.kfRenderCommunities=async main=>{
  const uid=state.user?.id,n=++request;if(!uid)return;publicCommunities=[];
  main.innerHTML='<div class="card"><div class="cardpad"><h2>Communities</h2><p class="muted">Find your people, build a space together.</p><form id="kfCreateCommunityForm" class="stack" style="margin:12px 0;padding:12px;border:1px solid #453646;border-radius:12px" onsubmit="event.preventDefault();kfCreateCommunity(this)"><b>Create a community</b><input class="field" name="name" maxlength="60" minlength="3" required placeholder="Community name" aria-label="Community name"><textarea class="field" name="description" maxlength="500" placeholder="What is your community about?" aria-label="Community description"></textarea><select class="field" name="visibility" aria-label="Community privacy"><option value="public">Public</option><option value="private">Private</option></select><button type="submit" class="btn primary">Create community</button><div data-community-status role="status" class="muted"></div></form><input id="kfCommunitySearch" class="field" type="search" placeholder="Search public communities" aria-label="Search public communities"><div id="kfCommunityResults" aria-live="polite">Loading communities…</div></div></div>';
  const input=main.querySelector('#kfCommunitySearch'),target=main.querySelector('#kfCommunityResults');
  const show=()=>{if(!current(uid,n,main))return;const q=input.value.trim().toLocaleLowerCase();const rows=publicCommunities.filter(c=>(c.name+' '+(c.description||'')).toLocaleLowerCase().includes(q));target.innerHTML=rows.length?rows.map(c=>'<article class="card" style="padding:14px;margin-top:10px"><b>'+esc(c.name)+'</b><p class="muted">'+esc(c.description||'A Kinfolk community')+'</p></article>').join(''):'<p class="muted">'+(q?'No matching public communities.':'No public communities yet.')+'</p>';};
  input.addEventListener('input',show);
  try{
   const {data,error}=await sb.from('kinfolk_communities').select('id,name,description,visibility,created_at').eq('visibility','public').order('created_at',{ascending:false}).limit(50);
   if(!current(uid,n,main))return;if(error)throw error;publicCommunities=(data||[]).filter(c=>c.visibility==='public');show();
  }catch(e){if(current(uid,n,main)){input.disabled=true;target.textContent='Communities are unavailable in this test environment. Community database and access policies must be verified before launch.';}console.warn('Kinfolk communities read',e)}
 };
})();
