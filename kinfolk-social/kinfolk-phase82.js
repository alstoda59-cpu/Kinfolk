(()=>{
  if(window.__kinfolkPhase82)return;
  window.__kinfolkPhase82=true;

  const KEY='kinfolk_content_lane_v1';
  const native=!!(window.Capacitor&&window.Capacitor.isNativePlatform?.());
  let lane=!native&&localStorage.getItem(KEY)==='xxx'?'xxx':'general';
  let safetyCache={known:false,adult:false,allow:false};
  let safetyAt=0,safetyPending=null;
  const baseHome=window.renderHome;
  const baseReels=window.renderReels;
  const basePost=window.openPostModal;
  const baseVideo=window.openVideoModal;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function calcAge(v){if(!v)return null;const d=new Date(v+'T00:00:00');if(Number.isNaN(d.getTime()))return null;const n=new Date();let a=n.getFullYear()-d.getFullYear(),m=n.getMonth()-d.getMonth();if(m<0||(m===0&&n.getDate()<d.getDate()))a--;return a}
  async function refreshSafety(force=false){
    if(!force&&safetyCache.known&&Date.now()-safetyAt<30000)return safetyCache;
    if(safetyPending)return safetyPending;
    safetyPending=(async()=>{
      try{
        if(typeof sb==='undefined'||!state?.user?.id)return safetyCache;
        const {data,error}=await sb.from('kinfolk_safety_settings').select('birth_date,mature_content_preference').eq('user_id',state.user.id).maybeSingle();
        if(error)throw error;
        const adult=calcAge(data?.birth_date)>=18;
        safetyCache={known:true,adult,allow:adult&&data?.mature_content_preference==='allow'};
        safetyAt=Date.now();
        if((!adult||native)&&lane==='xxx'){lane='general';try{localStorage.setItem(KEY,lane)}catch{}}
        updateBars();
        return safetyCache;
      }catch(e){console.warn('Kinfolk content filter read',e);return safetyCache}
      finally{safetyPending=null}
    })();
    return safetyPending;
  }

  const st=document.createElement('style');
  st.id='kf82-style';
  st.textContent=`.kf82filter{margin-bottom:10px}.kf82lanes{display:flex;gap:8px;overflow:auto}.kf82lane{border:1px solid rgba(255,255,255,.14);background:#26232d;color:#ddd;border-radius:999px;padding:10px 15px;font-weight:900;white-space:nowrap}.kf82lane.on{background:var(--accent,#e85a9b);color:#fff}.kf82lane.xxx.on{background:#8f2359}.kf82note{font-size:12px;color:var(--muted,#999);line-height:1.45;margin-top:7px}.kf82gate{text-align:center;padding:18px}.kf82gate p{color:var(--muted,#aaa);line-height:1.45}.kf82fallback{padding:18px}.kf82fallback button{margin-top:12px}`;
  document.head.appendChild(st);

  function barHTML(){
    const adult=safetyCache.known&&safetyCache.adult&&!native;
    return `<div class="card kf82filter" data-kf82-filter><div class="cardpad"><div class="sectionTitle">Content filter</div><div class="kf82lanes"><button class="kf82lane ${lane==='general'?'on':''}" type="button" onclick="kf82Lane('general')">General</button>${adult?`<button class="kf82lane xxx ${lane==='xxx'?'on':''}" type="button" onclick="kf82Lane('xxx')">XXX · 18+</button>`:''}</div>${lane==='xxx'?`<div class="kf82note">${safetyCache.allow?'Viewing the separate XXX 18+ feed.':'Adult content is off until you enable it.'}</div>`:''}</div></div>`;
  }
  function addBar(main){if(!main?.isConnected)return;main.querySelector('[data-kf82-filter]')?.remove();main.insertAdjacentHTML('afterbegin',barHTML())}
  function updateBars(){document.querySelectorAll('[data-kf82-filter]').forEach(old=>{const wrap=document.createElement('div');wrap.innerHTML=barHTML();old.replaceWith(wrap.firstElementChild)})}

  function generalOnly(x){return (x?.content_rating||'general')==='general'}
  function chosen(x){return (x?.content_rating||'general')===lane}
  function renderHomeFallback(main,items,err){
    if(!main?.isConnected)return;
    const cards=items.slice(0,20).map(p=>`<div class="card"><div class="cardpad"><b>${esc(state.profiles?.get?.(p.author_id||p.owner_id)?.display_name||'Kinfolk member')}</b><div style="margin-top:9px;white-space:pre-wrap">${esc(p.body||p.content||p.caption||'Post')}</div></div></div>`).join('');
    main.innerHTML=`<div class="card"><div class="kf82fallback"><b>Home is open</b><div class="muted" style="margin-top:7px">A display component had trouble, so Kinfolk switched to a safe feed view instead of making you refresh.</div><button class="btn primary" type="button" onclick="renderApp()">Retry full feed</button></div></div>${cards||'<div class="card"><div class="empty">No posts yet.</div></div>'}`;
    console.warn('Kinfolk Home recovered locally',err);
  }
  function renderReelsFallback(main,items,err){
    if(!main?.isConnected)return;
    const rows=items.slice(0,30).map(v=>`<div class="card"><div class="cardpad"><b>${esc(v.title||v.caption||'Video')}</b><div class="muted" style="margin-top:6px">${esc(v.description||'Kinfolk video')}</div></div></div>`).join('');
    main.innerHTML=`<div class="card"><div class="kf82fallback"><b>Reels is open</b><div class="muted" style="margin-top:7px">A video display component had trouble, so Kinfolk kept the section usable instead of leaving it on Loading.</div><button class="btn primary" type="button" onclick="renderApp()">Retry Reels</button></div></div>${rows||'<div class="card"><div class="empty">No videos yet.</div></div>'}`;
    console.warn('Kinfolk Reels recovered locally',err);
  }

  if(typeof baseHome==='function')window.renderHome=async main=>{
    const all=Array.isArray(state.feed)?state.feed:[];
    const permitted=lane==='xxx'?(safetyCache.adult&&safetyCache.allow&&!native?all.filter(chosen):all.filter(generalOnly)):all.filter(generalOnly);
    state.feed=permitted;
    try{await baseHome(main)}catch(e){renderHomeFallback(main,permitted,e)}finally{state.feed=all}
    addBar(main);
    refreshSafety(false);
  };

  if(typeof baseReels==='function')window.renderReels=async main=>{
    const all=Array.isArray(state.videos)?state.videos:[];
    if(lane==='xxx'&&safetyCache.known&&safetyCache.adult&&!safetyCache.allow&&!native){
      main.innerHTML=`<div class="card"><div class="kf82gate"><b>XXX content is off</b><p>Enable the adult filter to open this separate video lane.</p><button class="btn primary" type="button" onclick="kf82Enable(this)">Enable XXX content</button></div></div>`;
      addBar(main);return;
    }
    const permitted=lane==='xxx'?(safetyCache.adult&&safetyCache.allow&&!native?all.filter(chosen):[]):all.filter(generalOnly);
    state.videos=permitted;
    try{await baseReels(main)}catch(e){renderReelsFallback(main,permitted,e)}finally{state.videos=all}
    addBar(main);
    refreshSafety(false);
  };

  window.kf82Lane=async v=>{
    if(v==='general'){
      lane='general';try{localStorage.setItem(KEY,lane)}catch{}
      try{await renderApp()}catch(e){console.warn('Kinfolk General render',e)}
      return;
    }
    const s=await refreshSafety(true);
    if(native||!s.adult)return toast?.('XXX content is for adult web accounts only.','danger');
    lane='xxx';try{localStorage.setItem(KEY,lane)}catch{}
    try{await renderApp()}catch(e){console.warn('Kinfolk adult lane render',e)}
  };

  window.kf82Enable=async btn=>{
    if(btn){btn.disabled=true;btn.textContent='Enabling…'}
    try{
      const s=await refreshSafety(true);if(native||!s.adult)throw Error('XXX content is for adult web accounts only.');
      const {error}=await sb.from('kinfolk_safety_settings').update({mature_content_preference:'allow',daily_limit_minutes:null,updated_at:new Date().toISOString()}).eq('user_id',state.user.id);if(error)throw error;
      safetyCache={...s,known:true,allow:true};safetyAt=Date.now();lane='xxx';try{localStorage.setItem(KEY,lane)}catch{}
      await renderApp();
    }catch(e){if(btn){btn.disabled=false;btn.textContent='Enable XXX content'}toast?.(e.message||'Could not enable XXX content.','danger')}
  };

  function ratingOptions(select,s){if(!select)return;select.innerHTML=`<option value="general">General audience</option>${s.adult&&!native?'<option value="xxx">XXX · 18+ explicit</option>':''}`}
  function refreshModalRatings(kind){refreshSafety(false).then(s=>{const x=document.getElementById(kind==='post'?'postRating':'videoRating');ratingOptions(x,s)})}
  if(typeof basePost==='function')window.openPostModal=(photo=false)=>{const r=basePost(photo);setTimeout(()=>{ratingOptions(document.getElementById('postRating'),safetyCache);refreshModalRatings('post')},0);return r};
  if(typeof baseVideo==='function')window.openVideoModal=()=>{const r=baseVideo();setTimeout(()=>{ratingOptions(document.getElementById('videoRating'),safetyCache);refreshModalRatings('video')},0);return r};

  function patchSettings(){
    const box=document.getElementById('kf78-safety');if(!box)return;
    box.querySelectorAll('label').forEach(l=>{if((l.textContent||'').includes('Mature-content filter')){for(const n of l.childNodes)if(n.nodeType===3&&n.textContent.includes('Mature-content filter'))n.textContent='Content filter';const s=l.querySelector('select');if(s){const h=s.querySelector('[value="hide"]'),a=s.querySelector('[value="allow"]');if(h)h.textContent='General audience only';if(a)a.textContent='General + XXX (18+) access'}}});
    if(!box.querySelector('.kf82rules'))box.insertAdjacentHTML('beforeend','<div class="kf82note kf82rules">XXX is adult-only. Illegal sexual content, non-consensual content, and any sexual content involving minors are prohibited.</div>');
  }
  let mt;new MutationObserver(()=>{clearTimeout(mt);mt=setTimeout(patchSettings,50)}).observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(patchSettings,120);
  setTimeout(()=>refreshSafety(false),600);
})();
