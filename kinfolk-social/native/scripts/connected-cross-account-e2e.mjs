// Run only against the isolated Kinfolk Social alpha with TWO already email-verified disposable accounts.
// Usage: KINFOLK_ALPHA_URL=... KINFOLK_ALPHA_ANON_KEY=... KINFOLK_E2E_A_EMAIL=...
// KINFOLK_E2E_A_PASSWORD=... KINFOLK_E2E_B_EMAIL=... KINFOLK_E2E_B_PASSWORD=... node scripts/connected-cross-account-e2e.mjs
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const env = process.env;
const url = env.KINFOLK_ALPHA_URL;
const key = env.KINFOLK_ALPHA_ANON_KEY;
const expected = 'https://viantpfagtbgyyzavmtv.supabase.co';
assert.equal(url, expected, 'Refusing to run against any backend other than the isolated alpha');
assert.ok(key && !key.startsWith('sb_secret_'), 'A publishable/anon key is required, never service role');
const required = ['A_EMAIL','A_PASSWORD','B_EMAIL','B_PASSWORD'];
for (const suffix of required) assert.ok(env['KINFOLK_E2E_' + suffix], 'Missing synthetic credential: ' + suffix);
assert.notEqual(env.KINFOLK_E2E_A_EMAIL, env.KINFOLK_E2E_B_EMAIL);
const make = () => createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const a = make(), b = make();
const runId = randomUUID();
let postId, commentId, messageId;
const check = (result, label) => {
  if (result.error) throw new Error(label + ': ' + result.error.message);
  return result.data;
};
const requireRow = (rows, id, label) => assert.ok(rows?.some(r => r.id === id), label);
try {
  const loginA = check(await a.auth.signInWithPassword({email:env.KINFOLK_E2E_A_EMAIL,password:env.KINFOLK_E2E_A_PASSWORD}), 'A login');
  const loginB = check(await b.auth.signInWithPassword({email:env.KINFOLK_E2E_B_EMAIL,password:env.KINFOLK_E2E_B_PASSWORD}), 'B login');
  const aid = loginA.user?.id, bid = loginB.user?.id;
  // Prove that a stored session can be restored by a fresh client, then signed out.
  const restored = make();
  check(await restored.auth.setSession({access_token:loginA.session.access_token,refresh_token:loginA.session.refresh_token}), 'A session restore');
  const restoredUser = check(await restored.auth.getUser(), 'A restored getUser');
  assert.equal(restoredUser.user?.id, aid, 'Restored session belongs to wrong account');
  check(await restored.auth.signOut(), 'A restored logout');
  assert.equal((await restored.auth.getSession()).data.session, null, 'Logout left a local session');
  assert.ok(aid && bid && aid !== bid && loginA.user.email_confirmed_at && loginB.user.email_confirmed_at, 'Distinct confirmed users required');
  for (const [client,id,label] of [[a,aid,'A'],[b,bid,'B']]) {
    const profile = check(await client.from('profiles').select('id').eq('id',id), label + ' profile');
    assert.equal(profile.length,1,label + ' profile trigger missing');
    const safety = check(await client.from('kinfolk_safety_settings').select('user_id').eq('user_id',id),label + ' safety');
    assert.equal(safety.length,1,label + ' safety trigger missing');
  }
  const body = 'Kinfolk isolated alpha E2E ' + runId;
  const post = check(await a.from('posts').insert({author_id:aid,body}).select('id').single(),'A create post');
  postId = post.id;
  requireRow(check(await a.from('posts').select('id').eq('id',postId),'A read post'),postId,'A own post');
  requireRow(check(await b.from('posts').select('id').eq('id',postId),'B feed read'),postId,'B cannot see A public post');
  const comment = check(await a.from('comments').insert({post_id:postId,author_id:aid,body:'Alpha comment '+runId}).select('id').single(),'A comment');
  commentId = comment.id;
  requireRow(check(await b.from('comments').select('id').eq('id',commentId),'B comment read'),commentId,'B cannot see A public comment');
  const msg = check(await a.from('messages').insert({sender_id:aid,receiver_id:bid,body:'Alpha private message '+runId}).select('id').single(),'A send message');
  messageId = msg.id;
  requireRow(check(await b.from('messages').select('id').eq('id',messageId),'B inbox'),messageId,'B receives message');
  assert.equal(check(await b.from('messages').select('id').eq('id',messageId),'B inbox repeat').length,1);
  const anon = make();
  assert.equal(check(await anon.from('messages').select('id').eq('id',messageId),'anonymous inbox').length,0,'Anonymous message leak');
  const spoof = await b.from('posts').insert({author_id:aid,body:'forbidden '+runId});
  assert.ok(spoof.error, 'B was allowed to impersonate A as post author');
  const spoofComment = await b.from('comments').insert({post_id:postId,author_id:aid,body:'forbidden '+runId});
  assert.ok(spoofComment.error, 'B was allowed to impersonate A as comment author');
  const spoofMessage = await b.from('messages').insert({sender_id:aid,receiver_id:bid,body:'forbidden '+runId});
  assert.ok(spoofMessage.error, 'B was allowed to impersonate A as message sender');
  const outsider = await b.from('kinfolk_safety_settings').update({discoverable:true}).eq('user_id',aid).select('user_id');
  assert.ok(outsider.error || outsider.data?.length===0, 'B was allowed to modify A safety settings');
  console.log('PASS: verified login/session restore/logout, profile/safety trigger, cross-account feed/comments, direct message, anonymous isolation, author spoofing and safety ownership');
} finally {
  // Only delete records carrying this run's IDs. Never remove users or unrelated data.
  if (commentId) { const r=await a.from('comments').delete().eq('id',commentId); if(r.error) console.error('Cleanup comment:',r.error.message); }
  if (messageId) { const r=await a.from('messages').delete().eq('id',messageId); if(r.error) console.error('Cleanup message:',r.error.message); }
  if (postId) { const r=await a.from('posts').delete().eq('id',postId); if(r.error) console.error('Cleanup post:',r.error.message); }
  await Promise.all([a.auth.signOut(),b.auth.signOut()]);
}
