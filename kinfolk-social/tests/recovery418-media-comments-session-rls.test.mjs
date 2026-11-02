import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const a=html.indexOf('// Recovery418: keep media comment loads');
const b=html.indexOf('  // Keep the enhanced media-comment renderer',a);
assert.ok(a>=0&&b>a,'effective Recovery418 handler is present');
const source=html.slice(a,b);
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {resolve,promise}};

function harness({deferRead=false,deferWrite=false,writeResult=null}={}){
  const writes=[],toasts=[],reads=[];
  const state={user:{id:'account-a'},view:'channels',
    profiles:new Map([['author',{display_name:'Synthetic author'}]])};
  const field={value:'  Hello Kinfolk  ',placeholder:'Write a comment…',focus(){}};
  const button={disabled:false};
  const label={classList:{remove(){}},textContent:''};
  let form=null,modalCalls=0;
  const ctx={
    window:null,state,kf129Epoch:1,kf300MessageRequest:0,
    kfAlphaLoadCurrent:(epoch,uid)=>epoch===ctx.kf129Epoch&&uid===state.user?.id,
    document:{querySelector:sel=>sel==='#mediaCommentForm'?form:sel==='#mediaReplyLabel'?label:null},
    modal:()=>{modalCalls++;ctx.kf300MessageRequest++;form={
      isConnected:true,dataset:{},onsubmit:null,
      querySelector:sel=>sel==='[name=body]'?field:sel==='button[type=submit]'?button:null
    }},
    toast:(...args)=>toasts.push(args),
    loadProfiles:async()=>{},
    avatarHtml:async()=>'<avatar>',
    esc:x=>String(x??''),
    sb:{from:name=>{
      assert.equal(name,'media_comments');
      return {
        select:cols=>{
          assert.equal(cols,'*');
          const chain={
            eq:()=>chain,order:()=>chain,
            limit:n=>{
              assert.equal(n,200);
              const d=deferred();reads.push(d);
              return deferRead?d.promise:Promise.resolve({data:[{
                id:'parent-a',target_type:'video',target_id:'video-a',
                parent_id:null,author_id:'author',body:'existing'
              }],error:null});
            }
          };
          return chain;
        },
        insert:(payload,opts)=>{
          const d=deferred(),entry={payload,opts,d};writes.push(entry);
          return {select:cols=>{
            assert.match(cols,/target_type,target_id,parent_id,author_id,body/);
            if(deferWrite)return d.promise;
            if(writeResult)return Promise.resolve(writeResult);
            return Promise.resolve({count:1,error:null,data:[{id:'saved-row',...payload}]});
          }};
        }
      };
    }}
  };
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(source,ctx,{timeout:1000});
  return {
    ctx,state,field,button,toasts,writes,reads,
    get form(){return form},get modalCalls(){return modalCalls},
    open:(type='video',id='video-a')=>ctx.openMediaComments(type,id),
    reply:id=>ctx.setMediaReply(id),
    send:()=>form.onsubmit({preventDefault(){}}),
    switchAccount:(uid='account-b')=>{state.user={id:uid};ctx.kf129Epoch++},
    replaceModal:()=>{ctx.kf300MessageRequest++;form=null}
  };
}

test('video comment save confirms exact row and reopens only current modal',async()=>{
  const h=harness();await h.open();await h.send();
  assert.equal(h.writes.length,1);
  assert.equal(h.writes[0].opts.count,'exact');
  assert.equal(h.writes[0].payload.author_id,'account-a');
  assert.equal(h.writes[0].payload.target_type,'video');
  assert.equal(h.field.value,'');
  assert.equal(h.modalCalls,2);
});

test('photo comments use the same account-bound write path',async()=>{
  const h=harness();await h.open('photo','photo-a');await h.send();
  assert.equal(h.writes[0].payload.target_type,'photo');
  assert.equal(h.writes[0].payload.target_id,'photo-a');
});

test('double submit during pending save sends only one database insert',async()=>{
  const h=harness({deferWrite:true});await h.open();
  const first=h.send(),second=h.send();
  assert.equal(h.writes.length,1);assert.equal(h.button.disabled,true);
  h.writes[0].d.resolve({count:1,error:null,data:[{id:'saved',...h.writes[0].payload}]});
  await Promise.all([first,second]);
  assert.equal(h.modalCalls,2);
});

