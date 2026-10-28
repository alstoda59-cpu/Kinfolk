# Recovery288 | Reels account-switch isolation

Date: 2026-10-28 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only. Kinfolksworld excluded.

## Baseline inspected

- Recovery287 final source checkpoint `cc842949ee2fff13cfb5e52085cdf5680fade596`, `RECOVERY287.md`, Reels renderer, existing signed URL tests, native alpha package verification, and README.
- Branch discovery found Recovery287 as the newest preexisting Recovery28x branch. Library Kinfolk continuation notes and Vercel nonproduction deployments were inspected.
- Recovery287 source CI previously passed its synthetic suite; this does not certify Recovery288.

## Implemented and committed

- `bd97273b2b26e535fed1d9a08c269efe88995d7b`: capture the active user ID when rendering Reels and require the same ID in the existing generation/navigation check. A delayed reaction fetch or signed private-video URL can no longer insert account A's Reels into the screen after switching to account B while still on the Reels view. Existing teardown, URL safety, bounded signing, swipe, playback and dark design remain intact.
- `e38342ebfbe3c4d8ac925a678aada3ce53437d9b`: add synthetic Node VM regressions for switching accounts while reaction loading is pending and while private media signing is pending, plus a source identity-guard assertion.
- `ef436d216f7e8438816aed7143040527c2223446`: integrate the new tests into the native alpha Reels source verification command.
- `343c4ead6bc85a5424663defa09be9b262b6a2bd`: update README's latest checkpoint pointer.

## Verification evidence and limits

- Exact committed `kinfolk-reels159.js` Git blob `90a5dc00a8f7f47945c3247a48394a3016d1f7ab` compiled in a V8 JavaScript function runtime.
- **2/2 synthetic V8 runtime scenarios passed**: account switch before reaction loading completes makes zero signing calls and does not replace the feed; account switch during signing does not replace the feed. These are focused synthetic checks, **not** the committed Node test file or GitHub CI.
- Vercel preview `dpl_2cQQiAFvDf2MmeQMbKuPMPUFnGJc` is **READY**, target null, at `https://kinfolk-social-demo-9h1uumbva-alstoda59-9779.vercel.app/` for integration commit `ef436d216f7e8438816aed7143040527c2223446`. It predates the README and report commits. READY proves deployment only.
- The separate `Kinfolk Social Alpha Test` Supabase project was inspected **read-only** and was `ACTIVE_HEALTHY`; its 14 public tables report RLS enabled and its security advisor returned zero lints. This does not prove any two-account or teen policy enforcement.
- **Unverified for this checkpoint**: full committed Node suite, new GitHub Actions CI, real synthetic-account signup/email confirmation/login/logout/session restore, two-account RLS, actual private-video playback, current Android/iOS functional native builds and physical-device QA.

## Next blockers

1. Run and inspect the committed Node/CI suite for this exact branch and repair any failures without weakening guards.
2. Use the existing isolated nonproduction backend only with authorized synthetic accounts and an approved HTTPS email verification callback/App Links; do not touch shared live auth, data or policies.
3. Verify cross-account RLS, teen privacy, Home/Reels/Channels, profiles/themes/music, uploads/posts/comments, messages/notifications on functional Android/iOS builds and physical devices.
4. Do not declare alpha launch readiness or modify production/aliases/stores without explicit owner approval.

No shared live Supabase schema/data/auth/security, production deployments or aliases, Kinfolksworld, paid infrastructure or app-store submissions were modified.
