// Real cross-account post-media delivery integration. Runs only on isolated alpha.
// Requires two confirmed Auth sessions and explicit disposable-write opt-in.
import { randomUUID } from 'node:crypto';
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { jwtSubject } from './verify-two-user-rls.mjs';
if (process.env.KINFOLK_ALPHA_E2E_WRITE_OPT_IN !== '1') throw Error('Alpha write opt-in required');
const {url,key}=requireFunctionalAlphaBackend();
const a=process.env.KINFOLK_ALPHA_TEST_USER_A_JWT;
const b=process.env.KINFOLK_ALPHA_TEST_USER_B_JWT;
const owner=jwtSubject(a,{requireExpiry:true});
if(owner===jwtSubject(b,{requireExpiry:true}))throw Error('Distinct confirmed accounts required');
const postId=randomUUID(),path=owner+'/posts/e2e-'+randomUUID()+'.png';
const objectUrl=url+'/storage/v1/object/kinfolk-media/'+path;
const png=Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000b49444154789c636000020000050001a5f645400000000049454e44ae426082','hex');
async function call(endpoint,method,token,body,extra={}){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
  try{
    const r=await fetch(endpoint,{method,signal:ctrl.signal,redirect:'manual',headers:{
      apikey:key,Authorization:'Bearer '+token,...extra
    },...(body!==undefined?{body}: {})});
    return {status:r.status,text:await r.text()};
  }finally{clearTimeout(timer)}
}
const rest=(table,query='')=>url+'/rest/v1/'+table+query;
async function json(table,method,token,query='',body){
  const r=await call(rest(table,query),method,token,body===undefined?undefined:JSON.stringify(body),
    {Accept:'application/json',Prefer:'return=representation',...(body===undefined?{}:{'Content-Type':'application/json'})});
  let data;try{data=JSON.parse(r.text)}catch{data=null}
  return {...r,data};
}
function check(ok,msg){if(!ok)throw Error(msg)}
let uploaded=false,posted=false,changed=false,original,primary;
try{
  const profile=await json('profiles','GET',a,'?select=is_private&id=eq.'+owner);
  check(profile.status===200&&profile.data?.length===1,'Owner profile missing');
  original=profile.data[0].is_private;
  check(typeof original==='boolean','Profile privacy flag missing');
  if(original){
    const update=await json('profiles','PATCH',a,'?id=eq.'+owner,{is_private:false});
    check(update.status===200&&update.data?.[0]?.is_private===false,'Could not enable public test post');
    changed=true;
  }
  const up=await call(objectUrl,'POST',a,png,{'Content-Type':'image/png','x-upsert':'false'});
  check([200,201].includes(up.status),'Owner media upload HTTP '+up.status);
  uploaded=true;
  const post=await json('posts','POST',a,'',{id:postId,author_id:owner,body:'alpha media delivery e2e',media_url:path});
  check(post.status===201&&post.data?.[0]?.id===postId,'Post-media metadata insert HTTP '+post.status);
  posted=true;
  const visible=await json('posts','GET',b,'?select=id,media_url&id=eq.'+postId);
  check(visible.status===200&&visible.data?.[0]?.media_url===path,'B cannot discover A public post media');
  const read=await call(objectUrl,'GET',b);
  check(read.status===200,'B cannot download permitted public post media HTTP '+read.status);
  const forbidden=await call(objectUrl,'DELETE',b);
  check([200,204,400,401,403,404].includes(forbidden.status),'Unexpected B delete HTTP '+forbidden.status);
  const preserved=await call(objectUrl,'GET',a);
  check(preserved.status===200,'SECURITY: B deleted A media');
  const privacy=await json('profiles','PATCH',a,'?id=eq.'+owner,{is_private:true});
  check(privacy.status===200&&privacy.data?.[0]?.is_private===true,'Cannot switch test profile to private');
  changed=true;
  const hidden=await json('posts','GET',b,'?select=id&id=eq.'+postId);
  check(hidden.status===200&&hidden.data?.length===0,'SECURITY: B sees private post');
  const blocked=await call(objectUrl,'GET',b);
  check([400,401,403,404].includes(blocked.status),'SECURITY: B downloads private post media HTTP '+blocked.status);
  console.log('PASS: authenticated public post media delivered to B; private post and media hidden; B cannot delete A object');
}catch(e){primary=e}
finally{
  const errors=[];
  if(posted){try{const r=await json('posts','DELETE',a,'?id=eq.'+postId);if(r.status!==200||r.data?.length!==1)errors.push('post cleanup not confirmed')}catch(e){errors.push(e.message)}}
  if(uploaded){try{const r=await call(objectUrl,'DELETE',a);if(![200,204].includes(r.status))errors.push('media cleanup HTTP '+r.status);else if((await call(objectUrl,'GET',a)).status===200)errors.push('media remains readable')}catch(e){errors.push(e.message)}}
  if(changed){try{const r=await json('profiles','PATCH',a,'?id=eq.'+owner,{is_private:original});if(r.status!==200||r.data?.[0]?.is_private!==original)errors.push('privacy restoration not confirmed')}catch(e){errors.push(e.message)}}
  if(errors.length)console.error('MANUAL ALPHA CLEANUP REQUIRED post '+postId+' media '+path+': '+errors.join('; '));
  if(primary)throw primary;
  if(errors.length)throw Error(errors.join('; '));
}
