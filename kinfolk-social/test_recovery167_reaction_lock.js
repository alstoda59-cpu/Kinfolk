const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const start=html.indexOf('const pendingVideoReactionIds=');
const end=html.indexOf('window.toggleVideoReaction=',start);
assert.ok(start>=0&&end>start,'current video reaction handler exists');
const fn=html.slice(start,end);
// Recovery293 changed the old global per-video lock into an account/session scoped lock.
// Duplicate clicks in the same session are blocked, but a different account can react
// without waiting for the previous account's pending request.
for(const token of [
 'const pendingVideoReactionIds=new Set()',
 'const userId=state.user?.id',
 'const sessionEpoch=kf129Epoch',
 "const pendingKey=sessionEpoch+':'+userId+':'+id",
 'pendingVideoReactionIds.has(pendingKey)',
 'pendingVideoReactionIds.add(pendingKey)',
 'pendingVideoReactionIds.delete(pendingKey)',
 'const stillCurrent=()=>state.user?.id===userId&&kf129Epoch===sessionEpoch',
 "eq('user_id',userId)",
 'if(!stillCurrent())return'
])assert.ok(fn.includes(token),token);
assert.ok(!fn.includes('pendingVideoReactionIds.has(id)'),'global per-video lock must not return');
assert.ok(!fn.includes('pendingVideoReactionIds.delete(id)'),'cleanup must use scoped key');
console.log('Recovery167 account/session-scoped video reaction lock checks passed');
