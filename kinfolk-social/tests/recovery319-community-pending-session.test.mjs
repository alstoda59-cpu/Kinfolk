import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../kinfolk-communities.js',import.meta.url),'utf8');
function harness(){
  const state={user:{id:'A'},view:'communities'},writes=[];
  const main={isConnected:true,nodes:{},querySelector(key){return this.nodes[key]}};
  Object.defineProperty(main,'innerHTML',{set(html){
    for(const node of Object.values(this.nodes))node.isConnected=false;
    this.html=html;
    const node=()=>({isConnected:true,value:'',textContent:'',innerHTML:'',disabled:false,listeners:{},addEventListener(type,fn){this.listeners[type]=fn}});
    const form=node(),name=node(),description=node(),visibility=node(),submit=node(),status=node();
    name.value='Kinfolk Gamers';description.value='Test only';visibility.value='public';
    form.querySelector=key=>({'[name="name"]':name,'[name="description"]':description,'[name="visibility"]':visibility,'[type="submit"]':submit,'[data-community-status]':status})[key];
    this.nodes={'#kfCreateCommunityForm':form,'#kfCommunitySearch':node(),'#kfOwnedCommunities':node(),'#kfCommunityResults':node(),form,submit,status};
  }});
  const sb={from(table){
    assert.equal(table,'kinfolk_communities');
    return {
      insert(payload){let resolve;const promise=new Promise(r=>resolve=r);writes.push({payload,resolve});return {select:()=>promise}},
      select(){return {eq(){return this},order(){return this},limit(){return Promise.resolve({data:[],error:null})}}}
    };
  }};
  const context={window:{},state,sb,kf129Epoch:1,document:{getElementById:()=>main},console:{warn(){}}};
  vm.createContext(context);vm.runInContext(source,context,{timeout:1000});
  const row=i=>({id:'123e4567-e89b-42d3-a456-42661417400'+i,...writes[i-1].payload});
  return {context,main,writes,row,render:()=>context.window.kfRenderCommunities(main),
    create:()=>context.window.kfCreateCommunity(main.nodes.form),
    reset:()=>{context.kf129Epoch++},
    settle:(i,result)=>writes[i-1].resolve(result??{data:[row(i)],error:null})};
}

test('same account can create in new auth epoch while old request is pending',async()=>{
  const h=harness();await h.render();const first=h.create();
  assert.equal(h.writes.length,1);
  h.reset();await h.render();const second=h.create();
  assert.equal(h.writes.length,2,'new session must not inherit old pending lock');
  h.settle(1);await first;
  await h.create();
  assert.equal(h.writes.length,2,'old finally must not clear new pending token');
  assert.equal(h.main.nodes.submit.disabled,true);
  h.settle(2);await second;
  assert.match(h.main.html,/Community created/);
});

test('completed create notice does not leak into later same-user login',async()=>{
  const h=harness();await h.render();const first=h.create();h.settle(1);await first;
  assert.match(h.main.html,/Community created/);
  h.reset();await h.render();
  assert.doesNotMatch(h.main.html,/Community created/);
});

test('stale failed create cannot change new session status or pending state',async()=>{
  const h=harness();await h.render();const first=h.create();
  h.reset();await h.render();const second=h.create();
  h.settle(1,{data:null,error:{code:'42501'}});await first;
  assert.equal(h.main.nodes.status.textContent,'Creating community…');
  await h.create();assert.equal(h.writes.length,2);
  h.settle(2);await second;
  assert.match(h.main.html,/Community created/);
});
