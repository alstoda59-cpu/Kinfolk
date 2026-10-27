// Strict static release gate for an alpha wired to the isolated backend.
// This does NOT prove real signup, email delivery, RLS or device functionality.
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { verifyIsolatedAuthReachability } from './verify-isolated-auth.mjs';

const config=requireFunctionalAlphaBackend();
await import('./verify-alpha-package.mjs');
await verifyIsolatedAuthReachability(config,{requireEmailSignupReady:true});
console.log('PASS functional native package and isolated Auth email-signup readiness for project '+config.projectRef+'; signup, email, RLS and device E2E remain unverified');
