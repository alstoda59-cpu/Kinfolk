# Recovery394 | Same-account reauthentication isolation for profile media saves

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only. Kinfolksworld excluded.

## Starting checkpoint and review
Continued from isolated Recovery393 PR #90, final commit `4840e7d13aa2169b4f6f9879cbaf929be95673ef`. Verified its GitHub Actions run 41311734109 completed successfully (47/47 steps; 993/993 Node tests) and the nonproduction Vercel preview at source/native-gate commit `35779311` was READY. Reviewed RECOVERY393.md, existing Phase100 profile save and profile regressions, native package/Capacitor configuration, the main CI workflow, historical Library continuation notes, and read-only isolated Alpha Test Supabase security advisor (no findings). No real Auth users or device evidence was inferred from source CI.

## Application fix
The effective `kinfolk-phase100.js` profile save previously pinned writes to a user ID and editor DOM node, but not to the auth activation. A logout/relogin into the same account could leave an old asynchronous avatar/wallpaper upload or profile write eligible to continue or show success in the new session.

The initiating `kf129Epoch` is now captured before asynchronous work and checked at all profile save preflight, upload, extras-write and profile-write boundaries. UI hydration, rendering, errors, success notifications and button restoration also require the initiating activation. The existing conservative Recovery393 rule remains: media potentially linked by an uncertain database update is preserved; unlinked uploads are cleaned only before profile UPDATE dispatch or after explicit zero-row acknowledgment. Existing dark mobile UI and all other features remain unchanged.

## Test coverage and packaging
- Source commit `f156cc362c483f4daea6746a6aa1ec0648b4c4a1`: profile-save auth epoch isolation.
- Regression commit `18e4642db7fd978862648045aa4cf8aae8c6436f`: four synthetic, source-executed same-user relogin cases in the existing Recovery230 harness: during upload, during extras write, during profile UPDATE, and during UI hydration. The harness uses a file-relative source path so it can also run from the native package directory.
- Native gate commit `00e4add6a205703cfd19b7e7510bcc95ecd3cca3`: requires the same source-executed Recovery230 regression as part of `alpha:profile:source:test` and `alpha:verify` for offline Android/iOS packaging.
- GitHub Actions and Vercel results must be checked against the final head separately. A READY preview is not an authenticated test; a packaging-only CI build uses an unreachable placeholder Supabase URL and cannot prove functional login or native device readiness.

## Safety and next steps
No shared live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld, real user accounts, paid resources, or store submissions changed. Isolated Supabase Alpha Test project `viantpfagtbgyyzavmtv` is read-only inspected, not used to create accounts. Confirm authorized synthetic inboxes and callback before real email verification and two-account RLS testing. Next: verify exact-head CI, resolve failures if any, then build/test authenticated isolated Android and iOS packages and physical-device QA. **Not launch-ready.**
