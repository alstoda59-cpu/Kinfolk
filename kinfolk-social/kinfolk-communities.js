(()=>{
 if(window.__kfCommunities)return;window.__kfCommunities=true;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let request=0,publicCommunities=[];
 const current=(uid,n,main)=>state.user?.id===uid&&state.view==='communities'&&request===n&&main.isConnected;
 window.kfRenderCommunities=async main=>{
  const uid=state.user?.id,n=++request;if(!uid)return;publicCommunities=[];
  main.innerHTML='<div class="card"><div class="cardpad"><h2>Communities</h2><p class="muted">Find your people, build a space together.</p><input id="kfCommunitySearch" class="field" type="search" placeholder="Search public communities" aria-label="Search public communities"><div id="kfCommunityResults" aria-live="polite">Loading communities…</div></div></div>';
  const input=main.querySelector('#kfCommunitySearch'),target=main.querySelector('#kfCommunityResults');
  const show=()=>{if(!current(uid,n,main))return;const q=input.value.trim().toLocaleLowerCase();const rows=publicCommunities.filter(c=>(c.name+' '+(c.description||'')).toLocaleLowerCase().includes(q));target.innerHTML=rows.length?rows.map(c=>'<article class="card" style="padding:14px;margin-top:10px"><b>'+esc(c.name)+'</b><p class="muted">'+esc(c.description||'A Kinfolk community')+'</p></article>').join(''):'<p class="muted">'+(q?'No matching public communities.':'No public communities yet.')+'</p>';};
  input.addEventListener('input',show);
  try{
   const {data,error}=await sb.from('kinfolk_communities').select('id,name,description,visibility,created_at').eq('visibility','public').order('created_at',{ascending:false}).limit(50);
   if(!current(uid,n,main))return;if(error)throw error;publicCommunities=(data||[]).filter(c=>c.visibility==='public');show();
  }catch(e){if(current(uid,n,main)){input.disabled=true;target.textContent='Communities are unavailable in this test environment. Community database and access policies must be verified before launch.';}console.warn('Kinfolk communities read',e)}
 };
})();
