# Recovery273 | Prevent active-account replacement and stale Stay Logged In selection

Date: 2026-10-27 (America/Los_Angeles). Scope: full main Kinfolk Social under `kinfolk-social/`, excluding Kinfolksworld.

## Baseline
- Latest Recovery272 report and Phase95 login source; Recovery271 token/session identity and in-flight form tests; Recovery214 cleanup and Recovery224 remount tests; native package and isolated RLS test scripts; existing native GitHub workflow; Recovery226/232 Library notes; and current Vercel nonproduction deployment list.
- Recovery272 code commit `2e3c2bde` has a READY nonproduction Vercel deployment. The existing native workflow only automatically builds designated older branches; no Recovery273 native CI run is established.
- Recovery226 historical GitHub Actions built an offline Android debug APK and iOS Simulator app, but those are NOT Recovery273 builds and were not functional-backend or physical-device proof.

## Application changes
- `c019c4c9d947e4ea023a3639ccf3b57d2fab6fe0`: Phase95 now refuses a fresh password-login attempt if an existing account is already authenticated. This prevents the login screen from silently replacing an active account and avoids the preexisting cleanup path skipping rollback when `startingAccount` was nonempty.
- The in-flight form identity check now includes the Stay Logged In checkbox, in addition to email and password. Changing persistence choice during a pending token or session-adoption request invalidates the stale attempt; existing preference rollback and local-only cleanup apply.
- No UI redesign or feature removal.

## Regression coverage and evidence
- `e6b5f2eb1f66d08da995e8d9e2219ee5f6d12df6`: new synthetic Node-style full Phase95 DOM/Auth test file for existing-account refusal, stale Stay choice during token fetch, and stale Stay choice during session adoption.
- `b72b156a8e8d4a9a0000ecdd04f1b0cf3cc9b780`: add positive login tests for both persistent and one-tab sessions.
- Re-fetched exact committed Phase95 blob `86bd72669d5fa63cdbb6159b8aab2294be26e6ff` and test blob `7300fbabc5ebd2432ffc151c1b11583d4c59245f`. Executed the complete five committed test callbacks in a synthetic JavaScript V8 adapter: **5/5 passed**.
- Re-fetched existing Recovery271 in-flight email/password DOM test blob `7196f7d4e6a4fa9ae433f883ca4da718738ae754` and executed both against the Recovery273 Phase95 source in the same adapter: **2/2 passed**.
- These are real in-memory test executions against exact GitHub source, **not Node.js test-runner results, GitHub Actions CI, browser/device tests, real Supabase auth or email delivery**.
- Vercel READY nonproduction preview for Recovery273 code commit `c019c4c9`: https://kinfolk-social-demo-p794pv0dq-alstoda59-9779.vercel.app/ . READY also confirmed for first test commit `e6b5f2eb`: https://kinfolk-social-demo-juxrk5eht-alstoda59-9779.vercel.app/ . READY means deployed, not that account flows were exercised.

## Remaining launch blockers
- Current branch native packaging execution, Android debug APK, iOS Simulator build, physical-device QA, and current GitHub CI are unverified.
- Real isolated Supabase synthetic signup/email confirmation/login/logout/session restoration and two-account RLS are unverified. Isolated project must remain separate from shared live Kinfolk; do not change backend security/schema/data without approval.
- Home/Reels/Channels, profile music/themes, uploads/posts/comments, messaging/notifications, teen safety/privacy still require real integrated device E2E.

## Boundaries
All writes confined to this isolated development branch in `kinfolk-social/`. No shared live Supabase, production aliases, Kinfolksworld, paid infrastructure or store submissions were modified.
