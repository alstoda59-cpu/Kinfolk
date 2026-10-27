// Read-only two-synthetic-account RLS probe. No account creation or database writes.
import { alphaBackendConfig, ALPHA_REF } from './alpha-backend-config.mjs';
import { pathToFileURL } from 'node:url';

export const PRIVATE_TABLES=Object.freeze(['kinfolk_safety_settings','user_settings','kinfolk_user_preferences','notification_preferences','kinfolk_profile_extras']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function jwtSubject(token){
  if(typeof token!=='string'||token.split('.').length!==3)throw Error('Synthetic JWT is missing or malformed');
  let payload;
  try{payload=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'))}
  catch{throw Error('Synthetic JWT payload is malformed')}
  if(!UUID.test(payload?.sub||'')||payload.role!=='authenticated')throw Error('Expected an authenticated synthetic JWT');
  return payload.sub.toLowerCase();
}
export async function verifyTwoUserRls(config,{tokenA,tokenB,idA,idB,fetchImpl=globalThis.fetch,tables=PRIVATE_TABLES,timeoutMs=8000}={}){
  if(!config||config.projectRef!==ALPHA_REF||config.offlineStub||config.url!=='https://'+ALPHA_REF+'.supabase.co'||!config.key)throw Error('RLS probe requires designated isolated alpha backend');
  if(typeof fetchImpl!=='function')throw Error('RLS probe requires fetch');
  const a=jwtSubject(tokenA),b=jwtSubject(tokenB);
  if(!UUID.test(idA||'')||!UUID.test(idB||'')||a!==idA.toLowerCase()||b!==idB.toLowerCase()||a===b)throw Error('Two distinct synthetic JWT subjects must match designated IDs');
  if(!Array.isArray(tables)||!tables.length||tables.some(t=>!PRIVATE_TABLES.includes(t))||new Set(tables).size!==tables.length)throw Error('Only known owner-private tables may be tested');
  async function count(table,owner,jwt,expected){
    const url=config.url+'/rest/v1/'+table+'?select=user_id&user_id=eq.'+owner+'&limit=2';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const response=await fetchImpl(url,{method:'GET',headers:{apikey:config.key,...(jwt?{Authorization:'Bearer '+jwt}:{}),Accept:'application/json'},redirect:'manual',cache:'no-store',signal:controller.signal});
      if([401,403].includes(response.status)&&expected===0)return 0;
      if(response.status!==200)throw Error('RLS probe HTTP '+response.status+' for '+table);
      if(!/\bapplication\/json\b/i.test(response.headers?.get('content-type')||''))throw Error('RLS probe expected JSON for '+table);
      const rows=await response.json();
      if(!Array.isArray(rows)||rows.some(row=>!row||Object.keys(row).some(k=>k!=='user_id')||row.user_id!==owner))throw Error('Unexpected RLS response for '+table);
      return rows.length;
    }finally{clearTimeout(timer)}
  }
  for(const table of tables){
    if(await count(table,a,tokenA,1)!==1||await count(table,b,tokenB,1)!==1)throw Error('RLS owner fixture missing in '+table);
    if(await count(table,b,tokenA,0)!==0||await count(table,a,tokenB,0)!==0)throw Error('Cross-account RLS exposure in '+table);
    if(await count(table,a,null,0)!==0)throw Error('Anonymous RLS exposure in '+table);
  }
  return {projectRef:ALPHA_REF,checkedTables:tables.length,readOnly:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const env=process.env;
  if(env.KINFOLK_ALPHA_SYNTHETIC_ACCOUNTS_ONLY!=='1')throw Error('Explicit synthetic-account opt-in required');
  const result=await verifyTwoUserRls(alphaBackendConfig(env),{tokenA:env.KINFOLK_ALPHA_TEST_USER_A_JWT,tokenB:env.KINFOLK_ALPHA_TEST_USER_B_JWT,idA:env.KINFOLK_ALPHA_TEST_USER_A_ID,idB:env.KINFOLK_ALPHA_TEST_USER_B_ID});
  console.log('PASS read-only two-account RLS for '+result.checkedTables+' owner-private tables');
}