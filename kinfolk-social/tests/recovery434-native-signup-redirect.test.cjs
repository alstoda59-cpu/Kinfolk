'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('kinfolk-social/index.html','utf8');
const start=source.indexOf('function kfAlphaSignupRedirectOptions(');
const end=source.indexOf('function renderAuth(',start);
assert.ok(start>=0&&end>start,'native-safe signup redirect helper must exist');
const options=vm.runInNewContext(source.slice(start,end)+'\nkfAlphaSignupRedirectOptions');
const redirect=o=>Object.assign({},options(o));
test('web HTTPS signup preserves same-origin confirmation redirect',()=>{
 assert.deepEqual(redirect('https://alpha.example.test'),{emailRedirectTo:'https://alpha.example.test'});
});
test('local web preview uses HTTP redirect',()=>{
 assert.deepEqual(redirect('http://localhost:3000'),{emailRedirectTo:'http://localhost:3000'});
});
test('Capacitor, file and opaque native origins do not become invalid email redirect URLs',()=>{
 for(const origin of ['capacitor://localhost','ionic://localhost','file://','null','']){
  assert.deepEqual(redirect(origin),{},origin);
 }
});
test('signup uses native-safe options without losing user metadata',()=>{
 assert.match(source,/options:\{\.\.\.kfAlphaSignupRedirectOptions\(location\.origin\),data:\{username,display_name\}\}/);
});
