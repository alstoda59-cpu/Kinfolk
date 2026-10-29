(()=>{
  if(window.__kfCommunityOwnerEdit||typeof window.kfRenderCommunities!=='function')return;
  window.__kfCommunityOwnerEdit=true;
  const baseRender=window.kfRenderCommunities;
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const pending=new Set();
  let generation=0;
  const current=(uid,n,main)=>state.user?.id===uid&&state.view==='communities'&&
    generation===n&&main?.isConnected&&document.getElementById('main')===main;
  window.kfRenderCommunities=async main=>{
    const uid=state.user?.id,n=++generation;
    await baseRender(main);
    if(!uid||!current(uid,n,main))return;
    const decorate=()=>{
      if(!current(uid,n,main))return;
      for(const card of main.querySelectorAll('#kfOwnedCommunities article[data-community-id]')){
        const id=card.dataset.communityId;
        if(!uuid.test(id||'')||card.dataset.ownerId!==uid)continue;
        if(card.querySelector('[data-kf-owner-edit]'))continue;
        const edit=document.createElement('button');
        edit.type='button';edit.className='btn';edit.textContent='Edit community';
        edit.setAttribute('data-kf-owner-edit','');
        edit.disabled=pending.has(uid+':'+id);
        edit.addEventListener('click',()=>{
          if(!current(uid,n,main)||!edit.isConnected||pending.has(uid+':'+id))return;
          if(card.querySelector('[data-kf-edit-form]'))return;
          const form=document.createElement('form');
          form.setAttribute('data-kf-edit-form','');
          form.className='stack';
          form.style.marginTop='12px';
          const name=document.createElement('input');
          name.className='field';name.name='name';name.maxLength=60;name.minLength=3;
          name.required=true;name.value=card.dataset.name||'';
          name.setAttribute('aria-label','Community name');
          const description=document.createElement('textarea');
          description.className='field';description.name='description';
          description.maxLength=500;description.value=card.dataset.description||'';
          description.setAttribute('aria-label','Community description');
          const visibility=document.createElement('select');
          visibility.className='field';visibility.name='visibility';
          visibility.setAttribute('aria-label','Community privacy');
          for(const value of ['public','private']){
            const option=document.createElement('option');option.value=value;
            option.textContent=value==='public'?'Public':'Private';
            visibility.append(option);
          }
          visibility.value=card.dataset.visibility==='private'?'private':'public';
          const save=document.createElement('button');save.type='submit';
          save.className='btn primary';save.textContent='Save changes';
          const cancel=document.createElement('button');cancel.type='button';
          cancel.className='btn';cancel.textContent='Cancel';
          const status=document.createElement('p');status.className='muted';
          status.setAttribute('role','status');
          cancel.addEventListener('click',()=>{if(!pending.has(uid+':'+id))form.remove()});
          form.append(name,description,visibility,save,cancel,status);
          form.addEventListener('submit',async event=>{
            event.preventDefault();
            if(!current(uid,n,main)||pending.has(uid+':'+id))return;
            const newName=name.value.trim(),newDescription=description.value.trim();
            const newVisibility=visibility.value;
            if(newName.length<3||newName.length>60||newDescription.length>500||
              !['public','private'].includes(newVisibility)){
              status.textContent='Use a name of 3–60 characters and a description up to 500 characters.';
              return;
            }
            const key=uid+':'+id;pending.add(key);
            save.disabled=true;cancel.disabled=true;edit.disabled=true;
            status.textContent='Saving changes…';
            try{
              const {data,error}=await sb.from('kinfolk_communities')
                .update({name:newName,description:newDescription,visibility:newVisibility})
                .eq('id',id).eq('owner_id',uid).select('id');
              if(!current(uid,n,main))return;
              if(error)throw error;
              if(!Array.isArray(data)||data.length!==1||data[0].id!==id)
                throw Error('Community update was not confirmed.');
              await window.kfRenderCommunities(main);
            }catch(error){
              if(current(uid,n,main)&&form.isConnected)
                status.textContent='Could not save changes. Check ownership and permissions.';
              console.warn('Kinfolk community owner edit',error);
            }finally{
              pending.delete(key);
              if(form.isConnected&&current(uid,n,main)){
                save.disabled=false;cancel.disabled=false;edit.disabled=false;
              }
            }
          });
          card.append(form);
        });
        card.append(edit);
      }
    };
    decorate();
    // Directory search replaces card elements; restore edit controls on new cards.
    main.querySelector('#kfCommunitySearch')?.addEventListener('input',decorate);
  };
})();
