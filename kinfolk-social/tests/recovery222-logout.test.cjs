const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('kinfolk-social/index.html','utf8');
const start=html.indexOf('let kf222LogoutBusy=');
const end=html.indexOf('\n}',start)+2;
const code=html.slice(start,end);
function fixture({signoutError=false,throwSignout=false,stillActive=false,defer=false,sessionError=false}={}){
 const state={user:{id:'alpha'}};let session={user:{id:'alpha'}},release;
 const calls={signouts:[],clears:0,toasts:[]};
 const sb={auth:{getSession:async()=>({data:{session},error:sessionError?Error('unavailable'):null}),
 signOut:async options=>{calls.signouts.push(options);if(defer)await new Promise(r=>release=r);if(throwSignout)throw Error('network');if(signoutError)return {error:Error('refused')};if(!stillActive)session=null;return {error:null}}}};
 const context={state,sb,toast:m=>calls.toasts.push(m),kf129ActivateSession:async()=>{calls.clears++;state.user=null}};
 vm.createContext(context);vm.runInContext(code,context);
 return {state,calls,logout:()=>context.logout(),release:()=>release(),setSession:s=>session=s};
}
test('successful logout uses local scope and confirmed cleanup',async()=>{
 const f=fixture();assert.equal(await f.logout(),true);assert.equal(f.calls.signouts[0].scope,'local');assert.equal(f.calls.clears,1);assert.equal(f.state.user,null);
});
test('SDK errors, network failures and retained session do not fake success',async()=>{
 for(const opts of [{signoutError:true},{throwSignout:true},{stillActive:true},{sessionError:true}]){
  const f=fixture(opts);assert.equal(await f.logout(),false);assert.equal(f.calls.clears,0);assert.equal(f.state.user.id,'alpha');assert.equal(f.calls.toasts.length,1);
 }
});
test('duplicate clicks share one pending sign-out and permit retry afterward',async()=>{
 const f=fixture({defer:true});const first=f.logout();await Promise.resolve();assert.equal(await f.logout(),false);assert.equal(f.calls.signouts.length,1);f.release();assert.equal(await first,true);
 assert.equal(await f.logout(),true);assert.equal(f.calls.signouts.length,1);
});
test('mismatched SDK account is not signed out',async()=>{
 const f=fixture();f.setSession({user:{id:'beta'}});assert.equal(await f.logout(),false);assert.equal(f.calls.signouts.length,0);assert.equal(f.calls.clears,0);
});
test('late logout completion cannot clear a newly signed-in account',async()=>{
 const f=fixture({defer:true,stillActive:true});const task=f.logout();for(let i=0;i<20&&!f.calls.signouts.length;i++)await Promise.resolve();assert.equal(f.calls.signouts.length,1);f.state.user={id:'beta'};f.setSession({user:{id:'beta'}});f.release();assert.equal(await task,false);assert.equal(f.calls.clears,0);assert.equal(f.state.user.id,'beta');
});
test('missing SDK session still cleans stale application state',async()=>{
 const f=fixture();f.setSession(null);assert.equal(await f.logout(),true);assert.equal(f.calls.signouts.length,0);assert.equal(f.calls.clears,1);
});
test('signed-out transition stops media, resets private caches and one-tab marker',async()=>{
 const code=html.slice(html.indexOf('let kf129Epoch='),html.indexOf('// Recovery149:'));
 const state={user:{id:'alpha'},profile:{id:'alpha'},extras:{},view:'profile',profileViewId:'alpha',channelViewId:'private',profileTab:'albums',channelTab:'posts'};
 for(const key of ['feed','videos','stories','notifications','channels','friendRequests'])state[key]=[{private:true}];
 for(const key of ['profiles','signed','likes','comments','subscriptions'])state[key]=new Map([['private',{}]]);
 let reels=0,music=0,rendered=0,removed;
 const context={state,window:{kf159StopReels(){reels++},kf81StopProfileMusic(){music++}},document:{getElementById(){return null},body:{style:{}}},sessionStorage:{removeItem:k=>removed=k},renderAuth:()=>rendered++};
 vm.createContext(context);vm.runInContext(code,context);await context.kf129ActivateSession(null);
 for(const key of ['feed','videos','stories','notifications','channels','friendRequests'])assert.equal(state[key].length,0,key);
 for(const key of ['profiles','signed','likes','comments','subscriptions'])assert.equal(state[key].size,0,key);
 assert.equal(reels,1);assert.equal(music,1);assert.equal(rendered,1);assert.equal(removed,'kinfolk_session_tab');assert.equal(state.view,'home');assert.equal(state.profileViewId,null);
});
