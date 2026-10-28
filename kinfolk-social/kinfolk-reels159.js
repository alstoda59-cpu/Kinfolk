/* Recovery159 immersive Reels/Shorts. Existing safety filtering remains in phase82. */
(function(){
 const style=document.createElement('style');
 style.textContent=`
 .kf159-feed{height:calc(100dvh - 180px);min-height:420px;overflow-y:auto;overscroll-behavior-y:contain;scroll-snap-type:y mandatory;background:#08080b;border-radius:16px;scrollbar-width:none}
 .kf159-feed::-webkit-scrollbar{display:none}
 .kf159-slide{height:100%;min-height:420px;position:relative;scroll-snap-align:start;scroll-snap-stop:always;overflow:hidden;background:#07070a;display:flex;align-items:center;justify-content:center}
 .kf159-slide video{height:100%;width:100%;object-fit:contain;background:#050505}
 .kf159-overlay{position:absolute;inset:0;pointer-events:none;background:linear-gradient(transparent 58%,rgba(0,0,0,.76));color:white}
 .kf159-info{position:absolute;bottom:20px;left:15px;right:85px;text-shadow:0 1px 4px black}
 .kf159-actions{position:absolute;right:9px;bottom:24px;max-height:75%;overflow-y:auto;scrollbar-width:none;display:flex;flex-direction:column;gap:7px;pointer-events:auto}
 .kf159-actions button{min-width:62px;min-height:47px;background:rgba(14,14,20,.64);border:1px solid #ffffff55;color:white;border-radius:14px;font-size:12px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;padding:5px}
 .kf159-actions button:disabled{opacity:.6}
 .kf159-actions button span{font-size:22px}
 .kf159-tap{position:absolute;inset:0;z-index:1;border:0;background:transparent;color:white;cursor:pointer}
 .kf159-playicon{position:absolute;z-index:2;top:50%;left:50%;transform:translate(-50%,-50%);font-size:56px;text-shadow:0 2px 8px black;pointer-events:none}
 .kf159-actions{z-index:3}.kf159-info{z-index:2;pointer-events:none}
 .kf159-top{padding:10px;display:flex;gap:10px;align-items:center;justify-content:space-between}
 .kf159-tabs{display:flex;gap:7px;align-items:center;margin-left:auto}
 .kf159-tabs button{border:1px solid #ffffff44;border-radius:999px;background:#26212d;color:#fff;padding:9px 11px;font:inherit;font-size:12px;min-height:40px}
 .kf159-tabs button[aria-current="page"]{background:var(--accent,#e85a9b);border-color:transparent;color:#fff;font-weight:800}
 @media(max-width:600px){
 .kf159-top{padding:8px 12px;background:#08080b;color:#fff;flex-wrap:wrap}
 .kf159-top>b{flex:1 1 120px}
 .kf159-tabs{order:3;width:100%;margin-left:0;justify-content:center}
 .kf159-tabs button{flex:1;max-width:190px}
 .kf159-feed{height:var(--kf159-viewport-height,calc(100dvh - 152px - env(safe-area-inset-bottom,0px)));min-height:120px;border-radius:0;background:#000;scroll-snap-type:y mandatory}
 .kf159-slide{height:100%;min-height:0;background:#000}
 .kf159-slide video{width:100%;height:100%;object-fit:cover;background:#000}
 .kf159-actions{right:8px;bottom:74px;gap:9px;max-height:calc(100% - 110px)}
 .kf159-actions button{min-width:54px;min-height:48px;padding:3px;background:rgba(0,0,0,.28);border:0;border-radius:12px;font-size:11px;text-shadow:0 1px 3px #000}
 .kf159-actions button span{font-size:27px}
 .kf159-info{bottom:34px;left:14px;right:76px;font-size:14px}
 .kf159-info p{margin:6px 0 0;max-height:3.6em;overflow:hidden}
 .kf159-overlay{background:linear-gradient(transparent 55%,rgba(0,0,0,.72))}
 .kf159-playicon{font-size:48px}
 }
 @media(prefers-reduced-motion:reduce){.kf159-feed{scroll-behavior:auto}}
 `;
 document.head.appendChild(style);
 const active={observer:null,root:null,pausedByUser:new Set(),generation:0,scrollHandler:null,resizeController:null};
 window.kf161ToggleSound=function(id){const v=document.getElementById('kf159-video-'+id);if(!v)return;v.muted=!v.muted;const slide=v.closest('.kf159-slide');const b=[...slide.querySelectorAll('.kf159-actions button')].find(x=>x.textContent.includes('Sound')||x.textContent.includes('Mute'));if(b)b.innerHTML=v.muted?'<span>🔇</span>Sound':'<span>🔊</span>Mute'};
 function teardown(){active.resizeController?.abort();active.resizeController=null;active.generation++;if(active.root&&active.scrollHandler)active.root.removeEventListener('scroll',active.scrollHandler);active.scrollHandler=null;active.observer?.disconnect();active.root?.querySelectorAll('video').forEach(v=>v.pause());active.observer=null;active.root=null;active.pausedByUser.clear()}
 window.kf159StopReels=teardown;
 document.addEventListener('visibilitychange',()=>{if(document.hidden)active.root?.querySelectorAll('video').forEach(v=>v.pause());else if(active.root){const visible=[...active.root.querySelectorAll('.kf159-slide')].find(slide=>{const a=slide.getBoundingClientRect(),b=active.root.getBoundingClientRect();return Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>a.height*.65});const video=visible?.querySelector('video');if(video&&!active.pausedByUser.has(visible.dataset.id)){pauseOthers(video);video.play().catch(()=>{})}}});
 function pauseOthers(current){document.querySelectorAll('.kf159-slide video').forEach(v=>{if(v!==current)v.pause()})}
 function tap(id){const v=document.getElementById('kf159-video-'+id);if(!v)return;const icon=v.parentElement.querySelector('.kf159-playicon');if(v.paused){active.pausedByUser.delete(id);pauseOthers(v);v.play().catch(()=>{if(icon)icon.textContent='▶'})}else{active.pausedByUser.add(id);v.pause();if(icon)icon.textContent='▶'}}
 window.kf159TogglePlayback=tap;
 document.addEventListener('kinfolk:video-saved',e=>{
   const slide=active.root?.querySelectorAll('.kf159-slide');
   if(!slide)return;
   for(const el of slide){if(el.dataset.id!==e.detail?.id)continue;
     const button=el.querySelectorAll('.kf159-actions button')[5];
     if(button){button.innerHTML=e.detail.saved?'<span>✓</span>Saved':'<span>▢</span>Save';button.setAttribute('aria-pressed',String(!!e.detail.saved))}
   }
 });
 document.addEventListener('kinfolk:video-reaction',e=>{
   const slides=active.root?.querySelectorAll('.kf159-slide');
   if(!slides)return;
   for(const el of slides){if(el.dataset.id!==e.detail?.id)continue;
     const rows=videoReactionState.rows.filter(r=>r.video_id===e.detail.id);
     const mine=rows.find(r=>r.user_id===state.user?.id)?.reaction;
     const buttons=el.querySelectorAll('.kf159-actions button');
     for(const [index,reaction] of [[0,'like'],[1,'dislike']]){
       const count=rows.filter(r=>r.reaction===reaction).length;
       if(buttons[index]){buttons[index].setAttribute('aria-pressed',String(mine===reaction));buttons[index].innerHTML='<span>'+(reaction==='like'?'♡':'👎')+'</span>'+(reaction==='like'?'Like ':'Dislike ')+count}
     }
   }
 });
 // Signed URLs are independent network requests. Resolve a bounded number in
 // parallel so a long Reels feed does not wait for every previous URL to finish.
 // A failed media signature affects only that reel, not the whole feed.
// Reaction counters are optional to playback. Do not strand the entire mobile
 // Reels feed when a reactions query rejects or never settles.
 async function kf289LoadReactions(waitMs=3500){
  let timer;
  try{
   return await Promise.race([
    Promise.resolve().then(()=>loadVideoReactions()).then(()=>true,()=>false),
    new Promise(resolve=>{timer=setTimeout(()=>resolve(false),waitMs)})
   ]);
  }finally{if(timer!==undefined)clearTimeout(timer)}
 }
 async function kf287ResolveReelUrls(reels,signMedia,isCurrent,maxConcurrent=4,signTimeoutMs=3500){
  const urls=new Array(reels.length).fill('');
  let next=0;
  // One stalled storage signature must not hold every subsequent mobile reel.
  // Limit each request, including custom test timeouts, to a bounded wait.
  const timeout=Math.max(1,Math.min(10000,Number(signTimeoutMs)||3500));
  const worker=async()=>{
   while(isCurrent()&&next<reels.length){
    const i=next++,video=reels[i];
    if(video.source_type!=='upload'||!video.storage_path){urls[i]=video.video_url;continue}
    let timer;
    try{
     const result=await Promise.race([
      Promise.resolve().then(()=>signMedia('kinfolk-video',video.storage_path)),
      new Promise(resolve=>{timer=setTimeout(()=>resolve(''),timeout)})
     ]);
     urls[i]=typeof result==='string'?result:'';
    }catch{urls[i]=''}
    finally{if(timer!==undefined)clearTimeout(timer)}
   }
  };
  const count=Math.min(reels.length,Math.max(1,Math.min(4,Math.floor(maxConcurrent)||1)));
  await Promise.all(Array.from({length:count},()=>worker()));
  return urls;
 }
 window.kf159RenderReels=async function(main,reels){
  // Only one media experience may own audio when entering the vertical feed.
  window.kf81StopProfileMusic?.();
  teardown();
  const generation=active.generation;
  // A pending media signature must never render a previous member's private feed
  // after the app switches accounts while remaining on the Reels screen.
  const renderUserId=state.user?.id??null;
  const isCurrent=()=>generation===active.generation&&main.isConnected&&state.view==='reels'&&(state.user?.id??null)===renderUserId;
  active.pausedByUser.clear();
  if(!reels.length){main.innerHTML='<div class="card"><div class="empty">No reels yet.</div></div>';return}
  // Reactions are optional to playback. Start signing private media while
  // counters load instead of making mobile viewers wait for both in series.
  const [reactionsReady,urls]=await Promise.all([
   kf289LoadReactions(),
   kf287ResolveReelUrls(reels,signed,isCurrent)
  ]);
  if(!isCurrent())return;
  const cards=[];
  for(let i=0;i<reels.length;i++){
   const v=reels[i];
   const p=state.profiles.get(v.creator_id);
   const rawUrl=urls[i];
   // External media and storage URLs must be navigable web URLs, never executable schemes.
   const url=typeof rawUrl==='string'&&/^https?:\/\//i.test(rawUrl)?rawUrl:'';
   if(!isCurrent())return;
   const isNative=!!url&&(v.source_type==='upload'||(!url.includes('youtube.com')&&!url.includes('youtu.be')&&['.mp4','.webm','.ogg'].some(ext=>url.split('?')[0].toLowerCase().endsWith(ext))));
   const rows=reactionsReady?videoReactionState.rows.filter(r=>r.video_id===v.id):[];
   const likes=rows.filter(r=>r.reaction==='like').length,dislikes=rows.filter(r=>r.reaction==='dislike').length;
   const mine=rows.find(r=>r.user_id===state.user?.id)?.reaction;
   const disabled=reactionsReady&&videoReactionState.available?'':' disabled title="Reactions require backend activation"';
   const id=esc(v.id);
   // Encode arguments as JavaScript strings, then HTML-escape the entire handler attribute.
   const jsCall=(fn,...args)=>esc(fn+'('+args.map(x=>JSON.stringify(String(x))).join(',')+')');
   const button=(symbol,label,fn,attr='')=>`<button type="button" ${attr} onclick="${fn}"><span>${symbol}</span>${label}</button>`;
   const actions=[
    button('♡','Like '+likes,jsCall('toggleVideoReaction',v.id,'like'),`aria-pressed="${mine==='like'}"${disabled}`),
    button('👎','Dislike '+dislikes,jsCall('toggleVideoReaction',v.id,'dislike'),`aria-pressed="${mine==='dislike'}"${disabled}`),
    button('☰','Comments',jsCall('openMediaComments','video',v.id)),
    button('↗','Share',jsCall('shareKinfolkVideo',v.id)),
    button('⟳','Remix',jsCall('remixKinfolkVideo',v.id)),
    button('▢','Save',jsCall('saveKinfolkVideo',v.id),`aria-pressed="${savedKinfolkVideoIds().includes(v.id)}"`),
    button('↓','Download',jsCall('downloadKinfolkVideo',v.id)),
    button('🔇','Sound',jsCall('kf161ToggleSound',v.id))
   ].join('');
   const media=isNative?`<video id="kf159-video-${id}" src="${esc(url)}" playsinline muted loop preload="metadata"></video><button class="kf159-tap" type="button" aria-label="Play or pause reel" onclick="${jsCall('kf159TogglePlayback',v.id)}"></button><div class="kf159-playicon">▶</div>`:`<div style="padding:25px;text-align:center">${url?`<a href="${esc(url)}" target="_blank" rel="noopener" class="btn">Open external video</a>`:'Video unavailable'}<p class="muted">External videos open in their original player.</p></div>`;
   cards.push(`<section class="kf159-slide" data-id="${id}" aria-label="Reel: ${esc(v.title||'Untitled')}">${media}<div class="kf159-overlay"><div class="kf159-info"><b>${esc(p?.display_name||p?.username||'Creator')}</b><p>${esc(v.title||'')}</p></div><div class="kf159-actions">${actions}</div></div></section>`);
  }
  if(!isCurrent())return;
  main.innerHTML=`<div class="kf159-top"><b>Reels & Shorts</b><div class="kf159-tabs" role="group" aria-label="Reels feed"><button type="button" aria-current="page">For You</button><button type="button" onclick="setView('channels')" aria-label="Subscriptions videos in Channels">Subscriptions</button></div><button class="btn small" onclick="openVideoModal()">＋ Upload</button></div><div class="kf159-feed" id="kf159-feed" aria-label="Swipe up or down for reels">${cards.join('')}</div>`;
  active.resizeController=new AbortController();
  const feed=main.querySelector('#kf159-feed');active.root=feed;
  // Size to the actual space above the app's bottom navigation rather than guessing header height.
  const fitViewport=()=>{
   if(!isCurrent()||!feed.isConnected)return;
   const top=feed.getBoundingClientRect().top;
   const nav=[...document.querySelectorAll('nav,footer,[role="navigation"],.bottomNav,.bottom-nav,.mobileNav,.mobile-nav')]
     .filter(el=>el.isConnected&&el!==feed&&getComputedStyle(el).position==='fixed')
     .map(el=>el.getBoundingClientRect()).filter(r=>r.height>0&&r.top>top&&r.top<window.innerHeight);
   const viewportBottom=window.visualViewport?Math.min(window.innerHeight,window.visualViewport.offsetTop+window.visualViewport.height):window.innerHeight;
   const bottom=nav.length?Math.min(viewportBottom,...nav.map(r=>r.top)):viewportBottom;
   const height=Math.max(120,Math.floor(bottom-top));
   feed.style.setProperty('--kf159-viewport-height',height+'px');
  };
  fitViewport();
  window.addEventListener('resize',fitViewport,{signal:active.resizeController.signal});
  window.visualViewport?.addEventListener('resize',fitViewport,{signal:active.resizeController.signal});
  window.visualViewport?.addEventListener('scroll',fitViewport,{signal:active.resizeController.signal});
  const updatePlayback=()=>{const root=feed.getBoundingClientRect();let winner=null,best=0;for(const slide of feed.querySelectorAll('.kf159-slide')){const rect=slide.getBoundingClientRect();const ratio=rect.height?Math.max(0,Math.min(rect.bottom,root.bottom)-Math.max(rect.top,root.top))/rect.height:0;if(ratio>best){best=ratio;winner=slide}}const v=best>=.65&&!document.hidden?winner?.querySelector('video'):null;if(!v){pauseOthers(null);return}pauseOthers(v);if(!v||active.pausedByUser.has(winner.dataset.id))return;if(v.paused)v.play().catch(()=>{})};
  if(typeof IntersectionObserver==='function'){
   const obs=new IntersectionObserver(updatePlayback,{root:feed,threshold:[0,.65,1]});
   active.observer=obs;feed.querySelectorAll('.kf159-slide').forEach(el=>obs.observe(el));
  }else{
   active.scrollHandler=updatePlayback;feed.addEventListener('scroll',updatePlayback,{passive:true});
   updatePlayback();
  }
  feed.addEventListener('play',e=>{
   if(e.target.tagName!=='VIDEO')return;
   pauseOthers(e.target);
   const icon=e.target.parentElement?.querySelector('.kf159-playicon');
   if(icon)icon.textContent='';
  },true);
  feed.addEventListener('pause',e=>{
   if(e.target.tagName!=='VIDEO')return;
   const icon=e.target.parentElement?.querySelector('.kf159-playicon');
   if(icon)icon.textContent='▶';
  },true);
  feed.addEventListener('error',e=>{
   if(e.target.tagName!=='VIDEO')return;
   const icon=e.target.parentElement?.querySelector('.kf159-playicon');
   if(icon)icon.textContent='Video unavailable';
  },true);
  feed.addEventListener('keydown',e=>{if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;e.preventDefault();feed.scrollBy({top:(e.key==='ArrowDown'?1:-1)*feed.clientHeight,behavior:'smooth'})});
  feed.tabIndex=0;
 };
})();
