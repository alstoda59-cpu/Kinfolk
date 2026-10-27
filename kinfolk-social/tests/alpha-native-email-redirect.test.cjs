'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase76.js'),'utf8');
const begin=source.indexOf('const originalSignUp=sb.auth.signUp.bind(sb.auth);');
const end=source.indexOf('const originalSignIn=sb.auth.signInWithPassword.bind(sb.auth);',begin);
assert.ok(begin>=0&&end>begin,'Active signup wrapper exists');
const install=new Function('sb',source.slice(begin,end));
function stub(){
 const calls=[];
 const sb={auth:{signUp:async options=>{calls.push(options);return {data:{session:null},error:null}}}};
 install(sb);
 return {sb,calls};
}
test('native, loopback, insecure and malformed email callbacks are not sent to Supabase',async()=>{
 for(const redirect of ['https://localhost','capacitor://localhost','https://127.0.0.1','https://app.localhost','http://preview.example.test','not-a-url']){
  const {sb,calls}=stub();
  const credentials={email:'synthetic@example.invalid',password:'a'.repeat(12),options:{emailRedirectTo:redirect,data:{username:'synthetic'}}};
  await sb.auth.signUp(credentials);
  assert.equal(calls.length,1,redirect);
  assert.equal(calls[0].options.emailRedirectTo,undefined,redirect);
  assert.equal(calls[0].options.data.username,'synthetic');
  assert.equal(credentials.options.emailRedirectTo,redirect,'input object must not mutate');
 }
});
test('valid HTTPS email callbacks are preserved',async()=>{
 const {sb,calls}=stub();
 const redirect='https://alpha.example.test/confirm';
 await sb.auth.signUp({email:'synthetic@example.invalid',password:'a'.repeat(128),options:{emailRedirectTo:redirect}});
 assert.equal(calls[0].options.emailRedirectTo,redirect);
});
test('signup wrapper enforces 12 to 128 characters',async()=>{
 for(const [length,accepted] of [[11,false],[12,true],[128,true],[129,false]]){
  const {sb,calls}=stub();
  const response=await sb.auth.signUp({email:'synthetic@example.invalid',password:'a'.repeat(length)});
  assert.equal(calls.length,accepted?1:0,'length '+length);
  if(!accepted)assert.match(response.error.message,/12–128/);
 }
});
