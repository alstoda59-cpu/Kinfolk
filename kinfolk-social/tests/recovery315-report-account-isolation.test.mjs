import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../kinfolk-phase108.js',import.meta.url),'utf8');
assert.match(source,/Recovery315: pin reports to the exact modal/);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
function harness(response={error:null,count:1}){
  const calls={writes:[],toasts:[],closed:0};
  const timers=[];
  let current=null;
  const ctx={
    state:{user:{id:A}},kf129Epoch:1,console:{warn(){},log(){}},
    setTimeout:fn=>{timers.push(fn);return timers.length},
    setInterval:()=>1,
    MutationObserver:class{observe(){}},
    document:{
      documentElement:{},
      querySelectorAll:()=>[],
      getElementById(id){
        if(!current)return null;
        if(id==='kf108Submit')return current.button;
        if(id==='kf108Reason')return current.reason;
        if(id==='kf108Details')return current.details;
        return null;
      },
      contains:el=>current?.button===el
    },
    toast:(...args)=>calls.toasts.push(args),
    modal:(title,html)=>{
      current={title,html,button:{disabled:false,textContent:'Submit report',onclick:null},reason:{value:'Harassment or bullying'},details:{value:'Synthetic report'}};
    },
    closeModal:()=>{calls.closed++;current=null},
    sb:{from:table=>{
      assert.equal(table,'kinfolk_reports');
      return {insert(row,options){
        calls.writes.push({row,options});
        return typeof response==='function'?response():response;
      }};
    }}
  };
  ctx.window=ctx;
  vm.runInNewContext(source,ctx,{timeout:1000});
  const flush=()=>{for(const fn of timers.splice(0))fn()};
  return {ctx,calls,flush,open:(type='post',id='post-1')=>{ctx.kf108Report(type,id);flush();return current?.button},current:()=>current,switchAccount:()=>{ctx.state.user={id:B}}};
}
test('report write is scoped to initiating account and exact target, with count verification',async()=>{
  const h=harness(),button=h.open();
  await button.onclick();
  assert.equal(h.calls.writes.length,1);
  assert.equal(h.calls.writes[0].row.reporter_id,A);
  assert.equal(h.calls.writes[0].row.target_type,'post');
  assert.equal(h.calls.writes[0].row.target_id,'post-1');
  assert.equal(h.calls.writes[0].row.reason,'Harassment or bullying: Synthetic report');
  assert.equal(h.calls.writes[0].options.count,'exact');
  assert.equal(h.calls.closed,1);
  assert.equal(h.calls.toasts[0][0],'Report sent to Kinfolk moderation.');
});
test('zero, missing or multiple affected rows cannot claim a submitted report',async()=>{
  for(const count of [0,null,2,undefined]){
    const h=harness({error:null,count}),button=h.open();
    await button.onclick();
    assert.equal(h.calls.closed,0);
    assert.match(h.calls.toasts[0][0],/not be confirmed/);
    assert.equal(button.disabled,false);
    assert.equal(button.textContent,'Submit report');
  }
});
test('database permission failure leaves report open and permits retry',async()=>{
  const h=harness({error:{message:'RLS denied'},count:null}),button=h.open();
  await button.onclick();
  assert.equal(h.calls.closed,0);
  assert.equal(button.disabled,false);
  assert.equal(h.calls.toasts[0][0],'RLS denied');
});
test('double tap sends one report while the first request is pending',async()=>{
  const gate=deferred(),h=harness(()=>gate.promise),button=h.open();
  const first=button.onclick(),second=button.onclick();
  await second;
  assert.equal(h.calls.writes.length,1);
  assert.equal(button.disabled,true);
  gate.resolve({error:null,count:1});await first;
  assert.equal(h.calls.closed,1);
});
test('account switch during pending report cannot close modal or show success',async()=>{
  const gate=deferred(),h=harness(()=>gate.promise),button=h.open();
  const pending=button.onclick();
  h.switchAccount();gate.resolve({error:null,count:1});await pending;
  assert.equal(h.calls.writes[0].row.reporter_id,A);
  assert.equal(h.calls.closed,0);
  assert.equal(h.calls.toasts.length,0);
});
test('same-account new activation cannot show stale report success',async()=>{
  const gate=deferred(),h=harness(()=>gate.promise),button=h.open();
  const pending=button.onclick();
  h.ctx.kf129Epoch++;
  gate.resolve({error:null,count:1});await pending;
  assert.equal(h.calls.closed,0);
  assert.equal(h.calls.toasts.length,0);
});
test('same-account new activation cannot submit an old report modal',async()=>{
  const h=harness(),button=h.open();
  h.ctx.kf129Epoch++;
  await button.onclick();
  assert.equal(h.calls.writes.length,0);
  assert.equal(h.calls.toasts[0][0],'Sign in again before reporting.');
});
test('new report modal remains independent of an older in-flight report',async()=>{
  const old=deferred(),newer=deferred();let n=0;
  const h=harness(()=>++n===1?old.promise:newer.promise);
  const a=h.open('post','old'),pendingA=a.onclick();
  const b=h.open('message','new'),pendingB=b.onclick();
  assert.equal(h.calls.writes.length,2);
  old.resolve({error:null,count:1});await pendingA;
  assert.equal(h.calls.closed,0);
  assert.equal(h.calls.toasts.length,0);
  assert.equal(h.current().button,b);
  newer.resolve({error:null,count:1});await pendingB;
  assert.equal(h.calls.closed,1);
  assert.equal(h.calls.toasts.length,1);
});
test('stale modal timer cannot attach old target to a newer report button',async()=>{
  const h=harness();
  h.ctx.kf108Report('post','old');
  h.ctx.kf108Report('message','new');
  h.flush();
  const b=h.current().button;
  assert.equal(typeof b.onclick,'function');
  await b.onclick();
  assert.equal(h.calls.writes[0].row.target_type,'message');
  assert.equal(h.calls.writes[0].row.target_id,'new');
});
test('self-report and unauthenticated report never open a report modal',()=>{
  const h=harness();
  h.ctx.kf108Report('profile',A);
  assert.equal(h.current(),null);
  h.ctx.state.user=null;
  h.ctx.kf108Report('post','post-1');
  assert.equal(h.current(),null);
  assert.equal(h.calls.writes.length,0);
});
test('stale submit from previous modal is rejected before writing',async()=>{
  const h=harness();
  const old=h.open('post','old');
  h.open('post','new');
  await old.onclick();
  assert.equal(h.calls.writes.length,0);
});
