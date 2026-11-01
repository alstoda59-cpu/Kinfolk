# Recovery389 | Prevent stale signup errors from overwriting edited mobile forms

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only; Kinfolksworld excluded.

## Verified starting point
Continued from Recovery388 exact commit `fea427f465b1fc21b162a1dccd253f162d32966f`, draft PR #85, after reading Recovery388, effective Phase79 signup code, source-executed tests, native package test wiring, Library continuation notes, and latest Vercel previews. GitHub Actions run 41284942853 for Recovery388 was confirmed completed SUCCESS. Recovery388 preview at exact commit was READY; READY does not prove working auth or devices.

## Source and test changes
- Effective `kinfolk-phase79.js` signup catch now distinguishes an Auth request that was actually sent from preflight failures. If a member edits the reused signup form while an in-flight Auth request later fails, the old error is not shown against the new email or password. A one-minute retry guard and original-inbox guidance acknowledge that the old request may have completed server-side. Unchanged-form errors and preflight failures preserve existing behavior.
- New `tests/recovery389-signup-stale-error.test.mjs` source-executes the effective catch guard against synthetic edited, unchanged, preflight, navigated, and detached forms, and verifies the request-sent marker is positioned after preflight and before `signUp`.
- Existing `native/package.json` `alpha:auth:source:test` runs the new test in the Android/iOS alpha source gate; no duplicate runner.
- Application commit `4f74cac0f85f103580d3cd0a7421d6b02f03e7de`; regression commit `ccb4c9002221a21b83052655c67940a3b2912ace`; native gate commit `ebcb446ac3a10dfef48ee473dd30ffa8dd1f2e88`.

## Evidence boundaries
Source commits are real; this note does not claim Recovery389 CI success until the exact final SHA is checked. Nonproduction Vercel READY is build status only. No real Auth accounts were created, no email was delivered, no authenticated RLS fixtures were exercised, and no physical Android/iPhone devices were tested.

No shared live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld, paid infrastructure, app-store submissions or real user data changed. No merge or production promotion.

## Remaining acceptance blockers
Real approved synthetic-account signup/email confirmation/login/logout/restoration; two-user JWT RLS enforcement; backend-connected uploads/posts/comments, messaging and notifications; signed installable Android/iPhone packages and physical-device QA. Not launch-ready.
