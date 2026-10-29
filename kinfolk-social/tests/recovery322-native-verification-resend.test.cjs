'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','kinfolk-phase79.js'),'utf8');
const start=source.indexOf('  function emailRedirect(){');
const end=source.indexOf('  // Recovery221:',start);
assert.ok(start>=0&&end>start,'active Phase79 verification redirect helper exists');
const helper=source.slice(start,end);

function redirect({callback,marker=false,bridge=false,origin='https://localhost',protocol='https:',hostname='localhost'}={}){
  const context={
    URL,
    window:{
      KINFOLK_NATIVE_ALPHA:marker,
      KINFOLK_EMAIL_REDIRECT_URL:callback,
      Capacitor:{isNativePlatform:()=>bridge}
    },
    location:{origin,protocol,hostname}
  };
  return vm.runInNewContext(helper+';emailRedirect()',context);
}

test('packaged native marker blocks verification resend before Capacitor bridge is ready',()=>{
  assert.throws(()=>redirect({marker:true}),/approved HTTPS email verification callback/);
  assert.equal(redirect({marker:true,callback:'https://alpha.example.test/auth/confirm?source=mobile'}),
    'https://alpha.example.test/auth/confirm?source=mobile');
});
test('native Capacitor bridge and iOS custom scheme independently fail closed',()=>{
  assert.throws(()=>redirect({bridge:true}),/approved HTTPS email verification callback/);
  assert.throws(()=>redirect({origin:'capacitor://localhost',protocol:'capacitor:',marker:false}),/approved HTTPS email verification callback/);
});
test('native resend rejects preview, Supabase, local, IP and unsafe callback destinations',()=>{
  for(const callback of [
    'https://preview.vercel.app/confirm','https://preview.vercel.app./confirm',
    'https://vercel.app/confirm','https://alpha.supabase.co/auth',
    'https://localhost/confirm','https://device.local/confirm',
    'https://alpha.localhost/confirm','https://127.0.0.1/confirm',
    'https://192.168.1.22/confirm','https://[::1]/confirm',
    'https://alpha.example.test:8443/confirm',
    'https://alpha.example.test/confirm#access_token=synthetic',
    'https://user:password@alpha.example.test/confirm',
    'http://alpha.example.test/confirm','not a url'
  ]){
    assert.throws(()=>redirect({marker:true,callback}),/approved HTTPS email verification callback/,callback);
  }
});
test('normal web signup retains HTTPS origin and safe optional override',()=>{
  assert.equal(redirect({origin:'https://web.example.test',hostname:'web.example.test'}),'https://web.example.test');
  assert.equal(redirect({origin:'https://web.example.test',hostname:'web.example.test',
    callback:'https://alpha.example.test/confirm'}),'https://alpha.example.test/confirm');
});
test('normal web helper ignores blocked optional callback instead of submitting it',()=>{
  assert.equal(redirect({origin:'https://web.example.test',hostname:'web.example.test',
    callback:'https://preview.vercel.app/confirm'}),null);
});
test('verification resend and signup both call the guarded helper before Supabase',()=>{
  const resend=source.indexOf("sb.auth.resend({type:'signup'");
  const signup=source.indexOf('sb.auth.signUp({');
  assert.ok(resend>0&&signup>0,'both Supabase Auth entry points exist');
  assert.match(source.slice(resend-350,resend),/const redirect=emailRedirect\(\);/);
  assert.match(source.slice(signup-1100,signup),/const redirect=emailRedirect\(\);/);
});
