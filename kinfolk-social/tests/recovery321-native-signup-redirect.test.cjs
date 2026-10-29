'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase76.js'),'utf8');
const begin=source.indexOf('const originalSignUp=sb.auth.signUp.bind(sb.auth);');
const end=source.indexOf('const originalSignIn=sb.auth.signInWithPassword.bind(sb.auth);',begin);
assert.ok(begin>=0&&end>begin,'active signup wrapper exists');
const install=new Function('sb','window','location',source.slice(begin,end));

function setup({native=true,callback,bridgeReady=true}={}){
  const calls=[];
  const sb={auth:{signUp:async credentials=>{
    calls.push(credentials);
    return {data:{user:null,session:null},error:null};
  }}};
  install(sb,{KINFOLK_NATIVE_ALPHA:native,Capacitor:{isNativePlatform:()=>native&&bridgeReady},KINFOLK_EMAIL_REDIRECT_URL:callback},
    {protocol:'https:',hostname:'localhost'});
  return {sb,calls};
}
const input=redirect=>({
  email:'synthetic@example.invalid',
  password:'s'.repeat(12),
  options:{emailRedirectTo:redirect,data:{display_name:'Synthetic Alpha'}}
});

test('native legacy signup overrides local WebView redirect with packaged HTTPS app link',async()=>{
  const callback='https://alpha.example.test/auth/callback?from=mobile';
  const {sb,calls}=setup({callback});
  const credentials=input('https://localhost');
  const result=await sb.auth.signUp(credentials);
  assert.equal(result.error,null);
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.emailRedirectTo,callback);
  assert.equal(calls[0].options.data.display_name,'Synthetic Alpha');
  assert.equal(credentials.options.emailRedirectTo,'https://localhost','do not mutate caller');
});
test('packaged native marker protects signup before Capacitor bridge is ready',async()=>{
  const callback='https://alpha.example.test/confirm';
  const {sb,calls}=setup({native:true,callback,bridgeReady:false});
  await sb.auth.signUp(input('https://localhost'));
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.emailRedirectTo,callback);
  const blocked=setup({native:true,bridgeReady:false});
  const response=await blocked.sb.auth.signUp(input('https://localhost'));
  assert.equal(blocked.calls.length,0);
  assert.match(response.error?.message||'',/approved HTTPS/);
});
test('native signup refuses to call Supabase when app-link callback is absent',async()=>{
  const {sb,calls}=setup({callback:undefined});
  const result=await sb.auth.signUp(input('https://localhost'));
  assert.match(result.error?.message||'',/approved HTTPS email verification callback/);
  assert.equal(calls.length,0);
});
test('native signup cannot be redirected by a legacy form to a different HTTPS site',async()=>{
  const callback='https://alpha.example.test/auth/callback';
  const {sb,calls}=setup({callback});
  await sb.auth.signUp(input('https://attacker.example.test/confirm'));
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.emailRedirectTo,callback);
});
test('native signup fails closed on blocked callback hosts and malformed URLs',async()=>{
  for(const callback of [
    'https://preview.vercel.app/confirm','https://viantpfagtbgyyzavmtv.supabase.co/confirm',
    'https://localhost/confirm','https://127.0.0.1/confirm',
    'https://[::1]/confirm','https://alpha.example.test:8443/confirm',
    'https://alpha.example.test/confirm#token','http://alpha.example.test/confirm',
    'https://user:pass@alpha.example.test/confirm','not-a-url'
  ]){
    const {sb,calls}=setup({callback});
    const result=await sb.auth.signUp(input('https://localhost'));
    assert.equal(calls.length,0,callback);
    assert.match(result.error?.message||'',/approved HTTPS/,callback);
  }
});
test('normal web signup preserves HTTPS redirect without native callback',async()=>{
  const {sb,calls}=setup({native:false});
  await sb.auth.signUp(input('https://web.example.test/confirm'));
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.emailRedirectTo,'https://web.example.test/confirm');
});
test('normal web signup strips local redirect without changing other options',async()=>{
  const {sb,calls}=setup({native:false});
  await sb.auth.signUp(input('https://localhost'));
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.emailRedirectTo,undefined);
  assert.equal(calls[0].options.data.display_name,'Synthetic Alpha');
});
