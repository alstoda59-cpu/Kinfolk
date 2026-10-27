// Strict static release gate for an alpha wired to the isolated backend.
// This does NOT prove real signup, email delivery, RLS or device functionality.
import { requireFunctionalAlphaBackend } from './alpha-backend-config.mjs';

const config=requireFunctionalAlphaBackend();
await import('./verify-alpha-package.mjs');
console.log('PASS functional native package configuration for isolated project '+config.projectRef+'; backend and device E2E remain unverified');
