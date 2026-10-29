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
 assert.match(html,/async function openDm\(peer\)\{[\s\S]{0,350}if\(!kfAlphaCanDm\(peer\)\)/);
 assert.match(html,/window\.openDm=async function\(peer\)\{if\(!kfAlphaCanDm\(peer\)\)/);
});
test('blocked DM opens display an actionable message',()=>{
 const message='Add this person as a friend before messaging.';
 assert.equal(html.split(message).length-1,2);
});

test('friend-only DM gate handles both directions and denies pending, strangers and logged-out users',()=>{
 const start=html.indexOf('function kfAlphaCanDm(peer)');
 const end=html.indexOf('async function sendFriend(id)',start);
 assert.ok(start>=0&&end>start);
 const canDm=new Function('state','peer',html.slice(start,end)+'return kfAlphaCanDm(peer)');
 const self='00000000-0000-0000-0000-000000000001';
 const peer='00000000-0000-0000-0000-000000000002';
 const other='00000000-0000-0000-0000-000000000003';
 const relationship=(sender_id,receiver_id,status)=>({sender_id,receiver_id,status});
 assert.equal(canDm({user:{id:self},friendRequests:[relationship(self,peer,'accepted')]},peer),true);
 assert.equal(canDm({user:{id:self},friendRequests:[relationship(peer,self,'accepted')]},peer),true);
 assert.equal(canDm({user:{id:self},friendRequests:[relationship(self,peer,'pending')]},peer),false);
 assert.equal(canDm({user:{id:self},friendRequests:[relationship(peer,self,'declined')]},peer),false);
 assert.equal(canDm({user:{id:self},friendRequests:[relationship(self,other,'accepted')]},peer),false);
 assert.equal(canDm({user:{id:self},friendRequests:[]},self),false);
 assert.equal(canDm({user:null,friendRequests:[]},peer),false);
});

test('disappearing-message UI does not claim server deletion',()=>{
 assert.ok(html.includes('Hidden 30 seconds after read (alpha)'));
 assert.ok(!html.includes('Disappears 30 seconds after read'));
});
