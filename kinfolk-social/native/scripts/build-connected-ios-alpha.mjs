// Connected, nonproduction iOS Simulator alpha. Requires macOS/Xcode and
// the same isolated Supabase configuration as Android; real two-account E2E is an optional release gate.
// This produces a simulator .app archive, NOT a signed installable iPhone IPA.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { alphaEmailCallback } from './native-email-callback.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
if(process.platform!=='darwin')throw Error('Connected iOS builds require macOS with Xcode.');
const backend=requireFunctionalAlphaBackend();
const emailCallback=alphaEmailCallback(process.env.KINFOLK_ALPHA_EMAIL_REDIRECT_URL);
function run(command,args,cwd=root){
  const result=spawnSync(command,args,{cwd,env:process.env,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)throw Error(command+' failed (exit '+result.status+')');
}
run('xcodebuild',['-version']);
run('npm',['run','prepare:web']);
const ranFunctionalE2E=process.env.KINFOLK_ALPHA_RUN_FUNCTIONAL_E2E==='1';
if(ranFunctionalE2E)run('npm',['run','alpha:verify:functional']);
const ios=resolve(root,'ios');
if(!existsSync(resolve(ios,'App')))run('npx',['cap','add','ios']);
run('npx',['cap','sync','ios']);
const workspace=resolve(ios,'App/App.xcworkspace');
if(!existsSync(workspace))throw Error('Capacitor iOS workspace missing after sync.');
const out=resolve(root,'connected-alpha-artifacts');
const derived=resolve(out,'ios-derived-data');
mkdirSync(out,{recursive:true});
run('xcodebuild',['-workspace',workspace,'-scheme','App',
  '-configuration','Debug','-sdk','iphonesimulator',
  '-destination','generic/platform=iOS Simulator',
  '-derivedDataPath',derived,'CODE_SIGNING_ALLOWED=NO','build']);
const app=resolve(derived,'Build/Products/Debug-iphonesimulator/App.app');
if(!existsSync(resolve(app,'Info.plist'))||
   !statSync(app).isDirectory())throw Error('Xcode reported success but simulator app is missing.');
const archive=resolve(out,'kinfolk-social-alpha-ios-simulator.zip');
run('ditto',['-c','-k','--sequesterRsrc','--keepParent',app,archive]);
if(!existsSync(archive)||statSync(archive).size===0)throw Error('Simulator archive missing or empty.');
writeFileSync(resolve(out,'ios-simulator-provenance.json'),JSON.stringify({
  backend:backend.projectRef,mode:'connected-nonproduction',
  artifact:'kinfolk-social-alpha-ios-simulator.zip',
  platform:'iOS Simulator only',signedIpa:false,
  gates:ranFunctionalE2E?'package and functional alpha verifier':'package only; two-account E2E not run',
  emailCallbackConfigured:Boolean(emailCallback),
  emailActivationMode:emailCallback?'configured app-link callback (device verification required)':'manual browser confirmation then return to app and log in',
  unverified:'email delivery, cross-account feature E2E, physical iPhone QA'
},null,2)+'\n');
console.log('Connected iOS simulator app archived: '+archive);
console.log('Not a signed IPA; physical iPhone installation requires approved signing and device QA.');
