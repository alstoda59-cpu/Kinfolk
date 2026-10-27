# Recovery251 | Read-only isolated Auth reachability gate

Date: 2026-10-27 (America/Los_Angeles). Scope: full main Kinfolk Social only, `kinfolk-social/`, excluding Kinfolksworld.

## Starting checkpoint
- Branched from Recovery250 commit `2784a2f776b4b2d20482502c6544574612c22901`; reviewed Recovery250, current native packaging scripts and tests, Library continuation notes, and Vercel history.
- Existing `alpha:verify:functional` checked static package and pinned environment, but accepted a syntactically plausible publishable key without contacting the isolated Auth service. It therefore did not establish that the configured Auth endpoint was reachable.
- Read-only Supabase inspection confirms designated isolated project `viantpfagtbgyyzavmtv` ACTIVE_HEALTHY with 14 public tables, all reporting RLS enabled and zero rows. This does not establish policy correctness or real signup.
- Existing dark mobile design and all application features are unchanged.

## Implemented
- `native/scripts/verify-isolated-auth.mjs`: a read-only GET of `https://viantpfagtbgyyzavmtv.supabase.co/auth/v1/settings` with the designated publishable key; checks HTTP 200, JSON content type, recognizable Auth settings shape, no redirects, and an eight-second abort timeout. Rejects offline, live, and foreign backend configurations before making any request. Does not create accounts or mutate data.
- `native/scripts/verify-functional-alpha.mjs`: after the existing static package verifier, require the isolated Auth reachability probe. Failure prevents a functional packaging pass.
- `native/tests/alpha-auth-reachability.test.mjs`: six synthetic Node tests for read-only request construction, backend pinning, HTTP failures/redirects, malformed settings, timeout and verifier wiring.
- `native/package.json`: include probe tests in `alpha:verify` and `alpha:functional:gate:test`; add `alpha:auth:reachability:test`.

## Evidence and limitations
- Local Node execution of reconstructed modules: 6/6 focused tests passed, and both new module and test passed `node --check`. This is not a GitHub Actions CI result or a claim that the locally reconstructed files have been hash-matched to the GitHub blobs.
- GitHub compare after code/test integration: five commits ahead, zero behind Recovery250; only files under `kinfolk-social/native/` changed.
- Vercel READY for earlier source/test commits on this branch. READY does not test native build, backend API, real email, RLS, or physical devices.
- Full native `npm ci && npm run sync && npm run alpha:verify:functional` with isolated publishable key has **not** run. No real Auth GET was executed in this continuation; probe was exercised with injected synthetic responses.
- Existing GitHub Actions commit workflow query returned no PR-triggered runs for latest commit. Do not infer that full CI passed.

## Next blockers
1. Run functional native package verification with securely supplied isolated publishable key and live read-only Auth settings probe.
2. Configure and test real synthetic-account signup, email confirmation, login/logout/session restore, then two-user RLS.
3. Complete isolated storage, Reels/Channels, Stories, DM, notifications, teen/privacy dependencies.
4. Build and test installable Android/iOS packages on physical devices. No production, store, or shared live Supabase changes without explicit approval.

No production deployment/aliases, shared live Supabase changes, Kinfolksworld edits, real-account actions, or paid infrastructure changes.
