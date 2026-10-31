import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const packageUrl = new URL('../package.json', import.meta.url);
const nativeRoot = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(packageUrl, 'utf8'));
const suites = Object.entries(pkg.scripts).filter(([name]) => /^alpha:.*:source:test$/.test(name));

function sourcePaths(command) {
  const tokens = command.trim().split(/\s+/);
  assert.deepEqual(tokens.slice(0, 2), ['node', '--test'], 'source suite must invoke node --test');
  assert.ok(tokens.length > 2, 'source suite cannot be empty');
  for (const token of tokens.slice(2)) {
    assert.match(token, /^(?:\.\.\/tests\/[\w.-]+|tests\/alpha-[\w.-]+)\.(?:cjs|mjs)$/, 'unexpected source test argument');
  }
  return tokens.slice(2);
}

test('all native source regression suites point to existing repository files', async () => {
  assert.ok(suites.length >= 10, 'expected auth, privacy, media, and other source suites');
  const seen = new Set();
  for (const [suite, command] of suites) {
    for (const relativePath of sourcePaths(command)) {
      assert.ok(!seen.has(relativePath), 'duplicate native regression: ' + relativePath);
      seen.add(relativePath);
      await assert.doesNotReject(access(new URL(relativePath, nativeRoot)),
        suite + ' references missing test ' + relativePath);
    }
  }
  assert.ok(seen.size >= 40, 'unexpectedly reduced regression coverage');
});

test('password reset and password change regressions run in the native auth suite', () => {
  const auth = sourcePaths(pkg.scripts['alpha:auth:source:test']);
  assert.ok(auth.includes('../tests/recovery323-password-reset-form-isolation.test.cjs'),
    'Recovery324 overlap case is part of the Recovery323 test file');
  assert.ok(auth.includes('tests/alpha-real-signup-smoke.test.mjs'),
    'isolated signup smoke regression must run with native auth');
  assert.ok(auth.includes('../tests/recovery325-password-change-session-guard.test.cjs'),
    'password-change session protection must be verified with native auth');
  assert.ok(!auth.includes('../tests/recovery324-password-reset-overlap.test.cjs'),
    'nonexistent Recovery324 standalone test must not be referenced');
});

test('native alpha verification runs source-path integrity checks', () => {
  assert.match(pkg.scripts['alpha:verify'], /tests\/alpha-source-suite-paths\.test\.mjs/);
  assert.match(pkg.scripts['alpha:verify'], /npm run alpha:auth:source:test/);
});
