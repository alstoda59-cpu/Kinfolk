// Recovery467: offline source-contract regression, not an E2E backend test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const begin=source.indexOf('  const subscriptionWritesInFlight=new Set();');
const end=source.indexOf('\n  };',begin);
assert(begin>=0&&end>begin,'expected guarded subscription handler');
const handler=source.slice(begin,end);
for(const [name,pattern] of [
 ['initiating account captured',/const ownerId=state\.user\?\.id,authEpoch=kf129Epoch/],
 ['account and epoch guarded',/state\.user\?\.id===ownerId&&kf129Epoch===authEpoch/],
 ['duplicate requests blocked',/subscriptionWritesInFlight\.has\(key\)/],
 ['uncertain retries blocked',/subscriptionWritesUncertain\.has\(key\)/],
 ['write scoped to account',/\.eq\('user_id',ownerId\)/],
 ['insert bound to account',/user_id:ownerId,notify_level:'all'/],
 ['exact acknowledgment',/data\.length!==1/],
 ['returned owner checked',/data\[0\]\?\.user_id!==ownerId/],
 ['returned channel checked',/data\[0\]\?\.channel_id!==cid/],
 ['post-network account check',/if\(!stillCurrent\(\)\)return;/],
 ['uncertain error locked',/if\(error\|\|/],
 ['network exception locked',/catch\(err\)/],
 ['finally releases inflight',/finally\{[\s\S]*subscriptionWritesInFlight\.delete\(key\)/]
])assert.match(handler,pattern,name);
console.log('Recovery467: 13 offline subscription source-contract assertions passed');
