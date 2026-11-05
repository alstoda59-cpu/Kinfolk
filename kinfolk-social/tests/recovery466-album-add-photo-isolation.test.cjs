// Recovery466 synthetic source contract. Run: node kinfolk-social/tests/recovery466-album-add-photo-isolation.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const section=html.split('function addPhotosToAlbum(id){')[1]?.split('\nasync function showChannelPlaylists')[0];
assert.ok(section,'Add Photos handler must exist');
for(const [name,pattern] of Object.entries({
 account:/state\.user\?\.id===uid/,
 epoch:/kf129Epoch===epoch/,
 modal:/kf300MessageRequest===modalEpoch/,
 duplicate:/kfAlbumAddPending/,
 ownership:/\.eq\('owner_id',uid\)\.single\(\)/,
 uploadGuard:/if\(!active\(\)\)return;\s*if\(up\.error\)/,
 exactAck:/count!==1/,
 pathAck:/rows\[0\]\.storage_path!==path/,
 lockedFailure:/Some photos may have saved/
}))assert.match(section,pattern,name);
assert.doesNotMatch(section,/storage_path:path,caption:''\}\);/,'unacknowledged insert must not return');
console.log('Recovery466: 9 synthetic source contracts passed (not backend E2E)');
