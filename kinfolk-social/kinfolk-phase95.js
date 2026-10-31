(()=>{if(window.__kinfolkPhase95)return;window.__kinfolkPhase95=true;const SUPABASE_URL='https://zojajuzmfjpvubzibzgg.supabase.co',ANON_KEY='sb_publishable_1te_hrDXQciMD7Gp1EXmRw_dvQmszvi',PREF1='kinfolk_stay_logged_in_v1',PREF2='kinfolk_stay_logged_in',TAB='kinfolk_session_tab';const friendly=(raw,status)=>{const m=String(raw||''),l=m.toLowerCase();if(l.includes('invalid login')||l.includes('invalid credentials'))return'Email or password is incorrect.';if(l.includes('email not confirmed'))return'Your email still needs to be confirmed. Check your inbox, then try again.';if(l.includes('rate limit')||l.includes('too many'))return'Too many login attempts. Wait a moment and try again.';if(l.includes('failed to fetch')||l.includes('network'))return'Kinfolk could not reach the login service. Check your connection and try again.';if(l.includes('login timed out'))return'Kinfolk login timed out. Check your connection and try again.';if(!m&&status>=500)return'Kinfolk login is temporarily unavailable. Try again in a moment.';return m||'Could not log in. Please try again.'};const mode=form=>{const t=(form.querySelector('.kf73Title')?.textContent||'').trim().toLowerCase();return t.includes('welcome back')?'login':(t.includes('create your kinfolk')||t.includes('create account'))?'signup':null};function show(form,text,good=false){let box=form.querySelector('.kf73Msg');if(!box){box=document.createElement('div');box.className='kf73Msg';form.appendChild(box)}box.style.display='block';box.style.color=good?'#c9ffd9':'#ffd9e7';box.textContent=text}// Recovery356: a failed older login cannot overwrite newer Stay Logged In choices.
let preferenceWriteVersion=0;
// Shared between tabs: same-value writes must still invalidate an older rollback.
const PREF_OWNER='kinfolk_stay_login_write_owner_v1';
function saveStay(stay){
  const version=++preferenceWriteVersion;
  const owner=version+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  let before;
  let rollbackAttempted=false;
  const saved=[stay?'1':'0',stay?'1':'0',stay?null:'1'];
  const restore=(force=false)=>{
    if(!before||rollbackAttempted)return;
    if(!force){
      // A newer save, another tab, or a changed session marker owns these keys.
      // Never roll back a different login's preference after async auth failure.
      if(version!==preferenceWriteVersion)return;
      if(localStorage.getItem(PREF_OWNER)!==owner)return;
      if(localStorage.getItem(PREF1)!==saved[0]||
         localStorage.getItem(PREF2)!==saved[1]||
         sessionStorage.getItem(TAB)!==saved[2])return;
    }
    // A rollback belongs to one failed attempt. Never replay it over a later
    // same-value choice made in another tab after the first rollback.
    rollbackAttempted=true;
    for(const [key,value] of [[PREF1,before[0]],[PREF2,before[1]]])
      value===null?localStorage.removeItem(key):localStorage.setItem(key,value);
    before[2]===null?sessionStorage.removeItem(TAB):sessionStorage.setItem(TAB,before[2]);
    // Do not resurrect an earlier owner's marker (ABA across tabs).
    localStorage.setItem(PREF_OWNER,owner+'-rolled-back');
  };
  try{
    before=[localStorage.getItem(PREF1),localStorage.getItem(PREF2),sessionStorage.getItem(TAB)];
    // Invalidate other tabs' pending rollbacks before writing even equal values.
    localStorage.setItem(PREF_OWNER,owner);
    localStorage.setItem(PREF1,saved[0]);
    localStorage.setItem(PREF2,saved[1]);
    if(saved[2]===null)sessionStorage.removeItem(TAB);
    else sessionStorage.setItem(TAB,saved[2]);
  }catch(err){
    try{restore(true)}catch(rollbackError){console.warn('Kinfolk could not restore login preference after storage failure')}
    throw new Error('Unable to save your login preference on this device. Check browser storage settings and try again.');
  }
  return restore;
}
function unlock(pass){pass.removeAttribute('maxlength');pass.removeAttribute('minlength');pass.removeAttribute('pattern');pass.autocomplete='current-password'}async function tokenLogin(email,password){
  const controller=new AbortController();
  const timeoutMessage='Kinfolk login timed out. Check your connection and try again.';
  let timeoutId;
  // AbortController alone is not a deadline: an SDK/fetch wrapper or a response
  // body reader can ignore abort and resolve long after the login was cancelled.
  const deadline=new Promise((_,reject)=>{
    timeoutId=setTimeout(()=>{
      controller.abort();
      reject(new Error(timeoutMessage));
    },15000);
  });
  const request=(async()=>{
    const response=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=password',{
      method:'POST',
      headers:{'Content-Type':'application/json',apikey:ANON_KEY},
      body:JSON.stringify({email,password}),
      cache:'no-store',
      signal:controller.signal
    });
    if(controller.signal.aborted)throw new Error(timeoutMessage);
    let data={};
    try{data=await response.json()}
    catch(parseError){if(controller.signal.aborted)throw parseError}
    if(controller.signal.aborted)throw new Error(timeoutMessage);
    return {response,data};
  })();
  let response,data;
  try{
    ({response,data}=await Promise.race([request,deadline]));
    if(controller.signal.aborted)throw new Error(timeoutMessage);
  }catch(error){
    if(controller.signal.aborted)throw new Error(timeoutMessage);
    throw error;
  }finally{
    clearTimeout(timeoutId);
  }
  if(!response.ok)throw new Error(friendly(data?.error_description||data?.msg||data?.message||data?.error,response.status));
  if(!data?.access_token||!data?.refresh_token||typeof data?.user?.id!=='string'||!data.user.id)throw new Error('Kinfolk received an incomplete login session. Please try again.');
  if(typeof data.user.email!=='string'||data.user.email.trim().toLowerCase()!==email.trim().toLowerCase())throw new Error('Login response belongs to a different email account. Please log in again.');
  if(typeof data.user.email_confirmed_at!=='string'||!data.user.email_confirmed_at.trim())throw new Error('Your email still needs to be confirmed. Check your inbox, then try again.');
  return data;
}async function currentAccountId(){if(typeof sb==='undefined'||typeof sb?.auth?.getSession!=='function')throw new Error('Kinfolk login is still starting. Try again in a moment.');const check=async()=>{const result=await sb.auth.getSession();if(!result||typeof result!=='object')throw new Error('Kinfolk could not verify the current login. Please try again.');const {data,error}=result;if(error)throw error;if(!data||!Object.prototype.hasOwnProperty.call(data,'session'))throw new Error('Kinfolk could not verify the current login. Please try again.');if(data.session===null)return null;if(typeof data.session?.user?.id!=='string'||!data.session.user.id.trim())throw new Error('Kinfolk received an incomplete active session. Please try again.');return data.session.user.id};if(typeof setTimeout!=='function'||typeof clearTimeout!=='function')return check();const timedOut=Symbol('login-preflight-timeout');let timerId;try{const result=await Promise.race([check(),new Promise(resolve=>{timerId=setTimeout(()=>resolve(timedOut),15000)})]);if(result===timedOut)throw new Error('Kinfolk could not check the current login in time. Please try again.');return result}finally{if(timerId!==undefined)clearTimeout(timerId)}}async function clearFailedLoginSession(expectedId,startingAccount,expectedAccessToken){if(startingAccount||!expectedId||!expectedAccessToken)return;try{if(typeof sb==='undefined'||typeof sb?.auth?.getSession!=='function'||typeof sb?.auth?.signOut!=='function')return;/* Account ID alone cannot distinguish a failed login from a newer same-user login. */const {data,error}=await sb.auth.getSession();if(error)throw error;const active=data?.session;if(active?.user?.id!==expectedId||active.access_token!==expectedAccessToken)return;/* Recheck after the first asynchronous read before clearing a local session. */const {data:latest,error:latestError}=await sb.auth.getSession();if(latestError)throw latestError;if(latest?.session?.user?.id!==expectedId||latest.session.access_token!==expectedAccessToken)return;const result=await sb.auth.signOut({scope:'local'});if(result?.error)throw result.error}catch(error){console.warn('Kinfolk could not clear an incomplete login session',error)}}async function adopt(tokens){const adoptedFailure=(message,session)=>{const failure=new Error(message);failure.adoptedSessionId=session?.user?.id||null;failure.adoptedSessionToken=session?.access_token||null;return failure};if(typeof sb==='undefined'||!sb?.auth?.setSession)throw new Error('Kinfolk login is still starting. Try again in a moment.');const {data,error}=await sb.auth.setSession({access_token:tokens.access_token,refresh_token:tokens.refresh_token});if(error)throw error;const expected=data?.session?.user?.id;if(!expected)throw new Error('Kinfolk could not identify the login account. Please try again.');if(expected!==tokens.user.id){const mismatch=new Error('The authenticated account does not match the login response. Please log in again.');mismatch.adoptedSessionId=expected;mismatch.adoptedSessionToken=data.session.access_token||null;throw mismatch;}if(typeof data.session.user.email!=='string'||data.session.user.email.trim().toLowerCase()!==tokens.user.email.trim().toLowerCase())throw adoptedFailure('The authenticated email does not match the login response. Please log in again.',data.session);if(typeof data.session.user.email_confirmed_at!=='string'||!data.session.user.email_confirmed_at.trim())throw adoptedFailure('Your email still needs to be confirmed. Check your inbox, then try again.',data.session);for(let i=0;i<5;i++){const {data:checked,error:checkError}=await sb.auth.getSession();if(checkError)throw checkError;const active=checked?.session;if(active?.user?.id===expected){if(active.access_token&&data.session.access_token&&active.access_token!==data.session.access_token)throw new Error('The active session changed during login. Please log in again.');if(typeof active.user.email!=='string'||active.user.email.trim().toLowerCase()!==tokens.user.email.trim().toLowerCase())throw adoptedFailure('The active email changed during login. Please log in again.',data.session);if(typeof active.user.email_confirmed_at!=='string'||!active.user.email_confirmed_at.trim())throw adoptedFailure('Your email still needs to be confirmed. Check your inbox, then try again.',data.session);return active;}if(active?.user?.id&&active.user.id!==expected)throw new Error('The active account changed during login. Please log in again.');if(i<4)await new Promise(r=>setTimeout(r,100))}throw new Error('Kinfolk could not verify the active session. Please log in again.')}async function verifyActiveLoginToken(session){if(!session?.user?.id||!session?.access_token||typeof sb==='undefined'||typeof sb?.auth?.getSession!=='function')throw new Error('Kinfolk could not verify the active login session. Please log in again.');const {data,error}=await sb.auth.getSession();if(error)throw error;if(data?.session?.user?.id!==session.user.id||data?.session?.access_token!==session.access_token)throw new Error('The active session changed during login. Please log in again.');return true}async function activateLoginSession(session){if(typeof window.kf129ActivateSession!=='function')throw new Error('Kinfolk could not open your account. Refresh the app and try again.');const opened=await window.kf129ActivateSession(session);if(opened!==true)throw new Error('Kinfolk could not finish opening your account. Please try logging in again.')} let loginBusy=false,activeLoginTitle=null;function bind(){const form=document.querySelector('#authForm[data-kf73="1"]')||document.getElementById('authForm');if(!form)return;const m=mode(form),pass=form.querySelector('#kf73Password')||form.querySelector('input[type="password"]');if(!m||!pass)return;if(m==='signup'){/* Match Phase79 signup validation and the confirmation field. */pass.minLength=12;pass.maxLength=128;pass.autocomplete='new-password';return}unlock(pass);document.getElementById('kf88PasswordNote')?.remove();if(!form.__kf95Handler){form.__kf95Handler=async function(e){const current=mode(form);if(current!=='login')return;const loginTitle=form.querySelector('.kf73Title');const currentLoginScreen=()=>form.isConnected&&form.querySelector('.kf73Title')===loginTitle&&mode(form)==='login';e.preventDefault();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();else e.stopPropagation();/* Keep a confirmed login locked until navigation; a duplicate submit must not repeat auth. */if(form.__kf95CompletedTitle===loginTitle)return;if(loginBusy){if(loginTitle!==activeLoginTitle)show(form,'A previous login attempt is still finishing. Please try again shortly.');return;}const email=form.querySelector('#kf73Email')?.value.trim()||'',password=(form.querySelector('#kf73Password')||pass).value,stay=form.querySelector('#kf73Stay')?.checked!==false,btn=form.querySelector('.kf73Primary');if(!email){show(form,'Enter your email address.');form.querySelector('#kf73Email')?.focus();return}if(!password){show(form,'Enter your password.');(form.querySelector('#kf73Password')||pass).focus();return}const sameLoginInputs=()=>String(form.querySelector('#kf73Email')?.value||'').trim().toLowerCase()===email.toLowerCase()&&String((form.querySelector('#kf73Password')||pass)?.value||'')===password&&(form.querySelector('#kf73Stay')?.checked!==false)===stay;loginBusy=true;activeLoginTitle=loginTitle;if(form.dataset)form.dataset.kf95LoginPending='1';if(btn){btn.disabled=true;btn.textContent='Logging in…'}try{const startingAccount=await currentAccountId();if(startingAccount)throw new Error('Another Kinfolk account is already signed in. Log out before switching accounts.');if(!currentLoginScreen())throw new Error('The login screen changed while signing in. Please try again.');if(!sameLoginInputs())throw new Error('The login details changed while signing in. Please try again.');const tokens=await tokenLogin(email,password);if(!currentLoginScreen())throw new Error('The login screen changed while signing in. Please try again.');if(!sameLoginInputs())throw new Error('The login details changed while signing in. Please try again.');if(await currentAccountId()!==startingAccount)throw new Error('The active account changed during login. Please try again.');if(!currentLoginScreen())throw new Error('The login screen changed while signing in. Please try again.');if(!sameLoginInputs())throw new Error('The login details changed while signing in. Please try again.');/* Set the choice before setSession emits SIGNED_IN: Recovery150 validates events asynchronously. */const restoreStay=saveStay(stay);let session;try{session=await adopt(tokens);await verifyActiveLoginToken(session);}catch(adoptError){try{restoreStay()}catch(restoreError){console.warn('Kinfolk could not restore login preference after session failure')}await clearFailedLoginSession(adoptError?.adoptedSessionId||tokens.user.id,startingAccount,adoptError?.adoptedSessionToken||tokens.access_token);throw adoptError}try{if(!currentLoginScreen())throw new Error('The login screen changed while opening Kinfolk. Please try again.');if(!sameLoginInputs())throw new Error('The login details changed while signing in. Please try again.');await activateLoginSession(session);await verifyActiveLoginToken(session);;if(!sameLoginInputs())throw new Error('The login details changed while signing in. Please try again.')}catch(activationError){try{restoreStay()}catch(restoreError){console.warn('Kinfolk could not restore login preference after activation failure')}await clearFailedLoginSession(session?.user?.id,startingAccount,session?.access_token);throw activationError}if(currentLoginScreen()){form.__kf95CompletedTitle=loginTitle;show(form,'Logged in. Opening Kinfolk…',true)}}catch(err){if(currentLoginScreen()){show(form,friendly(err?.message||err));if(btn){btn.disabled=false;btn.textContent='Log in'}}}finally{if(activeLoginTitle===loginTitle){loginBusy=false;activeLoginTitle=null;if(form.dataset)delete form.dataset.kf95LoginPending;/* Phase76 may reuse the same submit button across Login -> Signup -> Login. Never strand it disabled after a stale response. */const currentButton=form.querySelector('.kf73Primary');if(currentButton===btn&&mode(form)==='login'&&form.__kf95CompletedTitle!==loginTitle){btn.disabled=false;if(btn.textContent==='Logging in…')btn.textContent='Log in'}}}}}/* A capture-phase submit listener survives Phase76's reused form replacing onsubmit during mode changes. */if(!form.__kf95CaptureInstalled&&typeof form.addEventListener==='function'){form.addEventListener('submit',form.__kf95Handler,true);form.__kf95CaptureInstalled=true}if(form.onsubmit!==form.__kf95Handler)form.onsubmit=form.__kf95Handler}let pending=false;new MutationObserver(()=>{clearTimeout(pending);pending=setTimeout(bind,15)}).observe(document.documentElement,{subtree:true,childList:true});// MutationObserver handles immediate form changes; periodic fallback is deliberately low frequency to reduce mobile CPU use.
setInterval(()=>{if(document.visibilityState==='visible')bind()},2000);setTimeout(bind,0);setTimeout(bind,120);setTimeout(bind,600);console.log('Kinfolk Phase95 login guard ready')})();