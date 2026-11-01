# Recovery390 | Prevent late signup success after mobile navigation

Date: 2026-11-01 (America/Los_Angeles). Scope: full MAIN Kinfolk Social under `kinfolk-social/` only; Kinfolksworld excluded.

## Verified continuation
Continued from Recovery389 exact commit `f728bbd071717f6c2ac74623c81942096e8107a4`, draft PR #86. Verified its GitHub Actions run `41288923241` completed SUCCESS and its nonproduction Vercel deployment was READY. Inspected effective Phase79 signup source, Recovery389 source-executed tests and native package scripts, Library continuation notes, current GitHub/Vercel history, and read-only isolated Supabase Alpha Test status. No restart or merge.

## Actual application fix
The effective `kinfolk-phase79.js` handler guarded edited signup details after `sb.auth.signUp` returned, but it only applied that check when the original form and title were still active. If a member navigated to Login or the signup form was replaced/detached, the completed request could fall through to signup result processing, risking success feedback or Stay Logged In persistence for a screen that no longer owned the request.

Commit `7b9225c166f3c521ca6a718f233a7707443a0f01` now immediately discards a late completed Auth result when the initiating signup form is detached, the title node has changed, or the screen is no longer signup. The existing edited-input guidance remains for the original active signup screen. No new UI or features.

## Synthetic regression and native gate
Commit `95239a3d62ce4189a238ee847644a09381874f9f` adds `tests/recovery390-signup-navigation-result.test.mjs`, which source-executes the effective result guard with detached, replaced-title, Login, edited-input, and unchanged-input fixtures. Commit `d2372fe36988f4d90ac24fa8b2c87cdd0dabba0b` wires it into existing `native/package.json` `alpha:auth:source:test` for Android/iOS source verification. Draft PR #87 targets Recovery389; unmerged.

## Evidence boundaries
GitHub Actions run [41297788475](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41297788475) was in progress when checked. Its main Node regression step had passed; do not claim full CI until final conclusion. Exact source/test/native-gate commit `d2372fe36988f4d90ac24fa8b2c87cdd0dabba0b` had a [nonproduction READY Vercel preview](https://kinfolk-social-demo-10v3sb17u-alstoda59-9779.vercel.app/). READY is deployment build status, not real backend/browser/device proof.

Read-only isolated Supabase project `viantpfagtbgyyzavmtv`: 0 Auth users; 16 public tables, 16 with RLS enabled. No authenticated two-user enforcement proof. No approved deliverable synthetic inbox is available for real email verification.

No shared live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld, paid infrastructure, app stores, or real user data changed.

## Remaining alpha blockers
Real synthetic signup/email delivery/confirmation, login/logout/restoration, two-user JWT RLS enforcement, backend-connected posts/media/messaging/notifications, signed installable Android/iPhone packages, and physical-device QA. **Not launch-ready.**
