'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase76.js'),'utf8');
const begin=source.indexOf('  function passwordResetRedirectOptions(){');
const end=source.indexOf('\n\n  function render(next=',begin);
assert.ok(begin>=0&&end>begin,'active password reset helper exists');
const make=new Function('window','location',source.slice(begin,end)+';return passwordResetRedirectOptions;');
function helper({native=true,callback,bridgeReady=false,origin='https://localhost'}={}){
  return make({
    KINFOLK_NATIVE_ALPHA:native,
    KINFOLK_PASSWORD_RESET_REDIRECT_URL:callback,
    Capacitor:{isNativePlatform:()=>native&&bridgeReady}
  },new URL(origin));
}
test('native password reset refuses absent callback before Auth request',()=>{
  assert.throws(()=>helper()(),/approved HTTPS recovery callback/);
});
test('native password reset uses approved packaged recovery link before bridge starts',()=>{
  const callback='https://alpha.example.test/reset?source=kinfolk';
  assert.deepEqual(helper({callback})(),{redirectTo:callback});
});
test('native password reset rejects blocked and malformed callback destinations',()=>{
  for(const callback of [
    'https://preview.vercel.app/reset','https://viantpfagtbgyyzavmtv.supabase.co/reset',
    'https://localhost/reset','https://127.0.0.1/reset','https://[::1]/reset',
    'https://foo.local/reset','https://alpha.example.test:8443/reset',
    'https://alpha.example.test/reset#token','http://alpha.example.test/reset',
    'https://user:pass@alpha.example.test/reset','not-a-url'
  ])assert.throws(()=>helper({callback})(),/approved HTTPS recovery callback/,callback);
});
test('normal web password recovery keeps existing public HTTPS origin behavior',()=>{
  assert.deepEqual(helper({native:false,origin:'https://web.example.test'})(),{redirectTo:'https://web.example.test'});
  assert.deepEqual(helper({native:false,origin:'https://localhost'})(),{});
});
