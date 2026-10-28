# Recovery299 | Immersive Reels viewport refit after content filter

Date: 2026-10-28 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only; Kinfolksworld excluded.

## Baseline inspected
- Latest Recovery298 report and branch `kinfolk-social/recovery298-concurrent-feed-source-20261028`, Recovery297 Settings notes, main README, native package verification scripts, existing Reels/Phase82 regression tests, and Library Recovery226/232 notes.
- Vercel Recovery298 nonproduction deployment `dpl_Au57pjjL33tmJwDX93aNtM9xxbtg` was READY at `cacd69ec`; READY alone is not functional QA.
- Historical Recovery226 Android debug and iOS Simulator build artifacts and CI passed for that **older** source only. No current native builds established.

## Bug reproduced
- Phase82 wraps the asynchronous immersive Reels renderer, then inserts its content-rating filter card at the top of the main view **after** the Reels player has already measured its height.
- The Reels159 player recalculated its viewport only on initial mount or browser viewport changes. In a source-backed synthetic V8 reproduction, a feed initially measured at 700px stayed at 700px when a 60px filter card was inserted above it; the correct available height was 640px. This could clip the bottom of the mobile player and action controls.

## Commits
- `01c62ecda90f2d380c74273e69cd3cf6d8ba0652`: expose `kf159FitViewport` as a lifecycle-safe hook for the active immersive feed; clear it on teardown, and reject stale account/view callbacks.
- `c05994be743337aa4bd80d2ebff98708974fae99`: Phase82 calls the hook after inserting its content-filter card and after safety refresh replaces the card.
- `d3e293743e6e05a24d512bb17821f52f80d0bbe4`: add three source-backed Node regression cases for post-insertion refit, safety refresh refit, account switching and teardown.
- `47e46598c3c455a93c119efdebf0a42748056bbe`: include new test in `native/package.json` `alpha:reels:source:test` and `alpha:verify`.
- `c2830cce95280a63173e1255ef468b89dc2f0f2f`: update README checkpoint.

## Verification
- Re-fetched committed Reels159 blob `92e22d5d5ea1f01f4ad0a376af9e4978b23026bf`, Phase82 blob `c655508d8d5753e9766111b89500c4a1d13ad431`, and regression test blob `881e9ef1d28fb7171d30ae5f855f6dfe21e7daf8`.
- Both exact committed JS modules compiled in V8. **8/8 focused synthetic V8 assertions passed**: committed test file present, initial viewport, late filter resize to 640px, stale account no-op, teardown no-op, filter insertion after DOM update, filter replacement, and Home unaffected.
- The three committed Node test cases were **not executed with Node or GitHub Actions** during this run. No real browser/device playback, native package compilation, isolated-backend signup/email/session or cross-account RLS was executed.
- Vercel nonproduction preview `dpl_2sjxZS64z1ePnsDCTDCHqHqWAqwm` was READY at `47e46598c3c455a93c119efdebf0a42748056bbe`: https://kinfolk-social-demo-qjcsnvcts-alstoda59-9779.vercel.app/ . Later README/report commits are not confirmed deployed; READY proves deployment, not functional playback.

## Remaining alpha blockers and boundaries
- Full current GitHub Actions CI; real synthetic-account signup/email verification/login/logout/session restoration; isolated nonproduction Supabase RLS and teen safety enforcement; integrated uploads/posts/comments, messaging/notifications; current installable Android and iOS builds; physical Android/iPhone QA.
- Nonproduction Supabase organization and any nonzero cost require owner confirmation. No paid resources created or changed.
- No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, or app-store submission changed. **Not launch ready.**
