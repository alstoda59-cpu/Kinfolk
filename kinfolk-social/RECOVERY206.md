# Kinfolk Social Recovery206 | verified signup session preference guard

Date: 2026-10-25 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, not Kinfolksworld. This supersedes the **unapplied patch status** recorded in RECOVERY205.md. Branch: `kinfolk-social/recovery205-signup-session-verification`.

## Inspected before implementation
- GitHub Phase79 signup source, Recovery205 audit and minimal diff, four-case Recovery205 regression, Recovery179–181 signup regressions, README, validation.json, INTEGRATION.md, Recovery204 notes.
- Library Recovery133 continuation and Recovery139 notes.
- Vercel project preview deployments. No production, shared live Supabase or Kinfolksworld modifications.

## Implemented (source of truth)
- `kinfolk-phase79.js`: when `sb.auth.getSession` is absent, signup no longer assumes the active account is verified. It raises a visible verification error and **does not save the Stay Logged In preference**. Commit `c274f51cddd1d3b9422c6bfd5e0023024aee03f3`.
- `tests/recovery179-signup-session-tab.test.cjs` and `tests/recovery180-signup-storage-atomic.test.cjs`: synthetic Supabase mocks now supply a matching current session for successful signup, so legacy tests still model a real verified client. Commits `b3d6e7b7e0f2013531d08b02517b71a134cbcd97`, `0a9973a3c0becd6acd9b8d393ff09500cd29a42d`.
- `.github/workflows/kinfolk-social-ci.yml`: gates on Recovery179, 180, 181, and 205 signup regression suites. Commit `fea2d4b92657bd7b6de272f2bf772a9dc845addf`.

## Verification
- Ran the actual committed four Node test source files against the fetched updated Phase79 source using an in-memory V8 adapter with synthetic DOM/storage/Supabase. **18/18 assertions passed** (5 Recovery179 + 4 Recovery180 + 5 Recovery181 + 4 Recovery205). This is **not a native Node process, GitHub Actions, rendered browser, real Supabase, or physical device** result.
- GitHub commit status reported Vercel success for `fea2d4b9`; GitHub Actions workflow-run lookup returned no runs (its connector only covers PR-triggered runs). **GitHub Actions remains unverified**.
- Vercel isolated preview `dpl_8CLMQy4do52Kz3HQGdMuoD2C2xmu`, state **READY**, `target: null`, commit `fea2d4b92657bd7b6de272f2bf772a9dc845addf`, URL `https://kinfolk-social-demo-wyf5tv12o-alstoda59-9779.vercel.app/`. No HTTP/browser behavior check performed for this preview.
- This fix fails closed for **preference persistence**, not proof of full session teardown if Supabase verification itself is unavailable. Server-side teen/privacy/RLS and session restoration remain unverified.

## Next acceptance gates
1. Verify GitHub Actions Node suite and browser startup on the isolated preview.
2. Obtain owner-authorized nonproduction Supabase and synthetic accounts; verify real signup, email confirmation, login/logout, cold-start and one-tab session behavior.
3. Test Home/Reels, theme/music, uploads/comments, messaging/notifications and RLS on Android/iPhone.
4. Build native Capacitor Android/iOS artifacts, configure verified native email callbacks and perform physical-device QA. Review store age/content/privacy/account-deletion requirements before any release.

No production deployment, production alias changes, live Supabase mutation, merge, store submission or payment commitment.
