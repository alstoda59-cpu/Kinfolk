import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../kinfolk-community-owner-edit.js',import.meta.url),'utf8');
const ID='123e4567-e89b-42d3-a456-426614174000';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
function harness({owner='A',response={data:[{id:ID}],error:null},deferWrite=false}={}){
 const state={user:{id:'A'},view:'communities'},writes=[],warnings=[];
 let renderCount=0;
 const make=(tag='div')=>({
   tag,attrs:{},children:[],listeners:{},style:{},dataset:{},isConnected:true,
   value:'',textContent:'',disabled:false,
   setAttribute(k,v){this.attrs[k]=v},
   addEventListener(k,f){this.listeners[k]=f},
   append(...children){this.children.push(...children)},
   remove(){this.isConnected=false},
   querySelector(sel){
     if(sel==='[data-kf-owner-edit]')return this.children.find(x=>Object.hasOwn(x.attrs,'data-kf-owner-edit'))||null;
     if(sel==='[data-kf-edit-form]')return this.children.find(x=>Object.hasOwn(x.attrs,'data-kf-edit-form')&&x.isConnected)||null;
     return null;
   }
 });
 let card=make('article');
 const setupCard=(who=owner)=>{card=make('article');card.dataset={communityId:ID,ownerId:who,name:'Original',description:'Old description',visibility:'private'};return card};
 setupCard();
 const search=make('input');
 const main={isConnected:true,querySelectorAll(sel){assert.equal(sel,'#kfOwnedCommunities article[data-community-id]');return [card]},querySelector(sel){return sel==='#kfCommunitySearch'?search:null}};
 const document={getElementById:()=>main,createElement:tag=>make(tag)};
 const pending=deferred();
 const sb={from(table){assert.equal(table,'kinfolk_communities');return {
   update(payload){const call={payload,filters:[],columns:null};writes.push(call);return {
     eq(k,v){call.filters.push([k,v]);return this},
     select(columns){call.columns=columns;return deferWrite?pending.promise:Promise.resolve(response)}
   }}
 }}};
 const window={kfRenderCommunities:async()=>{renderCount++}};
 vm.runInNewContext(source,{window,state,document,sb,console:{warn:(...args)=>warnings.push(args)}},{timeout:1000});
 const render=()=>window.kfRenderCommunities(main);
 const open=()=>{const edit=card.querySelector('[data-kf-owner-edit]');assert.ok(edit);edit.listeners.click();return card.querySelector('[data-kf-edit-form]')};
 const fields=form=>({name:form.children[0],description:form.children[1],visibility:form.children[2],save:form.children[3],cancel:form.children[4],status:form.children[5]});
 return {state,writes,warnings,pending,render,open,fields,search,setupCard,main,
   get card(){return card},get renderCount(){return renderCount}};
}
test('only owner gets edit button and fields preserve private community details',async()=>{
 const h=harness();await h.render();const f=h.open();const x=h.fields(f);
 assert.equal(x.name.value,'Original');assert.equal(x.description.value,'Old description');assert.equal(x.visibility.value,'private');
 const other=harness({owner:'B'});await other.render();assert.equal(other.card.children.length,0);
});
test('owner edit scopes UPDATE to owner and requires a returned row',async()=>{
 const h=harness();await h.render();const f=h.open(),x=h.fields(f);
 x.name.value='Updated community';x.description.value='New description';x.visibility.value='public';
 await f.listeners.submit({preventDefault(){}});
 assert.deepEqual(h.writes[0].filters,[['id',ID],['owner_id','A']]);
 assert.equal(h.writes[0].columns,'id');
 assert.deepEqual(Object.assign({},h.writes[0].payload),{name:'Updated community',description:'New description',visibility:'public'});
 assert.equal(h.renderCount,2);
});
test('zero-row UPDATE cannot falsely claim save succeeded',async()=>{
 const h=harness({response:{data:[],error:null}});await h.render();const f=h.open();
 await f.listeners.submit({preventDefault(){}});
 assert.equal(h.renderCount,1);
 assert.match(h.fields(f).status.textContent,/Could not save/);
});
test('invalid form values do not write to database',async()=>{
 const h=harness();await h.render();const f=h.open(),x=h.fields(f);
 x.name.value='x';await f.listeners.submit({preventDefault(){}});
 x.name.value='Valid';x.visibility.value='invalid';await f.listeners.submit({preventDefault(){}});
 assert.equal(h.writes.length,0);
});
test('duplicate pending saves blocked and account switch discards old completion',async()=>{
 const h=harness({deferWrite:true});await h.render();const f=h.open(),x=h.fields(f);
 const first=f.listeners.submit({preventDefault(){}});
 await f.listeners.submit({preventDefault(){}});
 assert.equal(h.writes.length,1);assert.equal(x.save.disabled,true);
 h.state.user={id:'B'};h.pending.resolve({data:[{id:ID}],error:null});await first;
 assert.equal(h.renderCount,1);
});
test('directory search rehydrates edit button after cards are replaced',async()=>{
 const h=harness();await h.render();h.setupCard();h.search.listeners.input();
 assert.equal(h.card.querySelector('[data-kf-owner-edit]').textContent,'Edit community');
});
