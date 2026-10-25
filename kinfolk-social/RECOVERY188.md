# Recovery188 | reject stale login form responses

Date: 2026-10-25. Full main Kinfolk Social only, no Kinfolksworld.

Inspected Recovery187 source, RECOVERY187.md, prior regression and current Vercel preview list before editing. Latest confirmed READY isolated preview before this change: dpl_Cgxy3BNYVTbucySdM9LkZZzapGr5 (Recovery187), target null.

A delayed password-token response could continue after the login form was detached or changed to signup. Added a guard immediately after the token response, before adopting a session, that requires the original form to remain connected and in login mode.

Application commit 77e4e6b77297152659c3f806e286f48248779f87. Added two offline Node regression scenarios in tests/recovery188-login-form-change.test.cjs, commit d95f86d104c8a3c6e78f68b50271307b5735e386. Test command: node kinfolk-social/tests/recovery188-login-form-change.test.cjs.

The tests are committed but execution has NOT been verified; no claim of pass. A new preview deployment has NOT been verified. Real isolated backend auth, rendered browser flows and physical-device builds remain pending. No shared Supabase, production alias, payment, or Kinfolksworld modifications.
