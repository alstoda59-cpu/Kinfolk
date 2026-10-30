import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('function kf339RestoreAllowed(){');
const end=html.indexOf('window.kf129Retry=',start);
assert.ok(start>0&&end>start,'exercise real startup session policy and restore helper');
const source=html.slice(start,end);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const session=(id,token)=>({user:{id,email_confirmed_at:'2026-10-30T00:00:00Z'},access_token:token,refresh_token:'refresh-'+token});

function harness({sessions=[session(A,'a')],stay=false,tab=false,readErrorAt=0,signOutError=false,afterRead}={}){
  let reads=0;let preference=stay;let tabPreference=tab;
  const calls={signOut:[]};
  const auth={
    async getSession(){
      reads++;
      const value=sessions[Math.min(reads-1,sessions.length-1)];
      if(afterRead)afterRead(reads,{setStay:v=>preference=v,setTab:v=>tabPreference=v});
      if(readErrorAt===reads)return {data:null,error:new Error('synthetic session read failed')};
      return {data:{session:value},error:null};
    },
    async signOut(options){
      calls.signOut.push(options);
      return {error:signOutError?new Error('synthetic signout failed'):null};
    }
  };
  const ctx={
    sb:{auth},
    localStorage:{getItem(){return preference?'1':'0'}},
    sessionStorage:{getItem(){return tabPreference?'1':null}}
  };
  const restore=vm.runInNewContext(source+';kf129RestorableSession',ctx);
  return {restore,calls,get reads(){return reads}};
}

test('persistent login restores only after a fresh auth read, without sign-out',async()=>{
  const h=harness({stay:true});
  assert.equal((await h.restore()).access_token,'a');
  assert.equal(h.reads,2);
  assert.equal(h.calls.signOut.length,0);
});

test('nonpersistent session remains available in its original tab',async()=>{
  const h=harness({tab:true});
  assert.equal((await h.restore()).access_token,'a');
  assert.equal(h.calls.signOut.length,0);
});

test('stable nonpersistent session in a different tab is locally signed out',async()=>{
  const h=harness();
  assert.equal(await h.restore(),null);
  assert.equal(h.reads,2);
  assert.equal(h.calls.signOut.length,1);
  assert.equal(h.calls.signOut[0].scope,'local');
});

test('new account arriving between auth reads is not signed out',async()=>{
  const h=harness({sessions:[session(A,'a'),session(B,'b')]});
  assert.equal(await h.restore(),null);
  assert.equal(h.calls.signOut.length,0);
});

test('same account with refreshed credentials is not signed out by stale startup',async()=>{
  const h=harness({sessions:[session(A,'old'),session(A,'new')]});
  assert.equal(await h.restore(),null);
  assert.equal(h.calls.signOut.length,0);
});

test('changing Stay Logged In during the second read restores the current session',async()=>{
  const h=harness({sessions:[session(A,'a'),session(B,'b')],afterRead:(n,controls)=>{
    if(n===2)controls.setStay(true);
  }});
  assert.equal((await h.restore()).user.id,B);
  assert.equal(h.calls.signOut.length,0);
});

test('new same-tab permission during the second read restores the current session',async()=>{
  const h=harness({afterRead:(n,controls)=>{if(n===2)controls.setTab(true)}});
  assert.equal((await h.restore()).access_token,'a');
  assert.equal(h.calls.signOut.length,0);
});

test('session disappearing during the second read does not trigger sign-out',async()=>{
  const h=harness({sessions:[session(A,'a'),null]});
  assert.equal(await h.restore(),null);
  assert.equal(h.calls.signOut.length,0);
});

test('failed second auth read cannot trigger sign-out',async()=>{
  const h=harness({readErrorAt:2});
  await assert.rejects(h.restore(),/synthetic session read failed/);
  assert.equal(h.calls.signOut.length,0);
});

test('failed local sign-out remains visible to the caller',async()=>{
  const h=harness({signOutError:true});
  await assert.rejects(h.restore(),/synthetic signout failed/);
  assert.equal(h.calls.signOut.length,1);
});

test('no startup session does not attempt a sign-out',async()=>{
  const h=harness({sessions:[null]});
  assert.equal(await h.restore(),null);
  assert.equal(h.reads,1);
  assert.equal(h.calls.signOut.length,0);
});
