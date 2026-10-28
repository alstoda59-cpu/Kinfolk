# Recovery286 | Sign-out event session-race guard

Date: 2026-10-28 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social, `kinfolk-social/` only; Kinfolksworld excluded.

## Baseline
Inspected Recovery285, Phase95 login, `index.html` boot/activation/logout, native alpha scripts, Recovery226/232 Library notes and the Recovery285 nonproduction Vercel READY deployment. No newer Recovery branch was returned before branching.

## Implemented
- `e6722528096d7dc60ab644bc41b61270ed0540e8`: defer SIGNED_OUT handling outside the Supabase auth callback lock, recheck the current session, and avoid clearing a newly authenticated account if a late sign-out event arrives. Missing session, auth read failure, or 4-second verification timeout clears private UI (fail closed).
- `5b07b58da86fda7d669cd873e2d9e9f7df819005`: add six Node regression cases against the actual `index.html` helper, including late event/new session, no session, read error/rejection, timeout and deferred callback integration.
- `90b23a7ca5c57420a2d15a9ffab56bedcde02894`: wire regression into native `alpha:auth:source:test`, used by `alpha:verify`.

## Verification and limitations
- Re-fetched committed application blob `207e57cba0a73761d3be9dc9fb0ffeaedd2d616e`, test blob `1ded7231f13ac798f31c9a963b66d058d7af1b6e`, native package blob `fe8c7d8779c1d52129979f2121fe1a145e4321d6`.
- **4/4 focused synthetic V8 checks passed** against extracted committed helper for no session, new session, read error, and rejected read. Deferred callback and test integration anchors were confirmed. The committed six-case Node test suite was **not executed**; full CI **unverified**.
- Nonproduction Vercel deployment `dpl_4qM2jnYGCW5aCxZsm7Ptuwvbj3gb` is **READY** for integration commit `90b23a7c`: https://kinfolk-social-demo-n6yvozmic-alstoda59-9779.vercel.app/ . READY is not functional QA.
- No new Android/iOS builds, real synthetic-account auth/email/RLS, browser E2E or physical-device QA performed.

## Remaining blockers
Isolated backend email callback allowlist and native App Links, real signup/email/login/logout/session restoration, two-user and teen RLS, uploads/messages/notifications and current native functional builds with physical-device testing. No shared live Supabase, production aliases, paid resources, Kinfolksworld or app-store changes.
