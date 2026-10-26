'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('both message entry points require an accepted friendship',()=>{
 const helper=html.indexOf('function kfAlphaCanDm(peer)');
 assert.ok(helper>0,'shared friendship check exists');
 assert.match(html,/r\.status==='accepted'/);
 assert.match(html,/async function openDm\(peer\)\{if\(!kfAlphaCanDm\(peer\)\)/);
 assert.match(html,/window\.openDm=async function\(peer\)\{if\(!kfAlphaCanDm\(peer\)\)/);
});
test('blocked DM opens display an actionable message',()=>{
 const message='Add this person as a friend before messaging.';
 assert.equal(html.split(message).length-1,2);
});
