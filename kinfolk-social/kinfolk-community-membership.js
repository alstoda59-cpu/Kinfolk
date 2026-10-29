(()=>{
  if(window.__kfCommunityMembership||typeof window.kfRenderCommunities!=='function')return;
  window.__kfCommunityMembership=true;
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const baseRender=window.kfRenderCommunities;
  const pending=new Set();
  let generation=0;
  const current=(uid,n,main)=>state.user?.id===uid&&state.view==='communities'&&generation===n&&main?.isConnected&&document.getElementById('main')===main;
  window.kfRenderCommunities=async main=>{
    const uid=state.user?.id,n=++generation;
    await baseRender(main);
    if(!uid||!current(uid,n,main))return;
    const cards=Array.from(main.querySelectorAll('#kfCommunityResults article[data-community-id]'))
      .filter(card=>uuid.test(card.dataset.communityId||''));
    if(!cards.length)return;
    const ids=cards.map(card=>card.dataset.communityId);
    let memberships;
    try{
      const {data,error}=await sb.from('kinfolk_community_members').select('community_id').eq('user_id',uid).in('community_id',ids);
      if(!current(uid,n,main))return;
      if(error)throw error;
      memberships=new Set((data||[]).filter(row=>ids.includes(row.community_id)).map(row=>row.community_id));
    }catch(error){
      if(current(uid,n,main)){
        const note=document.createElement('p');note.className='muted';note.setAttribute('role','status');
        note.textContent='Community joining is unavailable until the isolated membership database and permissions are verified.';
        main.querySelector('#kfCommunityResults')?.append(note);
      }
      console.warn('Kinfolk community membership read',error);
      return;
    }
    for(const card of cards){
      const id=card.dataset.communityId;
      const button=document.createElement('button');
      button.type='button';button.className='btn';
      const refresh=()=>{button.textContent=memberships.has(id)?'Leave community':'Join community';button.setAttribute('aria-label',button.textContent)};
      refresh();
      button.addEventListener('click',async()=>{
        if(!current(uid,n,main)||!button.isConnected)return;
        const key=uid+':'+id;
        if(pending.has(key))return;
        const joining=!memberships.has(id);
        pending.add(key);button.disabled=true;button.textContent=joining?'Joining…':'Leaving…';
        try{
          const query=joining
            ?sb.from('kinfolk_community_members').insert({community_id:id,user_id:uid})
            :sb.from('kinfolk_community_members').delete().eq('community_id',id).eq('user_id',uid);
          const {error}=await query;
          if(!current(uid,n,main)||!button.isConnected)return;
          if(error)throw error;
          if(joining)memberships.add(id);else memberships.delete(id);
          refresh();
        }catch(error){
          if(current(uid,n,main)&&button.isConnected){
            refresh();
            const note=document.createElement('span');note.className='muted';note.setAttribute('role','status');
            note.textContent=' Membership change failed. Check permissions and retry.';
            button.after(note);
          }
          console.warn('Kinfolk community membership write',error);
        }finally{
          pending.delete(key);
          if(current(uid,n,main)&&button.isConnected)button.disabled=false;
        }
      });
      card.append(button);
    }
  };
})();
