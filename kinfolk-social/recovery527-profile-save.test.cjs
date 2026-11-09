// Run: node kinfolk-social/recovery527-profile-save.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'kinfolk-phase103.js'),'utf8');
async function tick(){await new Promise(resolve=>setImmediate(resolve))}
async function scenario(onsubmit){
  const errors=[];let calls=0;
  const button={textContent:'Save Profile',dataset:{},type:'submit'};
  const form={onsubmit(event){calls++;return onsubmit(event)},querySelectorAll(){return [button]}};
  const context={window:{},document:{documentElement:{},getElementById(id){return id==='profileForm'?form:null}},MutationObserver:class{observe(){}},setInterval(fn){fn()},setTimeout(fn){fn()},console:{log(){},error(...args){errors.push(args)}}};
  vm.runInNewContext(source,context);
  const event={preventDefault(){},stopImmediatePropagation(){}};
  button.onpointerup(event);
  await tick();
  button.onpointerup(event);
  await tick();
  return {calls,errors,button};
}
(async()=>{
  const sync=await scenario(()=>{throw Error('temporary failure')});
  assert.equal(sync.calls,2,'synchronous failure must not permanently lock Save Profile');
  assert.equal(sync.errors.length,2);
  const rejected=await scenario(()=>Promise.reject(Error('temporary failure')));
  assert.equal(rejected.calls,2,'rejected save must allow retry');
  assert.equal(rejected.errors.length,2);
  let resolveSave;const pending=new Promise(resolve=>{resolveSave=resolve});
  const button={textContent:'Save Profile',dataset:{}};let calls=0;
  const form={onsubmit(){calls++;return pending},querySelectorAll(){return [button]}};
  const context={window:{},document:{documentElement:{},getElementById(){return form}},MutationObserver:class{observe(){}},setInterval(fn){fn()},setTimeout(fn){fn()},console:{log(){},error(){}}};
  vm.runInNewContext(source,context);
  const event={preventDefault(){},stopImmediatePropagation(){}};
  button.onpointerup(event);button.onpointerup(event);
  assert.equal(calls,1,'pending save must not double-submit');
  resolveSave();await tick();button.onpointerup(event);
  assert.equal(calls,2,'successful save must allow another save');
  console.log('Recovery527 profile-save regression: 3 scenarios passed');
})().catch(error=>{console.error(error);process.exitCode=1});
