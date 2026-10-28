import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {alphaEmailCallback} from '../scripts/native-email-callback.mjs';

test('packaging-only mode may omit callback, functional mode cannot',()=>{
  assert.equal(alphaEmailCallback(undefined),null);
  assert.throws(()=>alphaEmailCallback(undefined,{required:true}),/requires KINFOLK_ALPHA_EMAIL_REDIRECT_URL/);
});
test('valid HTTPS callback retains its path and query',()=>{
  assert.equal(alphaEmailCallback('https://alpha.example/auth/callback?source=mobile'),
    'https://alpha.example/auth/callback?source=mobile');
});
test('rejects insecure, credential-bearing, loopback and fragment callbacks',()=>{
  for(const url of ['http://alpha.example/auth','https://localhost/auth','https://127.0.0.1/auth',
    'https://user:password@alpha.example/auth','https://alpha.example/auth#token','not a url']){
    assert.throws(()=>alphaEmailCallback(url),/callback/);
  }
});
test('native packager injects configured callback and functional verifier requires it',async()=>{
  const pack=await readFile(new URL('../scripts/prepare-web.mjs',import.meta.url),'utf8');
  const gate=await readFile(new URL('../scripts/verify-functional-alpha.mjs',import.meta.url),'utf8');
  const verify=await readFile(new URL('../scripts/verify-alpha-package.mjs',import.meta.url),'utf8');
  assert.match(pack,/alphaEmailCallback\(process\.env\.KINFOLK_ALPHA_EMAIL_REDIRECT_URL\)/);
  assert.match(pack,/window\.KINFOLK_EMAIL_REDIRECT_URL=/);
  assert.match(gate,/alphaEmailCallback\(process\.env\.KINFOLK_ALPHA_EMAIL_REDIRECT_URL,\{required:true\}\)/);
  assert.match(verify,/native package must embed the configured HTTPS verification callback/);
});
