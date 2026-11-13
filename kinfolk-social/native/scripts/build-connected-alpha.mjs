// Build the real isolated Kinfolk Android alpha, never the offline CI placeholder.
// Run from kinfolk-social/native after npm ci, with Android SDK/JDK installed.
// Required: isolated alpha backend URL and publishable key. HTTPS app-link callback is optional for manual-confirmation alpha.
// Build can be compiled before disposable inboxes are available; that is NOT an E2E pass.
// Set KINFOLK_ALPHA_RUN_FUNCTIONAL_E2E=1 to require connected functional verification.
// No production credentials are accepted.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { alphaEmailCallback } from './native-email-callback.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const backend=requireFunctionalAlphaBackend();
const emailCallback=alphaEmailCallback(process.env.KINFOLK_ALPHA_EMAIL_REDIRECT_URL);
if(!process.env.ANDROID_HOME&&!process.env.ANDROID_SDK_ROOT)
  throw new Error('Android SDK missing: configure ANDROID_HOME or ANDROID_SDK_ROOT');
function run(command,args,cwd=root){
  const result=spawnSync(command,args,{cwd,stdio:'inherit',env:process.env,shell:process.platform==='win32'});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(command+' '+args.join(' ')+' failed (exit '+result.status+')');
}
run('npm',['run','prepare:web']);
const ranFunctionalE2E=process.env.KINFOLK_ALPHA_RUN_FUNCTIONAL_E2E==='1';
if(ranFunctionalE2E)run('npm',['run','alpha:verify:functional']);
const configPath=resolve(root,'capacitor.config.json');
const config=JSON.parse(readFileSync(configPath,'utf8'));
if(!config.appId||!config.appName)throw new Error('Capacitor application identity missing');
const androidPath=resolve(root,'android');
if(!existsSync(androidPath))run('npx',['cap','add','android']);
run('npx',['cap','sync','android']);
run(process.platform==='win32'?'gradlew.bat':'./gradlew',['--no-daemon','assembleDebug'],androidPath);
const apk=resolve(androidPath,'app/build/outputs/apk/debug/app-debug.apk');
if(!existsSync(apk))throw new Error('Gradle succeeded without an APK');
run('python3',['scripts/audit-compiled-apk.py','--connected-alpha',apk]);
const out=resolve(root,'connected-alpha-artifacts');
mkdirSync(out,{recursive:true});
const target=resolve(out,'kinfolk-social-alpha-android-debug.apk');
copyFileSync(apk,target);
writeFileSync(resolve(out,'build-provenance.json'),JSON.stringify({
  backend:backend.projectRef,mode:'connected-nonproduction',
  artifact:'kinfolk-social-alpha-android-debug.apk',
  emailCallbackConfigured:Boolean(emailCallback),
  emailActivationMode:emailCallback?'configured app-link callback (device verification required)':'manual browser confirmation then return to app and log in',
  verifiedBy:ranFunctionalE2E?'functional alpha verification and compiled APK auditor':'compiled APK auditor only',
  backendE2E:ranFunctionalE2E?'functional verifier completed':'NOT RUN; confirmed disposable accounts required',
  limitations:'Not proof of email delivery, cross-account E2E, or physical-device QA; only claim verified stages'
},null,2)+'\n');
console.log('Connected Android alpha packaged at '+target+'; device QA remains required.');
