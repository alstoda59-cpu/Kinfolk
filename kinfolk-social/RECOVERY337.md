# Recovery337 | Confirmed-session login preference regression repair

Date: 2026-10-30 (America/Los_Angeles). Scope: full MAIN Kinfolk Social only, `kinfolk-social/`. Isolated continuation from Recovery336 final commit `a30f8714005a1e012fde7d7b325fc44e6b6a2505`.

## Evidence inspected before editing
- Recovery336 exact-head source CI [41014183286](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41014183286) **failed** at "Auth event and login preference regressions (synthetic only)." The complete Node regression suite, Chromium/WebKit browser regressions, offline reactions and session restoration passed before this step.
- Full failing job log showed `test_recovery151_auth_preference.js` threw "Your email still needs to be confirmed" from Phase95 `adopt`. The legacy synthetic `setSession` and `getSession` users lacked `email_confirmed_at`, while Recovery335 correctly requires explicit confirmation at both stages.
- Inspected Recovery336 report/README, the Phase95 implementation, existing test, native CI workflow, Library prelaunch/continuation notes, and nonproduction Vercel deployment history. Recovery336 READY previews are build evidence, not real backend or device QA.

## Actual change
- Repair the legacy preference-order regression to model email-confirmed synthetic token, adopted session and active session. Preserve existing storage preference ordering and event assertions.
- Add two negative checks: an unconfirmed adopted session and an unconfirmed active session must each reject with the email-verification error. This increases the Recovery151 test's reported scenarios from 7 to 9 and keeps the production Phase95 guard intact.
- Enable Recovery337 in the existing offline-only Android APK/iOS Simulator workflow. Build credentials remain unreachable CI-only placeholders. No shared backend use.

## Verification boundaries
- Source change: `1d4992a6314e2f68ade8146fae22b75cec9c63e8`.
- Native workflow change: `4f2407c04ec73c4e73fa9fb2e222e8ac3f51ca11`.
- Exact-head source CI, native Android/iOS compilation and preview status must be checked independently after final documentation commits. Do not infer success from source inspection or an earlier READY preview.
- Real isolated Supabase signup, email callbacks, logout/session restoration, two-account RLS, missing Community/Channel tables, private media, messaging and teen-safety enforcement are unverified. Physical Android/iPhone QA and signed iPhone distribution are unverified.
- No production, shared live Supabase schema/data/auth/security, Kinfolksworld, paid resources, aliases or app stores modified.
