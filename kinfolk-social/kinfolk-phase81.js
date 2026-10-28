(()=>{
  if(window.__kinfolkPhase81)return;
  window.__kinfolkPhase81=1;

  const $q=(s,r=document)=>r.querySelector(s);
  const hexOk=v=>/^#[0-9a-fA-F]{6}$/.test(v||'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const style=document.createElement('style');
  style.id='kf81-style';
  style.textContent=`
    .kf81Card{background:#211e28;border:1px solid #393442;border-radius:18px;padding:16px;margin:12px 0}.kf81Card h3{margin:0 0 7px;font-size:20px}.kf81Muted{color:#b9b4c2;font-size:13px;line-height:1.45}.kf81Grid{display:grid;grid-template-columns:58px 1fr;gap:10px;align-items:center;margin-top:12px}.kf81Color{width:58px;height:50px;border:0;border-radius:13px;background:transparent;padding:0;overflow:hidden}.kf81Input{width:100%;box-sizing:border-box;min-height:50px;border-radius:13px;border:1px solid #44404c;background:#111017;color:#fff;padding:0 12px;font:inherit}.kf81Btn{width:100%;min-height:49px;border:0;border-radius:14px;background:var(--accent,#e85a9b);color:#fff;font:inherit;font-weight:900;margin-top:10px}.kf81Btn.secondary{background:#2b2832;border:1px solid #4a4552}.kf81Msg{min-height:18px;margin-top:8px;font-size:12px;color:#aaa}.kf81Player{margin-top:10px;padding:11px 12px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(9,9,13,.72)}.kf81PlayerRow{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.kf81Play{border:0;border-radius:999px;background:var(--accent,#e85a9b);color:#fff;padding:9px 13px;font-weight:900}.kf81Status{font-size:12px;color:#b9b4c2}.kf81Open{margin-left:auto;color:var(--accent,#e85a9b);font-size:12px;font-weight:800;text-decoration:none}
  `;
  document.head.appendChild(style);

  async function loadOwnAppearance(){
    if(typeof sb==='undefined'||!state?.user?.id)return null;
    const uid=state.user.id;
    const profile=state.profile||state.profiles?.get?.(uid)||{};
    let extra={};
    try{extra=(await sb.from('kinfolk_profile_extras').select('music_url').eq('user_id',uid).maybeSingle()).data||{}}catch{}
    if(state?.user?.id!==uid)return null;
    return{profile,extra,userId:uid};
  }

  function setMsg(card,text,good=false){
    const m=$q('.kf81Msg',card);if(!m)return;
    m.textContent=text;m.style.color=good?'#aef7bd':'#ffb8cf';
  }

  async function saveColor(card){
    const picker=$q('.kf81Color',card),text=$q('.kf81ColorText',card),btn=$q('[data-kf81-save-color]',card);
    const color=(text?.value||picker?.value||'').trim();
    if(!hexOk(color))return setMsg(card,'Choose a valid 6-digit color, for example #e85a9b.');
    const uid=state?.user?.id;
    if(!uid)return setMsg(card,'Log in before saving your color.');
    btn.disabled=true;btn.textContent='Saving color…';
    try{
      const {data,error}=await sb.from('profiles').update({accent_color:color}).eq('id',uid).select().single();
      if(error)throw error;
      if(state?.user?.id!==uid)return;
      state.profile=data;state.profiles?.set?.(data.id,data);
      window.applyKinfolkTheme?.(color);
      document.documentElement.style.setProperty('--accent',color);
      document.querySelector('.kf51Profile')?.style.setProperty('--kf51-accent',color);
      setMsg(card,'Color saved to your profile.',true);
      btn.textContent='Saved ✓';
      setTimeout(()=>{btn.disabled=false;btn.textContent='Save color'},900);
    }catch(e){if(state?.user?.id===uid)setMsg(card,e.message||'Color could not be saved.');}finally{btn.disabled=false;btn.textContent='Save color';}
  }

  async function saveMusic(card){
    const input=$q('.kf81MusicUrl',card),btn=$q('[data-kf81-save-music]',card),url=(input?.value||'').trim();
    if(url&&!/^https:\/\//i.test(url))return setMsg(card,'Use a full https:// music or YouTube link.');
    const uid=state?.user?.id;
    if(!uid)return setMsg(card,'Log in before saving profile music.');
    btn.disabled=true;btn.textContent='Saving music…';
    try{
      const now=new Date().toISOString();
      const [a,b]=await Promise.all([
        sb.from('kinfolk_profile_extras').upsert({user_id:uid,music_url:url||null,updated_at:now},{onConflict:'user_id'}),
        sb.from('profiles').update({profile_music_url:url||null}).eq('id',uid).select().single()
      ]);
      const er=a.error||b.error;if(er)throw er;
      if(state?.user?.id!==uid)return;
      state.profile=b.data;state.profiles?.set?.(b.data.id,b.data);
      setMsg(card,url?'Profile music saved. Opening your profile will try to play it automatically.':'Profile music removed.',true);
      btn.textContent='Saved ✓';
      stopMusic();
      if(state.view==='profile')setTimeout(()=>{if(state?.user?.id===uid&&state.view==='profile')ensureMusic(true)},80);
      setTimeout(()=>{btn.disabled=false;btn.textContent='Save music'},900);
    }catch(e){if(state?.user?.id===uid)setMsg(card,e.message||'Music could not be saved.');}finally{btn.disabled=false;btn.textContent='Save music';}
  }

  async function mountAppearance(){
    const sheet=document.getElementById('kf78-sheet');
    if(!sheet||sheet.querySelector('.kf81Card'))return;
    const safetyBox=document.getElementById('kf78-safety');
    if(!safetyBox)return;
    const loaded=await loadOwnAppearance();
    if(!loaded||state?.user?.id!==loaded.userId||document.getElementById('kf78-sheet')!==sheet||sheet.querySelector('.kf81Card'))return;
    const {profile,extra}=loaded;
    const card=document.createElement('section');card.className='kf81Card';
    const color=hexOk(profile.accent_color)?profile.accent_color:'#e85a9b';
    const music=extra.music_url||profile.profile_music_url||'';
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
    const uid=state.user.id;
    sb.from('profiles').update({accent_color:color}).eq('id',uid).select().single().then(({data,error})=>{
      if(error||!data||state?.user?.id!==uid)return;
      state.profile=data;state.profiles?.set?.(data.id,data);window.applyKinfolkTheme?.(color);
    }).catch(()=>{});
  },true);

  let musicKey='',player=null,ensureBusy=false,pausedKey='';
  function ytId(u){try{const z=new URL(u);if(z.hostname.includes('youtu.be'))return z.pathname.split('/').filter(Boolean)[0]||'';if(z.hostname.includes('youtube.com'))return z.searchParams.get('v')||(z.pathname.includes('/shorts/')?z.pathname.split('/shorts/')[1]?.split('/')[0]:'')||(z.pathname.includes('/embed/')?z.pathname.split('/embed/')[1]?.split('/')[0]:'')}catch{}return''}
  function directAudio(u){return /\.(mp3|m4a|aac|ogg|wav)(\?|#|$)/i.test(u||'')}

  function stopMusic(){
    if(player?.audio){try{player.audio.pause();player.audio.src=''}catch{}}
    if(player?.iframe){try{player.iframe.remove()}catch{}}
    document.querySelectorAll('.kf51Music audio').forEach(audio=>{try{audio.pause();audio.autoplay=false;audio.muted=true}catch{}});
    document.getElementById('kf81-profile-player')?.remove();
    document.getElementById('kf54YT')?.remove();
    player=null;musicKey='';
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

  async function musicUrlFor(uid){
    const p=state?.profiles?.get?.(uid)||(uid===state?.user?.id?state?.profile:null)||{};
    let url=p?.profile_music_url||'';
    if(uid===state?.user?.id){
      try{
        const {data}=await sb.from('kinfolk_profile_extras').select('music_url').eq('user_id',uid).maybeSingle();
        if(state?.user?.id!==uid)return url;
        if(data?.music_url)url=data.music_url;
        if(url&&p?.profile_music_url!==url){
          const {data:updated}=await sb.from('profiles').update({profile_music_url:url}).eq('id',uid).select().single();
          if(updated&&state?.user?.id===uid&&state.view==='profile'&&(state.profileViewId||uid)===uid){state.profile=updated;state.profiles?.set?.(uid,updated)}
        }
      }catch{}
    }
    return url;
  }

  async function ensureMusic(force=false){
    if(ensureBusy)return;
    if(!state?.user||state.view!=='profile'){if(player)stopMusic();return}
    const viewerId=state.user.id;
    const uid=state.profileViewId||viewerId;
    const hero=document.querySelector('.profileHero');if(!hero)return;
    ensureBusy=true;
    try{
      const url=await musicUrlFor(uid);
      // Ignore lookups from a profile that has been replaced or signed out.
      if(!state?.user||state.user.id!==viewerId||state.view!=='profile'||(state.profileViewId||state.user.id)!==uid||document.querySelector('.profileHero')!==hero)return;
      const key=uid+'|'+url;
      const isPaused=pausedKey===viewerId+'|'+key;
      if(!url){if(player)stopMusic();return}
      if(!force&&player&&musicKey===key&&document.getElementById('kf81-profile-player')===player.ctl)return;
      if(player)stopMusic();
      if(player&&musicKey!==key)stopMusic();
      musicKey=key;
      document.getElementById('kf54YT')?.remove();
      const oldAudio=document.querySelector('.kf51Music audio');if(oldAudio){try{oldAudio.pause();oldAudio.muted=true;oldAudio.autoplay=false}catch{}}
      const ctl=attachControl(url,directAudio(url)?'audio':ytId(url)?'youtube':'link');if(!ctl)return;
      const btn=$q('.kf81Play',ctl),status=$q('.kf81Status',ctl);
      if(directAudio(url)){
        const audio=new Audio(url);audio.loop=true;audio.preload='auto';audio.autoplay=!isPaused;audio.setAttribute('playsinline','');
        player={type:'audio',audio,url,ctl};
        const play=async()=>{try{await audio.play();pausedKey='';status.textContent='Playing';btn.textContent='⏸ Pause';return true}catch{status.textContent='Autoplay blocked. Tap Play.';btn.textContent='▶ Play music';return false}};
        btn.onclick=async()=>{if(audio.paused)await play();else{pausedKey=viewerId+'|'+key;audio.pause();status.textContent='Paused';btn.textContent='▶ Play music'}};
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
    }finally{ensureBusy=false}
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
