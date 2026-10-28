import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-phase79.js'),'utf8');
const start=source.indexOf('function emailRedirect(){');
const end=source.indexOf('// Recovery221:',start);
assert.ok(start>=0&&end>start,'Phase79 redirect helper exists');
const helper=source.slice(start,end);
function resolve({custom,origin='https://preview.example',protocol='https:',hostname='preview.example',native=false}={}){
  const context={URL,location:{origin,protocol,hostname},window:{
    KINFOLK_EMAIL_REDIRECT_URL:custom,
    Capacitor:{isNativePlatform:()=>native}
  }};
  return vm.runInNewContext(helper+';emailRedirect()',context);
}
test('HTTPS web preview keeps its existing origin fallback',()=>{
  assert.equal(resolve(),'https://preview.example');
});
test('iOS Capacitor refuses missing explicit verification callback',()=>{
  assert.throws(()=>resolve({origin:'capacitor://localhost',protocol:'capacitor:',hostname:'localhost'}),/approved HTTPS email verification callback/);
});
test('Android Capacitor refuses missing callback',()=>{
  assert.throws(()=>resolve({origin:'http://localhost',protocol:'http:',hostname:'localhost',native:true}),/approved HTTPS email verification callback/);
});
test('native HTTPS origin still requires explicit callback',()=>{
  assert.throws(()=>resolve({native:true}),/approved HTTPS email verification callback/);
});
test('native accepts an explicitly configured secure callback',()=>{
  assert.equal(resolve({native:true,custom:'https://alpha.example/auth/callback'}),'https://alpha.example/auth/callback');
});
test('native refuses insecure, localhost and credential-bearing callbacks',()=>{
  for(const custom of ['http://alpha.example/auth','https://localhost/auth','https://name:secret@alpha.example/auth','not a url']){
    assert.throws(()=>resolve({native:true,custom}),/approved HTTPS email verification callback/);
  }
});
test('web preview continues returning null for invalid optional override',()=>{
  assert.equal(resolve({custom:'http://alpha.example/auth'}),null);
});