test('lost response keeps the original composer locked',async()=>{
  const h=harness({writeResult:{error:{message:'lost acknowledgment'}}});await h.open();
  await h.send();await h.send();
  assert.equal(h.writes.length,1);assert.equal(h.button.disabled,true);
  assert.equal(h.form.dataset.kfMediaSending,'1');
  assert.match(h.toasts[0][0],/status is uncertain/);
});

test('verified zero-row insert permits a retry without erasing the draft',async()=>{
  const h=harness({writeResult:{count:0,data:[],error:null}});await h.open();
  await h.send();
  assert.equal(h.button.disabled,false);
  assert.equal(h.form.dataset.kfMediaSending,undefined);
  assert.equal(h.field.value,'  Hello Kinfolk  ');
  await h.send();assert.equal(h.writes.length,2);
});

test('wrong row identity cannot be mistaken for a saved comment',async()=>{
  const h=harness({writeResult:{count:1,error:null,data:[{
    id:'row',target_type:'video',target_id:'other-video',parent_id:null,
    author_id:'account-a',body:'Hello Kinfolk'
  }]}});await h.open();await h.send();
  assert.equal(h.button.disabled,true);assert.equal(h.modalCalls,1);
});

test('a delayed read cannot open after account switch or logout',async()=>{
  const h=harness({deferRead:true}),pending=h.open();
  h.switchAccount();
  h.reads[0].resolve({data:[],error:null});await pending;
  assert.equal(h.modalCalls,0);assert.equal(h.toasts.length,0);
});

test('a delayed read cannot replace a different modal',async()=>{
  const h=harness({deferRead:true}),pending=h.open();
  h.ctx.kf300MessageRequest++;
  h.reads[0].resolve({data:[],error:null});await pending;
  assert.equal(h.modalCalls,0);
});

test('account reauthentication during save cannot reopen or leak a stale comment',async()=>{
  const h=harness({deferWrite:true});await h.open();
  const pending=h.send();h.switchAccount('account-a');
  h.writes[0].d.resolve({count:1,error:null,data:[{id:'saved',...h.writes[0].payload}]});
  await pending;assert.equal(h.modalCalls,1);assert.equal(h.toasts.length,0);
});

test('modal replacement during save suppresses delayed refresh',async()=>{
  const h=harness({deferWrite:true});await h.open();
  const pending=h.send();h.replaceModal();
  h.writes[0].d.resolve({count:1,error:null,data:[{id:'saved',...h.writes[0].payload}]});
  await pending;assert.equal(h.modalCalls,1);
});

test('reply parent must be a visible comment from this modal',async()=>{
  const h=harness();await h.open();
  h.reply('forged-parent');await h.send();
  assert.equal(h.writes[0].payload.parent_id,null);
  const other=harness();await other.open();
  other.reply('parent-a');await other.send();
  assert.equal(other.writes[0].payload.parent_id,'parent-a');
});

test('isolated migration enforces same-target reply integrity and teen/private visibility',()=>{
  const sql=readFileSync(new URL('../migrations/ALPHA_only_media_comments_rls.sql',import.meta.url),'utf8');
  assert.match(sql,/NEVER apply to shared\/live zojajuzmfjpvubzibzgg/);
  assert.match(sql,/foreign key \(parent_id,target_type,target_id\)/);
  assert.match(sql,/references public\.media_comments\(id,target_type,target_id\)/);
  assert.match(sql,/alter table public\.media_comments enable row level security/);
  assert.match(sql,/revoke all on public\.media_comments from public,anon,authenticated/);
  assert.match(sql,/p\.is_private=false/g);
  assert.match(sql,/kinfolk_alpha_private\.not_blocked/g);
  assert.match(sql,/security definer set search_path = ''/g);
  assert.match(sql,/author_id=\(select auth\.uid\(\)\)/);
  assert.doesNotMatch(sql,/grant\s+[^;]+\s+to anon\s*;/i);
});
