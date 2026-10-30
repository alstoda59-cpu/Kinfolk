# Recovery353 | Reject adopted auth sessions without clearing a newer login

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social, `kinfolk-social/` only. Continued from Recovery352 exact head `611dff95a46fda304311fec4181543d57697f937` on isolated branch `kinfolk-social/recovery353-adopted-auth-rejection-cleanup-20261030`. No merge, production release or app-store submission.

## Inspected before changes

- Latest Recovery352 branch, draft PR #50, README, RECOVERY352.md, effective `kinfolk-phase95.js`, Recovery332/335/352 synthetic auth tests, native auth verification gate and native CI workflow.
- Recovery352 source run [41138206853](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41138206853): its source job and all listed stages completed successfully. This is **synthetic** evidence, not live authentication.
- Nonproduction Vercel READY deployments for intermediate Recovery352 commits, including `c33a883f28fd16adfd0b3273dd6ddd60f97c44a5`; not proof of Recovery352 final-head deployment or functional signup.
- Library Recovery232 and earlier continuation notes. The designated isolated Supabase project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY. Shared live project `zojajuzmfjpvubzibzgg` is explicitly out of scope.

## Actual application change

The effective Phase95 `adopt()` already rejected an adopted session with a different email or missing email confirmation, but its catch path only knew the original password-token identity. When Supabase `setSession` returned a different access token, the rollback's new exact-token guard could not clear that rejected adopted session. This could leave an unconfirmed or wrong-email local session behind even though the UI reported failure.

- Rejections after `setSession` for mismatched adopted email or unconfirmed adopted account now carry the **actual adopted account ID and access token** into the existing local-only rollback.
- Rejections after `getSession` for changed email or missing confirmation also identify the originally adopted token, never the newer session token.
- If an active session has the same user ID but a different access token, adoption now rejects it rather than returning another login's session. Cleanup's token check preserves the newer session.
- Retains the existing two-read rollback guard and local-only sign-out. This is not atomic against independent concurrent Supabase operations; live two-account tests are still necessary.

## Tests and native integration

- Added seven source-extracted VM regressions in `tests/recovery353-adopted-session-rejection.test.cjs`: wrong-email adopted cleanup, unconfirmed adopted cleanup, wrong-email active cleanup, unconfirmed active cleanup, newer same-user token rejection, newer token preserved during cleanup and confirmed matching success.
- Added tests to `native/package.json` `alpha:auth:source:test`.
- Enabled Recovery353 in offline-only Android/iOS native CI. CI packages use an unreachable synthetic Supabase placeholder, **not** the shared live or isolated real backend.
- Application commit: `8d60fb4dd602d844237792236058c3f3fd8955c5`. Test commit: `88c33adf569d447de9dd7e23f0506b1a9cfc7994`. Native test-gate commit: `02de8fc99ed1690f25818484004dc5efab2a1ef5`. Workflow commit: `1e4d8e8829fdd5e134f4794780eb978f02e25e7d`.

## Verification boundaries

At report creation, Recovery353 source CI, Android APK compilation and iOS Simulator compilation have not yet been confirmed at the final report commit. Check exact SHA, job conclusions and artifacts independently. Vercel READY is only a preview-build status; physical Android/iPhone QA has not been performed.

Real isolated-backend signup and email delivery, logout/session restoration, two synthetic accounts with cross-account RLS, private uploads, posts, messaging/notifications, teen safety, missing Community/Channel/group-chat schema, signed iPhone IPA and physical-device testing remain open. No live Supabase schema/data/auth/security, production Vercel deployment/aliases, Kinfolksworld, paid infrastructure or stores were modified.
