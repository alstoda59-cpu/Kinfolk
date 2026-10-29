(()=>{if(window.__kinfolkPhase108)return;window.__kinfolkPhase108=true;const TYPES=new Set(['post','profile','message','listing','video']),REASONS=['Spam or scam','Harassment or bullying','Hate or abusive content','Sexual content','Violence or threats','Underage safety concern','Impersonation','Other'];let sending=false;const esc108=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function tell108(m,t='danger'){try{toast(m,t)}catch{console.warn(m)}}// Recovery315: pin reports to the exact modal and initiating account. A delayed
// handler must not attach to a newer report after a fast mobile navigation.
let reportModalSerial=0,activeReport=null,sendingToken=null;
window.kf108Report=function(type,id,label='content'){
  if(!TYPES.has(type)||!id||!window.state?.user?.id)return tell108('Report could not be opened.');
  if(type==='profile'&&id===state.user.id)return tell108('You cannot report your own account.');
  const reporterId=state.user.id,token=++reportModalSerial;
  const activationEpoch=typeof kf129Epoch==='number'?kf129Epoch:null;
  activeReport={type,id,reporterId,token,activationEpoch};
  const opts=REASONS.map(r=>`<option value="${esc108(r)}">${esc108(r)}</option>`).join('');
  modal('Report '+label,`<div class="muted" style="margin-bottom:10px">Reports are sent to Kinfolk moderation for review.</div><label class="label">Reason</label><select id="kf108Reason" class="field">${opts}</select><label class="label">Details</label><textarea id="kf108Details" class="textarea" maxlength="500" placeholder="Optional details"></textarea><button id="kf108Submit" class="btn primary full" type="button" style="margin-top:12px">Submit report</button>`);
  setTimeout(()=>{
    if(activeReport?.token!==token||state.user?.id!==reporterId)return;
    const b=document.getElementById('kf108Submit');
    if(b)b.onclick=()=>window.kf108SubmitReport(type,id,token);
  },0);
};
window.kf108SubmitReport=async function(type,id,token){
  const report=activeReport;
  if(!report||report.token!==token||report.type!==type||report.id!==id||!TYPES.has(type))return;
  const reporterId=window.state?.user?.id;
  const sameActivation=()=>report.activationEpoch===null||(typeof kf129Epoch==='number'&&kf129Epoch===report.activationEpoch);
  if(!reporterId||reporterId!==report.reporterId||!sameActivation())return tell108('Sign in again before reporting.');
  if(sendingToken===token)return;
  const b=document.getElementById('kf108Submit');
  if(!b)return;
  const stillCurrent=()=>window.state?.user?.id===reporterId&&sameActivation()&&activeReport?.token===token&&document.getElementById('kf108Submit')===b;
  const reason=document.getElementById('kf108Reason')?.value||'Other';
  const details=document.getElementById('kf108Details')?.value.trim()||'';
  const full=details?`${reason}: ${details}`:reason;
  if(full.length>700)return tell108('Keep report details shorter.');
  sendingToken=token;b.disabled=true;b.textContent='Submitting…';
  try{
    // Reports may intentionally have no member SELECT policy. Request an
    // affected-row count rather than SELECTing sensitive moderation records.
    const {error,count}=await sb.from('kinfolk_reports').insert({
      reporter_id:reporterId,target_type:type,target_id:id,reason:full
    },{count:'exact'});
    if(error)throw error;
    if(count!==1)throw new Error('Report could not be confirmed. Please try again.');
    if(!stillCurrent())return;
    try{closeModal()}catch(error){console.warn('Kinfolk report modal close',error)}
    tell108('Report sent to Kinfolk moderation.','good');
  }catch(error){
    if(stillCurrent())tell108(error?.message||'Report could not be submitted.');
  }finally{
    if(sendingToken===token)sendingToken=null;
    if(stillCurrent()&&document.contains(b)){b.disabled=false;b.textContent='Submit report'}
  }
};
function patchDmReports(){document.querySelectorAll('.kmLine[data-km91-id]:not(.mine)').forEach(line=>{if(line.dataset.kf108Report)return;const bubble=line.querySelector('.kmBubble');const id=line.getAttribute('data-km91-id');if(!bubble||!id)return;line.dataset.kf108Report='1';const b=document.createElement('button');b.type='button';b.className='btn small';b.textContent='Report';b.style.cssText='margin-top:6px;padding:5px 9px;font-size:11px';b.onclick=e=>{e.preventDefault();e.stopPropagation();window.kf108Report('message',id,'message')};bubble.appendChild(b)})}const oldFeed=window.renderFeed;if(typeof oldFeed==='function')window.renderFeed=async function(root,posts){const out=await oldFeed.apply(this,arguments);try{const cards=[...root.querySelectorAll('article.card')];(posts||[]).forEach((p,i)=>{if(!p?.id||p.author_id===state.user?.id)return;const actions=cards[i]?.querySelector('.postActions');if(!actions||actions.querySelector('[data-kf108-post-report]'))return;const b=document.createElement('button');b.type='button';b.dataset.kf108PostReport='1';b.textContent='⚑ Report';b.onclick=e=>{e.preventDefault();window.kf108Report('post',p.id,'post')};actions.appendChild(b)})}catch(e){console.warn('Kinfolk post report controls',e)}return out};const oldProfile=window.renderProfile;if(typeof oldProfile==='function')window.renderProfile=async function(main,id){const out=await oldProfile.apply(this,arguments);try{if(id&&id!==state.user?.id){const row=main?.querySelector('.kf55Actions')||main?.querySelector('.profileHero');if(row&&!row.querySelector('[data-kf108-profile-report]')){const b=document.createElement('button');b.type='button';b.className='btn';b.dataset.kf108ProfileReport='1';b.textContent='⚑ Report';b.onclick=e=>{e.preventDefault();window.kf108Report('profile',id,'account')};row.appendChild(b)}}}catch(e){console.warn('Kinfolk profile report control',e)}return out};function patchDmHeader(){const form=document.getElementById('dmForm');if(!form||form.dataset.kf108Header)return;const peer=form.dataset.peer;if(!peer)return;form.dataset.kf108Header='1';const row=document.createElement('div');row.style.cssText='grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap';const report=document.createElement('button');report.type='button';report.className='btn';report.textContent='⚑ Report account';report.onclick=e=>{e.preventDefault();const currentPeer=form.dataset.peer;if(currentPeer)window.kf108Report('profile',currentPeer,'account')};row.appendChild(report);form.appendChild(row)}function enforce108(){patchDmReports();patchDmHeader()}let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(enforce108,25)}).observe(document.documentElement,{subtree:true,childList:true});setInterval(enforce108,400);setTimeout(enforce108,0);console.log('Kinfolk Phase108 reporting controls ready')})();