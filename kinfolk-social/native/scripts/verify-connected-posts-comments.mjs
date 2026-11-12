// Connected alpha integration probe. Real Auth JWTs required; writes disposable posts/comments.
// Never run against LIVE. Deletes only records whose random IDs this process created.
import { randomUUID } from 'node:crypto';
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { jwtSubject } from './verify-two-user-rls.mjs';

if(process.env.KINFOLK_ALPHA_E2E_WRITE_OPT_IN!=='1')throw Error('Explicit alpha write-test opt-in required');
const config=requireFunctionalAlphaBackend();
const a=process.env.KINFOLK_ALPHA_TEST_USER_A_JWT;
const b=process.env.KINFOLK_ALPHA_TEST_USER_B_JWT;
const idA=jwtSubject(a,{requireExpiry:true}),idB=jwtSubject(b,{requireExpiry:true});
if(idA===idB)throw Error('Two distinct real alpha accounts required');
const postId=randomUUID(),commentId=randomUUID(),spoofId=randomUUID(),marker='kinfolk-alpha-e2e-'+randomUUID();
const created={post:false,comment:false,spoof:false};
let originalPrivacy=null,privacyChanged=false;
const timeout=12000;
async function request(table,method,token,{query='',body,prefer}={}){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),timeout);
  try{
    const res=await fetch(config.url+'/rest/v1/'+table+query,{
      method,redirect:'manual',cache:'no-store',signal:ctrl.signal,
      headers:{apikey:config.key,Authorization:'Bearer '+token,Accept:'application/json',
        ...(body?{'Content-Type':'application/json'}:{}),
        ...(prefer?{Prefer:prefer}:{})},
      ...(body?{body:JSON.stringify(body)}:{})
    });
    const raw=await res.text();
    let data;
    try{data=raw?JSON.parse(raw):null}catch{throw Error(table+' '+method+' returned non-JSON body (HTTP '+res.status+')')}
    return {status:res.status,data};
  }finally{clearTimeout(timer)}
}
function assert(ok,message){if(!ok)throw Error(message)}
async function rows(table,token,query){
  const r=await request(table,'GET',token,{query});
  assert(r.status===200&&Array.isArray(r.data),table+' authenticated read failed: HTTP '+r.status);
  return r.data;
}
let primaryError;
try{
  // Prove both sessions can read their own profile. No synthetic JWT is fabricated here.
  for(const [token,id] of [[a,idA],[b,idB]]){
    const profile=await rows('profiles',token,'?select=id,is_private&id=eq.'+id);
    assert(profile.length===1,'Missing confirmed Auth-backed profile for '+id);
  }
  const pa=await rows('profiles',a,'?select=is_private&id=eq.'+idA);
  originalPrivacy=pa[0].is_private;
  // Exercise the real default-private profile path before public feed access.
  if(originalPrivacy===true){
    let r=await request('posts','POST',a,{body:{id:postId,author_id:idA,body:marker},prefer:'return=representation'});
    assert(r.status===201&&r.data?.[0]?.id===postId,'Private account post creation failed: HTTP '+r.status);
    created.post=true;
    const hidden=await rows('posts',b,'?select=id&id=eq.'+postId);
    assert(hidden.length===0,'SECURITY: private profile post visible to unrelated account B');
    r=await request('profiles','PATCH',a,{query:'?id=eq.'+idA,body:{is_private:false},prefer:'return=representation'});
    assert(r.status===200&&r.data?.[0]?.is_private===false,'Owner cannot make profile public: HTTP '+r.status);
    privacyChanged=true;
  }
  assert(originalPrivacy===true||originalPrivacy===false,'Missing profile privacy setting');
  let r;
  if(!created.post){
    r=await request('posts','POST',a,{body:{id:postId,author_id:idA,body:marker},prefer:'return=representation'});
    assert(r.status===201&&r.data?.[0]?.id===postId,'Account A post creation failed: HTTP '+r.status);
    created.post=true;
  }
  const visible=await rows('posts',b,'?select=id,body&id=eq.'+postId);
  assert(visible.length===1&&visible[0].body===marker,'Account B cannot read A public post');
  r=await request('posts','POST',b,{body:{id:spoofId,author_id:idA,body:marker+'-spoof'},prefer:'return=minimal'});
  if(r.status===201)created.spoof=true;
  assert(r.status===401||r.status===403,'SECURITY: B could impersonate A in post insert (HTTP '+r.status+')');
  r=await request('comments','POST',b,{body:{id:commentId,post_id:postId,author_id:idB,body:marker},prefer:'return=representation'});
  assert(r.status===201&&r.data?.[0]?.id===commentId,'Account B comment creation failed: HTTP '+r.status);
  created.comment=true;
  const comments=await rows('comments',a,'?select=id,body&id=eq.'+commentId);
  assert(comments.length===1&&comments[0].body===marker,'Account A cannot see B comment');
  r=await request('posts','DELETE',b,{query:'?id=eq.'+postId,prefer:'return=representation'});
  assert(r.status===200&&Array.isArray(r.data)&&r.data.length===0,'SECURITY: B deleted A post or delete was unverified');
  const still=await rows('posts',a,'?select=id&id=eq.'+postId);
  assert(still.length===1,'Account A post disappeared after B attempted deletion');
  console.log('PASS connected alpha: two confirmed sessions, private/public visibility, A post, B feed read/comment, A comment read, cross-account spoof/delete denied');
}catch(e){primaryError=e}
finally{
  const failures=[];
  if(created.spoof){
    try{await request('posts','DELETE',a,{query:'?id=eq.'+spoofId,prefer:'return=representation'})}
    catch(e){failures.push('spoofed post cleanup: '+e.message)}
  }
  if(created.comment){
    try{const r=await request('comments','DELETE',b,{query:'?id=eq.'+commentId,prefer:'return=representation'});if(r.status!==200||r.data?.length!==1)failures.push('comment cleanup unverified')}
    catch(e){failures.push('comment cleanup: '+e.message)}
  }
  if(created.post){
    try{const r=await request('posts','DELETE',a,{query:'?id=eq.'+postId,prefer:'return=representation'});if(r.status!==200||r.data?.length!==1)failures.push('post cleanup unverified')}
    catch(e){failures.push('post cleanup: '+e.message)}
  }
  if(privacyChanged){
    try{
      const r=await request('profiles','PATCH',a,{query:'?id=eq.'+idA,body:{is_private:originalPrivacy},prefer:'return=representation'});
      if(r.status!==200||r.data?.[0]?.is_private!==originalPrivacy)failures.push('profile privacy restoration unverified');
    }catch(e){failures.push('profile privacy restoration: '+e.message)}
  }
  if(failures.length)console.error('MANUAL ALPHA CLEANUP NEEDED: '+failures.join('; ')+'; IDs: '+postId+', '+commentId+', '+spoofId);
  if(primaryError)throw primaryError;
  if(failures.length)throw Error(failures.join('; '));
}
