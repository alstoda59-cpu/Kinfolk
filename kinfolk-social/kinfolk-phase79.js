(()=>{
  if(window.__kinfolkPhase79) return;
  window.__kinfolkPhase79=true;

  const style=document.createElement('style');
  style.id='kf79-style';
  style.textContent=`
    .kf73Form input[type=date]{width:100%;box-sizing:border-box;min-height:54px;border-radius:15px;border:1px solid rgba(255,255,255,.12);background:#121118;color:#fff;padding:0 16px;font:inherit;font-size:16px;outline:none;color-scheme:dark}
    .kf73Form input[type=date]:focus{border-color:var(--accent,#e85a9b);box-shadow:0 0 0 3px rgba(232,90,155,.12)}
    .kf79AgeNote{font-size:12px;line-height:1.45;color:#9e9aa8;margin:7px 2px 2px}
    .kf218ConfirmToggle{display:block;margin:4px 0 4px auto;min-height:44px;border:0;background:transparent;color:var(--accent,#e85a9b);font-weight:850;padding:8px 0}
    .kf218ProfileSetup{margin:18px 0 10px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:#24212c;padding:14px}
    .kf218ProfileSetup summary{cursor:pointer;font-weight:850;color:#fff;min-height:36px;line-height:36px}
    .kf218ProfileSetup p{font-size:13px;color:#bdb5c7;line-height:1.45;margin:8px 0}
    .kf218ProfileSetup textarea,.kf218ProfileSetup select{width:100%;box-sizing:border-box;border-radius:13px;border:1px solid rgba(255,255,255,.15);background:#121118;color:#fff;padding:13px;font:inherit;font-size:16px;min-height:49px}
    .kf218ProfileSetup textarea{min-height:88px;resize:vertical}
    .kf218Interests{border:0;padding:0;margin:14px 0 0}
    .kf218Interests legend{color:#d7d4df;font-weight:800;margin-bottom:7px}
    .kf218InterestChoice{display:inline-flex!important;align-items:center;gap:7px;border:1px solid #514255;border-radius:99px;padding:9px 11px;margin:3px!important;font-size:13px;font-weight:600!important}
    .kf218InterestChoice input{accent-color:var(--accent,#e85a9b);width:17px;height:17px}
    .kf218Review{margin:15px 0 0;padding:13px;border-radius:14px;background:#26222d;border:1px solid rgba(255,255,255,.11);font-size:13px;line-height:1.5;color:#d6ccdc}
    .kf218Review strong{display:block;font-size:15px;color:#fff;margin-bottom:4px}
    .kf219PrivacyChoice{display:flex!important;align-items:center;gap:12px;margin:13px 0 2px!important;min-height:48px;line-height:1.35}
    .kf219PrivacyChoice input{width:21px;height:21px;min-width:21px;accent-color:var(--accent,#e85a9b)}
    .kf219PrivacyNote{margin:5px 0 8px!important;font-size:12px;color:#c5b6cc}
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
    const prefKeys=['kinfolk_stay_logged_in_v1','kinfolk_stay_logged_in'];
    const tabKey='kinfolk_session_tab';
    let previous;
    try{
      // Snapshot before writing: partial storage failure must not silently
      // leave the opposite persistence choice on a newly created account.
      previous=[localStorage.getItem(prefKeys[0]),localStorage.getItem(prefKeys[1]),sessionStorage.getItem(tabKey)];
      localStorage.setItem(prefKeys[0],v?'1':'0');
      localStorage.setItem(prefKeys[1],v?'1':'0');
      // A one-tab session needs its marker before auth-state restoration checks.
      if(v)sessionStorage.removeItem(tabKey);
      else sessionStorage.setItem(tabKey,'1');
    }catch(error){
      if(previous){
        try{
          for(let i=0;i<prefKeys.length;i++){
            if(previous[i]===null)localStorage.removeItem(prefKeys[i]);
            else localStorage.setItem(prefKeys[i],previous[i]);
          }
          if(previous[2]===null)sessionStorage.removeItem(tabKey);
          else sessionStorage.setItem(tabKey,previous[2]);
        }catch(rollbackError){console.warn('Kinfolk signup preference rollback failed',rollbackError)}
      }
      throw new Error('Account created, but this device could not save the Stay Logged In setting.');
    }
  }

  // Only persist signup preferences for the exact new email identity.
  // Checking ID alone misses an email changed on that account while getSession
  // is pending. Fail closed on missing email, including during cleanup.
  async function signupSessionIsCurrent(session,submittedEmail){
    if(typeof sb==='undefined'||typeof sb?.auth?.getSession!=='function')throw new Error('Kinfolk could not verify the signup session. Sign in again to set Stay Logged In.');
    const expected=session?.user?.id;
    const expectedToken=session?.access_token;
    const email=String(submittedEmail||'').trim().toLowerCase();
    // The same account may log in again while getSession is pending. A matching
    // user ID and email do not prove that the signup's session is still active.
    // Fail closed for adapters that omit either access token.
    if(!expected||typeof expectedToken!=='string'||!expectedToken.trim()||!email||
       typeof session?.user?.email!=='string'||session.user.email.trim().toLowerCase()!==email)return false;
    const {data,error}=await sb.auth.getSession();
    if(error)throw error;
    const activeSession=data?.session;
    const active=activeSession?.user;
    return activeSession?.access_token===expectedToken&&active?.id===expected&&
      typeof active.email==='string'&&active.email.trim().toLowerCase()===email;
  }

  // A session returned by signUp is not proof of email verification. Supabase
  // may issue a session when confirmation is disabled or an adapter is misconfigured.
  // Never persist Stay Logged In or advertise private-app access in that case.
  function signupSessionEmailConfirmed(data){
    const signupUser=data?.user;
    const sessionUser=data?.session?.user;
    return Boolean(data?.session&&
      typeof signupUser?.email_confirmed_at==='string'&&signupUser.email_confirmed_at.trim()&&
      typeof sessionUser?.email_confirmed_at==='string'&&sessionUser.email_confirmed_at.trim());
  }

  function updateSignupPrivacy(form){
    const birthday=form.querySelector('#kf79Birthdate');
    const check=form.querySelector('#kf219Private');
    if(!birthday||!check)return;
    const age=ageFromDate(birthday.value);
    const note=form.querySelector('#kf219PrivacyNote');
    const review=form.querySelector('#kf219PrivacyReview');
    const isAdult=age!==null&&age>=18&&age<=99;
    if(!isAdult){
      check.checked=true;
      check.disabled=true;
      if(note)note.textContent=age!==null&&age>=13&&age<18
        ?'Teen profiles start private. Teen Safety Mode is also enforced separately by the account service.'
        :'Enter a valid birthday to choose profile visibility.';
      if(review)review.textContent='Profile visibility: private until an eligible adult chooses otherwise.';
    }else{
      check.disabled=false;
      check.checked=check.dataset.adultPreference==='true';
      if(note)note.textContent='Optional. Private profiles require follower approval. You can change this later in Settings.';
      if(review)review.textContent='Profile visibility: '+(check.checked?'private':'public')+'.';
    }
  }

  // Phase76 and legacy auth wrappers use two signup headings. Keep every
  // submit, resend and async navigation guard aligned with both variants.
  function isSignupTitle(value){
    const title=String(value||'').trim().toLowerCase();
    return title.includes('create your kinfolk')||title.includes('create account');
  }

  function mountSignupGate(){
    const form=document.querySelector('#authForm[data-kf73="1"]');
    if(!form) return;
    const title=(form.querySelector('.kf73Title')?.textContent||'').trim().toLowerCase();
    if(!isSignupTitle(title)){
      delete form.__kf221Verification;
      form.querySelector('#kf221Verification')?.remove();
      return;
    }
    // Phase76 reuses the login password field. Set the signup limits here,
    // before the new confirmation input can be filled on a fast mobile device.
    const signupPassword=form.querySelector('#kf73Password');
    if(signupPassword){
      signupPassword.minLength=12;
      signupPassword.maxLength=128;
      signupPassword.autocomplete='new-password';
      signupPassword.removeAttribute?.('pattern');
    }
    mountVerification(form);
    const introduction=form.querySelector('.kf73Text');
    if(introduction&&introduction.dataset.kf218Intro!=='1'){
      introduction.textContent='Step 1 of 3: Enter your account details. Next, personalize your profile if you like, then review and create your account.';
      introduction.dataset.kf218Intro='1';
    }

    // Recovery217: additional signup identity fields, without replacing the existing form.
    if(!form.querySelector('#kf217Username')){
      const emailLabel=form.querySelector('label[for="kf73Email"]');
      if(emailLabel){
        const label=document.createElement('label');
        label.htmlFor='kf217Username';label.textContent='Username';
        const input=document.createElement('input');
        input.id='kf217Username';input.type='text';input.required=true;
        input.minLength=3;input.maxLength=24;input.autocomplete='username';
        input.placeholder='Choose a username';
        const hint=document.createElement('div');
        hint.className='kf79AgeNote';hint.textContent='3–24 letters, numbers, or underscores. Your username is confirmed after signup; your display name can change later.';
        form.insertBefore(label,emailLabel);form.insertBefore(input,emailLabel);form.insertBefore(hint,emailLabel);
      }
    }
    if(!form.querySelector('#kf217ConfirmPassword')){
      const pass=form.querySelector('#kf73Password');
      const passLabel=form.querySelector('label[for="kf73Password"]');
      if(pass&&passLabel){
        const label=document.createElement('label');
        label.htmlFor='kf217ConfirmPassword';label.textContent='Confirm password';
        const input=document.createElement('input');
        input.id='kf217ConfirmPassword';input.type='password';input.required=true;
        input.autocomplete='new-password';input.minLength=12;input.maxLength=128;
        input.placeholder='Enter password again';
        const toggle=document.createElement('button');
        toggle.type='button';toggle.className='kf218ConfirmToggle';toggle.textContent='Show confirmation';
        toggle.setAttribute('aria-label','Show confirmation password');
        toggle.addEventListener('click',()=>{
          input.type=input.type==='password'?'text':'password';
          toggle.textContent=input.type==='password'?'Show confirmation':'Hide confirmation';
        });
        // The password input lives inside .kf73Password. Its next sibling is
        // not a direct child of the form, so insertBefore(pass.nextSibling)
        // throws NotFoundError and prevents birthday/signup setup on mobile.
        const passwordBlock=pass.closest('.kf73Password');
        const following=passwordBlock?.parentElement===form?passwordBlock.nextSibling:passLabel.nextSibling;
        form.insertBefore(label,following);form.insertBefore(input,following);form.insertBefore(toggle,following);
      }
    }

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
    const birthdayField=form.querySelector('#kf79Birthdate');
    if(birthdayField&&!birthdayField.dataset.kf219PrivacyWired){
      birthdayField.dataset.kf219PrivacyWired='1';
      birthdayField.addEventListener('input',()=>updateSignupPrivacy(form));
      birthdayField.addEventListener('change',()=>updateSignupPrivacy(form));
    }

    // Optional personalization is collected with signup metadata. It is not
    // a substitute for backend profile/privacy policy enforcement.
    if(!form.querySelector('#kf218ProfileSetup')){
      const meta=form.querySelector('.kf73Meta');
      if(meta){
        const details=document.createElement('details');
        details.id='kf218ProfileSetup';
        details.className='kf218ProfileSetup';
        const summary=document.createElement('summary');
        summary.textContent='Step 2: Personalize your profile (optional)';
        details.appendChild(summary);
        const intro=document.createElement('p');
        intro.textContent='Tell people what you enjoy. You can skip this and update your profile later.';
        details.appendChild(intro);
        const bioLabel=document.createElement('label');
        bioLabel.htmlFor='kf218Bio';bioLabel.textContent='Short bio';
        const bio=document.createElement('textarea');
        bio.id='kf218Bio';bio.maxLength=160;bio.rows=3;bio.placeholder='A little about you (optional)';
        details.appendChild(bioLabel);details.appendChild(bio);
        const langLabel=document.createElement('label');
        langLabel.htmlFor='kf218Language';langLabel.textContent='Preferred language';
        const lang=document.createElement('select');
        lang.id='kf218Language';
        [['en','English'],['es','Español'],['fr','Français'],['pt','Português'],['de','Deutsch']].forEach(([value,name])=>{
          const option=document.createElement('option');option.value=value;option.textContent=name;lang.appendChild(option);
        });
        details.appendChild(langLabel);details.appendChild(lang);
        const genderLabel=document.createElement('label');
        genderLabel.htmlFor='kf219Gender';genderLabel.textContent='Gender (optional)';
        const gender=document.createElement('select');gender.id='kf219Gender';
        [['','Prefer not to say'],['Female','Female'],['Male','Male'],['Nonbinary','Non-binary']].forEach(([value,name])=>{
          const option=document.createElement('option');option.value=value;option.textContent=name;gender.appendChild(option);
        });
        details.appendChild(genderLabel);details.appendChild(gender);
        const privateLabel=document.createElement('label');
        privateLabel.className='kf219PrivacyChoice';
        const privateInput=document.createElement('input');
        privateInput.type='checkbox';privateInput.id='kf219Private';privateInput.checked=true;
        privateInput.dataset.adultPreference='false';
        privateInput.addEventListener('change',()=>{if(!privateInput.disabled)privateInput.dataset.adultPreference=String(privateInput.checked)});
        const privateText=document.createElement('span');privateText.textContent='Private profile';
        privateLabel.appendChild(privateInput);privateLabel.appendChild(privateText);
        const privateNote=document.createElement('p');privateNote.id='kf219PrivacyNote';privateNote.className='kf219PrivacyNote';
        details.appendChild(privateLabel);details.appendChild(privateNote);

        const interests=document.createElement('fieldset');
        interests.className='kf218Interests';
        const legend=document.createElement('legend');
        legend.textContent='Interests (choose up to 3)';
        interests.appendChild(legend);
        [['gaming','Gaming'],['music','Music'],['art','Art'],['fashion','Fashion'],['sports','Sports'],['technology','Technology']].forEach(([value,name])=>{
          const label=document.createElement('label');label.className='kf218InterestChoice';
          const check=document.createElement('input');
          check.type='checkbox';check.name='kf218Interest';check.value=value;
          check.addEventListener('change',()=>{
            const selected=form.querySelectorAll('input[name="kf218Interest"]:checked');
            if(selected.length>3){check.checked=false;show(form,'Choose up to three interests.');}
          });
          label.appendChild(check);
          const caption=document.createElement('span');caption.textContent=name;label.appendChild(caption);
          interests.appendChild(label);
        });
        details.appendChild(interests);
        form.insertBefore(details,meta);
      }
    }
    if(!form.querySelector('#kf218Review')){
      const primary=form.querySelector('.kf73Primary');
      if(primary){
        const review=document.createElement('div');
        review.id='kf218Review';review.className='kf218Review';
        const heading=document.createElement('strong');
        heading.textContent='Step 3: Review & create account';
        const note=document.createElement('span');
        note.textContent='Confirm your details, then create your account. Email verification may be required. Teen accounts use mandatory protections.';
        review.appendChild(heading);review.appendChild(note);
        const privacyStatus=document.createElement('div');
        privacyStatus.id='kf219PrivacyReview';privacyStatus.className='kf219PrivacyNote';
        review.appendChild(privacyStatus);
        form.insertBefore(review,primary);
      }
    }
    updateSignupPrivacy(form);
  }

  // Native Capacitor WebViews typically use https://localhost. That origin is
  // not a public email-confirmation callback and must not be sent to Supabase.
  // A verified app/universal-link callback can be supplied in a later native
  // build through KINFOLK_EMAIL_REDIRECT_URL after backend allowlist approval.
  function emailRedirect(){
    const custom=window.KINFOLK_EMAIL_REDIRECT_URL;
    // Recovery322: the packaged marker is available before Capacitor's bridge.
    // Both initial signup and "Resend verification email" call this helper.
    // Never let a native resend fall back to Supabase's Site URL.
    const native=window.KINFOLK_NATIVE_ALPHA===true||
      (typeof window.Capacitor?.isNativePlatform==='function'&&window.Capacitor.isNativePlatform())||
      /^(?:capacitor|ionic):$/.test(location.protocol||'')||
      (location.protocol==='http:'&&['localhost','127.0.0.1'].includes(location.hostname));
    let redirect=null;
    try{
      const target=new URL(custom||location.origin);
      const host=target.hostname.toLowerCase().replace(/\.$/,'').replace(/^\[|\]$/g,'');
      // Reject the same unusable callback classes as the native packager.
      const blocked=!host||host==='localhost'||host.endsWith('.localhost')||
        host==='vercel.app'||host.endsWith('.vercel.app')||
        host==='supabase.co'||host.endsWith('.supabase.co')||
        host.endsWith('.local')||/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)||
        host.includes(':');
      if(target.protocol==='https:'&&!target.username&&!target.password&&
         !target.hash&&!target.port&&!blocked){
        redirect=custom?target.href:target.origin;
      }
    }catch{}
    if(native&&(!custom||!redirect)){
      throw new Error('Native Kinfolk signup needs an approved HTTPS email verification callback. Configure KINFOLK_EMAIL_REDIRECT_URL before creating accounts.');
    }
    return redirect;
  }

  // Recovery221: retain only the submitted email in memory, never credentials.
  // Resend responses cannot update a replaced form or a later signup attempt.
  function mountVerification(form){
    const pending=form.__kf221Verification;
    let panel=form.querySelector('#kf221Verification');
    if(!pending){panel?.remove();return}
    if(panel?.__pending===pending)return;
    panel?.remove();
    panel=document.createElement('section');
    panel.id='kf221Verification';panel.className='kf218Review';panel.__pending=pending;
    const heading=document.createElement('strong');heading.textContent='Verify your email';
    const note=document.createElement('p');
    note.textContent='If verification is required for '+pending.email+', check your inbox and spam folder for a confirmation link, then return to Log in. If you already have an account, try logging in or resetting your password.';
    const button=document.createElement('button');
    button.type='button';button.className='kf218ConfirmToggle';button.textContent='Resend verification email';
    const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    // The signup form is reused across screens. Never resend for an address
    // that no longer matches the visible signup email field.
    const current=()=>form.isConnected&&panel.isConnected&&form.__kf221Verification===pending&&
      isSignupTitle(form.querySelector('.kf73Title')?.textContent)&&
      String((form.querySelector('#kf73Email')||form.querySelector('input[type="email"]'))?.value||'').trim().toLowerCase()===String(pending.email||'').trim().toLowerCase();
    button.onclick=async()=>{
      if(!current()){
        if(form.isConnected&&panel.isConnected&&isSignupTitle(form.querySelector('.kf73Title')?.textContent)){
          status.textContent='Email address changed. Submit the form again to verify the new address.';
          button.disabled=true;
        }
        return;
      }
      if(pending.busy)return;
      if(Date.now()<pending.retryAt){status.textContent='Please wait a minute before requesting another email.';return}
      pending.busy=true;pending.retryAt=Date.now()+60000;button.disabled=true;status.textContent='Requesting verification email…';
      // Some mobile networks never settle a request. Bound the UI wait while
      // retaining the one-minute cooldown: the server may still send the email.
      const timedOut=Symbol('verification-resend-timeout');
      let timeoutId=null;
      try{
        if(typeof sb==='undefined'||!sb?.auth?.resend)throw new Error('Email resend is unavailable. Please try again later.');
        const redirect=emailRedirect();
        const result=await Promise.race([
          sb.auth.resend({type:'signup',email:pending.email,...(redirect?{options:{emailRedirectTo:redirect}}:{})}),
          new Promise(resolve=>{timeoutId=setTimeout(()=>resolve(timedOut),20000)})
        ]);
        if(result===timedOut){
          if(current())status.textContent='The email request is taking too long. It may still arrive; check your inbox before retrying in a minute.';
          return;
        }
        if(!result||typeof result!=='object')throw new Error('Verification resend returned no result.');
        if(result.error)throw result.error;
        if(current())status.textContent='If this account needs verification, a new email has been requested. Check your inbox and spam folder.';
      }catch(error){
        // A network outage or server error did not confirm a resend. Do not
        // impose a false one-minute cooldown; retain it for rate limits and
        // rejected requests to avoid hammering the authentication service.
        const code=Number(error?.status);
        if(!Number.isFinite(code)||!code||code===408||code>=500)pending.retryAt=0;
        if(current())status.textContent=code===429?'Too many email requests. Please wait before trying again.':'Could not request an email. Please try again.';
      }finally{if(timeoutId!==null)clearTimeout(timeoutId);pending.busy=false;if(current())button.disabled=false}
    };
    panel.append(heading,note,button,status);form.appendChild(panel);
  }

  // Recovery133: a single capturing signup handler owns this path. Previous
  // phase handlers repeatedly replaced form.onsubmit, sometimes causing an
  // adult signup click to be swallowed after an underage attempt.
  // Login remains owned by the existing Phase95/98 session handler.
  let signupBusy=false;
  let activeSignupTitle=null;
  // A timed-out signup may still complete server-side. Delay duplicate requests.
  let signupRetryAt=0;
  // A signup request is immutable once sent. If the reused mobile form changes
  // during the network request, never attach the earlier result or apply its
  // session-persistence choice to the newly displayed details.
  function signupInputsUnchanged(form,expected){
    const read=id=>form.querySelector('#'+id)?.value||'';
    const interests=Array.from(form.querySelectorAll('input[name="kf218Interest"]:checked'),el=>el.value);
    return read('kf73Name').trim()===expected.display_name
      && read('kf73Email').trim().toLowerCase()===expected.email.toLowerCase()
      && read('kf73Password')===expected.password
      && read('kf79Birthdate')===expected.birthdate
      && read('kf217Username').trim()===expected.username
      && form.querySelector('#kf217ConfirmPassword')?.value===expected.confirmPassword
      && read('kf218Bio').trim()===expected.bio
      && (read('kf218Language')||'en')===expected.preferredLanguage
      && (read('kf219Gender')||'')===expected.gender
      && interests.length===expected.interests.length
      && interests.every((value,i)=>value===expected.interests[i])
      && (form.querySelector('#kf219Private')?.checked===true)===expected.privateProfile
      && (form.querySelector('#kf73Stay')?.checked!==false)===expected.stay;
  }
  // Never start signup over an authenticated account. Supabase signUp can
  // change the active session, so a stale signup screen must not switch users.
  async function requireNoActiveSignupAccount(){
    if(typeof sb==='undefined'||typeof sb?.auth?.getSession!=='function')throw new Error('Kinfolk cannot verify the current account. Try again in a moment.');
    const {data,error}=await sb.auth.getSession();
    if(error)throw error;
    if(!data||!Object.prototype.hasOwnProperty.call(data,'session'))throw new Error('Kinfolk cannot verify the current account. Try again in a moment.');
    if(data.session)throw new Error('A Kinfolk account is already signed in. Log out before creating another account.');
    return true;
  }
  async function handleSignup(e){
    const form=e.target;
    if(form?.id!=='authForm'||form.dataset.kf73!=='1')return;
    // Phase76 reuses the same #authForm across Login/Signup transitions.
    // Capture the actual title node so an old async response cannot update a
    // *new* signup screen that happens to have the same title after navigating back.
    const signupTitle=form.querySelector('.kf73Title');
    if(!isSignupTitle(signupTitle?.textContent))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(signupBusy){
      if(signupTitle!==activeSignupTitle)show(form,'A previous account creation request is still finishing. Please try again shortly.');
      return;
    }
    if(Date.now()<signupRetryAt){
      show(form,'A previous signup may still be processing. Check your inbox or try logging in before requesting another account. Please wait a minute before retrying.');
      return;
    }
    const btn=form.querySelector('.kf73Primary');
    const display_name=form.querySelector('#kf73Name')?.value.trim()||'';
    const email=form.querySelector('#kf73Email')?.value.trim()||'';
    const password=form.querySelector('#kf73Password')?.value||'';
    const birthdate=form.querySelector('#kf79Birthdate')?.value||'';
    const username=form.querySelector('#kf217Username')?.value.trim()||'';
    const confirmPassword=form.querySelector('#kf217ConfirmPassword')?.value;
    const bio=(form.querySelector('#kf218Bio')?.value||'').trim();
    const preferredLanguage=form.querySelector('#kf218Language')?.value||'en';
    const interests=Array.from(form.querySelectorAll('input[name="kf218Interest"]:checked'),el=>el.value);
    const gender=form.querySelector('#kf219Gender')?.value||'';
    const privateProfile=form.querySelector('#kf219Private')?.checked===true;
    const stay=form.querySelector('#kf73Stay')?.checked!==false;
    const signupSnapshot={display_name,email,password,birthdate,username,confirmPassword,bio,preferredLanguage,interests,gender,privateProfile,stay};
    if(!display_name){show(form,'Enter a display name.');return}
    if(form.querySelector('#kf217Username')&&!/^[a-zA-Z0-9_]{3,24}$/.test(username)){show(form,'Choose a username using 3–24 letters, numbers, or underscores.');return}
    if(!email){show(form,'Enter your email address.');return}
    if(password.length<12||password.length>128){show(form,'Password must be 12–128 characters.');return}
    if(confirmPassword!==undefined&&confirmPassword!==password){show(form,'Passwords do not match.');return}
    if(bio.length>160){show(form,'Your bio must be 160 characters or less.');return}
    if(!['en','es','fr','pt','de'].includes(preferredLanguage)){show(form,'Choose a supported language.');return}
    if(gender&&!['Female','Male','Nonbinary'].includes(gender)){show(form,'Select a supported gender option.');return}
    if(interests.length>3){show(form,'Choose no more than three interests.');return}
    const age=ageFromDate(birthdate);
    if(age===null){show(form,'Enter a valid birthday.');form.querySelector('#kf79Birthdate')?.focus();return}
    if(age<13){show(form,'Kinfolk accounts are available for ages 13 and older.');return}
    if(age>99){show(form,'Enter a valid birthday for ages 13–99.');return}
    delete form.__kf221Verification;
    form.querySelector('#kf221Verification')?.remove();
    signupBusy=true;
    activeSignupTitle=signupTitle;
    if(btn){btn.disabled=true;btn.textContent='Creating account…'}
    let signupTimeoutId=null;
    try{
      if(typeof sb==='undefined'||!sb?.auth?.signUp)throw new Error('Kinfolk signup is not ready. Try again in a moment.');
      await requireNoActiveSignupAccount();
      // The preflight getSession is asynchronous. Never send credentials from
      // a replaced or edited signup form after waiting for that check.
      if(!form.isConnected||form.querySelector('.kf73Title')!==signupTitle||!isSignupTitle(signupTitle?.textContent))return;
      if(!signupInputsUnchanged(form,signupSnapshot))throw new Error('Signup details changed while checking the current account. Please review them and try again.');
      const redirect=emailRedirect();
      // A mobile connection can leave signUp unresolved forever. Limit the UI
      // wait without claiming failure: the server may have created the account.
      const timedOut=Symbol('signup-timeout');
      const result=await Promise.race([
        sb.auth.signUp({
          email,password,
          options:{...(redirect?{emailRedirectTo:redirect}:{}),data:{display_name,profile_display_name:display_name,signup_birthdate:birthdate,...(username?{username}:{}),...(bio?{bio,profile_bio:bio}:{}),preferred_language:preferredLanguage,...(interests.length?{interests}:{}),...(gender?{signup_gender:gender}:{}),profile_private:(age<18||privateProfile)?'true':'false'}}
        }),
        new Promise(resolve=>{signupTimeoutId=setTimeout(()=>resolve(timedOut),25000)})
      ]);
      if(result===timedOut){
        signupRetryAt=Date.now()+60000;
        if(form.isConnected&&form.querySelector('.kf73Title')===signupTitle&&isSignupTitle(signupTitle?.textContent)){
          show(form,'Account creation is taking too long to confirm. It may have succeeded. Check your inbox or try logging in before retrying in a minute.');
          if(btn){btn.disabled=false;btn.textContent='Create account'}
        }
        return;
      }
      // Do not bind a completed request to changed signup details, especially
      // birthday/teen privacy, email, password or Stay Logged In preference.
      if(form.isConnected&&form.querySelector('.kf73Title')===signupTitle&&isSignupTitle(signupTitle?.textContent)&&
         !signupInputsUnchanged(form,signupSnapshot)){
        signupRetryAt=Date.now()+60000;
        show(form,'Signup details changed while account creation was processing. The earlier request may have succeeded. Check the original email inbox or log in before retrying in a minute.');
        if(btn){btn.disabled=false;btn.textContent='Create account'}
        return;
      }
      if(!result||typeof result!=='object')throw new Error('Kinfolk could not confirm account creation. Check your email or try logging in before retrying.');
      const {data,error}=result;
      if(error)throw error;
      // A successful HTTP response is not proof that an account was created.
      // Never claim email delivery or persist a session preference without a
      // concrete signup user. An unexpected session for another account must
      // not inherit the new signup's Stay Logged In choice.
      if(!data?.user?.id)throw new Error('Kinfolk could not confirm account creation. Please try again.');
      // Supabase can return a user-shaped response without an active session.
      // Never accept an explicitly different email identity as this signup.
      // An email signup must return its submitted email identity. Missing or
      // non-string emails cannot prove which account Supabase actually created.
      const matchesSubmittedEmail=value=>typeof value==='string'&&value.trim().toLowerCase()===email.toLowerCase();
      if(!matchesSubmittedEmail(data.user.email))throw new Error('Signup returned a different email account. Sign in again.');
      if(data.session&&(data.session.user?.id!==data.user.id||!matchesSubmittedEmail(data.session.user?.email)))throw new Error('Signup session did not match the new account. Sign in again.');
      // The user may have navigated to login while signup was in flight.
      // Do not persist signup preferences or update a replaced form.
      if(!form.isConnected||form.querySelector('.kf73Title')!==signupTitle||!(isSignupTitle(signupTitle?.textContent))){
        console.info('Kinfolk signup completed after leaving the signup screen; ignoring stale UI result.');
        return;
      }
      // A returned session alone is not proof that email was confirmed.
      // Keep the verification screen and never persist login preferences for
      // unconfirmed or malformed signup identities. The global auth activation
      // guard separately rejects unconfirmed sessions before private UI opens.
      if(data?.session&&!signupSessionEmailConfirmed(data)){
        form.__kf221Verification={email,busy:false,retryAt:0};
        mountVerification(form);
        show(form,'Email confirmation is still required. Check your inbox, then log in. Kinfolk has not saved a Stay Logged In choice.',true);
        if(btn){btn.disabled=false;btn.textContent='Create account'}
        return;
      }
      // Email-confirmation signups normally have no session yet.
      // Only confirmed sessions may persist Stay Logged In.
      if(data?.session){
        const verifiedSignupSession=await signupSessionIsCurrent(data.session,email);
        // Session verification is asynchronous: the form may have changed again.
        if(!form.isConnected||form.querySelector('.kf73Title')!==signupTitle||!(isSignupTitle(signupTitle?.textContent)))return;
        if(!signupInputsUnchanged(form,signupSnapshot)){
          show(form,'Signup details changed while your session was being verified. Sign in again to choose Stay Logged In.');
          if(btn){btn.disabled=false;btn.textContent='Create account'}
          return;
        }
        if(!verifiedSignupSession){
          show(form,'Account created, but the active login changed. Sign in again to set Stay Logged In.');
          if(btn){btn.disabled=false;btn.textContent='Create account'}
          return;
        }
        try{saveStay(stay)}
        catch(storageError){
          // Never sign out another account that became active during cleanup.
          let sameAccount=false,signOutFailed=false;
          try{sameAccount=await signupSessionIsCurrent(data.session,email)}
          catch(checkError){console.warn('Kinfolk signup session recheck failed',checkError)}
          if(sameAccount){
            try{
              const out=await sb.auth.signOut({scope:'local'});
              if(out?.error)throw out.error;
            }catch(signOutError){
              signOutFailed=true;
              console.warn('Kinfolk signup local sign-out failed',signOutError);
            }
          }
          // Local sign-out may take time. Do not paint its error over a new login screen.
          if(!form.isConnected||form.querySelector('.kf73Title')!==signupTitle||!(isSignupTitle(signupTitle?.textContent)))return;
          show(form,storageError.message+' Enable browser storage, then log in again.'+(signOutFailed?' Your session may still be active; sign out manually.':''));
          if(btn){btn.disabled=false;btn.textContent='Create account'}
          return;
        }
      }
      // A storage failure cleanup can await sign-out while navigation changes.
      // Never display success in a screen that is no longer the signup form.
      if(!form.isConnected||form.querySelector('.kf73Title')!==signupTitle||!(isSignupTitle(signupTitle?.textContent)))return;
      if(data?.session)show(form,'Account created. Opening Kinfolk…',true);
      else {
        form.__kf221Verification={email,busy:false,retryAt:0};
        // Render immediately. Waiting for the DOM observer can drop the email
        // verification panel if a mock/native event schedules another render.
        mountVerification(form);
        show(form,'If verification is required, check your email for a confirmation link, then log in.',true);
      }
      // Email-confirmation signups do not have a session yet. Keep the form
      // usable so the member can correct an address or retry if necessary.
      if(btn){btn.disabled=false;btn.textContent='Create account'};
    }catch(err){
      // An in-flight signup can fail after the user navigates to login.
      // Never write its error into a different screen or reset that screen's button.
      if(!form.isConnected||form.querySelector('.kf73Title')!==signupTitle||!(isSignupTitle(signupTitle?.textContent)))return;
      const raw=err?.message||String(err),low=raw.toLowerCase();
      const code=String(err?.code||err?.error_code||'').toLowerCase();
      let message=raw;
      // Real isolated Auth smoke tests returned email_address_invalid. Do not
      // print a raw provider error or mistake an undeliverable inbox for a
      // successful signup: give the member a useful correction instead.
      if(code==='email_address_invalid'||(low.includes('email address')&&low.includes('invalid')))message='Enter a valid email address that can receive a verification link.';
      else if(code==='over_email_send_rate_limit'||code==='over_request_rate_limit'||Number(err?.status)===429)message='Too many account or email requests. Please wait before trying again.';
      else if(low.includes('birthday is required'))message='Enter your birthday to create a Kinfolk account.';
      else if(low.includes('requires ages 13 through 99')||low.includes('minimum age is 13'))message='Kinfolk accounts are available for ages 13–99.';
      else if(low.includes('username')&&(low.includes('already taken')||low.includes('duplicate')||low.includes('unique')))message='That username is already taken. Choose a different username.';
      show(form,message);
      if(btn){btn.disabled=false;btn.textContent='Create account'}
    }finally{
      if(signupTimeoutId!==null)clearTimeout(signupTimeoutId);
      // The active request owns the lock; a navigation does not silently
      // allow duplicate account creation while the original request is pending.
      if(activeSignupTitle===signupTitle){signupBusy=false;activeSignupTitle=null}
    }
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