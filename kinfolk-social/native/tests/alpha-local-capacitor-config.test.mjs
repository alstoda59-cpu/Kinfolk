import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyLocalCapacitorConfig } from '../scripts/verify-local-capacitor-config.mjs';

const safe=()=>({appId:'social.kinfolk.app',webDir:'www',server:{androidScheme:'https'}});
test('accepts the existing locally bundled alpha configuration',()=>assert.equal(verifyLocalCapacitorConfig(safe()),true));
test('rejects remote hosted startup including nonproduction preview URLs',()=>{
  for(const url of ['https://example.vercel.app','https://localhost','http://192.168.1.2:3000','']){
    assert.throws(()=>verifyLocalCapacitorConfig({...safe(),server:{androidScheme:'https',url}}),/server.url/);
  }
});
test('rejects cleartext override and unexpected schemes',()=>{
  assert.throws(()=>verifyLocalCapacitorConfig({...safe(),server:{cleartext:true}}),/Cleartext/);
  assert.throws(()=>verifyLocalCapacitorConfig({...safe(),server:{androidScheme:'http'}}),/HTTPS/);
});
test('rejects invalid package directories and malformed settings',()=>{
  assert.throws(()=>verifyLocalCapacitorConfig({...safe(),webDir:'../web'}),/www/);
  assert.throws(()=>verifyLocalCapacitorConfig({...safe(),server:null,appId:'bad id'}),/appId/);
  assert.throws(()=>verifyLocalCapacitorConfig({...safe(),server:'remote'}),/server settings/);
});

test('rejects navigation and local-origin overrides that bypass server.url checks',()=>{
  for(const override of [
    {hostname:'example.vercel.app'},
    {hostname:'localhost'},
    {allowNavigation:['*']},
    {allowNavigation:['example.com']},
    {iosScheme:'http'},
    {errorPath:'https://example.com/error'},
    {androidScheme:'https',extraFlag:true}
  ]){
    assert.throws(()=>verifyLocalCapacitorConfig({...safe(),server:{androidScheme:'https',...override}}),/Unreviewed Capacitor server setting/);
  }
});
test('rejects inherited or malformed server configuration without weakening reviewed settings',()=>{
  assert.equal(verifyLocalCapacitorConfig({...safe(),server:{}}),true);
  assert.throws(()=>verifyLocalCapacitorConfig({...safe(),server:[]}),/server settings/);
});

test('rejects inherited and accessor-based config overrides without executing getters',()=>{
  const inheritedServer=Object.create({url:'https://example.vercel.app'});
  inheritedServer.androidScheme='https';
  assert.throws(()=>verifyLocalCapacitorConfig({...safe(),server:inheritedServer}),/plain object/);
  const inheritedConfig=Object.create({webDir:'www'});
  inheritedConfig.appId='social.kinfolk.app';
  inheritedConfig.server={androidScheme:'https'};
  assert.throws(()=>verifyLocalCapacitorConfig(inheritedConfig),/plain object/);
  let invoked=0;
  const server={androidScheme:'https'};
  Object.defineProperty(server,'url',{enumerable:false,get(){invoked++;return 'https://example.com';}});
  assert.throws(()=>verifyLocalCapacitorConfig({...safe(),server}),/accessors/);
  const config=safe();
  Object.defineProperty(config,'server',{get(){invoked++;return server;}});
  assert.throws(()=>verifyLocalCapacitorConfig(config),/accessors/);
  assert.equal(invoked,0);
});
