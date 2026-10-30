// Recovery183 source-order regression, run from repository root with Node 22.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const source=fs.readFileSync('kinfolk-social/kinfolk-phase95.js','utf8');
const activation="await window.kf129ActivateSession(session)";
const success="show(form,'Logged in. Opening Kinfolk…',true)";
const guard="typeof window.kf129ActivateSession!=='function'";
assert.equal(source.split(activation).length-1,1,'Account activation must occur exactly once');
assert.equal(source.split(success).length-1,1,'Success feedback must occur exactly once');
assert.ok(source.includes(guard),'Missing activation handler must be rejected');
assert.ok(source.indexOf(guard)<source.indexOf(activation),'Guard must precede activation');
assert.ok(source.indexOf(activation)<source.indexOf(success),'Success feedback must follow activation');
assert.ok(source.includes('catch(activationError){try{restoreStay()}'),'Activation failure must roll back login preference');
assert.ok(source.includes('The active account changed while opening Kinfolk.'),'Activation must verify active account again');
assert.ok(source.includes("if(currentLoginScreen()){form.__kf95CompletedTitle=loginTitle;"+success+"}"),'Only display success when the original login screen is still connected');
assert.ok(source.includes("form.isConnected&&form.querySelector('.kf73Title')===loginTitle&&mode(form)==='login'"),'Screen guard must verify DOM element identity after login/signup navigation');
console.log('PASS Recovery183 activation feedback source ordering');
