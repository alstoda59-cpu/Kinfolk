// Opt-in real Auth smoke test. Creates ONE unconfirmed synthetic user in the ISOLATED alpha project.
// Never call this from ordinary source CI or a live-app browser. Does not test email delivery.
import {randomUUID, randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {ALPHA_REF, alphaBackendConfig} from './alpha-backend-config.mjs';
import {assertEmailSignupReady} from './verify-isolated-auth.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function verifyIsolatedRealSignup(config,{fetchImpl=globalThis.fetch,email,password,timeoutMs=10000}={}){
  if(config?.projectRef!==ALPHA_REF||config?.offlineStub||config?.url!=='https://'+ALPHA_REF+'.supabase.co'||!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(config.key||'')) throw Error('Only the isolated alpha publishable client may create a test signup');
  if(!/^kinfolkalpha\+[a-f0-9]{16,32}@example\.invalid$/.test(email||'')) throw Error('Only explicitly synthetic example.invalid addresses are permitted');
  if(typeof password!=='string'||password.length<12||password.length>128)throw Error('Synthetic signup password must meet Kinfolk limits');
  if(typeof fetchImpl!=='function')throw Error('Fetch is required');
  const base=config.url+'/auth/v1';
  const headers={apikey:config.key,accept:'application/json','content-type':'application/json'};
  async function request(path,method='GET',body){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const response=await fetchImpl(base+path,{method,headers,redirect:'manual',cache:'no-store',signal:controller.signal,...(body?{body:JSON.stringify(body)}:{})});
      if(!/\bapplication\/json\b/i.test(response.headers?.get('content-type')||''))throw Error('Auth endpoint response was not JSON');
      return {status:response.status,data:await response.json()};
    }finally{clearTimeout(timeout)}
  }
  const settings=await request('/settings');
  if(settings.status!==200)throw Error('Isolated Auth settings HTTP '+settings.status);
  assertEmailSignupReady(settings.data);
  // Match Phase79's actual registration metadata. The isolated signup trigger requires a birthday.
  const username='kinfolkalpha'+email.match(/\+([a-f0-9]{16,32})@/)[1].slice(0,10);
  const data={display_name:'Kinfolk Alpha Test',profile_display_name:'Kinfolk Alpha Test',signup_birthdate:'2000-01-01',username,preferred_language:'en',profile_private:'true'};
  const signup=await request('/signup','POST',{email,password,data});
  if(signup.status!==200&&signup.status!==201)throw Error('Isolated Auth signup rejected: HTTP '+signup.status+' ('+String(signup.data?.error_code||signup.data?.code||'unknown')+')');
  const user=signup.data?.user??signup.data;
  if(!UUID.test(user?.id||''))throw Error('Signup did not return a user ID');
  if(user?.email_confirmed_at||signup.data?.session||signup.data?.access_token)throw Error('Unconfirmed signup unexpectedly returned a confirmed user or session');
  // Verify the new account cannot log in with its password before email confirmation.
  const login=await request('/token?grant_type=password','POST',{email,password});
  if(login.status===200||login.data?.access_token)throw Error('Unconfirmed synthetic signup was allowed to sign in');
  const message=String(login.data?.error_code||'')+' '+String(login.data?.msg||login.data?.message||login.data?.error_description||login.data?.error||'');
  if(![400,401,403].includes(login.status)||!/email.?not.?confirm/i.test(message.replace(/_/g,' ')))throw Error('Signup login denial did not prove email confirmation gate (HTTP '+login.status+')');
  return {projectRef:ALPHA_REF,signupAccepted:true,confirmationRequired:true,unconfirmedLoginBlocked:true,emailDelivered:false,userId:user.id};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.env.KINFOLK_ALPHA_REAL_SIGNUP_OPT_IN!=='1')throw Error('Explicit isolated synthetic signup opt-in required');
  const email='kinfolkalpha+'+randomUUID().replaceAll('-','').slice(0,24)+'@example.invalid';
  const password=randomBytes(9).toString('base64url');
  const result=await verifyIsolatedRealSignup(alphaBackendConfig(process.env),{email,password});
  console.log('PASS isolated synthetic signup and unconfirmed-login block; email delivery/callback NOT verified; nonproduction test user retained ('+result.projectRef+')');
}
