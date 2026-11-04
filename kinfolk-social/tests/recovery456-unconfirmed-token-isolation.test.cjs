'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('async function kf338RejectUnconfirmedSession(');
const end = html.indexOf('\nasync function kf129ActivateSession(', start);
assert(start >= 0 && end > start, 'effective rejected-session handler must exist');
const source = html.slice(start, end);
async function check(name, rejected, active, shouldSignOut) {
  let calls = 0, cleared = 0;
  const ctx = {
    sb: {auth: {
      getSession: async () => ({data: {session: active}, error: null}),
      signOut: async ({scope}) => {assert.equal(scope, 'local'); calls++; return {error:null};}
    }},
    kf129ActivateSession: async value => {assert.equal(value,null); cleared++;},
    kf338ConfirmedSession: s => !!(s?.access_token && s?.user?.email_confirmed_at),
    console
  };
  vm.runInNewContext(source + '\nthis.runCleanup = kf338RejectUnconfirmedSession;', ctx);
  await ctx.runCleanup(rejected);
  assert.equal(cleared, 1, name + ': clear private UI');
  assert.equal(calls, shouldSignOut ? 1 : 0, name + ': local signout');
}
(async () => {
  const rejected = {user:{id:'member'},access_token:'old'};
  await check('same rejected session',rejected,{user:{id:'member'},access_token:'old'},true);
  await check('new same-member token',rejected,{user:{id:'member'},access_token:'new'},false);
  await check('different member',rejected,{user:{id:'other'},access_token:'old'},false);
  await check('confirmed replacement',rejected,{user:{id:'member',email_confirmed_at:'2026-11-04'},access_token:'old'},false);
  await check('no active session',rejected,null,false);
  await check('missing rejected token',{user:{id:'member'}},{user:{id:'member'},access_token:'new'},false);
  console.log('Recovery456: 6 synthetic cleanup scenarios passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
