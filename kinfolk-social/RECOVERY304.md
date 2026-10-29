# Recovery304 | Communities foundation (2026-10-28)

Scope: MAIN Kinfolk Social only. Based on Recovery303. No production changes.

## Code committed
- 21e88308: new `kinfolk-communities.js` for public community discovery, escaped user content, account-scoped asynchronous responses and graceful missing-table fallback.
- 1ac55c22: integrated Communities into desktop and bottom mobile navigation and main renderer. Existing features preserved.

## Verification
- GitHub Contents API confirmed both commits. No Node, browser, CI, Vercel, real backend, APK, iOS build, or physical-device tests executed for Recovery304. Do not represent source changes as launch-ready.
- The isolated backend was previously reported missing essential tables. Community table and RLS have not been provisioned or verified. Community creation, membership, posting and moderation are not implemented by this checkpoint.

## Next
- Define and verify isolated community schema and policies after environment/org and cost approval; add create/join/leave/posts/moderation, tests and native mobile QA. Fix seven-item bottom navigation fit if mobile tests show overflow.
- No shared live Supabase, production deployment, Kinfolksworld, store submission or paid resources changed.
