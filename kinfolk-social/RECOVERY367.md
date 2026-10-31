# Recovery367 | Reject obfuscated signup identities in the actual mobile app

Date: 2026-10-31. Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only; Kinfolksworld excluded.

## Verified continuation
- Continued directly from Recovery366 commit `637484b0ae11930b9d35537c10407163d00849f5`, isolated from `main` and production.
- Recovery366 exact-head source workflow [41188712708](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41188712708) completed SUCCESS. Its [nonproduction Vercel deployment](https://kinfolk-social-demo-dim6dyduf-alstoda59-9779.vercel.app/) was READY at the exact SHA; this does not prove functional signup.
- Reviewed Recovery362–366, actual Phase79 mobile signup, synthetic browser signup fixtures, real isolated Auth smoke, and Library prelaunch security notes.

## Substantive mobile runtime change
- The real Phase79 signup handler previously accepted any returned `user.id` and matching `user.email`, even when Supabase returned no email identities. An existing email may receive an obfuscated user-shaped response, which must not be presented as proof of a newly registered account.
- The mobile handler now requires an email identity with `provider: 'email'`, the returned user's own `user_id`, and the exact submitted email (case/whitespace normalized). Missing, empty, malformed, other-provider, wrong-owner and wrong-email identities fail closed before the verification/resend panel or Stay Logged In preference can be applied.
- Existing age/teen privacy enforcement, password policy, login/logout, session restoration, Home/Reels/Channels, profiles, media, messaging and dark mobile UI remain unchanged.

## Source and synthetic verification
- Code commit: `7b6011f95d1132765a08ab34635748e6a4255d14`.
- Updated existing success fixtures in `tests/recovery258-phase79-title.test.cjs` and `tests/recovery178-signup-stay.test.cjs` to include matching Supabase-style identities.
- Expanded executed Phase79 synthetic browser tests to reject obfuscated and mismatched identities; no backend or synthetic accounts are created by these tests.
- Exact-head CI and preview must be verified separately; this report does not assume green status.

## Still blocked / protected
- Real email delivery/callback, two confirmed isolated synthetic accounts and private-row RLS fixtures, backend-connected uploads/messaging, and physical Android/iPhone QA are unverified.
- No shared live Supabase data/schema/auth/security, production Vercel alias/deployment, Kinfolksworld, paid resources, or store submissions changed. Branch remains unmerged and draft-only. **NOT launch-ready.**
