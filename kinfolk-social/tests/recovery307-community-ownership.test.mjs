import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../kinfolk-communities.js',import.meta.url),'utf8');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
function harness({rows=[],insertError=null,deferInsert=false,deferReads=false}={}){
  const state={user:{id:'A'},view:'communities'};
  const calls=[],writes=[],readRequests=[],pendingInsert=deferred();
  const main={isConnected:true,html:'',nodes:{},querySelector(selector){return this.nodes[selector]||null}};
  Object.defineProperty(main,'innerHTML',{set(html){
    for(const node of Object.values(this.nodes))node.isConnected=false;
    this.html=html;
    const make=()=>({isConnected:true,innerHTML:'',textContent:'',value:'',listeners:{},addEventListener(event,fn){this.listeners[event]=fn}});
    const form=make(),submit=make(),status=make();submit.disabled=false;
    const name=make(),description=make(),visibility=make();visibility.value='public';
    form.querySelector=s=>({'[name="name"]':name,'[name="description"]':description,'[name="visibility"]':visibility,'[type="submit"]':submit,'[data-community-status]':status}[s]||null);
    this.nodes={'#kfCreateCommunityForm':form,'#kfCommunitySearch':make(),'#kfOwnedCommunities':make(),'#kfCommunityResults':make()};
    this.nodes.form=form;this.nodes.submit=submit;this.nodes.status=status;this.nodes.name=name;this.nodes.description=description;this.nodes.visibility=visibility;
  }});
  const sb={from(table){assert.equal(table,'kinfolk_communities');return {
    select(columns){assert.match(columns,/owner_id/);let field,value;return {
      eq(k,v){field=k;value=v;return this},order(){return this},limit(){
        calls.push({field,value});
        if(deferReads){const d=deferred();readRequests.push({field,value,...d});return d.promise}
        return Promise.resolve({data:rows.filter(c=>c[field]===value),error:null});
      }
    }},
    insert(payload){writes.push(payload);if(deferInsert)return pendingInsert.promise;
      if(!insertError)rows.push({id:'new-'+writes.length,...payload,created_at:'2026-10-28'});
      return Promise.resolve({error:insertError});}
  }} };
  const warnings=[];
  const context={window:{},state,sb,document:{getElementById:key=>key==='main'?main:null},console:{warn:(...args)=>warnings.push(args)}};
  vm.createContext(context);vm.runInContext(source,context,{timeout:1000});
  const fill=(name='Community One',visibility='public')=>{main.nodes.name.value=name;main.nodes.description.value='A friendly group';main.nodes.visibility.value=visibility;return main.nodes.form};
  return {state,main,calls,writes,readRequests,pendingInsert,warnings,fill,
    render:()=>context.window.kfRenderCommunities(main),create:form=>context.window.kfCreateCommunity(form),
    switchAccount:()=>{state.user={id:'B'}},
    resolveReads:()=>{for(const r of readRequests)r.resolve({data:rows.filter(c=>c[r.field]===r.value),error:null})}
  };
}

test('discovery lists public communities and private spaces only under their owner',async()=>{
 const h=harness({rows:[
  {id:'1',name:'Public & <Friends>',description:'<img src=x onerror=alert(1)>',visibility:'public',owner_id:'B'},
  {id:'2',name:'Private A',description:'Hidden group',visibility:'private',owner_id:'A'},
  {id:'3',name:'Private B',description:'Secret',visibility:'private',owner_id:'B'}]});
 await h.render();
 assert.match(h.main.nodes['#kfCommunityResults'].innerHTML,/Public &amp; &lt;Friends&gt;/);
 assert.doesNotMatch(h.main.nodes['#kfCommunityResults'].innerHTML,/<img/);
 assert.match(h.main.nodes['#kfOwnedCommunities'].innerHTML,/Private A/);
 assert.doesNotMatch(h.main.nodes['#kfOwnedCommunities'].innerHTML,/Private B/);
 assert.doesNotMatch(h.main.nodes['#kfCommunityResults'].innerHTML,/Private A|Private B/);
 assert.deepEqual(h.calls.map(c=>c.field),['visibility','owner_id']);
});

test('search filters public and owned communities independently',async()=>{
 const h=harness({rows:[{name:'Gamers',description:'Console',visibility:'public',owner_id:'B'},
  {name:'Artists',description:'Painting',visibility:'private',owner_id:'A'}]});
 await h.render();h.main.nodes['#kfCommunitySearch'].value='paint';h.main.nodes['#kfCommunitySearch'].listeners.input();
 assert.match(h.main.nodes['#kfOwnedCommunities'].innerHTML,/Artists/);
 assert.doesNotMatch(h.main.nodes['#kfCommunityResults'].innerHTML,/Gamers/);
});

test('private community creation saves owner and remains visible in My communities',async()=>{
 const h=harness();await h.render();const form=h.fill('My Private Space','private');await h.create(form);
 assert.equal(h.writes.length,1);assert.equal(h.writes[0].owner_id,'A');assert.equal(h.writes[0].visibility,'private');
 assert.match(h.main.html,/Community created/);
 assert.match(h.main.nodes['#kfOwnedCommunities'].innerHTML,/My Private Space/);
 assert.doesNotMatch(h.main.nodes['#kfCommunityResults'].innerHTML,/My Private Space/);
});

test('duplicate submission is blocked while first insert is pending',async()=>{
 const h=harness({deferInsert:true});await h.render();const form=h.fill();const first=h.create(form);
 await h.create(form);assert.equal(h.writes.length,1);assert.equal(h.main.nodes.status.textContent,'Your community is already being created.');
 h.pendingInsert.resolve({error:{code:'42501'}});await first;
 assert.equal(h.writes.length,1);
});

test('account switch while insert pending cannot show stale creation success',async()=>{
 const h=harness({deferInsert:true});await h.render();const form=h.fill();const first=h.create(form);
 h.switchAccount();await h.render();h.pendingInsert.resolve({error:null});await first;
 assert.doesNotMatch(h.main.html,/Community created/);
 assert.equal(h.writes[0].owner_id,'A');
});

test('delayed directory response is ignored after account switch',async()=>{
 const h=harness({deferReads:true,rows:[{name:'Private A',visibility:'private',owner_id:'A'}]});
 const first=h.render();h.switchAccount();const second=h.render();h.resolveReads();await Promise.all([first,second]);
 assert.doesNotMatch(h.main.nodes['#kfOwnedCommunities'].innerHTML,/Private A/);
});

test('backend error does not claim community was created',async()=>{
 const h=harness({insertError:{code:'42P01'}});await h.render();const form=h.fill();await h.create(form);
 assert.match(h.main.nodes.status.textContent,/database is not available/);
 assert.doesNotMatch(h.main.html,/Community created/);
});

test('invalid names and privacy values are rejected without writing',async()=>{
 const h=harness();await h.render();let form=h.fill('x','private');await h.create(form);
 form=h.fill('Valid Name','not-a-privacy');await h.create(form);
 assert.equal(h.writes.length,0);
});
