# Kinfolk Social Recovery209 | signup navigation race cleanup

Date: 2026-10-25. Scope: full main Kinfolk Social, excluding Kinfolksworld.
Branch: `kinfolk-social/recovery207-signup-navigation-guard`.

## Changes
- Recovery207: ignore completed signup responses when the signup form was removed or changed to login, before writing Stay Logged In preference.
- Recovery208: recheck form after asynchronous `sb.auth.getSession()` before preference write.
- Recovery209: ignore late signup errors after navigating away, so obsolete error UI does not replace login state.
- Static source-order regression file `tests/recovery207-signup-navigation-guard.test.cjs` has four checks and is referenced by `.github/workflows/kinfolk-social-ci.yml`.

## Evidence
- Latest source/test commit: `6f890913dda3c87681da4c363cd66c61ddaf1604`.
- GitHub combined status on this commit: Vercel **failure** with target `https://vercel.com/alstoda59-9779?upgradeToPro=build-rate-limit`. Build-rate limit; not evidence of a failed app test.
- No native Node execution, GitHub Actions result, browser integration, real Supabase or physical device test verified in this run.
- Last verified READY preview remains Recovery206 `dpl_8CLMQy4do52Kz3HQGdMuoD2C2xmu`, which does **not** contain these newer changes.

## Next
1. Run Node CI on Recovery209 and inspect results. Recheck isolated Vercel preview after quota resets.
2. Verify signup/login/logout/session restore with owner-approved isolated Supabase and synthetic accounts.
3. Validate real Android/iPhone Home/Reels, settings/music, uploads, messages, privacy/RLS.
4. Native Capacitor builds and store compliance before any launch.

No production, Kinfolksworld, shared Supabase, or store submission changes.
