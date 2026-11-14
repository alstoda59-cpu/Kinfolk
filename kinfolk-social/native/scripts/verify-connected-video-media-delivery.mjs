// Connected alpha Reels/Channels media authorization, using two confirmed disposable users.
// Writes only to the isolated alpha project; restores owner privacy and cleans up.
import { randomUUID } from 'node:crypto';
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { jwtSubject } from './verify-two-user-rls.mjs';
if (process.env.KINFOLK_ALPHA_E2E_WRITE_OPT_IN !== '1') throw Error('Explicit alpha write opt-in required');
const {url,key}=requireFunctionalAlphaBackend();
const a=process.env.KINFOLK_ALPHA_TEST_USER_A_JWT,b=process.env.KINFOLK_ALPHA_TEST_USER_B_JWT;
const owner=jwtSubject(a,{requireExpiry:true});
if(owner===jwtSubject(b,{requireExpiry:true}))throw Error('Two distinct accounts required');
const videoId=randomUUID(),path=owner+'/videos/e2e-'+randomUUID()+'.mp4';
const object=url+'/storage/v1/object/kinfolk-video/'+path;
async function request(endpoint,method,token,body,headers={}){
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),15000);
 try {const r=await fetch(endpoint,{method,signal:ctrl.signal,redirect:'manual',headers:{apikey:key,Authorization:'Bearer '+token,...headers},...(body===undefined?{}:{body})});
 return {status:r.status,text:await r.text()};}finally{clearTimeout(timeout)}
}
async function table(name,method,token,query='',body){
 const r=await request(url+'/rest/v1/'+name+query,method,token,body===undefined?undefined:JSON.stringify(body),
 {Accept:'application/json',Prefer:'return=representation',...(body===undefined?{}:{'Content-Type':'application/json'})});
 let data;try{data=JSON.parse(r.text)}catch{data=null}return {...r,data};
}
function assert(ok,message){if(!ok)throw Error(message)}
let uploaded=false,created=false,changed=false,original,primary;
try{
 const p=await table('profiles','GET',a,'?select=is_private&id=eq.'+owner);
 assert(p.status===200&&p.data?.length===1,'Owner profile missing');
 original=p.data[0].is_private;assert(typeof original==='boolean','Privacy flag missing');
 if(original){const r=await table('profiles','PATCH',a,'?id=eq.'+owner,{is_private:false});assert(r.status===200&&r.data?.[0]?.is_private===false,'Cannot enable public test');changed=true}
 // Minimal binary fixture exercises authorization, not codec or playback.
 const fixture=Buffer.from([0,0,0,20,102,116,121,112,105,115,111,109,0,0,0,0,105,115,111,109]);
 const up=await request(object,'POST',a,fixture,{'Content-Type':'video/mp4','x-upsert':'false'});
 assert([200,201].includes(up.status),'Owner video upload HTTP '+up.status);uploaded=true;
 const ins=await table('kinfolk_videos','POST',a,'',{id:videoId,creator_id:owner,title:'Alpha video media E2E',kind:'reel',source_type:'upload',storage_path:path,source_mime:'video/mp4',source_size:fixture.length,visibility:'public',processing_status:'ready'});
 assert(ins.status===201&&ins.data?.[0]?.id===videoId,'Video metadata insert HTTP '+ins.status);created=true;
 const found=await table('kinfolk_videos','GET',b,'?select=id,storage_path&id=eq.'+videoId);
 assert(found.status===200&&found.data?.[0]?.storage_path===path,'B cannot discover public Reel');
 assert((await request(object,'GET',b)).status===200,'B cannot fetch public Reel media');
 const priv=await table('profiles','PATCH',a,'?id=eq.'+owner,{is_private:true});
 assert(priv.status===200&&priv.data?.[0]?.is_private===true,'Cannot privatize owner');changed=true;
 const hidden=await table('kinfolk_videos','GET',b,'?select=id&id=eq.'+videoId);
 assert(hidden.status===200&&hidden.data?.length===0,'SECURITY: private Reel metadata visible');
 assert([400,401,403,404].includes((await request(object,'GET',b)).status),'SECURITY: private Reel media downloadable');
 console.log('PASS: public Reel media cross-account delivery and private-profile denial (not video playback)');
}catch(e){primary=e}
finally{
 const errors=[];
 if(created)try{const r=await table('kinfolk_videos','DELETE',a,'?id=eq.'+videoId);if(r.status!==200||r.data?.length!==1)errors.push('video metadata cleanup failed')}catch(e){errors.push(e.message)}
 if(uploaded)try{const r=await request(object,'DELETE',a);if(![200,204].includes(r.status))errors.push('video storage cleanup HTTP '+r.status)}catch(e){errors.push(e.message)}
 if(changed)try{const r=await table('profiles','PATCH',a,'?id=eq.'+owner,{is_private:original});if(r.status!==200||r.data?.[0]?.is_private!==original)errors.push('privacy restoration failed')}catch(e){errors.push(e.message)}
 if(errors.length)console.error('MANUAL ALPHA CLEANUP REQUIRED video '+videoId+' path '+path+': '+errors.join('; '));
 if(primary)throw primary;if(errors.length)throw Error(errors.join('; '));
}
