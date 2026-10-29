import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../kinfolk-communities.js',import.meta.url),'utf8');
test('community discovery checks auth lifecycle epoch',()=>{
 assert.match(source,/const active=\(uid,request,main,epoch\)=>authEpoch\(\)===epoch/);
 assert.match(source,/const uid=state\.user\?\.id,epoch=authEpoch\(\),request=\+\+directoryRequest/);
});
test('community creation rejects stale same-account sessions',()=>{
 assert.match(source,/if\(authEpoch\(\)!==epoch\|\|state\.user\?\.id!==uid\|\|state\.view!==\x27communities\x27\|\|!form\.isConnected\)return false/);
 assert.match(source,/if\(authEpoch\(\)===epoch&&state\.user\?\.id===uid&&form\.isConnected\)/);
});
