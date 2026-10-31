// Functional alpha gate: package integrity, real two-user privacy, and Auth readiness.
// Passing this gate still does NOT prove email delivery or physical-device behavior.
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { verifyIsolatedAuthReachability } from './verify-isolated-auth.mjs';
import { requireFunctionalRlsProof } from './functional-rls-gate.mjs';
import { alphaEmailCallback } from './native-email-callback.mjs';

const config=requireFunctionalAlphaBackend();
alphaEmailCallback(process.env.KINFOLK_ALPHA_EMAIL_REDIRECT_URL,{required:true});
await import('./verify-alpha-package.mjs');
// This MUST execute the RLS probe. Merely importing verify-two-user-rls.mjs
// does not run its direct-CLI guard and previously allowed false green gates.
const rls=await requireFunctionalRlsProof(config);
await verifyIsolatedAuthReachability(config,{requireEmailSignupReady:true});
console.log('PASS functional package, '+rls.checkedTables+' owner-private tables with two-account RLS, and isolated Auth signup readiness for '+config.projectRef+'; email delivery, confirmed login and device E2E remain unverified');
