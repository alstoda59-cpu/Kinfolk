'use strict';
// Real cross-account comments and direct messaging against isolated Kinfolk alpha.
// Uses the same two confirmed disposable identities and safety guard as the post E2E.
// No service-role key, schema changes, live project access, or fabricated auth records.
const {config} = require('./nonproduction-cross-account-backend-e2e.cjs');
const request = async (c,path,{method='GET',token,body,prefer,expected=[200]}={}) => {
  const response=await fetch(c.base+path,{method,redirect:'error',cache:'no-store',
    headers:{apikey:c.key,Authorization:'Bearer '+token,'Content-Type':'application/json',
      ...(prefer?{Prefer:prefer}:{})},
    ...(body===undefined?{}:{body:JSON.stringify(body)})});
  const raw=await response.text();let data;
  try{data=raw?JSON.parse(raw):null;}catch{data=null;}
  if(!expected.includes(response.status))throw Error(method+' '+path.split('?')[0]+' HTTP '+response.status);
  return {status:response.status,data};
};
async function run(c=config(),log=console.log){
  const sessions=[],created=[];
  const rest=(path,options)=>request(c,'/rest/v1/'+path,options);
  try{
    for(const [email,password] of c.accounts){
      const r=await request(c,'/auth/v1/token?grant_type=password',
        {method:'POST',token:c.key,body:{email,password}});
      if(!r.data?.access_token||!r.data?.user?.email_confirmed_at)throw Error('Confirmed account required');
      sessions.push({id:r.data.user.id,token:r.data.access_token});
    }
    const [a,b]=sessions;
    if(a.id===b.id)throw Error('Distinct accounts required');
    for(const u of sessions){
      const r=await rest('profiles?id=eq.'+u.id+'&select=id',{token:u.token});
      if(r.data?.length!==1)throw Error('Missing profile for '+u.id);
    }
    const marker='Kinfolk isolated alpha conversation '+Date.now();
    const p=await rest('posts?select=id,author_id',{method:'POST',token:a.token,
      prefer:'return=representation',body:{author_id:a.id,body:marker},expected:[201]});
    const post=p.data?.[0];
    if(!post?.id||post.author_id!==a.id)throw Error('Post creation failed');
    created.push({table:'posts',id:post.id,token:a.token});
    log('PASS real post created');
    const visible=await rest('posts?id=eq.'+post.id+'&select=id',{token:b.token});
    if(visible.data?.length!==1)throw Error('Cross-account comment prerequisite: post not visible to B');
    const cr=await rest('comments?select=id,author_id,post_id',{method:'POST',token:b.token,
      prefer:'return=representation',body:{post_id:post.id,author_id:b.id,body:marker+' reply'},
      expected:[201]});
    const comment=cr.data?.[0];
    if(!comment?.id||comment.author_id!==b.id||comment.post_id!==post.id)throw Error('Comment ownership mismatch');
    created.push({table:'comments',id:comment.id,token:b.token});
    const read=await rest('comments?id=eq.'+comment.id+'&select=id,body',{token:a.token});
    if(read.data?.length!==1)throw Error('Post owner cannot read cross-account comment');
    log('PASS B comments on A post; A reads comment');
    // Messaging is friend-only under alpha RLS. Establish the relationship through
    // the same authenticated request/accept flow as real users, never via admin SQL.
    const existing=await rest('friend_requests?or=(and(sender_id.eq.'+a.id+',receiver_id.eq.'+b.id+'),and(sender_id.eq.'+b.id+',receiver_id.eq.'+a.id+'))&select=id,status,sender_id,receiver_id',{token:a.token});
    let friendship=existing.data?.find(x=>x.status==='accepted');
    if(!friendship){
      if(existing.data?.some(x=>x.status!=='pending'))throw Error('Existing declined friendship; use fresh disposable accounts');
      let pending=existing.data?.find(x=>x.status==='pending');
      if(!pending){
        const fr=await rest('friend_requests?select=id,status,sender_id,receiver_id',{method:'POST',token:a.token,prefer:'return=representation',body:{sender_id:a.id,receiver_id:b.id,status:'pending'},expected:[201]});
        pending=fr.data?.[0];
        if(!pending?.id)throw Error('Friend request creation failed');
        created.push({table:'friend_requests',id:pending.id,token:a.token,pendingOnly:true});
      }
      const recipient=pending.receiver_id===a.id?a:b;
      const accepted=await rest('friend_requests?id=eq.'+pending.id+'&status=eq.pending&select=id,status',{method:'PATCH',token:recipient.token,prefer:'return=representation',body:{status:'accepted'},expected:[200]});
      if(accepted.data?.[0]?.status!=='accepted')throw Error('Recipient could not accept friend request; inspect contact permissions');
      friendship=accepted.data[0];
    }
    log('PASS authenticated friend request accepted before messaging');
    const msg=await rest('messages?select=id,sender_id,receiver_id',{method:'POST',token:a.token,
      prefer:'return=representation',body:{sender_id:a.id,receiver_id:b.id,body:marker+' direct message'},
      expected:[201]});
    const message=msg.data?.[0];
    if(!message?.id||message.sender_id!==a.id||message.receiver_id!==b.id)
      throw Error('Message sender/recipient mismatch');
    created.push({table:'messages',id:message.id,token:a.token});
    const inbox=await rest('messages?id=eq.'+message.id+'&select=id,sender_id',{token:b.token});
    if(inbox.data?.length!==1)throw Error('Recipient cannot read delivered message');
    log('PASS A sends real message; B reads recipient inbox');
    const third=await rest('messages?id=eq.'+message.id+'&select=id',{token:a.token});
    if(third.data?.length!==1)throw Error('Sender cannot read own sent message');
    log('PASS sender can read sent message');
  }finally{
    for(const item of created.reverse()){
      if(item.pendingOnly){log('CLEANUP REQUIRED accepted friendship '+item.id+' (alpha RLS forbids deleting accepted requests)');continue;}
      try{await rest(item.table+'?id=eq.'+item.id,{method:'DELETE',token:item.token,expected:[200,204]});}
      catch(e){log('CLEANUP REQUIRED '+item.table+' '+item.id+': '+e.message);}
    }
    for(const s of sessions){
      try{await request(c,'/auth/v1/logout?scope=local',{method:'POST',token:s.token,expected:[204]});}
      catch(e){log('Logout warning: '+e.message);}
    }
  }
}
if(require.main===module)run().catch(e=>{console.error('FAIL alpha cross-account integration: '+e.message);process.exitCode=1;});
module.exports={run};
