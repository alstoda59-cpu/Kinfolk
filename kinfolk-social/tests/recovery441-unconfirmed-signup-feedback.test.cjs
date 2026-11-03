// Recovery441: source regression for the baseline signup feedback handler.
// Run: node kinfolk-social/tests/recovery441-unconfirmed-signup-feedback.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = source.indexOf('function renderAuth(mode=');
const end = source.indexOf('\nfunction layout()', start);
assert.ok(start >= 0 && end > start, 'baseline renderAuth handler must exist');
const handler = source.slice(start, end);
assert.match(handler, /if\(data\.session&&kf338ConfirmedSession\(data\.session\)\)\{toast\('Account created'\);\}/, 'success toast must require confirmed session');
assert.match(handler, /Check your email to confirm, then log in\./, 'unconfirmed signup must explain confirmation');
assert.doesNotMatch(handler, /if\(data\.session\)\{toast\('Account created'\);\}/, 'session alone is not proof of confirmation');
assert.match(source, /function kf338ConfirmedSession\(/, 'confirmation predicate must remain present');
console.log('Recovery441 source signup confirmation feedback assertions passed');
