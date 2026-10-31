import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the effective Phase106 viewer with synthetic rows and signed URLs.
// These are not real Supabase JWT, RLS, browser, or physical-device tests.
const source=readFileSync(new URL('../kinfolk-phase106.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=source.indexOf('let albumViewRequest=0;');
const end=source.indexOf('function bind(form,handler)',start);
assert.ok(start>=0&&end>start,'effective album viewer must be extracted');
const implementation=source.slice(start,end);
const deferred=()=>{
  let resolve;
  const promise=new Promise(r=>{resolve=r});
  return {promise,resolve};
};
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function harness(options={}){
  const id='synthetic-album',owner='synthetic-A';
  const photo={id:'synthetic-photo',album_id:id,owner_id:owner,storage_path:owner+'/albums/'+id+'/photo.png'};
  const album={id,owner_id:options.foreignOwner?'synthetic-B':owner,title:'My album',description:'Private photos',visibility:'private'};
  const state={user:{id:owner}};
  const calls=[],notices=[];
  const readGate=options.delayRead?deferred():null;
  const urlGate=options.delayUrl?deferred():null;
  let root=null,add=null;
  const node=()=>({
    children:[],isConnected:true,
    appendChild(child){this.children.push(child)},
    append(...children){this.children.push(...children)}
  });
  const document={
    createElement:()=>node(),
    getElementById:name=>name==='albumPhotoGrid'?root:name==='albumAddPhotosAction'?add:null
  };
  const ctx={
    state,document,URL,kf129Epoch:1,kf300MessageRequest:0,
    esc:value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;'),
    tell:message=>notices.push(message),
    modal:(title,html)=>{
      calls.push({type:'modal',title,html});
      ctx.kf300MessageRequest++;
      root=node();add=node();
    },
    sb:{from:table=>({
      select:()=>({eq:()=>({
        single:()=>table==='photo_albums'
          ?(readGate?readGate.promise:Promise.resolve({data:album,error:null}))
          :Promise.reject(new Error('unexpected single')),
        order:()=>table==='album_photos'
          ?Promise.resolve({data:options.photos??[photo],error:null})
          :Promise.reject(new Error('unexpected order'))
      })})
    })},
    signed:async(bucket,path)=>{
      calls.push({type:'signed',bucket,path});
      return urlGate?urlGate.promise:(options.url??'https://alpha.invalid/signed-photo.png');
    },
    window:{
      open:(...args)=>calls.push({type:'open',args}),
      openMediaComments:(...args)=>calls.push({type:'comments',args}),
      addPhotosToAlbum:id=>calls.push({type:'add',id})
    }
  };
  const run=vm.runInNewContext(implementation+';guardedViewAlbum',ctx,{timeout:2000});
  return {
    run:()=>run(id),calls,notices,state,ctx,readGate,urlGate,
    get root(){return root},
    get add(){return add},
    replaceModal(){ctx.kf300MessageRequest++;if(root)root.isConnected=false}
  };
}
const count=(h,type)=>h.calls.filter(c=>c.type===type).length;

test('effective viewer renders owned photo and preserves comment/add actions',async()=>{
  const h=harness();
  await h.run();
  assert.equal(count(h,'modal'),1);
  assert.equal(count(h,'signed'),1);
  assert.equal(h.root.children.length,1);
  const wrap=h.root.children[0];
  assert.equal(wrap.children[0].children[0].src,'https://alpha.invalid/signed-photo.png');
  wrap.children[0].onclick();
  wrap.children[1].onclick();
  h.add.onclick();
  assert.equal(count(h,'open'),1);
  assert.equal(count(h,'comments'),1);
  assert.equal(count(h,'add'),1);
  assert.equal(h.calls.find(c=>c.type==='open').args[2],'noopener,noreferrer');
});
test('account switch during album fetch cannot open an old account modal',async()=>{
  const h=harness({delayRead:true});
  const pending=h.run();
  h.state.user.id='synthetic-B';
  h.readGate.resolve({data:{id:'synthetic-album',owner_id:'synthetic-A',title:'Private'},error:null});
  await pending;
  assert.equal(count(h,'modal'),0);
  assert.equal(count(h,'signed'),0);
});
test('same-user reactivation while signing prevents stale private media rendering',async()=>{
  const h=harness({delayUrl:true});
  const pending=h.run();
  await tick();
  assert.equal(count(h,'signed'),1);
  h.ctx.kf129Epoch++;
  h.urlGate.resolve('https://alpha.invalid/old-session.png');
  await pending;
  assert.equal(h.root.children.length,0);
});
test('account switch while signing cannot display or open old private media',async()=>{
  const h=harness({delayUrl:true});
  const pending=h.run();
  await tick();
  h.state.user.id='synthetic-B';
  h.urlGate.resolve('https://alpha.invalid/old-account.png');
  await pending;
  assert.equal(h.root.children.length,0);
});
test('replaced modal cannot receive late signed album photos',async()=>{
  const h=harness({delayUrl:true});
  const pending=h.run();
  await tick();
  h.replaceModal();
  h.urlGate.resolve('https://alpha.invalid/late-photo.png');
  await pending;
  assert.equal(h.root.children.length,0);
});
test('mismatched photo rows never request signed URLs',async()=>{
  const h=harness({photos:[{id:'other',album_id:'foreign-album',owner_id:'synthetic-B',storage_path:'foreign'}]});
  await h.run();
  assert.equal(count(h,'signed'),0);
  assert.equal(h.root.children.length,0);
  assert.equal(h.root.textContent,'No photos yet.');
});
test('unsafe signed URL schemes are never rendered or opened',async()=>{
  const h=harness({url:'javascript:alert(1)'});
  await h.run();
  assert.equal(h.root.children.length,0);
  assert.equal(count(h,'open'),0);
});
test('foreign album viewer does not get an Add photos control',async()=>{
  const h=harness({foreignOwner:true,photos:[]});
  await h.run();
  assert.doesNotMatch(h.calls.find(c=>c.type==='modal').html,/albumAddPhotosAction/);
});
test('new album UI and effective submit fallback are private by default',()=>{
  assert.match(index,/<select class="field" id="albumVisibility"><option value="private" selected>Private<\/option><option value="public">Public<\/option>/);
  assert.match(source,/const visibility=f\.querySelector\('#albumVisibility'\)\?\.value==='public'\?'public':'private'/);
  assert.match(source,/window\.viewAlbum=guardedViewAlbum/);
});
