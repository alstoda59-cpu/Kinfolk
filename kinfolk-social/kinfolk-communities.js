(()=>{
  if(window.__kfCommunities)return;window.__kfCommunities=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  let request=0;\n  let publicCommunities=[];\n  window.kfCommunitySearch=term=>{\n    const target=document.getElementById('kfCommunityResults');\n    if(!target||state.view!=='communities')return;\n    const q=String(term||'').trim().toLocaleLowerCase();\n    const rows=publicCommunities.filter(c=>(c.name+' '+(c.description||'')).toLocaleLowerCase().includes(q));\n    target.innerHTML=rows.length?rows.map(c=>'<article class="card" style="padding:14px;margin-top:10px"><b>'+esc(c.name)+'</b><p class="muted">'+esc(c.description||'A Kinfolk community')+'</p></article>').join(''):'<p class="muted">'+(q?'No matching public communities.':'No public communities yet.')+'</p>';\n  };
  const current=(uid,n,main)=>state.user?.id===uid&&state.view==='communities'&&request===n&&main.isConnected;
  window.kfRenderCommunities=async main=>{
    const uid=state.user?.id,n=++request;if(!uid)return;publicCommunities=[];
    main.innerHTML='<div class="card"><div class="cardpad"><h2>Communities</h2><p class="muted">Find your people, build a space together.</p><div id="kfCommunityResults">Loading communities…</div></div></div>';
    const target=main.querySelector('#kfCommunityResults');
    try{
      const {data,error}=await sb.from('kinfolk_communities').select('id,name,description,visibility,created_at').eq('visibility','public').order('created_at',{ascending:false}).limit(50);
      if(!current(uid,n,main))return;
      if(error)throw error;
      target.innerHTML=(data||[]).length?(data||[]).map(c=>'<article class="card" style="padding:14px;margin-top:10px"><b>'+esc(c.name)+'</b><p class="muted">'+esc(c.description||'A Kinfolk community')+'</p></article>').join(''):'<p class="muted">No public communities yet.</p>';
    }catch(e){if(current(uid,n,main))target.textContent='Communities are unavailable in this test environment. The community database must be provisioned and its access rules verified before launch.';console.warn('Kinfolk communities read',e)}
  };
})();
