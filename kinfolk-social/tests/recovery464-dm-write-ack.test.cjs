'use strict';
// Recovery464 source contract: synthetic, no live Supabase access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = source.indexOf('async function openDm(peer){');
const end = source.indexOf('function openAlbumModal()', start);
assert.ok(start >= 0 && end > start, 'DM handler must exist');
const dm = source.slice(start, end);
assert.match(dm, /kf300MessageCurrent\(epoch,uid,openedRequest\)/, 'account and request guard');
assert.match(dm, /if\(button\?\.disabled\)return/, 'duplicate tap guard');
assert.match(dm, /insert\(\{sender_id:uid,receiver_id:peer,body\},\{count:'exact'\}\)/, 'exact insert count');
assert.match(dm, /count!==1\|\|!sent\?\.id/, 'reject uncertain insert');
assert.match(dm, /sent\.sender_id!==uid\|\|sent\.receiver_id!==peer\|\|sent\.body!==body/, 'verify saved message ownership');
assert.match(dm, /if\(confirmed&&kf300MessageCurrent\(epoch,uid,openedRequest\)&&button\)button\.disabled=false/, 'only unlock after confirmation');
console.log('Recovery464 DM source-contract checks passed (synthetic; not backend E2E)');
