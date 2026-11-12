// Real connected alpha Auth + cross-account integration runner.
// Uses existing disposable test accounts. Never bypasses email verification.
// No credentials or access tokens are logged. Never run against LIVE.
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { spawnSync } from 'node:child_process';
const config = requireFunctionalAlphaBackend();
if (process.env.KINFOLK_ALPHA_E2E_WRITE_OPT_IN !== '1') throw Error('Explicit alpha write opt-in required');
const users = ['A','B'].map(n => ({
  email: process.env['KINFOLK_ALPHA_TEST_USER_'+n+'_EMAIL'],
  password: process.env['KINFOLK_ALPHA_TEST_USER_'+n+'_PASSWORD']
}));
if (users.some(u=>!u.email||!u.password)||users[0].email===users[1].email)
  throw Error('Two distinct disposable alpha emails and passwords required');
async function auth(path, body, token) {
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(),12000);
  try {
    const r = await fetch(config.url+'/auth/v1/'+path,{
      method:'POST',signal:ctrl.signal,redirect:'manual',
      headers:{apikey:config.key,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
      body:JSON.stringify(body)
    });
    const data = await r.json().catch(()=>null);
    return {status:r.status,data};
  } finally {clearTimeout(timer)}
}
const sessions=[];
try {
  for(const user of users) {
    const result=await auth('token?grant_type=password',user);
    if(result.status!==200||!result.data?.access_token||!result.data?.user?.id)
      throw Error('Confirmed alpha password login failed (HTTP '+result.status+'); verify signup/email in a real disposable inbox');
    if(!result.data.user.email_confirmed_at)
      throw Error('Alpha account email not confirmed');
    const verify=await fetch(config.url+'/auth/v1/user',{
      headers:{apikey:config.key,Authorization:'Bearer '+result.data.access_token}
    });
    const identity=await verify.json().catch(()=>null);
    if(verify.status!==200||identity?.id!==result.data.user.id)
      throw Error('Alpha token identity verification failed');
    sessions.push(result.data.access_token);
  }
  if(sessions.length!==2)throw Error('Both sessions required');
  const payloads=sessions.map(s=>JSON.parse(Buffer.from(s.split('.')[1],'base64url').toString('utf8')));
  if(payloads[0].sub===payloads[1].sub)throw Error('Account isolation requires distinct Auth IDs');
  const result=spawnSync(process.execPath,['scripts/verify-connected-posts-comments.mjs'],{
    cwd:process.cwd(),stdio:'inherit',timeout:120000,
    env:{...process.env,KINFOLK_ALPHA_TEST_USER_A_JWT:sessions[0],KINFOLK_ALPHA_TEST_USER_B_JWT:sessions[1]}
  });
  if(result.error)throw result.error;
  if(result.status!==0)throw Error('Connected posts/comments cross-account test failed');
  console.log('PASS: two confirmed alpha logins and cross-account posts/comments integration');
} finally {
  // Revocation of each disposable session, including on failed integration.
  for(const token of sessions){
    try {await auth('logout',{},token)} catch {console.error('Alpha logout request failed; revoke disposable session manually')}
  }
}
