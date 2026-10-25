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
 @media(max-width:600px){.kf159-feed{height:calc(100dvh - 175px);border-radius:0}.kf159-slide{min-height:360px}}
 `;
 document.head.appendChild(style);
 const active={observer:null,root:null,pausedByUser:new Set(),generation:0};
 window.kf161ToggleSound=function(id){const v=document.getElementById('kf159-video-'+id);if(!v)return;v.muted=!v.muted;const slide=v.closest('.kf159-slide');const b=[...slide.querySelectorAll('.kf159-actions button')].find(x=>x.textContent.includes('Sound')||x.textContent.includes('Mute'));if(b)b.innerHTML=v.muted?'<span>🔇</span>Sound':'<span>🔊</span>Mute'};
 function teardown(){active.generation++;active.observer?.disconnect();active.root?.querySelectorAll('video').forEach(v=>v.pause());active.observer=null;active.root=null;active.pausedByUser.clear()}
 window.kf159StopReels=teardown;
 document.addEventListener('visibilitychange',()=>{if(document.hidden)active.root?.querySelectorAll('video').forEach(v=>v.pause());else if(active.root){const visible=[...active.root.querySelectorAll('.kf159-slide')].find(slide=>{const a=slide.getBoundingClientRect(),b=active.root.getBoundingClientRect();return Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>a.height*.65});const video=visible?.querySelector('video');if(video&&!active.pausedByUser.has(visible.dataset.id)){pauseOthers(video);video.play().catch(()=>{})}}});
 function pauseOthers(current){document.querySelectorAll('.kf159-slide video').forEach(v=>{if(v!==current)v.pause()})}
 function tap(id){const v=document.getElementById('kf159-video-'+id);if(!v)return;const icon=v.parentElement.querySelector('.kf159-playicon');if(v.paused){active.pausedByUser.delete(id);pauseOthers(v);v.play().then(()=>{if(icon)icon.textContent='' }).catch(()=>{if(icon)icon.textContent='▶'})}else{active.pausedByUser.add(id);v.pause();if(icon)icon.textContent='▶'}}
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
 window.kf159RenderReels=async function(main,reels){
  teardown();
  const generation=active.generation;
  const isCurrent=()=>generation===active.generation&&main.isConnected&&state.view==='reels';
  active.pausedByUser.clear();
  if(!reels.length){main.innerHTML='<div class="card"><div class="empty">No reels yet.</div></div>';return}
  await loadVideoReactions();
  if(!isCurrent())return;
  const cards=[];
  for(const v of reels){
   const p=state.profiles.get(v.creator_id);
   const url=v.source_type==='upload'&&v.storage_path?await signed('kinfolk-video',v.storage_path):v.video_url;
   if(!isCurrent())return;
   const isNative=!!url&&(v.source_type==='upload'||(!url.includes('youtube.com')&&!url.includes('youtu.be')&&['.mp4','.webm','.ogg'].some(ext=>url.split('?')[0].toLowerCase().endsWith(ext))));
   const rows=videoReactionState.rows.filter(r=>r.video_id===v.id);
   const likes=rows.filter(r=>r.reaction==='like').length,dislikes=rows.filter(r=>r.reaction==='dislike').length;
   const mine=rows.find(r=>r.user_id===state.user?.id)?.reaction;
   const disabled=videoReactionState.available?'':' disabled title="Reactions require backend activation"';
   const id=esc(v.id);
   const button=(symbol,label,fn,attr='')=>`<button type="button" ${attr} onclick="${fn}"><span>${symbol}</span>${label}</button>`;
   const actions=[
    button('♡','Like '+likes,`toggleVideoReaction('${id}','like')`,`aria-pressed="${mine==='like'}"${disabled}`),
    button('👎','Dislike '+dislikes,`toggleVideoReaction('${id}','dislike')`,`aria-pressed="${mine==='dislike'}"${disabled}`),
    button('☰','Comments',`openMediaComments('video','${id}')`),
    button('↗','Share',`shareKinfolkVideo('${id}')`),
    button('⟳','Remix',`remixKinfolkVideo('${id}')`),
    button('▢','Save',`saveKinfolkVideo('${id}')`,`aria-pressed="${savedKinfolkVideoIds().includes(v.id)}"`),
    button('↓','Download',`downloadKinfolkVideo('${id}')`),
    button('🔇','Sound',`kf161ToggleSound('${id}')`)
   ].join('');
   const media=isNative?`<video id="kf159-video-${id}" src="${esc(url)}" playsinline muted loop preload="metadata"></video><button class="kf159-tap" type="button" aria-label="Play or pause reel" onclick="kf159TogglePlayback('${id}')"></button><div class="kf159-playicon">▶</div>`:`<div style="padding:25px;text-align:center">${url?`<a href="${esc(url)}" target="_blank" rel="noopener" class="btn">Open external video</a>`:'Video unavailable'}<p class="muted">External videos open in their original player.</p></div>`;
   cards.push(`<section class="kf159-slide" data-id="${id}" aria-label="Reel: ${esc(v.title||'Untitled')}">${media}<div class="kf159-overlay"><div class="kf159-info"><b>${esc(p?.display_name||p?.username||'Creator')}</b><p>${esc(v.title||'')}</p></div><div class="kf159-actions">${actions}</div></div></section>`);
  }
  if(!isCurrent())return;
  main.innerHTML=`<div class="kf159-top"><b>Reels & Shorts</b><button class="btn small" onclick="openVideoModal()">＋ Upload</button></div><div class="kf159-feed" id="kf159-feed" aria-label="Swipe up or down for reels">${cards.join('')}</div>`;
  const feed=main.querySelector('#kf159-feed');active.root=feed;
  const obs=new IntersectionObserver(()=>{const root=feed.getBoundingClientRect();let winner=null,best=0;for(const slide of feed.querySelectorAll('.kf159-slide')){const rect=slide.getBoundingClientRect();const ratio=rect.height?Math.max(0,Math.min(rect.bottom,root.bottom)-Math.max(rect.top,root.top))/rect.height:0;if(ratio>best){best=ratio;winner=slide}}const v=best>=.65&&!document.hidden?winner?.querySelector('video'):null;pauseOthers(v);if(!v||active.pausedByUser.has(winner.dataset.id))return;if(v.paused)v.play().then(()=>{const icon=v.parentElement.querySelector('.kf159-playicon');if(icon)icon.textContent=''}).catch(()=>{})},{root:feed,threshold:[0,.65,1]});
  active.observer=obs;feed.querySelectorAll('.kf159-slide').forEach(el=>obs.observe(el));
  feed.addEventListener('keydown',e=>{if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;e.preventDefault();feed.scrollBy({top:(e.key==='ArrowDown'?1:-1)*feed.clientHeight,behavior:'smooth'})});
  feed.tabIndex=0;
 };
})();
