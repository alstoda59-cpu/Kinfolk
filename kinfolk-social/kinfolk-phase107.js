(()=>{if(window.__kinfolkPhase107)return;window.__kinfolkPhase107=true;const FORMS=['dmForm','groupMsgForm','groupCreateForm'];function safeRun(form,handler,raw){if(form.dataset.kf107Busy==='1')return;const ev={preventDefault(){},stopPropagation(){},stopImmediatePropagation(){},target:form,currentTarget:form,originalEvent:raw};try{const out=handler.call(form,ev);if(out&&typeof out.then==='function'){form.dataset.kf107Busy='1';Promise.resolve(out).catch(e=>{console.warn('Kinfolk message submit rejected',e)}).finally(()=>{delete form.dataset.kf107Busy})}}catch(e){console.warn('Kinfolk message form',e);delete form.dataset.kf107Busy}}function bind(form){if(!form||form.dataset.kf107==='1')return;const handler=form.onsubmit;if(typeof handler!=='function')return;form.dataset.kf107='1';form.__kf107Handler=handler;const btn=[...form.querySelectorAll('button')].find(b=>/send|create group/i.test((b.textContent||'').trim()))||form.querySelector('button');if(!btn)return;btn.type='button';btn.dataset.kf107='1';const run=e=>{e.preventDefault();e.stopImmediatePropagation();safeRun(form,form.__kf107Handler,e)};btn.onpointerup=run;btn.ontouchend=run;btn.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){run(e)}};for(const el of form.querySelectorAll('input,textarea')){if(el.dataset.kf107Enter==='1')continue;el.dataset.kf107Enter='1';el.addEventListener('keydown',e=>{if(e.key==='Enter'&&!(el.tagName==='TEXTAREA'&&e.shiftKey)){e.preventDefault();e.stopImmediatePropagation();safeRun(form,form.__kf107Handler,e)}},true)}}const pendingBlocks=new Set();
async function blockPeer(peer,originForm){
  const accountId=window.state?.user?.id;
  if(!peer||!accountId)return;
  if(peer===accountId){try{toast('You cannot block your own account.','danger')}catch{}return}
  const requestKey=accountId+':'+peer;
  if(pendingBlocks.has(requestKey))return;
  pendingBlocks.add(requestKey);
  const stillCurrent=()=>window.state?.user?.id===accountId&&
    (!originForm||(originForm.isConnected&&originForm.dataset.peer===peer));
  try{
    const {error}=await sb.from('blocks').insert({blocker_id:accountId,blocked_id:peer});
    if(error&&!/duplicate|unique/i.test(error.message||''))throw error;
    if(!stillCurrent())return;
    try{closeModal()}catch{}
    try{toast('Account blocked. They can no longer message you.','good')}catch{}
  }catch(e){
    if(!stillCurrent())return;
    try{toast(e?.message||'Could not block this account.','danger')}catch{console.warn(e)}
  }finally{pendingBlocks.delete(requestKey)}
}window.blockKinfolk=blockPeer;function addDmBlock(form){
  if(!form||form.dataset.kf107Privacy==='1')return;
  if(!form.dataset.peer)return;
  form.dataset.kf107Privacy='1';
  const note=document.createElement('div');
  note.className='kf107DmPrivacy';
  note.innerHTML='<span>Privacy</span><button type="button" class="btn" id="kf107BlockBtn">Block account</button>';
  form.insertAdjacentElement('beforebegin',note);
  const b=note.querySelector('button');
  // A native click fires once for touch, pointer and keyboard activation.
  // Do not bind pointerup + touchend separately: mobile taps can fire both.
  b.onclick=e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    const currentPeer=form.dataset.peer;
    if(currentPeer)void blockPeer(currentPeer,form);
  };
}function enforce(){for(const id of FORMS){const f=document.getElementById(id);if(f){bind(f);if(id==='dmForm')addDmBlock(f)}}}if(!document.getElementById('kf107Style')){const s=document.createElement('style');s.id='kf107Style';s.textContent='.kf107DmPrivacy{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0 10px;padding:8px 10px;border:1px solid var(--line,#34343d);border-radius:12px;font-size:12px;color:var(--muted,#aaa)}.kf107DmPrivacy .btn{padding:7px 10px;font-size:12px;background:rgba(255,255,255,.08)}';document.head.appendChild(s)}let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(enforce,12)}).observe(document.documentElement,{subtree:true,childList:true});setInterval(()=>{if(document.visibilityState!=='hidden')enforce()},2000);setTimeout(enforce,0);console.log('Kinfolk Phase107 messaging form + block guard ready')})();