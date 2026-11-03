// Recovery442: execute the actual confirmed-session predicate with synthetic fixtures.
// Run: node kinfolk-social/tests/recovery442-confirmed-session.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = html.match(/function kf338ConfirmedSession\(session\)\s*\{[^}]*\}/);
assert.ok(match, 'confirmed-session predicate must exist');
const confirmed = vm.runInNewContext(match[0] + '\n kf338ConfirmedSession;', Object.create(null), {timeout: 1000});
const user = (id, email_confirmed_at) => ({user:{id,email_confirmed_at}});
const cases = [
  ['null session', null, false],
  ['empty session', {}, false],
  ['missing user', {access_token:'synthetic'}, false],
  ['missing id', user('', '2026-11-03T10:00:00Z'), false],
  ['missing confirmation', {user:{id:'synthetic-user'}}, false],
  ['null confirmation', user('synthetic-user', null), false],
  ['empty confirmation', user('synthetic-user', ''), false],
  ['whitespace confirmation', user('synthetic-user', '   '), false],
  ['boolean confirmation', user('synthetic-user', true), false],
  ['confirmed user', user('synthetic-user', '2026-11-03T10:00:00Z'), true],
];
for (const [label, session, expected] of cases) {
  assert.equal(Boolean(confirmed(session)), expected, label);
}
console.log('Recovery442: 10 synthetic confirmed-session behavior cases passed');
