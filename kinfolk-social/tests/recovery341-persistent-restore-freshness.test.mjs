import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Recovery341: execute the real startup/Retry session policy, not a duplicate.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('function kf339RestoreAllowed(){');
const end=html.indexOf('window.kf129Retry=',start);
assert.ok(start>=0&&end>start,'extract current restoration implementation');
const implementation=html.slice(start,end);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const session=(id,token)=>({
  user:{id,email_confirmed_at:'2026-10-30T00:00:00Z'},
  access_token:token,
  refresh_token:'refresh-'+token
});

function harness({sessions=[session(A,'old'),session(A,'old')],stay=true,tab=false,afterRead,failAt=0}={}){
  let reads=0,keep=stay,allowedTab=tab;
  const signOuts=[];
  const sb={auth:{
    async getSession(){
      reads++;
      const current=sessions[Math.min(reads-1,sessions.length-1)];
      if(afterRead)afterRead(reads,{setStay:v=>keep=v,setTab:v=>allowedTab=v});
      if(failAt===reads)return {data:null,error:Error('synthetic session read failed')};
      return {data:{session:current},error:null};
    },
    async signOut(options){signOuts.push(options);return {error:null}}
  }};
  const ctx={sb,
    localStorage:{getItem(){return keep?'1':'0'}},
    sessionStorage:{getItem(){return allowedTab?'1':null}}
  };
  const restore=vm.runInNewContext(implementation+';kf129RestorableSession',ctx);
  return {restore,signOuts,get reads(){return reads}};
}

test('persistent startup activates the latest account, not an old pending response',async()=>{
  const h=harness({sessions:[session(A,'a'),session(B,'b')]});
  const actual=await h.restore();
  assert.equal(actual.user.id,B);
  assert.equal(actual.access_token,'b');
  assert.equal(h.reads,2);
  assert.equal(h.signOuts.length,0);
});

test('persistent startup uses rotated tokens for the same account',async()=>{
  const h=harness({sessions:[session(A,'old'),session(A,'new')]});
  assert.equal((await h.restore()).access_token,'new');
  assert.equal(h.signOuts.length,0);
});

test('original-tab nonpersistent startup also uses the newest account',async()=>{
  const h=harness({stay:false,tab:true,sessions:[session(A,'a'),session(B,'b')]});
  assert.equal((await h.restore()).user.id,B);
  assert.equal(h.signOuts.length,0);
});

test('persistent startup does not activate a session that disappeared',async()=>{
  const h=harness({sessions:[session(A,'a'),null]});
  assert.equal(await h.restore(),null);
  assert.equal(h.signOuts.length,0);
});

test('persistent startup does not activate after the second auth read fails',async()=>{
  const h=harness({failAt:2});
  await assert.rejects(h.restore(),/synthetic session read failed/);
  assert.equal(h.signOuts.length,0);
});

test('removing persistent permission during the second read prevents restoration',async()=>{
  const h=harness({afterRead:(n,controls)=>{if(n===2)controls.setStay(false)}});
  assert.equal(await h.restore(),null);
  assert.equal(h.signOuts.length,1);
  assert.equal(h.signOuts[0].scope,'local');
});

test('revoked preference never signs out a newer account',async()=>{
  const h=harness({sessions:[session(A,'a'),session(B,'b')],afterRead:(n,controls)=>{
    if(n===2)controls.setStay(false);
  }});
  assert.equal(await h.restore(),null);
  assert.equal(h.signOuts.length,0);
});

test('newly granted persistent permission returns the latest account',async()=>{
  const h=harness({stay:false,sessions:[session(A,'a'),session(B,'b')],afterRead:(n,controls)=>{
    if(n===2)controls.setStay(true);
  }});
  assert.equal((await h.restore()).user.id,B);
  assert.equal(h.signOuts.length,0);
});

test('no first session cannot resurrect a later session',async()=>{
  const h=harness({sessions:[null,session(B,'b')]});
  assert.equal(await h.restore(),null);
  assert.equal(h.reads,1);
  assert.equal(h.signOuts.length,0);
});
