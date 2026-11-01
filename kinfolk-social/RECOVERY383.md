# Recovery383 | Bounded isolated two-account RLS verification

Date: 2026-10-31 (America/Los_Angeles). Scope: full MAIN Kinfolk Social under `kinfolk-social/` only. Kinfolksworld excluded.

## Verified continuation
Continued from Recovery382 exact commit `a7979fd4bdd98edae9b4d43a66877ffe6906ffaa`, draft PR #79, and source CI run `41261329326` (SUCCESS). Inspected Recovery381/382, native Auth and RLS verification scripts/tests, README, relevant Library continuation notes, GitHub branch/commit/PR history, Vercel preview history, and read-only isolated Supabase status. No restart, merge, or redesign.

## Actual source and regression changes
- `native/scripts/verify-two-user-rls.mjs` previously relied on `AbortController` alone. A fetch wrapper or `response.json()` that ignored abort could stall the required two-user RLS release gate indefinitely. Each owner, cross-account and anonymous GET now races the complete network/body read against a hard timeout. The signal is aborted on expiry, and invalid timeout values are rejected before network access.
- The existing `native/tests/alpha-two-user-rls.test.mjs` gained three synthetic cases: an abort-ignoring stalled fetch, an abort-ignoring stalled JSON body reader, and invalid timeout rejection with zero network calls. The suite remains wired into `native/package.json` `alpha:rls:test` and `alpha:verify`, without a duplicate test runner.
- Source commit: `a1d00c79cfe66689fdc1824bf52cee0f2a3680e1`. Test commit: `82f688e23b0394ce25ac3f49f2fff9e8e013fe64`. Draft PR #80 targets Recovery382 only; unmerged.

## Evidence and boundaries
- GitHub Actions [run 41265091809](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41265091809) was pending at note creation. Do not claim CI passed until its exact SHA and final conclusion are verified.
- [Nonproduction Vercel preview](https://kinfolk-social-demo-769a490gd-alstoda59-9779.vercel.app/) was READY at exact test commit `82f688e23b0394ce25ac3f49f2fff9e8e013fe64`. READY is deployment build status, not a backend, authenticated browser, or device test.
- Read-only isolated Supabase Alpha Test project `viantpfagtbgyyzavmtv`: 0 Auth users, 0 photo albums, 0 album photos, 16/16 public tables with RLS enabled, and zero security-advisor findings. No synthetic JWTs/owner fixtures exist for real cross-account RLS verification. SQL inspection is not enforcement proof.
- No changes to shared live Supabase, production deployments or aliases, Kinfolksworld, paid infrastructure, app stores, or real user accounts/data. No new Supabase organization/project created.

## Remaining acceptance blockers
Real signup and email delivery/confirmation; confirmed login, logout and restored session with synthetic accounts; actual two-user JWT/fixture RLS enforcement; backend-connected uploads, messaging and notifications; signed installable Android/iPhone packages and physical-device QA. Source/CI success cannot establish launch readiness.

**Not launch-ready.** Next independent work: improve and exercise the isolated real Auth signup proof once a deliverable approved synthetic inbox is available, establish two distinct authenticated test users and owner fixtures, and run backend-connected Android/iPhone acceptance testing.
