import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const phase78=readFileSync(new URL('../kinfolk-phase78.js',import.meta.url),'utf8');
const phase81=readFileSync(new URL('../kinfolk-phase81.js',import.meta.url),'utf8');
const start=phase78.indexOf('  async function getSafety(uid)');
const end=phase78.indexOf('  function openLegacySettings()',start);
assert.ok(start>=0&&end>start,'actual safety functions must be present');
const safetySource=phase78.slice(start,end);
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
function harness(){
 const state={user:{id:'synthetic-A'}},calls=[],pending=deferred();
 const sb={from:table=>({
   select:()=>({eq:(column,uid)=>({maybeSingle:()=>{calls.push({type:'read',table,column,uid});return pending.promise}})}),
   update:payload=>({eq:(column,uid)=>{calls.push({type:'write',table,column,uid,payload});return Promise.resolve({error:null})}})
 })};
 const ctx={state,sb,console:{warn:()=>{}},setTimeout:()=>{},Date};
 vm.runInNewContext(safetySource+';globalThis.api={getSafety,enforceTeen,saveAdultFilter}',ctx);
 return {state,calls,pending,...ctx.api};
}
test('settings safety read never returns the previous account data after a switch',async()=>{
 const h=harness(),result=h.getSafety('synthetic-A');
 h.state.user={id:'synthetic-B'};
 h.pending.resolve({data:{birth_date:'2000-01-01',mature_content_preference:'allow'},error:null});
 assert.equal(await result,null);
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].uid,'synthetic-A');
});
test('teen enforcement cannot write to an account other than the active one',async()=>{
 const h=harness();
 await h.enforceTeen({birth_date:'2011-01-01'},'synthetic-B');
 assert.equal(h.calls.length,0);
 await h.enforceTeen({birth_date:'2011-01-01'},'synthetic-A');
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].uid,'synthetic-A');
 assert.equal(h.calls[0].payload.discoverable,false);
 assert.equal(h.calls[0].payload.daily_limit_minutes,480);
});
test('adult filter save cannot mutate a different account',async()=>{
 const h=harness(),button={textContent:'Save',disabled:false};
 await h.saveAdultFilter('allow',button,'synthetic-B');
 assert.equal(h.calls.length,0);
 assert.equal(button.disabled,false);
 await h.saveAdultFilter('allow',button,'synthetic-A');
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].uid,'synthetic-A');
 assert.equal(h.calls[0].payload.mature_content_preference,'allow');
 assert.equal(h.calls[0].payload.daily_limit_minutes,null);
});
test('opening Settings never clears adult daily limit without explicit Save',()=>{
 const open=phase78.slice(phase78.indexOf('  async function openSettings()'),phase78.indexOf('  window.openKinfolkAgeSafetySettings='));
 assert.ok(!open.includes("update({daily_limit_minutes:null})"));
 assert.match(open,/const userId=state\?\.user\?\.id\?\?null/);
 assert.match(open,/getSafety\(userId\)/);
 assert.match(open,/state\?\.user\?\.id!==userId/);
});
test('mobile Settings hub routes existing controls without a second editor',()=>{
 for(const id of ['kf78-more','kf78-go-appearance','kf78-go-safety','kf78-go-notifications'])assert.ok(phase78.includes('id="'+id+'"'),id);
 assert.match(phase78,/#kf78-sheet\{box-sizing:border-box;width:100%;height:100dvh/);
 assert.match(phase78,/window\.kf81MountAppearance\?\.\(\)/);
 assert.match(phase81,/window\.kf81MountAppearance=mountAppearance/);
 assert.match(phase78,/setView\('notifications'\)/);
});
