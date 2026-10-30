import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-phase81.js'),'utf8');
const between=(a,b)=>{
  const start=source.indexOf(a),end=source.indexOf(b,start);
  assert.ok(start>=0&&end>start,'effective profile music source exists: '+a);
  return source.slice(start,end);
};
const helpers=between('  const safeMusicUrl=raw=>','  const style=')+
  between('  function ytId(u){','  function stopMusic(){');
const {safeMusicUrl,ytId,directAudio}=vm.runInNewContext(helpers+';({safeMusicUrl,ytId,directAudio})',{URL},{timeout:1000});
const ensureCode=between('  async function ensureMusic(force=false){','  window.kf81MountAppearance');
const A='11111111-1111-4111-8111-111111111111';
const mp3='https://cdn.example.test/music.mp3';
const link='https://music.example.test/artist/track';
const youtube='https://www.youtube.com/watch?v=abcdefghijk';

function deferred(){
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
  return {promise,resolve,reject};
}
function harness(){
  const hero={},timers=[],reads=[],controls=[],audio=[];
  const ctx={
    state:{user:{id:A},view:'profile',profileViewId:A},
    kf129Epoch:5,
    document:{
      querySelector:selector=>selector==='.profileHero'?hero:null,
      getElementById:id=>id==='kf81-profile-player'?ctx.player?.ctl:null
    },
    safeMusicUrl,musicUrlFor:()=>{const d=deferred();reads.push(d);return d.promise},
    ytId,directAudio,
    musicKey:'',player:null,ensureBusy:false,ensureAgain:false,pausedKey:'',musicSessionEpoch:null,
    stopMusic:()=>{if(ctx.player?.audio)ctx.player.audio.pause();ctx.player=null;ctx.musicKey='';ctx.musicSessionEpoch=null},
    attachControl:()=>{
      const ctl={btn:{textContent:''},status:{textContent:''}};
      controls.push(ctl);return ctl;
    },
    $q:(selector,ctl)=>selector==='.kf81Play'?ctl.btn:ctl.status,
    window:{open:()=>{throw new Error('unexpected navigation')}},
    setTimeout:fn=>{timers.push(fn);return timers.length},
    Audio:function(url){
      const d=deferred();
      const a={url,paused:true,play:()=>d.promise,pauseCalls:0,
        pause(){this.paused=true;this.pauseCalls++},setAttribute(){}};
      audio.push({a,d});return a;
    }
  };
  const ensure=vm.runInNewContext(ensureCode+';ensureMusic',ctx,{timeout:1000});
  return {ctx,ensure,reads,timers,controls,audio};
}

test('stored non-HTTPS, credential-bearing and malformed links are never playable',()=>{
  for(const value of ['javascript:alert(1)','data:audio/mp3;base64,AAAA','http://example.test/a.mp3',
    'https://user:pass@example.test/a.mp3','https://','//example.test/a.mp3','file:///a.mp3']){
    assert.equal(safeMusicUrl(value),'',value);
  }
  assert.equal(safeMusicUrl(mp3),mp3);
});
test('lookalike YouTube domains cannot become embedded players',()=>{
  for(const host of ['evil-youtube.com','youtube.com.evil.test','notyoutu.be','youtube.example.test']){
    assert.equal(ytId('https://'+host+'/watch?v=abcdefghijk'),'');
  }
  assert.equal(ytId(youtube),'abcdefghijk');
  assert.equal(ytId('https://youtu.be/abcdefghijk'),'abcdefghijk');
  assert.equal(ytId('https://m.youtube.com/shorts/abcdefghijk'),'abcdefghijk');
  assert.equal(ytId('https://youtube.com/watch?v=short'),'');
});
test('direct audio requires HTTPS and a real audio file path',()=>{
  assert.equal(directAudio(mp3),true);
  assert.equal(directAudio('https://cdn.example.test/music.M4A?token=abc'),true);
  assert.equal(directAudio('http://cdn.example.test/music.mp3'),false);
  assert.equal(directAudio('https://cdn.example.test/stream?file=music.mp3'),false);
});
test('persisted unsafe profile URL is ignored before creating controls',async()=>{
  const h=harness(),pending=h.ensure();
  h.reads[0].resolve('javascript:alert(1)');
  await pending;
  assert.equal(h.controls.length,0);
  assert.equal(h.ctx.player,null);
});
test('same-user relogin during a pending music lookup cannot mount the old player',async()=>{
  const h=harness(),pending=h.ensure();
  h.ctx.kf129Epoch++;
  h.reads[0].resolve(link);
  await pending;
  assert.equal(h.controls.length,0);
  assert.equal(h.ctx.player,null);
});
test('a newer playback request is retried after an older pending lookup finishes',async()=>{
  const h=harness(),old=h.ensure();
  await h.ensure();
  h.ctx.kf129Epoch++;
  h.reads[0].resolve(link);
  await old;
  assert.equal(h.controls.length,0);
  assert.equal(h.timers.length,1);
  const newer=h.timers.shift()();
  assert.equal(h.reads.length,2);
  h.reads[1].resolve(link);
  await newer;
  assert.equal(h.controls.length,1);
  assert.equal(h.ctx.musicSessionEpoch,6);
  assert.equal(h.ctx.player.type,'link');
});
test('a player from the previous activation is torn down even for identical URL',async()=>{
  const h=harness(),first=h.ensure();
  h.reads[0].resolve(link);await first;
  assert.equal(h.controls.length,1);
  h.ctx.kf129Epoch++;
  const next=h.ensure();
  h.reads[1].resolve(link);await next;
  assert.equal(h.controls.length,2);
  assert.equal(h.ctx.musicSessionEpoch,6);
});
test('late audio.play completion cannot resume after leaving the profile',async()=>{
  const h=harness(),pending=h.ensure();
  h.reads[0].resolve(mp3);
  for(let i=0;i<10&&h.audio.length===0;i++)await Promise.resolve();
  assert.equal(h.audio.length,1);
  h.ctx.state.view='home';
  h.ctx.stopMusic();
  h.audio[0].d.resolve();
  await pending;
  assert.ok(h.audio[0].a.pauseCalls>=2,'late play must be paused after navigation');
  assert.equal(h.ctx.player,null);
  assert.notEqual(h.controls[0].status.textContent,'Playing');
});
