import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../kinfolk-community-membership.js',import.meta.url),'utf8');
const ID='123e4567-e89b-42d3-a456-426614174000';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {resolve,promise}};
function harness({readError=null,readPending=false,writePending=false,writeError=null}={}){
  const state={user:{id:'A'},view:'communities'},calls=[],warnings=[];
  let card,listing;
  const element=()=>({isConnected:true,disabled:false,textContent:'',attrs:{},listeners:{},
    setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.listeners[k]=f},
    append(x){(this.children??=[]).push(x)},after(x){(this.afterNodes??=[]).push(x)}});
  const main={isConnected:true,querySelectorAll(){return [card]},querySelector(){return listing}};
  const document={getElementById:()=>main,createElement:()=>element()};
  const read=deferred(),write=deferred();
  const sb={from(table){
    assert.equal(table,'kinfolk_community_members');
    return {
      select(){return {eq(k,v){assert.equal(k,'user_id');assert.equal(v,state.user.id);return this},
        in(k,ids){assert.equal(k,'community_id');assert.deepEqual(Array.from(ids),[ID]);calls.push('read');
          return readPending?read.promise:Promise.resolve({data:[],error:readError})}}},
      insert(row){calls.push(['join',row]);return writePending?write.promise:Promise.resolve({error:writeError})},
      delete(){return {eq(){return this},then(ok){calls.push('leave');return Promise.resolve({error:writeError}).then(ok)}}}
    };
  }};
  const window={kfRenderCommunities:async()=>{}};
  vm.runInNewContext(source,{window,state,sb,document,console:{warn:(...args)=>warnings.push(args)}},{timeout:1000});
  const reset=()=>{card=element();card.dataset={communityId:ID};listing=element();return card};
  reset();
  return {state,calls,warnings,main,read,write,reset,render:()=>window.kfRenderCommunities(main),get card(){return card},get listing(){return listing}};
}
test('public community join then leave binds writes to signed-in user',async()=>{
 const h=harness();await h.render();const b=h.card.children?.[0];assert.equal(b.textContent,'Join community');
 await b.listeners.click();assert.equal(b.textContent,'Leave community');
 await b.listeners.click();assert.equal(b.textContent,'Join community');
 assert.equal(h.calls[1][0],'join');assert.equal(h.calls[1][1].user_id,'A');
 assert.deepEqual(h.calls.map(x=>typeof x==='string'?x:x[0]),['read','join','leave']);
});
test('missing membership table fails closed without showing join controls',async()=>{
 const h=harness({readError:{code:'42P01'}});await h.render();
 assert.equal(h.card.children?.length,undefined);
 assert.match(h.listing.children[0].textContent,/unavailable/);
});
test('late membership read from old account cannot render buttons',async()=>{
 const h=harness({readPending:true});const first=h.render();h.state.user={id:'B'};
 h.read.resolve({data:[{community_id:ID}],error:null});await first;
 assert.equal(h.card.children?.length,undefined);
});
test('duplicate pending join and account switch do not display stale membership state',async()=>{
 const h=harness({writePending:true});await h.render();const b=h.card.children[0];
 const first=b.listeners.click();const second=b.listeners.click();
 assert.equal(h.calls.filter(c=>Array.isArray(c)&&c[0]==='join').length,1);
 h.state.user={id:'B'};h.write.resolve({error:null});await Promise.all([first,second]);
 assert.notEqual(b.textContent,'Leave community');
});
test('write errors do not claim membership success',async()=>{
 const h=harness({writeError:{code:'42501'}});await h.render();const b=h.card.children[0];
 await b.listeners.click();assert.equal(b.textContent,'Join community');
 assert.match(b.afterNodes[0].textContent,/failed/);
});

test('community owner is not shown a self-join button',async()=>{
 const h=harness();h.card.dataset.ownerId='A';await h.render();
 assert.equal(h.card.children?.length,undefined);
 assert.deepEqual(h.calls,[]);
});

test('search rebuild restores membership buttons without another backend read',async()=>{
 const h=harness();await h.render();
 const search=h.listing;
 h.reset();search.listeners.input();
 assert.equal(h.card.children[0].textContent,'Join community');
 await h.card.children[0].listeners.click();
 h.reset();search.listeners.input();
 assert.equal(h.card.children[0].textContent,'Leave community');
 assert.equal(h.calls.filter(x=>x==='read').length,1);
});
test('search during pending join keeps new button disabled and preserves result',async()=>{
 const h=harness({writePending:true});await h.render();
 const search=h.listing;
 const first=h.card.children[0].listeners.click();
 h.reset();search.listeners.input();
 const rebuilt=h.card.children[0];
 assert.equal(rebuilt.disabled,true);
 assert.equal(rebuilt.textContent,'Joining…');
 await rebuilt.listeners.click();
 assert.equal(h.calls.filter(x=>Array.isArray(x)&&x[0]==='join').length,1);
 h.write.resolve({error:null});await first;
 assert.equal(rebuilt.disabled,false);
 assert.equal(rebuilt.textContent,'Leave community');
});
test('search after account switch never rehydrates old account membership',async()=>{
 const h=harness();await h.render();
 const search=h.listing;
 h.state.user={id:'B'};h.reset();search.listeners.input();
 assert.equal(h.card.children?.length,undefined);
});
