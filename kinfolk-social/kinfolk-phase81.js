(()=>{
  if(window.__kinfolkPhase81)return;
  window.__kinfolkPhase81=1;

  const $q=(s,r=document)=>r.querySelector(s);
  const hexOk=v=>/^#[0-9a-fA-F]{6}$/.test(v||'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Persisted profile links are user-controlled. Never turn a non-HTTPS or
  // credential-bearing URL into an audio request or an Open link.
  const safeMusicUrl=raw=>{
    try{
      const url=new URL(String(raw||'').trim());
      return url.protocol==='https:'&&!!url.hostname&&!url.username&&!url.password&&!url.port?url.href:'';
    }catch{return ''}
  };

  const style=document.createElement('style');
  style.id='kf81-style';
  style.textContent=`
    .kf81Card{background:#211e28;border:1px solid #393442;border-radius:18px;padding:16px;margin:12px 0}.kf81Card h3{margin:0 0 7px;font-size:20px}.kf81Muted{color:#b9b4c2;font-size:13px;line-height:1.45}.kf81Grid{display:grid;grid-template-columns:58px 1fr;gap:10px;align-items:center;margin-top:12px}.kf81Color{width:58px;height:50px;border:0;border-radius:13px;background:transparent;padding:0;overflow:hidden}.kf81Input{width:100%;box-sizing:border-box;min-height:50px;border-radius:13px;border:1px solid #44404c;background:#111017;color:#fff;padding:0 12px;font:inherit}.kf81Btn{width:100%;min-height:49px;border:0;border-radius:14px;background:var(--accent,#e85a9b);color:#fff;font:inherit;font-weight:900;margin-top:10px}.kf81Btn.secondary{background:#2b2832;border:1px solid #4a4552}.kf81Msg{min-height:18px;margin-top:8px;font-size:12px;color:#aaa}.kf81Player{margin-top:10px;padding:11px 12px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(9,9,13,.72)}.kf81PlayerRow{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.kf81Play{border:0;border-radius:999px;background:var(--accent,#e85a9b);color:#fff;padding:9px 13px;font-weight:900}.kf81Status{font-size:12px;color:#b9b4c2}.kf81Open{margin-left:auto;color:var(--accent,#e85a9b);font-size:12px;font-weight:800;text-decoration:none}
  `;
  document.head.appendChild(style);

  async function loadOwnAppearance(){
    if(typeof sb==='undefined'||!state?.user?.id)return null;
    const uid=state.user.id;
    const epoch=typeof kf129Epoch==='undefined'?null:kf129Epoch;
    const current=()=>state?.user?.id===uid&&(epoch===null||kf129Epoch===epoch);
    // Never hydrate the owner's settings from another profile or an earlier
    // activation of the same account while a private extras read is pending.
    const profile=(state.profile?.id===uid?state.profile:state.profiles?.get?.(uid))||{};
    let extra={};
    try{
      const result=await sb.from('kinfolk_profile_extras').select('music_url').eq('user_id',uid).maybeSingle();
      if(!current())return null;
      if(!result.error&&result.data)extra=result.data;
    }catch{}
    if(!current())return null;
    return{profile,extra,userId:uid,epoch};
  }

  function setMsg(card,text,good=false){
    const m=$q('.kf81Msg',card);if(!m)return;
    m.textContent=text;m.style.color=good?'#aef7bd':'#ffb8cf';
  }

  // Recovery348: appearance saves belong to one account activation and one
  // still-mounted settings card, not merely to a matching user ID.
  function appearanceCurrent(card,uid,epoch){
    const sheet=document.getElementById('kf78-sheet');
    return !!uid&&state?.user?.id===uid
      &&(epoch===null||kf129Epoch===epoch)
      &&!!sheet&&sheet.contains(card)&&card.isConnected!==false;
  }

  async function saveColor(card){
    const picker=$q('.kf81Color',card),text=$q('.kf81ColorText',card),btn=$q('[data-kf81-save-color]',card);
    if(!btn||btn.disabled)return;
    const color=(text?.value||picker?.value||'').trim();
    if(!hexOk(color))return setMsg(card,'Choose a valid 6-digit color, for example #e85a9b.');
    const uid=state?.user?.id,epoch=typeof kf129Epoch==='undefined'?null:kf129Epoch;
    if(!appearanceCurrent(card,uid,epoch))return;
    btn.disabled=true;btn.textContent='Saving color…';
    try{
      const {data,error}=await sb.from('profiles').update({accent_color:color}).eq('id',uid).select().single();
      if(!appearanceCurrent(card,uid,epoch))return;
      if(error)throw error;
      if(!data||data.id!==uid||String(data.accent_color||'').toLowerCase()!==color.toLowerCase())
        throw new Error('Profile color save could not be confirmed. Please try again.');
      state.profile=data;state.profiles?.set?.(uid,data);
      window.applyKinfolkTheme?.(color);
      document.documentElement.style.setProperty('--accent',color);
      document.querySelector('.kf51Profile')?.style.setProperty('--kf51-accent',color);
      setMsg(card,'Color saved to your profile.',true);
    }catch(e){if(appearanceCurrent(card,uid,epoch))setMsg(card,e.message||'Color could not be saved.');}
    finally{btn.disabled=false;btn.textContent='Save color';}
  }

  async function saveMusic(card){
    const input=$q('.kf81MusicUrl',card),btn=$q('[data-kf81-save-music]',card);
    if(!btn||btn.disabled)return;
    const url=(input?.value||'').trim();
    if(url&&!/^https:\/\//i.test(url))return setMsg(card,'Use a full https:// music or YouTube link.');
    const uid=state?.user?.id,epoch=typeof kf129Epoch==='undefined'?null:kf129Epoch;
    if(!appearanceCurrent(card,uid,epoch))return;
    btn.disabled=true;btn.textContent='Saving music…';
    try{
      const value=url||null,now=new Date().toISOString();
      // Sequential writes avoid updating the public profile after a failed or
      // stale private-extras write. Both returned rows must confirm the value.
      const a=await sb.from('kinfolk_profile_extras')
        .upsert({user_id:uid,music_url:value,updated_at:now},{onConflict:'user_id'})
        .select('user_id,music_url').single();
      if(!appearanceCurrent(card,uid,epoch))return;
      if(a.error)throw a.error;
      if(!a.data||a.data.user_id!==uid||(a.data.music_url||null)!==value)
        throw new Error('Music preferences could not be confirmed. Please try again.');
      const b=await sb.from('profiles').update({profile_music_url:value}).eq('id',uid).select().single();
      if(!appearanceCurrent(card,uid,epoch))return;
      if(b.error)throw b.error;
      if(!b.data||b.data.id!==uid||(b.data.profile_music_url||null)!==value)
        throw new Error('Profile music could not be fully saved. Please retry.');
      state.profile=b.data;state.profiles?.set?.(uid,b.data);
      setMsg(card,url?'Profile music saved. Opening your profile will try to play it automatically.':'Profile music removed.',true);
      stopMusic();
      if(state.view==='profile')setTimeout(()=>{
        if(appearanceCurrent(card,uid,epoch)&&state.view==='profile')ensureMusic(true);
      },80);
    }catch(e){if(appearanceCurrent(card,uid,epoch))setMsg(card,e.message||'Music could not be saved.');}
    finally{btn.disabled=false;btn.textContent='Save music';}
  }

  async function mountAppearance(){
    const sheet=document.getElementById('kf78-sheet');
    if(!sheet||sheet.querySelector('.kf81Card'))return;
    const safetyBox=document.getElementById('kf78-safety');
    if(!safetyBox)return;
    const loaded=await loadOwnAppearance();
    if(!loaded||state?.user?.id!==loaded.userId||(loaded.epoch!==null&&kf129Epoch!==loaded.epoch)||document.getElementById('kf78-sheet')!==sheet||sheet.querySelector('.kf81Card'))return;
    const {profile,extra}=loaded;
    const card=document.createElement('section');card.className='kf81Card';
    const color=hexOk(profile.accent_color)?profile.accent_color:'#e85a9b';
    const music=Object.prototype.hasOwnProperty.call(extra,'music_url')
      ? (extra.music_url||'')
      : (profile.profile_music_url||'');
    card.innerHTML=`<h3>Appearance & Music</h3><div class="kf81Muted">Save your profile color and music independently so one setting cannot block the other.</div><div class="kf81Grid"><input class="kf81Color" type="color" value="${esc(color)}" aria-label="Profile color"><input class="kf81Input kf81ColorText" maxlength="7" value="${esc(color)}" aria-label="Profile color hex"></div><button type="button" class="kf81Btn" data-kf81-save-color>Save color</button><div style="height:12px"></div><input class="kf81Input kf81MusicUrl" type="url" value="${esc(music)}" placeholder="YouTube or direct music link"><button type="button" class="kf81Btn" data-kf81-save-music>Save music</button><div class="kf81Muted" style="margin-top:8px">YouTube and direct audio links will auto-start when the browser allows it. If Android/iPhone blocks sound autoplay, Kinfolk shows a Play button instead.</div><div class="kf81Msg"></div>`;
    safetyBox.insertAdjacentElement('afterend',card);
    const picker=$q('.kf81Color',card),text=$q('.kf81ColorText',card);
    picker.oninput=()=>{text.value=picker.value;window.applyKinfolkTheme?.(picker.value)};
    text.oninput=()=>{if(hexOk(text.value)){picker.value=text.value;window.applyKinfolkTheme?.(text.value)}};
    $q('[data-kf81-save-color]',card).onclick=()=>saveColor(card);
    $q('[data-kf81-save-music]',card).onclick=()=>saveMusic(card);
  }

  document.addEventListener('submit',e=>{
    if(e.target?.id!=='kfsForm'||!state?.user?.id)return;
    const text=document.getElementById('kfsAccentText'),picker=document.getElementById('kfsAccent');
    const color=(text?.value||picker?.value||'').trim();
    if(!hexOk(color))return;
    const uid=state.user.id,epoch=typeof kf129Epoch==='undefined'?null:kf129Epoch,form=e.target;
    const current=()=>state?.user?.id===uid&&(epoch===null||kf129Epoch===epoch)
      &&document.getElementById('kfsForm')===form&&form.isConnected!==false;
    if(!current())return;
    sb.from('profiles').update({accent_color:color}).eq('id',uid).select().single().then(({data,error})=>{
      if(error||!data||data.id!==uid||String(data.accent_color||'').toLowerCase()!==color.toLowerCase()||!current())return;
      state.profile=data;state.profiles?.set?.(uid,data);window.applyKinfolkTheme?.(color);
    }).catch(()=>{});
  },true);

  let musicKey='',player=null,ensureBusy=false,ensureAgain=false,pausedKey='',musicSessionEpoch=null;
  function ytId(u){
    try{
      const z=new URL(u),host=z.hostname.toLowerCase();
      if(z.protocol!=='https:')return '';
      const short=host==='youtu.be'||host==='www.youtu.be';
      const youtube=['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host);
      if(!short&&!youtube)return '';
      const id=short?z.pathname.split('/').filter(Boolean)[0]:
        z.searchParams.get('v')||(z.pathname.includes('/shorts/')?z.pathname.split('/shorts/')[1]?.split('/')[0]:'')||(z.pathname.includes('/embed/')?z.pathname.split('/embed/')[1]?.split('/')[0]:'');
      return /^[a-zA-Z0-9_-]{11}$/.test(id||'')?id:'';
    }catch{return ''}
  }
  function directAudio(u){const safe=safeMusicUrl(u);return !!safe&&/\.(mp3|m4a|aac|ogg|wav)$/i.test(new URL(safe).pathname)}

  function stopMusic(){
    if(player?.audio){try{player.audio.pause();player.audio.src=''}catch{}}
    if(player?.iframe){try{player.iframe.remove()}catch{}}
    document.querySelectorAll('.kf51Music audio').forEach(audio=>{try{audio.pause();audio.autoplay=false;audio.muted=true}catch{}});
    document.getElementById('kf81-profile-player')?.remove();
    document.getElementById('kf54YT')?.remove();
    player=null;musicKey='';musicSessionEpoch=null;
  }

  function attachControl(url,type){
    let host=document.querySelector('.kf51Music');
    if(!host){const hero=document.querySelector('.profileHero');if(!hero)return null;host=document.createElement('div');host.className='kf51Music';hero.after(host)}
    host.querySelector('.kf81Player')?.remove();
    const ctl=document.createElement('div');ctl.className='kf81Player';ctl.id='kf81-profile-player';
    ctl.innerHTML=`<div class="kf81PlayerRow"><button type="button" class="kf81Play">▶ Play music</button><span class="kf81Status">Trying autoplay…</span><a class="kf81Open" target="_blank" rel="noopener" href="${esc(url)}">Open</a></div>`;
    host.appendChild(ctl);
    return ctl;
  }

  // Recovery349: a private extras row is authoritative, including an explicit
  // null/empty value when music was removed. Profile playback is read-only:
  // never repair a public profile record as a side effect of opening it.
  async function musicUrlFor(uid){
    const p=state?.profiles?.get?.(uid)||(uid===state?.user?.id?state?.profile:null)||{};
    let url=p?.profile_music_url||'';
    if(uid===state?.user?.id){
      const epoch=typeof kf129Epoch==='undefined'?null:kf129Epoch;
      try{
        const {data,error}=await sb.from('kinfolk_profile_extras').select('music_url').eq('user_id',uid).maybeSingle();
        if(state?.user?.id!==uid||(epoch!==null&&kf129Epoch!==epoch))return '';
        if(!error&&data&&Object.prototype.hasOwnProperty.call(data,'music_url'))
          url=data.music_url||'';
      }catch{}
      if(state?.user?.id!==uid||(epoch!==null&&kf129Epoch!==epoch))return '';
    }
    return url;
  }

  async function ensureMusic(force=false){
    if(ensureBusy){ensureAgain=true;return}
    if(!state?.user||state.view!=='profile'){if(player)stopMusic();return}
    const viewerId=state.user.id,epoch=typeof kf129Epoch==='undefined'?null:kf129Epoch;
    const uid=state.profileViewId||viewerId;
    const hero=document.querySelector('.profileHero');if(!hero)return;
    ensureBusy=true;
    try{
      const url=safeMusicUrl(await musicUrlFor(uid));
      // A same-user relogin is a new auth activation even when the profile,
      // account ID and URL look identical. Never mount a previous activation.
      if(!state?.user||state.user.id!==viewerId||state.view!=='profile'||(state.profileViewId||state.user.id)!==uid||document.querySelector('.profileHero')!==hero||(epoch!==null&&kf129Epoch!==epoch))return;
      if(player&&musicSessionEpoch!==epoch){stopMusic();pausedKey=''}
      const key=uid+'|'+url;
      const isPaused=pausedKey===viewerId+'|'+key;
      if(!url){if(player)stopMusic();return}
      if(!force&&player&&musicKey===key&&document.getElementById('kf81-profile-player')===player.ctl)return;
      if(player)stopMusic();
      musicKey=key;musicSessionEpoch=epoch;
      document.getElementById('kf54YT')?.remove();
      const oldAudio=document.querySelector('.kf51Music audio');if(oldAudio){try{oldAudio.pause();oldAudio.muted=true;oldAudio.autoplay=false}catch{}}
      const ctl=attachControl(url,directAudio(url)?'audio':ytId(url)?'youtube':'link');if(!ctl)return;
      const btn=$q('.kf81Play',ctl),status=$q('.kf81Status',ctl);
      if(directAudio(url)){
        const audio=new Audio(url);audio.loop=true;audio.preload='auto';audio.autoplay=!isPaused;audio.setAttribute('playsinline','');
        player={type:'audio',audio,url,ctl};
        const active=()=>player?.audio===audio&&state?.user?.id===viewerId&&state.view==='profile'&&(state.profileViewId||state.user.id)===uid&&(epoch===null||kf129Epoch===epoch)&&document.querySelector('.profileHero')===hero;
        const play=async()=>{try{await audio.play();if(!active()){audio.pause();return false}pausedKey='';status.textContent='Playing';btn.textContent='⏸ Pause';return true}catch{if(active()){status.textContent='Autoplay blocked. Tap Play.';btn.textContent='▶ Play music'}return false}};
        btn.onclick=async()=>{if(!active())return;if(audio.paused)await play();else{pausedKey=viewerId+'|'+key;audio.pause();status.textContent='Paused';btn.textContent='▶ Play music'}};
        if(isPaused){status.textContent='Paused';btn.textContent='▶ Play music'}else await play();
      }else if(ytId(url)){
        const id=ytId(url);const iframe=document.createElement('iframe');iframe.id='kf81YT';iframe.allow='autoplay; encrypted-media';iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.style.cssText='position:fixed;width:2px;height:2px;opacity:.001;pointer-events:none;left:-20px;top:-20px;border:0';document.body.appendChild(iframe);
        const src=()=>`https://www.youtube.com/embed/${encodeURIComponent(id)}?enablejsapi=1&autoplay=${isPaused?0:1}&playsinline=1&controls=0&loop=1&playlist=${encodeURIComponent(id)}`;
        iframe.src=src();player={type:'youtube',iframe,url,ctl};status.textContent=isPaused?'Paused':'Autoplay requested. Tap Play if silent.';
        btn.textContent=isPaused?'▶ Play music':'⏸ Pause';player.paused=isPaused;
        btn.onclick=()=>{if(player?.iframe!==iframe)return;player.paused=!player.paused;pausedKey=player.paused?viewerId+'|'+key:'';iframe.contentWindow?.postMessage(JSON.stringify({event:'command',func:player.paused?'pauseVideo':'playVideo',args:[]}), 'https://www.youtube.com');status.textContent=player.paused?'Paused':'Playing requested';btn.textContent=player.paused?'▶ Resume':'⏸ Pause'};
      }else{
        player={type:'link',url,ctl};status.textContent='This link opens in its music service.';btn.textContent='Open music';btn.onclick=()=>window.open(url,'_blank','noopener');
      }
    }finally{ensureBusy=false;if(ensureAgain){ensureAgain=false;setTimeout(()=>ensureMusic(false),0)}}
  }

  window.kf81MountAppearance=mountAppearance;
  window.kf81EnsureProfileMusic=ensureMusic;
  window.kf81StopProfileMusic=stopMusic;
  let timer;
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{mountAppearance();ensureMusic(false)},70)}).observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>ensureMusic(false),80)});
  setTimeout(()=>{mountAppearance();ensureMusic(false)},250);
  setTimeout(()=>{mountAppearance();ensureMusic(false)},900);
})();
