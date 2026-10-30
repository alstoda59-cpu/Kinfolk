# Recovery334 | Restore browser login regression after confirmed-email auth guard

Date: 2026-10-29. Scope: full MAIN Kinfolk Social in `kinfolk-social/` only. Isolated continuation from Recovery333 commit `05c53cc3a2a27dbf61a8fcad7eaede3fa54c2640`.

## Verified before editing
- Recovery333 source CI run [40997557076](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40997557076) completed FAILURE. Its complete synthetic Node regression step passed; the Chromium browser stage failed in `test_recovery129.py` with `AssertionError: login did not open main app`.
- Phase95 now correctly refuses to adopt password tokens without `user.email_confirmed_at`. The shared Recovery129 browser fixture returned a synthetic password-token user without that property, so the simulated login could no longer open the app.
- Recovery133/137/138 reuse the Recovery129 fixture. Library prelaunch audit still flags private media, RLS, teen safety, functional auth and physical device QA.
- Recovery333 Vercel previews marked READY were at intermediate commits, not the final Recovery333 head. READY is not functional authentication evidence.

## Actual change
- Updated the synthetic password-token response in `test_recovery129.py` to supply an explicit confirmed-email timestamp, matching a verified account.
- Added a browser-level negative case that returns HTTP 200 tokens without email confirmation, checks that the main app stays closed, no session is adopted, an actionable message appears and login can retry. The following existing verified-login, Home/Reels/Channels, profile and signup scenarios remain in place.
- The production Phase95 fail-closed email confirmation check is **unchanged**. No existing test assertions, app behavior or security checks were weakened.
- Enabled Recovery334 isolated offline Android debug APK and unsigned iOS Simulator build workflow.
- The browser fixture remains offline and uses synthetic `example.test` identities, not a real Supabase account.

## Verification boundaries
- A new CI run must confirm the Recovery129 browser test and all subsequent browser checks, then native packaging. Neither offline compilation nor a READY Vercel preview proves real signup/email verification.
- Real isolated-backend signup, email callback, login/logout/session restoration, two-account RLS, missing Community/Channel schema, private media, teen safety, messaging and physical-device QA remain open.
- No shared live Supabase schema/auth/data/security, production deployments/aliases, Kinfolksworld, paid infrastructure or app stores were changed.
