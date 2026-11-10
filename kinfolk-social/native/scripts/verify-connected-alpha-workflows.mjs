// Connected, disposable two-account alpha workflow. Writes only to the isolated
// alpha project and deletes its own test rows. Never use production credentials.
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';

const env=process.env;
if(env.KINFOLK_ALPHA_SYNTHETIC_ACCOUNTS_ONLY!=='1'||env.KINFOLK_ALPHA_ALLOW_TEST_WRITES!=='1')
  throw Error('Synthetic-account and isolated test-write opt-ins are required');
const config=requireFunctionalAlphaBackend(env);
const credentials=[
  [env.KINFOLK_ALPHA_TEST_USER_A_EMAIL,env.KINFOLK_ALPHA_TEST_USER_A_PASSWORD],
  [env.KINFOLK_ALPHA_TEST_USER_B_EMAIL,env.KINFOLK_ALPHA_TEST_USER_B_PASSWORD]
];
if(credentials.some(p=>!p[0]||!p[1])||credentials[0][0].toLowerCase()===credentials[1][0].toLowerCase())
  throw Error('Two distinct disposable alpha credentials required');
const clients=credentials.map(()=>createClient(config.url,config.key,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
}));
const ids=[];
const cleanup=[];
const marker='kinfolk-alpha-e2e-'+randomUUID();
const check=(result,what)=>{
  if(result.error)throw Error(what+': '+result.error.message);
  return result.data;
};
async function remove(client,table,id){
  const {error}=await client.from(table).delete().eq('id',id);
  if(error)console.error('Cleanup failed for '+table+': '+error.message);
}
try{
  for(let i=0;i<2;i++){
    const {data,error}=await clients[i].auth.signInWithPassword({
      email:credentials[i][0],password:credentials[i][1]
    });
    if(error||!data?.session||!data.user?.email_confirmed_at)
      throw Error('Account '+(i+1)+' is not confirmed and authenticated');
    const verified=check(await clients[i].auth.getUser(),'Verify session '+(i+1));
    if(verified.user?.id!==data.user.id)throw Error('Session identity mismatch');
    ids.push(data.user.id);
  }
  if(ids[0]===ids[1])throw Error('Accounts must be distinct');
  // Simulate a native process restart by restoring each authenticated session
  // into a fresh Supabase client. Verify identity with Auth, not just local state.
  // The original clients remain active for the connected workflows below.
  for(let i=0;i<2;i++){
    const {data:original,error:sessionError}=await clients[i].auth.getSession();
    if(sessionError||!original?.session?.access_token||!original.session.refresh_token)
      throw Error('Account '+(i+1)+' has no restorable session');
    const restored=createClient(config.url,config.key,{
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
    });
    try{
      const {data:resumed,error:restoreError}=await restored.auth.setSession({
        access_token:original.session.access_token,
        refresh_token:original.session.refresh_token
      });
      if(restoreError||resumed?.user?.id!==ids[i]||!resumed.session)
        throw Error('Account '+(i+1)+' session restoration failed: '+(restoreError?.message||'identity mismatch'));
      const {data:verified,error:verifyError}=await restored.auth.getUser();
      if(verifyError||verified?.user?.id!==ids[i])
        throw Error('Account '+(i+1)+' restored session was not accepted by Auth');
      const {error:logoutError}=await restored.auth.signOut({scope:'local'});
      if(logoutError)throw Error('Account '+(i+1)+' logout failed: '+logoutError.message);
      const {data:afterLogout,error:afterLogoutError}=await restored.auth.getSession();
      if(afterLogoutError||afterLogout?.session)
        throw Error('Account '+(i+1)+' retained a local session after logout');
    }finally{
      await restored.auth.signOut({scope:'local'}).catch(()=>{});
    }
  }
  for(let i=0;i<2;i++){
    const rows=check(await clients[i].from('profiles').select('id').eq('id',ids[i]).limit(1),'Read profile');
    if(rows.length!==1)throw Error('Account '+(i+1)+' lacks its application profile');
  }
  // An authenticated user must be able to publish a feed item, and the other
  // account must see it before being allowed to comment on it.
  const post=check(await clients[0].from('posts')
    .insert({author_id:ids[0],body:marker}).select('id').single(),'Publish post');
  cleanup.push(()=>remove(clients[0],'posts',post.id));
  const visible=check(await clients[1].from('posts').select('id,body').eq('id',post.id),'Cross-account feed read');
  if(visible.length!==1||visible[0].body!==marker)throw Error('Post not visible to second account');
  const comment=check(await clients[1].from('comments')
    .insert({post_id:post.id,author_id:ids[1],body:marker}).select('id').single(),'Publish comment');
  cleanup.push(()=>remove(clients[1],'comments',comment.id));
  const replies=check(await clients[0].from('comments').select('id,author_id').eq('id',comment.id),'Read comment');
  if(replies.length!==1||replies[0].author_id!==ids[1])throw Error('Cross-account comment missing');
  // Prove that a second account cannot impersonate the post author.
  const forged=await clients[1].from('posts').insert({author_id:ids[0],body:marker+'-forged'});
  if(!forged.error)throw Error('RLS allowed cross-account post author impersonation');
  // Reels and Channels share the video metadata backend. A ready public video
  // must be discoverable by another account, but private videos must not leak.
  const reel=check(await clients[0].from('kinfolk_videos').insert({
    creator_id:ids[0],title:marker,kind:'reel',source_type:'external',
    video_url:'https://example.org/alpha-synthetic-video',visibility:'public',
    processing_status:'ready'
  }).select('id').single(),'Publish reel metadata');
  cleanup.push(()=>remove(clients[0],'kinfolk_videos',reel.id));
  const reelRead=check(await clients[1].from('kinfolk_videos')
    .select('id').eq('id',reel.id),'Cross-account reel discovery');
  if(reelRead.length!==1)throw Error('Public ready reel is not discoverable');
  check(await clients[0].from('kinfolk_videos').update({visibility:'private'})
    .eq('id',reel.id).select('id').single(),'Make reel private');
  const hidden=check(await clients[1].from('kinfolk_videos')
    .select('id').eq('id',reel.id),'Private reel isolation');
  if(hidden.length!==0)throw Error('Private reel leaked to another account');
  // Profile music/settings are owner-controlled. Verify an unrelated account
  // cannot overwrite the profile, then restore the original field.
  const originalProfile=check(await clients[0].from('profiles')
    .select('profile_music_url').eq('id',ids[0]).single(),'Read profile music');
  const forgedMusic=await clients[1].from('profiles').update({profile_music_url:'https://example.org/forged.mp3'})
    .eq('id',ids[0]).select('id');
  if(forgedMusic.error)throw Error('Profile ownership probe failed: '+forgedMusic.error.message);
  if(forgedMusic.data.length!==0)throw Error('Cross-account profile update allowed');
  check(await clients[0].from('profiles').update({profile_music_url:'https://example.org/alpha-synthetic-music.mp3'})
    .eq('id',ids[0]).select('id').single(),'Save profile music');
  cleanup.push(async()=>{
    const {error}=await clients[0].from('profiles').update({profile_music_url:originalProfile.profile_music_url})
      .eq('id',ids[0]);if(error)console.error('Restore profile music failed: '+error.message);
  });
  const savedMusic=check(await clients[0].from('profiles')
    .select('profile_music_url').eq('id',ids[0]).single(),'Reload profile music');
  if(savedMusic.profile_music_url!=='https://example.org/alpha-synthetic-music.mp3')
    throw Error('Profile music did not persist');
  // Friendship is required by the existing messaging privacy rules.
  const request=check(await clients[0].from('friend_requests')
    .insert({sender_id:ids[0],receiver_id:ids[1],status:'pending'})
    .select('id').single(),'Send friend request');
  cleanup.push(()=>remove(clients[0],'friend_requests',request.id));
  const accepted=check(await clients[1].from('friend_requests')
    .update({status:'accepted'}).eq('id',request.id).select('id,status').single(),'Accept friend request');
  if(accepted.status!=='accepted')throw Error('Friendship acceptance did not persist');
  // A stranger may not read an existing direct message or send one as its author.
  const message=check(await clients[0].from('messages')
    .insert({sender_id:ids[0],receiver_id:ids[1],body:marker})
    .select('id').single(),'Send direct message');
  cleanup.push(()=>remove(clients[0],'messages',message.id));
  const received=check(await clients[1].from('messages')
    .select('id,sender_id,body').eq('id',message.id),'Receive direct message');
  if(received.length!==1||received[0].sender_id!==ids[0]||received[0].body!==marker)
    throw Error('Receiver could not read message');
  console.log('PASS isolated alpha: confirmed sessions, restore/logout, profiles/music ownership, posts/comments, Reels privacy, friendship and direct messages');
}catch(error){
  console.error('FAIL isolated alpha connected workflow: '+error.message);
  process.exitCode=1;
}finally{
  for(const fn of cleanup.reverse())try{await fn()}catch(error){console.error('Cleanup error: '+error.message)}
  await Promise.all(clients.map(async c=>{try{await c.auth.signOut({scope:'local'})}catch{}}));
}
