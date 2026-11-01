# Recovery402 | Scope DM block request lock to the auth activation

Date: 2026-11-01. Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only; Kinfolksworld excluded.

## Verified starting checkpoint
- Based on Recovery401 final head `d5625ffe024115a4ee37ff455dd1fd0222761a07`, draft PR #98. Recovery401 GitHub Actions run [41352416427](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41352416427) passed the synthetic source/browser/native verification workflow.
- Read Recovery401, effective `kinfolk-phase107.js`, the Recovery400 source-executed privacy test, existing native `alpha:safety:source:test` command, Library continuation notes and Vercel preview history.
- The latest inspected nonproduction Vercel READY preview for Recovery401 was `b2b309c759ea8ca33007fe9e222034225e7f11ab`, not the final Recovery401 commit. No preview is a substitute for real backend or physical device evidence.
- Read-only isolated Supabase Alpha Test project `viantpfagtbgyyzavmtv` was ACTIVE_HEALTHY, with RLS enabled on all 16 public tables. No writes to that project were performed.

## Actual application fix
- Commit `82739642bac7de6c738335ae3f5b956737f818a0`: `blockPeer` now keys its in-flight duplicate-tap lock by the captured authentication activation as well as account and peer. Previously the key was only `account:peer`; a hung request from a logged-out or reauthenticated same-account session could suppress a new block request until the old request settled. Existing stale-activation success/error suppression and exact-row confirmation remain unchanged.
- Commit `efa68437b99612d47d143ec81271711fdf7f0154`: extend the existing source-executed Recovery400 synthetic tests with same-activation duplicate-tap suppression and overlapping old/new activation requests, including old cleanup not unlocking a new pending request.
- The native Android/iOS offline safety gate already invokes `../tests/recovery400-block-confirmation.test.cjs`, so no duplicate test runner was created.

## Validation boundaries
- New tests are synthetic Node VM tests, not real Supabase account or RLS enforcement tests.
- Final-head CI and Vercel READY must be checked after pushing these commits; do not infer success from Recovery401.
- No signed installable Android APK / physical-iPhone IPA or physical device QA was produced or performed in this recovery.
- Real signup/email confirmation, two-account authenticated RLS, backend uploads and messaging, native email callbacks and physical-device acceptance remain release blockers.

## Safety
- Isolated branch and draft PR only. No shared live Supabase schema/data/auth/policies, production Vercel deployment/aliases, Kinfolksworld, paid resources or store submissions changed.
