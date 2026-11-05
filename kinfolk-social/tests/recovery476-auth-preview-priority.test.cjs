// Recovery476: execute the shipped SDK recovery bootstrap with a synthetic DOM.
// No backend credentials, network, or real accounts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = html.match(/<script id="kinfolk-auth-sdk-recovery">([\s\S]*?)<\/script>/);
assert.ok(match, 'shipped auth SDK recovery script exists');
function run(blocked) {
  const appended = [];
  const makeElement = tag => ({
    tag, style: {}, children: [], textContent: '',
    setAttribute(){}, addEventListener(){},
    append(...nodes){this.children.push(...nodes);},
    appendChild(node){this.children.push(node);}
  });
  const document = {
    readyState: 'complete',
    body: {appendChild(node){appended.push(node);}},
    getElementById(){return null;},
    createElement: makeElement
  };
  const window = {__kinfolkPreviewBackendBlocked: blocked};
  vm.runInNewContext(match[1], {window, document}, {timeout: 1000});
  return appended;
}
assert.equal(run(true).length, 0, 'isolated preview must not offer a misleading auth retry');
assert.equal(run(false).length, 1, 'native/off-preview missing SDK must show actionable recovery');
console.log('Recovery476: preview isolation and auth SDK fallback precedence passed');
