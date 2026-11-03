(()=>{if(window.__kinfolkPhase107)return;window.__kinfolkPhase107=true;const FORMS=['dmForm','groupMsgForm','groupCreateForm'];function safeRun(form,handler,raw){
  // MutationObserver rebinding is deferred. During that gap, a retained input
  // or native submit can still reach this handler after Send was replaced.
  // Do not submit until the current button has been rebound to this form.
  const send=form.__kf107SendButton;
  if(form.dataset.kf107Busy==='1'||form.isConnected===false||!send||send.isConnected===false||send.disabled||
     (typeof form.contains==='function'&&!form.contains(send)))return;const ev={preventDefault(){},stopPropagation(){},stopImmediatePropagation(){},target:form,currentTarget:form,originalEvent:raw};try{const out=handler.call(form,ev);if(out&&typeof out.then==='function'){form.dataset.kf107Busy='1';Promise.resolve(out).catch(e=>{console.warn('Kinfolk message submit rejected',e)}).finally(()=>{delete form.dataset.kf107Busy})}}catch(e){console.warn('Kinfolk message form',e);delete form.dataset.kf107Busy}}function bind(form){
  if(!form)return;
  // Keep the latest underlying form submit handler, including after a modal
  // rerender replaces onsubmit without replacing the form itself.
  const handler=form.onsubmit;
  if(typeof handler==='function'&&handler!==form.__kf107BoundHandler){
    form.__kf107Handler=handler;
    form.__kf107BoundHandler=handler;
  }
  if(typeof form.__kf107Handler!=='function')return;
  const btn=[...form.querySelectorAll('button')].find(b=>/send|create group/i.test((b.textContent||'').trim()))||form.querySelector('button');
  if(!btn)return;
  form.dataset.kf107='1';
  // The form can survive while its Send button is replaced, cloned, or has
  // onclick cleared. A one-time dataset flag must not strand mobile messaging.
  if(!form.__kf107Run){
    form.__kf107Run=function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      // A replaced Send button can retain onclick while its form stays live.
      // Only the current, still-mounted button may start a message request.
      if(this!==form.__kf107SendButton||this.isConnected===false||
         (typeof form.contains==='function'&&!form.contains(this)))return;
      safeRun(form,form.__kf107Handler,e);
    };
  }
  form.__kf107SendButton=btn;
  // Hardware keyboard submit, iOS Go and accessibility requestSubmit() can
  // bypass keydown and button onclick. Route the native submit event through
  // the same pending-request lock, before the original onsubmit executes.
  if(!form.__kf107SubmitHandler&&typeof form.addEventListener==='function'){
    form.__kf107SubmitHandler=e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      if(form.__kf107Composing||Date.now()<(form.__kf107ImeUntil||0))return;
      // requestSubmit(oldButton) may fire after a modal swaps Send controls.
      // Reject a stale/foreign/disabled submitter, including detached nodes.
      const submitter=e.submitter;
      if(submitter&&(submitter!==form.__kf107SendButton||submitter.isConnected===false||submitter.disabled||
         (typeof form.contains==='function'&&!form.contains(submitter))))return;
      safeRun(form,form.__kf107Handler,e);
    };
    form.addEventListener('submit',form.__kf107SubmitHandler,true);
    // Some iOS keyboards dispatch a submit immediately after compositionend,
    // with isComposing=false and keyCode=13. Ignore that confirmation briefly.
    form.addEventListener('compositionstart',()=>{form.__kf107Composing=true},true);
    form.addEventListener('compositionend',()=>{
      form.__kf107Composing=false;
      form.__kf107ImeUntil=Date.now()+200;
    },true);
  }
  btn.type='button';
  btn.dataset.kf107='1';
  if(btn.onclick!==form.__kf107Run)btn.onclick=form.__kf107Run;
  btn.onpointerup=null;
  btn.ontouchend=null;
  btn.onkeydown=null;
  // cloneNode copies dataset attributes, not addEventListener registrations.
  // Use an element-owned sentinel so replacement inputs regain Enter-to-send.
  for(const el of form.querySelectorAll('input,textarea')){
    if(el.__kf107EnterHandler)continue;
    const onEnter=e=>{
      // A removed or replaced field retains its old listener. Do not let it
      // submit through a still-connected form after a modal rerender.
      if(el.isConnected===false||
         (typeof form.contains==='function'&&!form.contains(el)))return;
      // Android/iOS IME confirmation and held Enter are not message submissions.
      // In particular, Android keyboards may report keyCode 229 during composition.
      if(e.isComposing||e.keyCode===229||e.repeat||form.__kf107Composing||Date.now()<(form.__kf107ImeUntil||0))return;
      if(e.key==='Enter'&&!(el.tagName==='TEXTAREA'&&e.shiftKey)){
        e.preventDefault();
        e.stopImmediatePropagation();
        safeRun(form,form.__kf107Handler,e);
      }
    };
    el.addEventListener('keydown',onEnter,true);
    el.__kf107EnterHandler=onEnter;
    el.dataset.kf107Enter='1';
  }
}const pendingBlocks=new Set();
async function blockPeer(peer,originForm){
  const accountId=window.state?.user?.id;
  if(!peer||!accountId)return;
  if(peer===accountId){try{toast('You cannot block your own account.','danger')}catch{}return}
  // Lock duplicate taps within one auth activation, not across a new login.
  // A stalled request from a previous activation must not block a fresh
  // session from protecting itself, even when the account ID is unchanged.
  const activation=typeof kf129Epoch==='number'?kf129Epoch:null;
  const requestKey=JSON.stringify([accountId,activation,peer]);
  if(pendingBlocks.has(requestKey))return;
  pendingBlocks.add(requestKey);
  const stillCurrent=()=>window.state?.user?.id===accountId&&
    (activation===null||(typeof kf129Epoch==='number'&&kf129Epoch===activation))&&
    (!originForm||(originForm.isConnected&&originForm.dataset.peer===peer));
  try{
    // A successful PostgREST request may affect zero rows under RLS.
    // Never tell someone a privacy block succeeded without one confirmed row.
    const {error,count}=await sb.from('blocks').insert(
      {blocker_id:accountId,blocked_id:peer},{count:'exact'}
    );
    const alreadyBlocked=!!error&&(error.code==='23505'||/duplicate|unique/i.test(error.message||''));
    if(error&&!alreadyBlocked)throw error;
    if(alreadyBlocked){
      // A duplicate constraint error alone does not prove this peer is blocked.
      // Confirm the exact owner/peer pair under the active user's SELECT RLS.
      if(!stillCurrent())return;
      const {data:existing,error:readError}=await sb.from('blocks')
        .select('blocker_id,blocked_id')
        .eq('blocker_id',accountId)
        .eq('blocked_id',peer)
        .limit(1);
      if(readError||!Array.isArray(existing)||
         !existing.some(row=>row?.blocker_id===accountId&&row?.blocked_id===peer))
        throw new Error('Existing block could not be verified. Check Blocked Accounts before trying again.');
    }else if(count!==1)
      throw new Error('Block could not be confirmed. Check Blocked Accounts before trying again.');
    if(!stillCurrent())return;
    try{closeModal()}catch{}
    try{toast('Account blocked. They can no longer message you.','good')}catch{}
  }catch(e){
    if(!stillCurrent())return;
    try{toast(e?.message||'Could not block this account.','danger')}catch{console.warn(e)}
  }finally{pendingBlocks.delete(requestKey)}
}window.blockKinfolk=blockPeer;function addDmBlock(form){
  if(!form||!form.dataset.peer)return;
  // The privacy control lives *outside* the DM form. Mobile modal rerenders
  // can remove or relocate that sibling while retaining the same form node.
  // A dataset-only one-time flag would then hide Block Account indefinitely.
  const previous=form.__kf107PrivacyNote;
  if(previous&&form.previousElementSibling===previous&&previous.querySelector('button')?.onclick)return;
  if(previous&&previous.isConnected)previous.remove();
  const note=document.createElement('div');
  note.className='kf107DmPrivacy';
  note.innerHTML='<span>Privacy</span><button type="button" class="btn" id="kf107BlockBtn">Block account</button>';
  form.insertAdjacentElement('beforebegin',note);
  form.__kf107PrivacyNote=note;
  form.dataset.kf107Privacy='1';
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