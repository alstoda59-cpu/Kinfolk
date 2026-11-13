// Connected alpha settings and private inbox isolation test.
// Requires two genuine confirmed alpha JWTs; only changes account A's own setting.
// Never run against LIVE; restores the original setting even after test failure.
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { jwtSubject } from './verify-two-user-rls.mjs';
if (process.env.KINFOLK_ALPHA_E2E_WRITE_OPT_IN !== '1') throw Error('Explicit alpha write opt-in required');
const {url,key}=requireFunctionalAlphaBackend();
const a=process.env.KINFOLK_ALPHA_TEST_USER_A_JWT;
const b=process.env.KINFOLK_ALPHA_TEST_USER_B_JWT;
const idA=jwtSubject(a,{requireExpiry:true}),idB=jwtSubject(b,{requireExpiry:true});
if(idA===idB)throw Error('Two distinct confirmed accounts required');
async function call(table,method,token,query='',body){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
  try{
    const r=await fetch(url+'/rest/v1/'+table+query,{
      method,signal:ctrl.signal,redirect:'manual',cache:'no-store',
      headers:{apikey:key,Authorization:'Bearer '+token,Accept:'application/json',
        ...(body?{'Content-Type':'application/json'}:{}),Prefer:'return=representation'},
      ...(body?{body:JSON.stringify(body)}:{})
    });
    const raw=await r.text();
    let data;try{data=raw?JSON.parse(raw):null}catch{throw Error(table+' returned invalid JSON (HTTP '+r.status+')')}
    return {status:r.status,data};
  }finally{clearTimeout(timer)}
}
function check(ok,msg){if(!ok)throw Error(msg)}
async function get(table,token,query){
  const r=await call(table,'GET',token,query);
  check(r.status===200&&Array.isArray(r.data),table+' read failed HTTP '+r.status);
  return r.data;
}
const qA='?select=user_id,show_online&user_id=eq.'+idA;
const initial=await get('user_settings',a,qA);
check(initial.length===1&&typeof initial[0].show_online==='boolean','Account A settings row missing');
const before=initial[0].show_online;
let changed=false,problem;
try{
  const invisible=await get('user_settings',b,qA);
  check(invisible.length===0,'SECURITY: B can read A settings');
  const denied=await call('user_settings','PATCH',b,'?user_id=eq.'+idA,{show_online:!before});
  check(denied.status===200&&Array.isArray(denied.data)&&denied.data.length===0,
    'SECURITY: B update of A settings not denied');
  const own=await call('user_settings','PATCH',a,'?user_id=eq.'+idA,{show_online:!before});
  check(own.status===200&&own.data?.length===1&&own.data[0].show_online===!before,
    'A settings update failed HTTP '+own.status);
  changed=true;
  const updated=await get('user_settings',a,qA);
  check(updated.length===1&&updated[0].show_online===!before,'A settings update did not persist');
  const privateNotifications=await get('notifications',b,'?select=id&recipient_id=eq.'+idA+'&limit=1');
  check(privateNotifications.length===0,'SECURITY: B can read A notifications');
  const privateMessages=await get('messages',b,'?select=id&sender_id=eq.'+idA+'&receiver_id=eq.'+idA+'&limit=1');
  // Self-addressed messages, if present, must not leak to B.
  check(privateMessages.length===0,'SECURITY: B can read A private messages');
  console.log('PASS: owner settings write/persistence, cross-account settings/notification/message isolation');
}catch(e){problem=e}
finally{
  if(changed){
    try{
      const r=await call('user_settings','PATCH',a,'?user_id=eq.'+idA,{show_online:before});
      if(r.status!==200||r.data?.length!==1||r.data[0].show_online!==before)
        throw Error('Restoration unverified HTTP '+r.status);
    }catch(e){problem=new Error((problem?.message||'')+'; MANUAL ALPHA RESTORE NEEDED for '+idA+': '+e.message)}
  }
}
if(problem)throw problem;
