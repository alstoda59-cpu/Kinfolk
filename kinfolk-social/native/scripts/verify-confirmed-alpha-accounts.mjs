// Real isolated-alpha account/session bootstrap for connected cross-account QA.
// Requires two already email-confirmed disposable accounts; never provisions
// privileged users or bypasses Supabase email verification.
import { createClient } from '@supabase/supabase-js';
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { verifyTwoUserRls } from './verify-two-user-rls.mjs';

const env=process.env;
if(env.KINFOLK_ALPHA_SYNTHETIC_ACCOUNTS_ONLY!=='1')throw Error('Explicit synthetic account opt-in required');
const config=requireFunctionalAlphaBackend(env);
const pairs=[
  [env.KINFOLK_ALPHA_TEST_USER_A_EMAIL,env.KINFOLK_ALPHA_TEST_USER_A_PASSWORD],
  [env.KINFOLK_ALPHA_TEST_USER_B_EMAIL,env.KINFOLK_ALPHA_TEST_USER_B_PASSWORD]
];
if(pairs.some(([email,password])=>!email||!password)||pairs[0][0].toLowerCase()===pairs[1][0].toLowerCase())
  throw Error('Provide two distinct confirmed disposable alpha email/password pairs in environment variables');
const clients=pairs.map(()=>createClient(config.url,config.key,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  global:{headers:{'X-Kinfolk-Alpha-QA':'synthetic-two-account'}}
}));
const sessions=[];
try{
  for(let i=0;i<2;i++){
    const {data,error}=await clients[i].auth.signInWithPassword({email:pairs[i][0],password:pairs[i][1]});
    if(error||!data?.session?.access_token||!data?.user?.email_confirmed_at)
      throw Error('Disposable account '+(i+1)+' cannot establish a confirmed authenticated session: '+(error?.message||'confirmation/session missing'));
    const {data:verified,error:verifyError}=await clients[i].auth.getUser(data.session.access_token);
    if(verifyError||verified?.user?.id!==data.user.id)throw Error('Account '+(i+1)+' server-side session verification failed');
    sessions.push({id:data.user.id,token:data.session.access_token});
  }
  if(sessions[0].id===sessions[1].id)throw Error('Both credentials resolve to the same user');
  const proof=await verifyTwoUserRls(config,{
    tokenA:sessions[0].token,tokenB:sessions[1].token,
    idA:sessions[0].id,idB:sessions[1].id,requireExpiry:true
  });
  console.log('PASS isolated alpha: two confirmed accounts, two verified sessions, '+proof.checkedTables+' private-table cross-account RLS checks');
}catch(error){
  console.error('FAIL isolated alpha authenticated integration: '+error.message);
  process.exitCode=1;
}finally{
  // Revoke test sessions even after a partial failure. Never print tokens.
  await Promise.all(clients.map(async client=>{
    try{await client.auth.signOut({scope:'local'})}catch{}
  }));
}
