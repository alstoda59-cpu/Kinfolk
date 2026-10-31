// Strict static release gate for an alpha wired to the isolated backend.
// This does NOT prove real signup, email delivery, RLS or device functionality.
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';
import { verifyIsolatedAuthReachability } from './verify-isolated-auth.mjs';
import { alphaEmailCallback } from './native-email-callback.mjs';

const config=requireFunctionalAlphaBackend();
alphaEmailCallback(process.env.KINFOLK_ALPHA_EMAIL_REDIRECT_URL,{required:true});
await import('./verify-alpha-package.mjs');
// A functional-alpha claim also requires the two-account privacy gate.
// The gate fails closed when synthetic account credentials are not supplied.
await import('./verify-two-user-rls.mjs');
await verifyIsolatedAuthReachability(config,{requireEmailSignupReady:true});
console.log('PASS functional native package and isolated Auth email-signup readiness for project '+config.projectRef+'; signup, email delivery and device E2E remain unverified; two-user RLS gate executed');
