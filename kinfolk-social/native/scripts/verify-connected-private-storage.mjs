// Connected alpha private media storage integration. Disposable unlinked object only.
// Runs after two confirmed logins. Does not touch LIVE or public content.
import { randomUUID } from 'node:crypto';
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { jwtSubject } from './verify-two-user-rls.mjs';
if (process.env.KINFOLK_ALPHA_E2E_WRITE_OPT_IN !== '1') throw Error('Explicit alpha write opt-in required');
const {url,key}=requireFunctionalAlphaBackend();
const a=process.env.KINFOLK_ALPHA_TEST_USER_A_JWT;
const b=process.env.KINFOLK_ALPHA_TEST_USER_B_JWT;
const idA=jwtSubject(a,{requireExpiry:true}),idB=jwtSubject(b,{requireExpiry:true});
if(idA===idB)throw Error('Distinct authenticated accounts required');
const path=idA+'/e2e/private-'+randomUUID()+'.png';
const endpoint=url+'/storage/v1/object/kinfolk-media/'+path;
const bytes=Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000b49444154789c636000020000050001a5f645400000000049454e44ae426082','hex');
async function request(method,token,body){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
  try{
    const response=await fetch(endpoint,{method,signal:ctrl.signal,redirect:'manual',
      headers:{apikey:key,Authorization:'Bearer '+token,...(body?{'Content-Type':'image/png','x-upsert':'false'}:{})},
      ...(body?{body}:{})});
    return {status:response.status,body:await response.text()};
  }finally{clearTimeout(timer)}
}
let created=false,problem;
try{
  const upload=await request('POST',a,bytes);
  if(upload.status!==200&&upload.status!==201)throw Error('Owner upload failed HTTP '+upload.status);
  created=true;
  const ownerRead=await request('GET',a);
  if(ownerRead.status!==200)throw Error('Owner private media read failed HTTP '+ownerRead.status);
  const otherRead=await request('GET',b);
  if(otherRead.status===200)throw Error('SECURITY: unrelated account can read unlinked private media');
  if(![400,401,403,404].includes(otherRead.status))throw Error('Unexpected cross-account read HTTP '+otherRead.status);
  const otherDelete=await request('DELETE',b);
  if(otherDelete.status===200||otherDelete.status===204) {
    // Storage API may return success even when RLS filters zero rows; confirm owner object still exists.
    const check=await request('GET',a);
    if(check.status!==200)throw Error('SECURITY: other account deleted owner private media');
  }else if(![400,401,403,404].includes(otherDelete.status)) {
    throw Error('Unexpected cross-account delete HTTP '+otherDelete.status);
  }
  const preserved=await request('GET',a);
  if(preserved.status!==200)throw Error('SECURITY: other account removed owner media');
  console.log('PASS: owner upload/read and cross-account private media read/delete isolation');
}catch(e){problem=e}
finally{
  if(created){
    try{
      const removed=await request('DELETE',a);
      if(![200,204].includes(removed.status))throw Error('Owner cleanup HTTP '+removed.status);
      const check=await request('GET',a);
      if(check.status===200)throw Error('Object still readable after owner cleanup');
    }catch(e){problem=new Error((problem?.message||'')+'; MANUAL ALPHA MEDIA CLEANUP REQUIRED at '+path+': '+e.message)}
  }
}
if(problem)throw problem;
