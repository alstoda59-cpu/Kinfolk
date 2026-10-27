# Recovery262 | Mobile verification resend timeout recovery

Date: 2026-10-27 (America/Los_Angeles). Scope: full main Kinfolk Social `kinfolk-social/` only. Kinfolksworld excluded.

## Baseline inspected
- Branched from Recovery261 `kinfolk-social/recovery261-resend-retry-20261027` after reviewing Recovery261, native packaging and auth gates, Phase79 and its regression harness, GitHub branches/commit comparisons, Library Recovery226/232 notes, and Vercel deployment metadata.
- Recovery261 final nonproduction Vercel deployment `dpl_5js96An1Um4W9aMVJBM7C6AMGLLh` was READY. That status is not real auth or native-device proof.
- Identified a mobile network hang: `sb.auth.resend()` could remain pending indefinitely, leaving the verification button disabled and `pending.busy` true.

## Implemented
- `4a7db4736d545c960c7f9e2f70b5514a0418841b`: Bound the verification resend UI wait to 20 seconds with `Promise.race`. On timeout, release the busy button, explain the email may still arrive, and retain the 60-second cooldown to avoid immediate duplicate email requests. A malformed null/primitive Auth response no longer claims success. Transient HTTP 408/5xx/network failures still permit immediate retry; 429 keeps cooldown.
- `464305d9db1d401e766ee8e30850391ce075dd2e`: Add synthetic tests for a never-settling resend, cooldown behavior and malformed responses; preserve prior signup/verification regressions.
- Only `kinfolk-social/kinfolk-phase79.js` and `kinfolk-social/tests/recovery258-phase79-title.test.cjs` changed before this note.

## Verification evidence
- Re-fetched exact GitHub committed source blob `f208bf7a5fb8a9a1c51e71523cfeb138d493d40f` and test blob `c1f3a096240aabf34f891f293d99e3be6787f591`.
- Executed **17/17** tests from the exact committed test source against the exact committed Phase79 source in a synthetic V8 adapter with mocked DOM, Auth, URL, timers and Node test/assert APIs. No failures. This is **not** an actual Node test runner, real browser, GitHub Actions, backend email delivery or device test.
- Focused 5/5 V8 scenarios also passed, including timeout, malformed response, 429 and 503.
- Vercel nonproduction preview at test commit `464305d9` reports **READY**, target null: https://kinfolk-social-demo-gffd3robv-alstoda59-9779.vercel.app/ . Asset HTTP response and rendered app behavior were not independently verified.
- GitHub PR-filtered workflow lookup returned no runs for `464305d9`; full CI remains unverified.

## Blockers and restrictions
- Real synthetic-account signup/email delivery/login/logout/session restoration and two-account RLS remain unverified. An isolated project exists, but fixture credentials and real end-to-end testing are not yet established.
- Home/Reels/Channels, profiles/music/themes, posts/uploads/comments, messages/notifications, teen privacy and native callback integration need functional device QA.
- No functional Android/iPhone native build, physical-device QA or signed store-ready package verified in this checkpoint.
- No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, paid infrastructure or app-store submission changed.
