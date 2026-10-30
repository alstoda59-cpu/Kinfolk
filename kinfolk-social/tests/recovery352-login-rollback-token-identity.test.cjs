'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Exercise the effective Phase95 rollback helper from the shipped application.
const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase95.js'),'utf8');
const start=source.indexOf('async function clearFailedLoginSession(');
const end=source.indexOf('async function adopt(',start);
assert.ok(start>=0&&end>start,'effective login rollback helper exists');
const helper=source.slice(start,end)+';globalThis.__rollback=clearFailedLoginSession;';
const USER='synthetic-account-a',OLD='synthetic-access-old',NEW='synthetic-access-new';

function harness({user=USER,token=OLD,onRead,readError}={}){
  let active={user:{id:user},access_token:token},reads=0,signouts=0;
  const scopes=[];
  const auth={
    async getSession(){
      reads++;
      if(onRead)onRead(reads,api);
      if(readError)return {data:null,error:Error('Synthetic auth read failed')};
      return {data:{session:active?{user:{...active.user},access_token:active.access_token}:null},error:null};
    },
    async signOut(options){
      scopes.push(options?.scope);signouts++;active=null;
      return {error:null};
    }
  };
  const api={
    get active(){return active},
    set active(value){active=value},
    get reads(){return reads},
    get signouts(){return signouts},
    scopes
  };
  const context={sb:{auth},console:{warn(){}}};
  vm.runInNewContext(helper,context,{timeout:1000});
  return {...api,rollback:context.__rollback,auth,getState:()=>({active,reads,signouts,scopes})};
}

test('rollback clears only the exact still-active failed-login access token',async()=>{
  const h=harness();
  await h.rollback(USER,null,OLD);
  const s=h.getState();
  assert.equal(s.reads,2);
  assert.equal(s.signouts,1);
  assert.equal(s.active,null);
  assert.deepEqual(s.scopes,['local']);
});

test('a newer login for the same user is not signed out by old rollback',async()=>{
  const h=harness({token:NEW});
  await h.rollback(USER,null,OLD);
  assert.equal(h.getState().signouts,0);
  assert.equal(h.getState().active.access_token,NEW);
});

test('a new same-user token between the two session reads cancels cleanup',async()=>{
  const h=harness({onRead:(count,state)=>{
    if(count===2)state.active={user:{id:USER},access_token:NEW};
  }});
  await h.rollback(USER,null,OLD);
  assert.equal(h.getState().reads,2);
  assert.equal(h.getState().signouts,0);
  assert.equal(h.getState().active.access_token,NEW);
});

test('another account is never signed out by failed-login rollback',async()=>{
  const h=harness({user:'synthetic-account-b'});
  await h.rollback(USER,null,OLD);
  assert.equal(h.getState().signouts,0);
});

test('missing token fails closed without reading or clearing a session',async()=>{
  const h=harness();
  await h.rollback(USER,null,undefined);
  assert.equal(h.getState().reads,0);
  assert.equal(h.getState().signouts,0);
});

test('pre-existing account prevents cleanup even when token matches',async()=>{
  const h=harness();
  await h.rollback(USER,'synthetic-previous-account',OLD);
  assert.equal(h.getState().signouts,0);
});

test('session read errors do not trigger local signout',async()=>{
  const h=harness({readError:true});
  await h.rollback(USER,null,OLD);
  assert.equal(h.getState().signouts,0);
});

test('adopt mismatch carries the actual adopted token into cleanup',()=>{
  assert.match(source,/mismatch\.adoptedSessionToken=data\.session\.access_token\|\|null/);
  assert.match(source,/clearFailedLoginSession\(adoptError\?\.adoptedSessionId\|\|tokens\.user\.id,startingAccount,adoptError\?\.adoptedSessionToken\|\|tokens\.access_token\)/);
});

test('activation rollback uses its verified adopted access token',()=>{
  assert.match(source,/clearFailedLoginSession\(session\?\.user\?\.id,startingAccount,session\?\.access_token\)/);
});
