# Recovery282 | Capture-phase age safety for both signup headings

Date: 2026-10-27 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social `kinfolk-social/` only, excluding Kinfolksworld.

## Inspected baseline
- Recovery281 and Recovery280 GitHub branches, Recovery281 report, native package/Capacitor configuration, Phase79 signup, Phase129 last-resort age guard, native alpha verification scripts, prior Recovery226/232 Library notes, and recent nonproduction Vercel previews.
- Read-only inspection of designated isolated Supabase project `viantpfagtbgyyzavmtv`: ACTIVE_HEALTHY, public tables RLS enabled; policies for messages, notifications, friend requests and safety settings exist. This does not prove actual RLS isolation or teen protection with real authenticated test accounts.
- Recovery281 source CI and offline Android/iOS Simulator builds were previously verified; those artifacts predate this checkpoint and use unreachable packaging-only backend.

## Implemented code
- `7c51c54809e870dad0371c3620ef887746abf542`: Phase129's capture-phase DOB safety guard now recognizes **both** Phase76/Phase79 signup headings: `Create your Kinfolk` and `Create Account`. Previously the second heading could bypass this last-resort guard, although Phase79's primary signup validation still existed. Valid login screens remain unaffected.
- `98a80030683c98f7df7b52c135f1bcfadac397e1`: add five Node behavioral regressions for the actual Phase129 script, including under-13, malformed DOB, over-99, eligible ages and login-screen exclusion.
- `c26dd0ff6f92ab63cb52ef1f06d239baba4ec230`: include new regression in `native/package.json` `alpha:auth:source:test`, which is called by `alpha:verify`.

## Verification
- Fetched committed GitHub Phase129 blob `a8d5406e0618ae5b0de206b8a69b43c027b0b6da` and test blob `839174335ea5bbd1acc18b461e4f90d585a3bf4d`. Both were copied into a temporary local test directory; `git hash-object` matched each exact GitHub blob.
- Node.js `v22.16.0` executed `node --test tests/recovery282-signup-age-guard.test.cjs`: **5/5 passed**, zero failures. Phase129 passed `node --check`.
- Vercel confirmed a **READY nonproduction preview** for integration commit `c26dd0ff`: https://kinfolk-social-demo-n4rxds8tr-alstoda59-9779.vercel.app/ . READY is deployment state, not a mobile UI/backend E2E pass.
- No new GitHub Actions source CI, current Android/iOS builds, real synthetic-account email verification/login/logout/session restoration, cross-account RLS, or physical-device QA verified for Recovery282.

## Remaining blockers
- Owner-approved HTTPS email callback and allowlist/App Links, real synthetic accounts and email confirmation, live two-user RLS/teen safety tests on the isolated backend, functional-backend Android/iPhone packages, integrated Home/Reels/Channels/profiles/media/messages QA, and physical-device testing.
- No shared live Supabase schema/data/auth/security, production aliases, Kinfolksworld, paid infrastructure or app-store submissions modified.
