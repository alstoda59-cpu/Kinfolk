import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('async function hydrateUser(){');
const end=html.indexOf('async function loadCore(){',start);
assert.ok(start>=0&&end>start,'use the real committed Kinfolk hydration function');
const implementation=html.slice(start,end);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const defer=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}};
const waitFor=async check=>{
  for(let i=0;i<50;i++){if(check())return;await new Promise(resolve=>setImmediate(resolve))}
  assert.fail('expected async database stage was not reached');
};
function harness(options={}){
  const counts={profileRead:0,profileUpsert:0,extrasRead:0,extrasInsert:0,extrasReload:0};
  const choose=(key,fallback)=>options[key]===undefined?fallback:options[key];
  const context={
    kf129Epoch:1,
    state:{user:{id:A,user_metadata:{username:'synthetic_a'}},profile:null,extras:null,profiles:new Map()},
    sb:{from(table){
      assert.ok(['profiles','kinfolk_profile_extras'].includes(table));
      return {
        select(){return this},
        eq(){return this},
        maybeSingle(){
          if(table==='profiles'){
            counts.profileRead++;
            return choose('profileRead',{data:{id:A,username:'synthetic_a'},error:null});
          }
          counts.extrasRead++;
          if(counts.extrasRead===1)return choose('extrasRead',{data:{user_id:A,theme:'dark'},error:null});
          counts.extrasReload++;
          return choose('extrasReload',{data:{user_id:A,theme:'dark'},error:null});
        },
        upsert(row){
          assert.equal(table,'profiles');assert.equal(row.id,A);
          counts.profileUpsert++;
          return {select(){return {single(){return choose('profileUpsert',{data:{id:A,username:row.username},error:null})}}}};
        },
        insert(row){
          assert.equal(table,'kinfolk_profile_extras');assert.equal(row.user_id,A);
          counts.extrasInsert++;
          return choose('extrasInsert',{data:null,error:null});
        }
      };
    }}
  };
  const hydrate=vm.runInNewContext(implementation+';hydrateUser',context);
  const switchUser=(id=B)=>{context.kf129Epoch++;context.state.user={id,user_metadata:{}}};
  return {hydrate,context,counts,switchUser};
}

test('current account hydrates profile and extras together',async()=>{
  const h=harness();
  assert.equal(await h.hydrate(),true);
  assert.equal(h.context.state.profile.id,A);
  assert.equal(h.context.state.extras.user_id,A);
  assert.equal(h.context.state.profiles.get(A).id,A);
});

test('stale profile SELECT after logout cannot populate state or query extras',async()=>{
  const gate=defer(),h=harness({profileRead:gate.promise});
  const task=h.hydrate();h.switchUser(null);
  gate.resolve({data:{id:A},error:null});
  assert.equal(await task,false);
  assert.equal(h.context.state.profile,null);
  assert.equal(h.context.state.extras,null);
  assert.equal(h.counts.extrasRead,0);
});

test('stale profile UPSERT after account switch skips all follow-up reads',async()=>{
  const gate=defer(),h=harness({profileRead:{data:null,error:null},profileUpsert:gate.promise});
  const task=h.hydrate();await waitFor(()=>h.counts.profileUpsert===1);
  h.switchUser();gate.resolve({data:{id:A},error:null});
  assert.equal(await task,false);
  assert.equal(h.counts.extrasRead,0);
  assert.equal(h.context.state.profile,null);
});

test('stale extras SELECT cannot publish a previous member profile',async()=>{
  const gate=defer(),h=harness({extrasRead:gate.promise});
  const task=h.hydrate();await waitFor(()=>h.counts.extrasRead===1);
  h.switchUser();gate.resolve({data:{user_id:A},error:null});
  assert.equal(await task,false);
  assert.equal(h.context.state.profile,null);
  assert.equal(h.context.state.extras,null);
  assert.equal(h.context.state.profiles.size,0);
});

test('stale extras INSERT cannot start another query after account switch',async()=>{
  const gate=defer(),h=harness({extrasRead:{data:null,error:null},extrasInsert:gate.promise});
  const task=h.hydrate();await waitFor(()=>h.counts.extrasInsert===1);
  h.switchUser();gate.resolve({data:null,error:null});
  assert.equal(await task,false);
  assert.equal(h.counts.extrasReload,0);
  assert.equal(h.context.state.profile,null);
});

test('stale extras reload after sign-out cannot overwrite profile state',async()=>{
  const gate=defer(),h=harness({extrasRead:{data:null,error:null},extrasReload:gate.promise});
  const task=h.hydrate();await waitFor(()=>h.counts.extrasReload===1);
  h.switchUser(null);gate.resolve({data:{user_id:A},error:null});
  assert.equal(await task,false);
  assert.equal(h.context.state.extras,null);
  assert.equal(h.context.state.profiles.size,0);
});

test('new activation epoch invalidates old hydration even for same user ID',async()=>{
  const gate=defer(),h=harness({profileRead:gate.promise});
  const task=h.hydrate();h.switchUser(A);gate.resolve({data:{id:A},error:null});
  assert.equal(await task,false);
  assert.equal(h.context.state.profile,null);
});

test('active new member still creates missing profile and extras',async()=>{
  const h=harness({profileRead:{data:null,error:null},extrasRead:{data:null,error:null}});
  assert.equal(await h.hydrate(),true);
  assert.equal(h.counts.profileUpsert,1);
  assert.equal(h.counts.extrasInsert,1);
  assert.equal(h.counts.extrasReload,1);
  assert.equal(h.context.state.profile.id,A);
  assert.equal(h.context.state.extras.user_id,A);
});

test('active backend read error remains visible instead of being swallowed',async()=>{
  const h=harness({profileRead:{data:null,error:new Error('synthetic failure')}});
  await assert.rejects(h.hydrate(),/Could not load your profile/);
});
