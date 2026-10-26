# Recovery234 | Publishable-key login request and native CI verification

Date: 2026-10-26. Scope: FULL MAIN Kinfolk Social, `kinfolk-social/`, excluding Kinfolksworld.

## Source of truth and review
- Continued from Recovery233 branch `kinfolk-social/recovery233-native-backend-isolation` at commit `c1f5322fd26482aa1d22aaba3b2a6a3e5ef88953`. Recovery232 and Recovery133 Library continuation notes, current GitHub source/README, Recovery233 notes, native packaging scripts, existing Node tests, CI and Vercel previews were inspected.
- Recovery233 native Android/iOS CI run `40332063635` completed successfully (Android debug APK and unsigned iOS Simulator app), **with offline-only backend**. This is not a functional authenticated alpha and is not physical-device verification.
- Recovery233 full source-check run `40332063719` failed specifically at `Check packaged login and signup module`: raw `cmp` compared intentionally rewritten native auth modules to the unmodified web source. Node and prior browser checks passed; a packaging comparison failure is not evidence that app features failed.

## Changes on isolated Recovery234 branch
- Branch: `kinfolk-social/recovery234-auth-header-native-ci`.
- `kinfolk-phase95.js`, commit `a312f6e7042e7f1c193a3a71da16a7727ab09402`: the password-token REST request now sends the Supabase publishable key on `apikey` only, not `Authorization: Bearer sb_publishable_...`. The latter is not a user JWT. Timeout, token/session validation, login screen guard and UI are preserved.
- `tests/recovery234-publishable-auth-header.test.cjs`, commit `c3e9589f329cc1a9e1559689fc8364ee37401b9f`: two synthetic tests execute the real Phase95 token-login function and assert correct request method, endpoint, JSON credentials, publishable header, absence of bearer API key, abort signal, successful token response and rejected credentials. No real credentials or backend calls.
- `.github/workflows/kinfolk-social-ci.yml`, commit `12cdd126113732d7974bfd920664709ff28ee77d`: replace invalid native-vs-web `cmp` with `npm run alpha:verify`, which checks all native app modules against source **after the expected backend isolation substitutions**, checks bundled local SDK and excludes the live project. This restores meaningful native package verification instead of weakening checks.

## Verification status
- The three Recovery234 changes were fetched back from the isolated GitHub branch and verified present.
- Vercel READY isolated preview from `12cdd126...`: `dpl_5wy4YUMJF25Z5DaGcEzMDbeB83m5`, `https://kinfolk-social-demo-ncq9q8qqt-alstoda59-9779.vercel.app/`, target null. READY is **not** browser/real-auth/device verification. Web preview continues to reference the shared live Supabase project; do not run synthetic accounts against it.
- Full Recovery234 source CI run `40340356597` was pending at the time of initial review; verify its final conclusion and investigate any failures before marking it passed.
- Supabase documentation on publishable keys: https://supabase.com/docs/guides/getting-started/api-keys . These are not JWTs; use `apikey` rather than bearer authorization for direct unauthenticated calls.

## Blockers and next actions
1. Confirm full Recovery234 source CI and native package verification; resolve failures on the isolated branch.
2. Provision an owner-approved, separately billed/nonproduction Supabase project **only after** organization and any nonzero cost are explicitly approved. Do not touch the live project `zojajuzmfjpvubzibzgg`.
3. Run synthetic signup, email verification, login/logout/session restore, cross-account RLS, teen privacy, uploads and messaging against the isolated backend. Then build against its actual publishable key and conduct physical Android/iPhone and deep-link tests.
4. Verify app identifiers, signed AAB/IPA, moderation, privacy, accessibility and store policy before seeking explicit launch approval.

No production deployment, production alias, shared live Supabase data/schema/auth/security, Kinfolksworld, real users, or store submissions were changed.
