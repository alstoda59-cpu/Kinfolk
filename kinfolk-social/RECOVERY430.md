# Recovery430 | Reject stale native message submitters

Date: 2026-11-02. Scope: full main Kinfolk Social only, kinfolk-social/. Base: Recovery429 final commit 9446b2aca94f78edf420652ac0163489757d2fd0. Isolated branch, unmerged.

## Implementation
- 6e7bd44110acee73269c6facb05498e50f22f4cd: Phase107 native submit capture now rejects a noncurrent, detached, foreign, or disabled event.submitter. This closes a remaining requestSubmit(oldButton) path after modal control replacement. Submit events without a submitter continue through the existing IME and duplicate-send gate.
- 76d4554abcaad7c4792a88439a386011e0099029: extend the existing source-executed Recovery429 test harness with two new regression cases for stale/detached and foreign/disabled submitters. Existing current-control/native submit cases remain.

## Evidence and boundaries
- Recovery429 exact-head source CI previously completed successfully. Recovery430 code and tests are committed, but no Recovery430 CI pass, native APK/iOS compilation, Vercel READY, connected Supabase auth/RLS, or physical-device test is claimed until independently verified.
- No shared live Supabase, production Vercel, Kinfolksworld, store submission, or paid resources changed.
- Next: verify Recovery430 source checks and native builds; continue real synthetic account email confirmation, session restoration, RLS and device QA in a confirmed zero-cost isolated environment.

**Not yet a backend-connected launch-ready alpha.**
