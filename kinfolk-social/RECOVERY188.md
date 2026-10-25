# Recovery188 | reject stale login form responses

Date: 2026-10-25. Full main Kinfolk Social only, no Kinfolksworld.

Inspected Recovery187 source, RECOVERY187.md, prior regression and current Vercel preview list before editing. Latest confirmed READY isolated preview before this change: dpl_Cgxy3BNYVTbucySdM9LkZZzapGr5 (Recovery187), target null.

A delayed password-token response could continue after the login form was detached or changed to signup. Added a guard immediately after the token response, before adopting a session, that requires the original form to remain connected and in login mode.

Application commit 77e4e6b77297152659c3f806e286f48248779f87. Added two offline Node regression scenarios in tests/recovery188-login-form-change.test.cjs, commit d95f86d104c8a3c6e78f68b50271307b5735e386. Test command: node kinfolk-social/tests/recovery188-login-form-change.test.cjs.

The tests are committed but execution has NOT been verified; no claim of pass. A new preview deployment has NOT been verified. Real isolated backend auth, rendered browser flows and physical-device builds remain pending. No shared Supabase, production alias, payment, or Kinfolksworld modifications.

## Follow-up deployment and CI verification
- Vercel reports READY preview `dpl_E4MvTqTKxkLS59DEuf9tGWFeGtPR` at `https://kinfolk-social-demo-614r9se4l-alstoda59-9779.vercel.app/`, target null, Git commit `d95f86d104c8a3c6e78f68b50271307b5735e386`. This includes the application guard and two regression tests, but not this documentation update.
- The checked GitHub Actions workflow `.github/workflows/kinfolk-recovery182-auth.yml` has not been updated to trigger on Recovery188 or run the Recovery188 test. An attempted workflow update was blocked by tool safety checks; no workflow change was made.
- Container has Node v22.16.0, but network access to GitHub was unavailable, so tests were not downloaded and executed. No claim of test pass or CI pass.
