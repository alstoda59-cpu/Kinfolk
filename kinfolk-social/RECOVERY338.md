# Recovery338 | Confirmed-email gate for startup and legacy session restoration

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`. Continued from verified Recovery337 final commit `4e703a45ab75b2a2802add102a9801ce2c69747a`. No redesign or feature removals.

## Evidence before implementation
- Recovery337 exact-head source workflow [41020396753](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41020396753) completed SUCCESS. Synthetic Node, Chromium/WebKit, login preference, source inventory and offline session restoration stages passed.
- Recovery337 draft PR #35 is open/unmerged. Vercel nonproduction deployment `dpl_GcPTKoy7MeuGjwJ3DEJbaeMD5jFN` for that exact commit reported READY; build status is not functional authentication proof.
- Inspected Recovery337 report and README, actual `index.html` boot, `kf129RestorableSession`, `kf129ActivateSession`, legacy Phase76 recovery handler, Phase95 login email confirmation checks, existing Recovery316 tests, native alpha scripts, and Library prelaunch diagnostic.
- Found startup, retry and legacy recovery paths could call `kf129ActivateSession` with a restored session whose `user.email_confirmed_at` was absent. Phase95's login-specific checks did not cover these paths.

## Implemented source change
- Added `kf338ConfirmedSession` as a centralized confirmed-email requirement inside the real `kf129ActivateSession` entry point. It runs **before** the same-account fast path, profile hydration, feed loading or private UI rendering.
- When a session is unconfirmed, immediately clear private state/UI via the existing logout activation path, then read the current Supabase session and use **local** sign-out only when that current account is the same still-unconfirmed identity. A stale unconfirmed event cannot sign out a newer or newly verified account.
- Kept existing signup, login, theme, profile music, Reels, Channels, communities, messages, notifications and dark mobile UI intact. No schema, backend credentials or deployment settings changed.
- Expanded existing `recovery316-auth-account-switch-state-isolation.test.mjs` synthetic harness to use confirmed fixtures and added four runtime cases: unconfirmed startup, stale callback account protection, bypass of ready-account fast path, and confirmed startup success. Existing account-switch tests remain.

## Verification boundary
- Actual source and synthetic tests are committed to this isolated branch. Final source CI and native Android/iOS workflow results must be independently confirmed; no success inferred from code review alone.
- A Vercel READY preview is build-only evidence. Real isolated Supabase email verification, two-account RLS, private media, Community/Channel backend schema, messaging and teen enforcement are not end-to-end proven.
- No physical Android/iPhone testing or signed store packages have been performed. Not launch-ready.
- No production deployments, shared live Supabase schema/data/auth/security, Kinfolksworld, paid resources, aliases or store submissions changed.
