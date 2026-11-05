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
