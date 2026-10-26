'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('kinfolk-social/kinfolk-phase76.js', 'utf8');
const helperStart = source.indexOf('function kfsIsTeen(');
const settingsStart = source.indexOf('window.openKinfolkSettings=async function(){if(!state.user)return;const settingsAccountId=', helperStart);
const settingsEnd = source.indexOf("let cache='';", settingsStart);
assert.ok(helperStart >= 0 && settingsStart > helperStart && settingsEnd > settingsStart,
  'Recovery228 settings and age guard must be present');
const helper = vm.runInNewContext(source.slice(helperStart, settingsStart) + '\nkfsIsTeen');
const settings = source.slice(settingsStart, settingsEnd);

test('signup birthdate keeps ages 13–17 private and handles birthdays correctly', () => {
  const now = new Date(2026, 9, 26, 12);
  for (const [date, expected] of [
    ['2013-10-26', true], ['2009-10-27', true],
    ['2008-10-26', false], ['2013-10-27', false],
    ['2013-02-30', false], ['2010-10-26', true],
    ['2009-10-26', true], ['invalid', false], ['', false]
  ]) {
    assert.equal(helper(date, now), expected, date);
  }
});

test('settings do not render stale account data after asynchronous fetch', () => {
  assert.match(settings, /const settingsAccountId=state\.user\.id/);
  assert.match(settings, /if\(state\.user\?\.id!==settingsAccountId\)return;closeKinfolkSettings/);
});

test('teen settings lock private toggle and force private on save', () => {
  assert.match(settings, /if\(isTeen\)\{const privacy=\$\('#kfsPrivate'\)/);
  assert.match(settings, /privacy\.checked=true;privacy\.disabled=true/);
  assert.match(settings, /if\(isTeen\)\$\('#kfsPrivate'\)\.checked=true/);
});

test('settings save writes are pinned to the account that opened the screen', () => {
  assert.match(settings, /Account changed\. Reopen Settings before saving/);
  const start = settings.indexOf('const [a,b,c1,d,e1,f]=await Promise.all(');
  const end = settings.indexOf(']);if(state.user?.id!==settingsAccountId)return;', start);
  assert.ok(start >= 0 && end > start, 'guarded writes and post-save identity check');
  const writes = settings.slice(start, end);
  assert.equal((writes.match(/settingsAccountId/g) || []).length, 6);
  assert.doesNotMatch(writes, /state\.user\.id/);
});

test('all settings message audience options use the live database enum', () => {
  assert.doesNotMatch(source, /value="none" \$\{us\?\.allow_messages==='none'/);
  assert.match(settings, /value="nobody">No one/);
});
