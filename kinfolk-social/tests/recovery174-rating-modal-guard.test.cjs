// Recovery174: synthetic account-switch and modal replacement regression.
// Run: node kinfolk-social/tests/recovery174-rating-modal-guard.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase82.js','utf8');
const handlers={};let user={id:'adult'},modal={innerHTML:''};
let resolveQuery;const pending=new Promise(resolve=>{resolveQuery=resolve});
const document={head:{appendChild(){}},documentElement:{},createElement(){return {style:{},set innerHTML(v){this.firstElementChild={};}}},getElementById(id){return id==='postRating'?modal:null},querySelectorAll(){return []}};
const state={get user(){return user},view:'home',feed:[],videos:[]};
const window={renderHome:async()=>{},renderReels:async()=>{},openPostModal:()=>{},Capacitor:null};
const sb={from(){return {select(){return this},eq(){return this},maybeSingle(){return pending}}}};
const context={window,document,state,sb,localStorage:{getItem(){return null},setItem(){}},MutationObserver:class{observe(){}},setTimeout(fn){handlers.timer=fn},clearTimeout(){},console,Date,toast(){},renderApp:async()=>{}};
vm.runInNewContext(source,context);
window.openPostModal();handlers.timer();
user={id:'teen'};modal={innerHTML:''};
resolveQuery({data:{birth_date:'1990-01-01',mature_content_preference:'allow'},error:null});
setImmediate(()=>setImmediate(()=>{
  assert.equal(modal.innerHTML,'','A stale adult response must not alter the new account modal');
  console.log('PASS Recovery174 account switch guard');
}));
