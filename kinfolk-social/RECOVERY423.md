# Recovery423 | Isolated Auth smoke proof and Settings reactivation safety

Date: 2026-11-02 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/`, excluding Kinfolksworld. Continued from Recovery422 final commit `0dc22b3702f4911a11217606ef00389e91188172`. Isolated branch `kinfolk-social/recovery423-auth-smoke-confirmation-gate-20261102`; no merge, production deployment or store release.

## Verified starting point
- Inspected GitHub Recovery422/421 reports, latest draft PR #119 and its exact branch head, current tests and native scripts, Library notes (older Recovery232), and nonproduction Vercel deployment history.
- Recovery422 final-head source CI run [41500506327](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41500506327) completed **success**.
- Recovery422 native run [41500491408](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41500491408) completed **failure overall**: Android debug APK job **success**, iOS Simulator job **cancelled**. The APK is offline packaging-only, not a connected functional build.
- Latest inspected nonproduction Vercel READY preview `https://kinfolk-social-demo-iw2i3w91u-alstoda59-9779.vercel.app/` was built at Recovery422 test commit `28cfcae9`, **not** the Recovery422 final head.
- The existing isolated Alpha Test project is `viantpfagtbgyyzavmtv`; shared live project `zojajuzmfjpvubzibzgg` must not be touched. Previous read-only inspection reported zero Auth users. No new Auth users were created here.

## Substantive implementation
- Hardened the optional nonproduction Auth smoke client so it **only accepts the known isolated Alpha Test project** and a `sb_publishable_` client key, never an arbitrary Supabase project or secret/service-role key.
- An opt-in signup must return a user **without** a session or confirmed email; otherwise the smoke fails closed because mandatory email confirmation was bypassed. A signup response is not claimed as proof of email delivery.
- Existing-account login now checks the authenticated `/user` identity, expected email and `email_confirmed_at`. A refresh must preserve the same verified identity, followed by logout and rejected refresh-token reuse.
- Added synthetic negative regressions for other projects, secret keys, unconfirmed/mismatched login identities and auto-confirmed signup, while preserving default no-signup behavior.
- Fixed the effective Phase76 full Settings screen to capture the auth activation epoch, reject stale A→B→A/same-account relogins before saving, ignore late responses from old activations or replaced screens, and suppress duplicate concurrent submissions.
- Added source-executed synthetic Settings regressions for stale session, account switch, replaced screen, duplicate save and current-session success. Wired both Auth smoke and Settings regressions into Android/iOS offline native verification gates.
- Updated only application source, tests, native test script and the isolated native workflow branch allowlist. No backend migrations, real Auth calls, paid infrastructure or production changes.

## Verification boundaries and follow-up
- New Recovery423 source CI and native runs must be inspected at their **final commit**, not inferred from earlier runs. An Actions Node pass is synthetic test evidence; Android/iOS compilation and Vercel READY are independent.
- No actual synthetic Auth accounts or email inbox are available for end-to-end signup/confirmation. Opt-in Auth smoke was **not executed against Supabase**; only its source tests run in CI.
- A passing opt-in smoke would prove an existing confirmed account can log in/refresh/logout but still would not prove email delivery, native deep-link callback or physical-device QA.
- The offline native workflow uses an intentionally unreachable CI backend. A successful Android APK or unsigned iOS Simulator app is not a connected Android/iPhone alpha, nor a signed physical-iPhone IPA.
- Real signup/email confirmation, authenticated two-account RLS, connected media and messaging, device QA and store readiness remain unverified.

**Safety:** no shared live Supabase schema/data/auth/security, production Vercel/aliases, Kinfolksworld, real user messages, paid resources or app-store submissions modified.
