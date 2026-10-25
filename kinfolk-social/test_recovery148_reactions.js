/* Offline Node regression for the REAL Recovery148 post reaction functions.
 * No network, credentials, browser, or shared Supabase state.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'kinfolk-phase76.js'), 'utf8');
const start = source.indexOf('async function fetchData(pid,force=false)');
const end = source.indexOf('async function sendComment(', start);
assert.ok(start >= 0 && end > start, 'reaction functions must be present');
const functions = source.slice(start, end);
assert.match(source, /\.kf58Bar\{display:flex;flex-wrap:wrap;/, 'mobile reaction row wraps');
assert.match(source, /data-like type="button" aria-pressed="\$\{liked\}"/, 'like accessible pressed state');
assert.match(source, /data-dislike type="button" aria-pressed="\$\{disliked\}"/, 'dislike accessible pressed state');

function setup({missing=false, dislikeError=null, likes=[], dislikes=[]}={}) {
  const rows = {
    post_likes: likes.map(user_id=>({post_id:'post1',user_id})),
    post_dislikes: dislikes.map(user_id=>({post_id:'post1',user_id})),
    comments: []
  };
  const writes=[], messages=[];
  const sb = {from(table) {
    assert.ok(Object.hasOwn(rows,table), 'unexpected table '+table);
    const q = {
      mode:'select', filters:[], value:null,
      select(){this.mode='select';return this},
      delete(){this.mode='delete';return this},
      insert(value){this.mode='insert';this.value=value;return this},
      eq(key,value){this.filters.push([key,value]);return this},
      order(){return this},
      then(resolve,reject) {
        const run=()=>{
          if(table==='post_dislikes' && (missing||dislikeError)) {
            return {data:null,error:dislikeError||{code:'PGRST205',message:'table missing'}};
          }
          const match=row=>this.filters.every(([k,v])=>row[k]===v);
          if(this.mode==='select') return {data:rows[table].filter(match).map(x=>({...x})),error:null};
          writes.push({table,mode:this.mode});
          if(this.mode==='delete') rows[table]=rows[table].filter(row=>!match(row));
          else rows[table].push({...this.value});
          return {data:null,error:null};
        };
        return Promise.resolve().then(run).then(resolve,reject);
      }
    };
    return q;
  }};
  const sandbox={sb,cache:new Map(),state:{user:{id:'user1'}},toast:(m)=>messages.push(m),renderOne:async()=>{},console};
  const {fetchData,toggleReaction}=vm.runInNewContext(functions+';({fetchData,toggleReaction})',sandbox);
  return {rows,writes,messages,fetchData,toggleReaction};
}
(async()=>{
  const missing=setup({missing:true});
  let data=await missing.fetchData('post1',true);
  assert.equal(data.dislikesReady,false);
  assert.equal(data.likes.length,0);
  await missing.toggleReaction('post1',{disabled:false},'like');
  assert.equal(missing.rows.post_likes.length,1,'like must work before dislike table exists');
  assert.equal(missing.writes.some(x=>x.table==='post_dislikes'),false);
  await missing.toggleReaction('post1',{disabled:false},'like');
  assert.equal(missing.rows.post_likes.length,0,'second like removes reaction');
  await missing.toggleReaction('post1',{disabled:false},'dislike');
  assert.equal(missing.rows.post_dislikes.length,0,'unavailable dislike must not write');
  assert.equal(missing.messages.length,1,'unavailable dislike explains limitation');

  const ready=setup({likes:['user1']});
  await ready.toggleReaction('post1',{disabled:false},'dislike');
  assert.equal(ready.rows.post_likes.length,0,'dislike clears previous like');
  assert.equal(ready.rows.post_dislikes.length,1);
  await ready.toggleReaction('post1',{disabled:false},'like');
  assert.equal(ready.rows.post_dislikes.length,0,'like clears previous dislike');
  assert.equal(ready.rows.post_likes.length,1);
  assert.equal(ready.messages.length,0);

  const denied=setup({dislikeError:{code:'42501',message:'permission denied'}});
  await assert.rejects(()=>denied.fetchData('post1',true));
  assert.equal(denied.writes.length,0,'unexpected database errors must not be silently ignored');
  console.log('PASS: missing dislikes table preserves likes, reaction toggle, mutual switch, mobile wrapping, accessible state and permission errors');
})().catch(e=>{console.error(e);process.exitCode=1});
