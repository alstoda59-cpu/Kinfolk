'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('async function renderProfile(');
const end=html.indexOf('async function renderProfileContent(',start);
const guardStart=html.indexOf('function kfAlphaLoadCurrent(');
const guardEnd=html.indexOf('async function loadProfiles(',guardStart);
assert.ok(start>=0&&end>start&&guardStart>=0&&guardEnd>guardStart);
const source=html.slice(guardStart,guardEnd)+html.slice(start,end);
function install(state,sb,main,avatarHtml=async()=>'<avatar>',renderProfileContent=async()=>{}){
 const $=selector=>selector==='#main'?main:{innerHTML:''};
 return new Function('state','sb','$','signed','avatarHtml','esc','renderProfileContent',
  'let kf129Epoch=1;'+source+';return {renderProfile,setEpoch(n){kf129Epoch=n}};')(
  state,sb,$,async()=>null,avatarHtml,x=>String(x??''),renderProfileContent);
}
function stateFor(id='target'){
 return {user:{id:'a'},view:'profile',profileViewId:id,profileTab:'posts',
  profiles:new Map(),feed:[],videos:[],friendRequests:[]};
}
function pendingRead(){
 let finish;
 const sb={from(){const q={select(){return q},eq(){return q},maybeSingle(){return new Promise(r=>{finish=r})}};return q}};
 return {sb,finish(result){assert.ok(finish);finish(result)}};
}
test('late profile lookup cannot populate next account cache',async()=>{
 const state=stateFor(),main={innerHTML:'unchanged'},read=pendingRead(),app=install(state,read.sb,main);
 const request=app.renderProfile(main,'target');
 state.user={id:'b'};app.setEpoch(2);read.finish({data:{id:'target',username:'old'}});
 await request;
 assert.equal(state.profiles.size,0);assert.equal(main.innerHTML,'unchanged');
});
test('late profile lookup cannot paint after navigation to another profile',async()=>{
 const state=stateFor(),main={innerHTML:'unchanged'},read=pendingRead(),app=install(state,read.sb,main);
 const request=app.renderProfile(main,'target');
 state.profileViewId='other';read.finish({data:{id:'target',username:'old'}});
 await request;
 assert.equal(state.profiles.size,0);assert.equal(main.innerHTML,'unchanged');
});
test('delayed avatar cannot paint profile after logout',async()=>{
 const state=stateFor(),main={innerHTML:'unchanged'};
 state.profiles.set('target',{id:'target',username:'old'});
 const sb={from(){const q={select(){return q},eq(){return q},async maybeSingle(){return {data:{}}}};return q}};
 let finishAvatar;
 const app=install(state,sb,main,()=>new Promise(r=>{finishAvatar=r}));
 const request=app.renderProfile(main,'target');
 await Promise.resolve();await Promise.resolve();
 assert.ok(finishAvatar,'Avatar request started');
 state.user=null;app.setEpoch(2);finishAvatar('<avatar>');
 await request;assert.equal(main.innerHTML,'unchanged');
});
test('current profile can render with hydrated extras',async()=>{
 const state=stateFor(),main={innerHTML:'unchanged'};
 state.profiles.set('target',{id:'target',username:'current'});
 const sb={from(){const q={select(){return q},eq(){return q},async maybeSingle(){return {data:{}}}};return q}};
 let calls=0;
 const app=install(state,sb,main,async()=>'<avatar>',async()=>{calls++});
 await app.renderProfile(main,'target');
 assert.ok(main.innerHTML.includes('current'));
 assert.equal(calls,1);
});
