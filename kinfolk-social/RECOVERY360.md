# Recovery360 | Require confirmed signup email before session persistence

Date: 2026-10-30 America/Los_Angeles. Scope: **FULL MAIN Kinfolk Social**, `kinfolk-social/`. Kinfolksworld excluded.

## Verified starting point
- Continued from isolated Recovery359 head `e5eaa2d62f63faee1f6fde667108f59ba37e874b` (draft PR #57), not the default branch.
- Reviewed Recovery359 and Recovery358 reports, README, actual Phase79 signup handler, signup/email synthetic tests, native alpha scripts and workflow, Library Recovery226 and prelaunch audit notes, Vercel nonproduction deployments, and latest GitHub branch/PR history.
- Recovery359 final-head source CI `41172566833` completed SUCCESS. Recovery359 native build CI `41172562747` completed SUCCESS for an offline-only Android debug APK and unsigned iOS Simulator app. These are not backend-connected/device E2E tests.
- Vercel nonproduction preview `dpl_Di7w7JoECb6pAPUfaMTqfTXjaPB3` reported READY at intermediate Recovery359 commit `1bb96efd`, not final Recovery359 head. Final-head Vercel check reported build-rate limit; READY does not prove functional login.
- Read-only check of separate `Kinfolk Social Alpha Test` project `viantpfagtbgyyzavmtv`: ACTIVE_HEALTHY, 14 empty public RLS-enabled tables, security advisor no notices. No RLS cross-account proof.

## Runtime correction
- The effective `kinfolk-phase79.js` signup handler previously treated any returned `data.session` as a verified signup session for Stay Logged In persistence and displayed "Opening Kinfolk", even if either signup user or session user had no `email_confirmed_at`.
- Added `signupSessionEmailConfirmed(data)`, requiring nonblank email confirmation timestamps on both signup and session identities before the existing exact-token session check and preference persistence.
- If an unconfirmed/malformed session is returned, keep the email-verification panel visible and do not persist Stay Logged In or claim private app access. The separate central `kf129ActivateSession` confirmed-email guard continues to block private UI and manage unconfirmed session cleanup.
- Preserved existing signup form, privacy/teen defaults, email resend, login, Home, Reels, Channels, profiles, music, uploads, messaging, dark mobile design, and all other features.
- This is a client-side defense, **not** proof that Supabase email confirmations are enabled or delivered. The signup handler does not independently sign out the unconfirmed session; central auth activation remains responsible for private-session rejection.

## Verification and release boundary
- Added six source-executed synthetic regressions for confirmed identities, missing/blank timestamps, absent sessions, and gate ordering. All use `example.invalid` and no real backend.
- Included new test in `native/package.json` `alpha:auth:source:test` and enabled isolated Recovery360 branch for offline-only Android/iOS CI. Check final exact-head source/native runs before claiming success.
- No live/shared or isolated Supabase schema/data/auth/security mutation, no production deployment/aliases, no Kinfolksworld changes, no paid infrastructure or store submissions.
- Still blocked: real synthetic signup/email delivery and callback, two-account RLS, functional media/messaging, teen-safety end-to-end, backend-connected native builds, signed physical-iPhone IPA, physical-device QA.
- **NOT launch-ready.**
