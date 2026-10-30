'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase95.js'),'utf8');
const start=source.indexOf('async function adopt(');
const end=source.indexOf('async function activateLoginSession(',start);
assert.ok(start>=0&&end>start,'active Phase95 Supabase session adoption exists');
const code=source.slice(start,end)+';globalThis.__adopt=adopt;';
const confirmed='2026-10-29T20:00:00Z';
const user={id:'synthetic-account',email:'synthetic@example.invalid',email_confirmed_at:confirmed};
const tokens={access_token:'synthetic-access',refresh_token:'synthetic-refresh',user};

function harness(adoptedConfirmation,activeConfirmation){
  if(arguments.length<1)adoptedConfirmation=confirmed;
  if(arguments.length<2)activeConfirmation=confirmed;
  const adopted={...user,email_confirmed_at:adoptedConfirmation};
  const active={...user,email_confirmed_at:activeConfirmation};
  let getCount=0;
  const auth={
    async setSession(){return {data:{session:{user:adopted}},error:null};},
    async getSession(){getCount++;return {data:{session:{user:active}},error:null};}
  };
  const context={sb:{auth},setTimeout,console};
  vm.runInNewContext(code,context,{timeout:1000});
  return {adopt:context.__adopt,getCount:()=>getCount};
}

test('confirmed adopted and active sessions continue to open',async()=>{
  const h=harness();
  const session=await h.adopt(tokens);
  assert.equal(session.user.id,user.id);
  assert.equal(h.getCount(),1);
});

for(const [label,value] of [['missing',undefined],['null',null],['blank',''],['whitespace','   ']]){
  test('unconfirmed adopted Supabase session is rejected: '+label,async()=>{
    const h=harness(value,confirmed);
    await assert.rejects(h.adopt(tokens),/email still needs to be confirmed/i);
    assert.equal(h.getCount(),0,'do not poll after an unverified adoption');
  });
  test('unconfirmed active Supabase session is rejected: '+label,async()=>{
    const h=harness(confirmed,value);
    await assert.rejects(h.adopt(tokens),/email still needs to be confirmed/i);
    assert.equal(h.getCount(),1);
  });
}

test('a confirmed adopted user cannot override an unconfirmed active session',async()=>{
  const h=harness(confirmed,null);
  await assert.rejects(h.adopt(tokens),/email still needs to be confirmed/i);
});
