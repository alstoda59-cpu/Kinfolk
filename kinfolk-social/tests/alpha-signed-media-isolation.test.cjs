'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function region(begin,end){
 const a=html.indexOf(begin),b=html.indexOf(end,a+1);
 assert.ok(a>=0&&b>a,'Missing source section '+begin);
 return html.slice(a,b);
}
const guard=region('function kfAlphaLoadCurrent(','async function loadProfiles(');
const signedCode=region('async function signed(','async function avatarHtml(');
const homeCode=region('async function renderHome(','async function renderFeed(');
const feedCode=region('async function renderFeed(','function linkify(');
function signedHarness(state,sb){
 return new Function('state','sb','let kf129Epoch=1;'+guard+signedCode+
  ';return {signed,setEpoch(n){kf129Epoch=n}};')(state,sb);
}
function deferredStorage(){
 let resolve;
 const sb={storage:{from(){return {createSignedUrl(){return new Promise(r=>{resolve=r})}}}}};
 return {sb,finish(result){assert.ok(resolve,'Expected signed URL request');resolve(result)}};
}
test('delayed signed media URL cannot enter another account cache',async()=>{
 const state={user:{id:'a'},signed:new Map()},storage=deferredStorage(),app=signedHarness(state,storage.sb);
 const request=app.signed('kinfolk-media','a/posts/photo.jpg');
 state.user={id:'b'};state.signed.clear();app.setEpoch(2);
 storage.finish({data:{signedUrl:'https://example.test/old'},error:null});
 assert.equal(await request,null);assert.equal(state.signed.size,0);
});
test('signed media request from a previous login is discarded even for same user',async()=>{
 const state={user:{id:'a'},signed:new Map()},storage=deferredStorage(),app=signedHarness(state,storage.sb);
 const request=app.signed('kinfolk-media','a/posts/photo.jpg');
 app.setEpoch(2);storage.finish({data:{signedUrl:'https://example.test/old'},error:null});
 assert.equal(await request,null);assert.equal(state.signed.size,0);
});
test('current account signed URL is cached and reused',async()=>{
 let calls=0;
 const state={user:{id:'a'},signed:new Map()};
 const sb={storage:{from(){return {async createSignedUrl(){calls++;return {data:{signedUrl:'https://example.test/current'},error:null}}}}}};
 const app=signedHarness(state,sb);
 assert.equal(await app.signed('kinfolk-media','a/posts/photo.jpg'),'https://example.test/current');
 assert.equal(await app.signed('kinfolk-media','a/posts/photo.jpg'),'https://example.test/current');
 assert.equal(calls,1);
});
test('delayed Home avatar cannot paint an account switched during rendering',async()=>{
 const state={user:{id:'a'},view:'home',stories:[],profile:{},profiles:new Map()};
 const main={innerHTML:'unchanged'};let finish,feedCalls=0;
 const avatarHtml=()=>new Promise(resolve=>{finish=resolve});
 const renderFeed=async()=>{feedCalls++};
 const app=new Function('state','avatarHtml','esc','$','signed','renderFeed',
  'let kf129Epoch=1;'+guard+homeCode+';return {renderHome,setEpoch(n){kf129Epoch=n}};')(
  state,avatarHtml,x=>x,()=>main,async()=>null,renderFeed);
 const request=app.renderHome(main);state.user={id:'b'};app.setEpoch(2);
 finish('<avatar>');await request;
 assert.equal(main.innerHTML,'unchanged');assert.equal(feedCalls,0);
});
test('Home render stops after navigating away while media loads',async()=>{
 const state={user:{id:'a'},view:'home',stories:[],profile:{},profiles:new Map()};
 const main={innerHTML:'unchanged'};let finish,feedCalls=0;
 const avatarHtml=()=>new Promise(resolve=>{finish=resolve});
 const app=new Function('state','avatarHtml','esc','$','signed','renderFeed',
  'let kf129Epoch=1;'+guard+homeCode+';return {renderHome};')(
  state,avatarHtml,x=>x,()=>main,async()=>null,async()=>{feedCalls++});
 const request=app.renderHome(main);state.view='profile';finish('<avatar>');await request;
 assert.equal(main.innerHTML,'unchanged');assert.equal(feedCalls,0);
});
test('delayed feed avatar cannot render posts after logout',async()=>{
 const state={user:{id:'a'},profiles:new Map([['a',{id:'a',username:'alice'}]]),
  likes:new Map(),comments:new Map()};
 const root={innerHTML:'unchanged'};let finish;
 const avatarHtml=()=>new Promise(resolve=>{finish=resolve});
 const app=new Function('state','avatarHtml','signed','esc','fmt','linkify','commentsHtml',
  'let kf129Epoch=1;'+guard+feedCode+';return {renderFeed,setEpoch(n){kf129Epoch=n}};')(
  state,avatarHtml,async()=>null,x=>x,()=>'',x=>x,async()=>'<form></form>');
 const request=app.renderFeed(root,[{id:'p',author_id:'a',body:'hello'}]);
 state.user=null;app.setEpoch(2);finish('<avatar>');await request;
 assert.equal(root.innerHTML,'unchanged');
});
