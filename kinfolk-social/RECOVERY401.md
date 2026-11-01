# Recovery401 | Verify duplicate DM blocks and restore native CI

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/`; Kinfolksworld excluded.

## Starting checkpoint and verification
- Continued from Recovery400 final commit `8e531e93491e5befd58e4506bb5fe0d4d1538e1a`, draft PR #97. Did not restart or merge branches.
- Read Recovery400, the effective Phase107 DM privacy handler, Recovery237/400 source-executed tests, native test command, Library notes and Recovery400 Vercel preview.
- Recovery400 GitHub Actions run [41347233304](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41347233304) **failed** its native safety gate: `recovery400-block-confirmation.test.cjs` read `kinfolk-social/kinfolk-phase107.js` relative to the process working directory; when launched from `kinfolk-social/native`, the file was missing (ENOENT). Do not report that run as SUCCESS.
- The previous Recovery400 preview was READY at earlier commit `0e99599bfc71b59620a8961283782b4a27e872df`, not the final Recovery400 commit.

## Changes
- `b13e1011e71982da16dc5d96feb47e7314609a87`: resolve the effective source path relative to `__dirname` so root and native working directories both find it.
- `601f9307022d2727bfd2d3997e63e002e5ed03ee`: when a block INSERT reports a unique/duplicate error, do not infer privacy success from the error. Before closing the DM or showing the success toast, read the exact blocker/blocked pair from `public.blocks` under the current user's RLS. Fail closed on missing, mismatched or denied readback. A changed account activation skips the verification read and stale UI. Confirmed one-row fresh INSERT behavior is preserved.
- `bfd579402043cbd1a8377965f9fa5410defd35f3`: add duplicate readback, wrong-account/peer, denied RLS and stale-activation regression coverage to the existing native safety test.
- `b2b309c759ea8ca33007fe9e222034225e7f11ab`: update the historical Recovery237 duplicate-block fixture to model the verified RLS-visible readback.

## Isolated backend boundary
- Read-only check against the separate `Kinfolk Social Alpha Test` Supabase project (`viantpfagtbgyyzavmtv`) returned ACTIVE_HEALTHY, 16 public tables with RLS enabled, and **zero** Auth users. No live or isolated schema, data, Auth configuration, policies or storage were modified.
- Real email verification, authenticated two-account RLS enforcement, backend media/messaging, native installation and physical-device QA remain unverified. The source-executed tests are synthetic, not real backend tests.

## Release controls
- Isolated branch and draft PR only. No production deployment/aliases, shared live Supabase, Kinfolksworld, paid infrastructure, real user accounts or app-store submission.
- Full final-head CI and exact-head Vercel READY must be verified separately. Do not claim Android/iPhone alpha launch readiness without end-to-end evidence.
