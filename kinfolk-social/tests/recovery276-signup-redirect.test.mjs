import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'kinfolk-phase79.js'),'utf8');
const start=source.indexOf('function emailRedirect(){');
const end=source.indexOf('// Recovery221:',start);
assert.ok(start>=0&&end>start,'emailRedirect source found');
const snippet=source.slice(start,end);
function redirect(custom,origin='https://kinfolk.example'){
  const context={URL,window:{KINFOLK_EMAIL_REDIRECT_URL:custom},location:{origin}};
  return vm.runInNewContext(snippet+';emailRedirect()',context);
}
test('uses HTTPS origin without custom override',()=>assert.equal(redirect(undefined),'https://kinfolk.example'));
test('accepts HTTPS redirect without credentials',()=>assert.equal(redirect('https://alpha.example/auth/callback'),'https://alpha.example/auth/callback'));
test('rejects username in email redirect',()=>assert.equal(redirect('https://user@alpha.example/auth/callback'),null));
test('rejects password in email redirect',()=>assert.equal(redirect('https://user:secret@alpha.example/auth/callback'),null));
test('rejects non-HTTPS and loopback redirects',()=>{
  assert.equal(redirect('http://alpha.example'),null);
  assert.equal(redirect('https://localhost/auth'),null);
});
