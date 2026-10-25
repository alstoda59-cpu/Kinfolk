(()=>{
  if(window.__kinfolkPhase79) return;
  window.__kinfolkPhase79=true;

  const style=document.createElement('style');
  style.id='kf79-style';
  style.textContent=`
    .kf73Form input[type=date]{width:100%;box-sizing:border-box;min-height:54px;border-radius:15px;border:1px solid rgba(255,255,255,.12);background:#121118;color:#fff;padding:0 16px;font:inherit;font-size:16px;outline:none;color-scheme:dark}
    .kf73Form input[type=date]:focus{border-color:var(--accent,#e85a9b);box-shadow:0 0 0 3px rgba(232,90,155,.12)}
    .kf79AgeNote{font-size:12px;line-height:1.45;color:#9e9aa8;margin:7px 2px 2px}
  `;
  document.head.appendChild(style);

  function ageFromDate(v){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(v||'')) return null;
    const d=new Date(v+'T00:00:00');
    if(Number.isNaN(d.getTime()) || d.getFullYear()!==Number(v.slice(0,4)) || d.getMonth()+1!==Number(v.slice(5,7)) || d.getDate()!==Number(v.slice(8,10))) return null;
    const n=new Date();
    let age=n.getFullYear()-d.getFullYear();
    const m=n.getMonth()-d.getMonth();
    if(m<0||(m===0&&n.getDate()<d.getDate())) age--;
    return age;
  }

  function show(form,text,good=false){
    let box=form.querySelector('.kf73Msg');
    if(!box){box=document.createElement('div');box.className='kf73Msg';form.appendChild(box)}
    box.style.display='block';
    box.style.color=good?'#c9ffd9':'#ffd9e7';
    box.textContent=text;
  }

  function saveStay(v){
    try{
      localStorage.setItem('kinfolk_stay_logged_in_v1',v?'1':'0');
      localStorage.setItem('kinfolk_stay_logged_in',v?'1':'0');
      // A one-tab session needs its marker before auth-state restoration checks.
      // Without this, signup with Stay Logged In unchecked is signed out immediately.
      if(v)sessionStorage.removeItem('kinfolk_session_tab');
      else sessionStorage.setItem('kinfolk_session_tab','1');
    }catch{}
  }

  function mountSignupGate(){
    const form=document.querySelector('#authForm[data-kf73="1"]');
    if(!form) return;
    const title=(form.querySelector('.kf73Title')?.textContent||'').trim().toLowerCase();
    if(!title.includes('create your kinfolk')) return;

    if(!form.querySelector('#kf79Birthdate')){
      const passwordLabel=form.querySelector('label[for="kf73Password"]');
      if(!passwordLabel) return;
      const label=document.createElement('label');
      label.htmlFor='kf79Birthdate';
      label.textContent='Birthday';
      const input=document.createElement('input');
      input.id='kf79Birthdate';
      input.type='date';
      input.required=true;
      input.autocomplete='bday';
      input.setAttribute('aria-describedby','kf79AgeNote');
      const note=document.createElement('div');
      note.id='kf79AgeNote';
      note.className='kf79AgeNote';
      note.textContent='Kinfolk is for ages 13–99. Ages 13–17 automatically use Teen Safety Mode.';
      form.insertBefore(label,passwordLabel);
      form.insertBefore(input,passwordLabel);
      form.insertBefore(note,passwordLabel);
    }

  }

  // Native Capacitor WebViews typically use https://localhost. That origin is
  // not a public email-confirmation callback and must not be sent to Supabase.
  // A verified app/universal-link callback can be supplied in a later native
  // build through KINFOLK_EMAIL_REDIRECT_URL after backend allowlist approval.
  function emailRedirect(){
    const custom=window.KINFOLK_EMAIL_REDIRECT_URL;
    try{
      const target=new URL(custom||location.origin);
      if(target.protocol!=='https:'||['localhost','127.0.0.1','0.0.0.0'].includes(target.hostname))return null;
      return custom?target.href:target.origin;
    }catch{return null}
  }

  // Recovery133: a single capturing signup handler owns this path. Previous
  // phase handlers repeatedly replaced form.onsubmit, sometimes causing an
  // adult signup click to be swallowed after an underage attempt.
  // Login remains owned by the existing Phase95/98 session handler.
  let signupBusy=false;
  async function handleSignup(e){
    const form=e.target;
    if(form?.id!=='authForm'||form.dataset.kf73!=='1')return;
    if(!(form.querySelector('.kf73Title')?.textContent||'').toLowerCase().includes('create your kinfolk'))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(signupBusy)return;
    const btn=form.querySelector('.kf73Primary');
    const display_name=form.querySelector('#kf73Name')?.value.trim()||'';
    const email=form.querySelector('#kf73Email')?.value.trim()||'';
    const password=form.querySelector('#kf73Password')?.value||'';
    const birthdate=form.querySelector('#kf79Birthdate')?.value||'';
    const stay=form.querySelector('#kf73Stay')?.checked!==false;
    if(!display_name){show(form,'Enter a display name.');return}
    if(!email){show(form,'Enter your email address.');return}
    if(password.length<5||password.length>12){show(form,'Password must be 5–12 characters.');return}
    const age=ageFromDate(birthdate);
    if(age===null){show(form,'Enter a valid birthday.');form.querySelector('#kf79Birthdate')?.focus();return}
    if(age<13){show(form,'Kinfolk accounts are available for ages 13 and older.');return}
    if(age>99){show(form,'Enter a valid birthday for ages 13–99.');return}
    signupBusy=true;
    if(btn){btn.disabled=true;btn.textContent='Creating account…'}
    try{
      if(typeof sb==='undefined'||!sb?.auth?.signUp)throw new Error('Kinfolk signup is not ready. Try again in a moment.');
      const redirect=emailRedirect();
      const {data,error}=await sb.auth.signUp({
        email,password,
        options:{...(redirect?{emailRedirectTo:redirect}:{}),data:{display_name,signup_birthdate:birthdate}}
      });
      if(error)throw error;
      // An email-confirmation signup has no authenticated session yet.
      // Do not persist Stay Logged In until signup actually returns a session.
      if(data?.session)saveStay(stay);
      if(data?.session)show(form,'Account created. Opening Kinfolk…',true);
      else show(form,'Account created. Check your email to confirm it, then log in.',true);
      // Email-confirmation signups do not have a session yet. Keep the form
      // usable so the member can correct an address or retry if necessary.
      if(btn){btn.disabled=false;btn.textContent='Create account'};
    }catch(err){
      const raw=err?.message||String(err),low=raw.toLowerCase();
      let message=raw;
      if(low.includes('birthday is required'))message='Enter your birthday to create a Kinfolk account.';
      else if(low.includes('requires ages 13 through 99')||low.includes('minimum age is 13'))message='Kinfolk accounts are available for ages 13–99.';
      show(form,message);
      if(btn){btn.disabled=false;btn.textContent='Create account'}
    }finally{signupBusy=false}
  }
  document.addEventListener('submit',handleSignup,true);

  function clarifySafetyCopy(){
    const box=document.querySelector('#kf78-safety');
    if(!box) return;
    [...box.querySelectorAll('p,.kf78-note')].forEach(el=>{
      if(el.textContent.includes('Accounts under 18 use mandatory teen protections.')) el.textContent=el.textContent.replace('Accounts under 18 use mandatory teen protections.','Accounts ages 13–17 use mandatory teen protections.');
    });
  }

  let t;
  const run=()=>{clearTimeout(t);t=setTimeout(()=>{mountSignupGate();clarifySafetyCopy()},40)};
  new MutationObserver(run).observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(()=>{mountSignupGate();clarifySafetyCopy()},50);
  setTimeout(()=>{mountSignupGate();clarifySafetyCopy()},500);
})();