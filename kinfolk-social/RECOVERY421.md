# Recovery421 | Confirm wallpaper settings writes before success

Date: 2026-11-02 (America/Los_Angeles). FULL MAIN Kinfolk Social only, `kinfolk-social/`. Continued directly from Recovery420 commit `cf8e5ee7e94654fd1f0a518d93cb9542b631bb79`, draft PR #117. Isolated Recovery421 branch; no merge or production change.

## Starting verification
- Inspected Recovery420 report, GitHub draft PR #117 and its exact head, latest Vercel READY nonproduction deployment at code/test commit `68c4806d`, Library Kinfolk notes and latest source/native workflows.
- Recovery420 final-head source CI [41483978783](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41483978783) finished SUCCESS.
- Recovery420 native run [41483967894](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41483967894) finished FAILURE overall: Android debug APK job succeeded, iOS Simulator job was CANCELLED. Do not claim iOS compiled.
- Existing isolated Alpha Test Supabase project `viantpfagtbgyyzavmtv` was identified; shared live project `zojajuzmfjpvubzibzgg` is excluded.

## Substantive implementation
- Application commit `234c5c47c871f58e9363830aa9ddece694ebe569`: the effective Phase76 animated wallpaper uploader now requests an exact affected-row count from `kinfolk_safety_settings`. Success requires exactly one row; missing, zero, multiple, rejected or thrown acknowledgments cannot display a false saved state. An ambiguous post-upload database write retains the uploaded file and blocks another upload for that account until a fresh Settings reload, preventing duplicate media after a lost response. Existing account/token checks remain in force.
- Regression commit `fa70ce8d06f439c2a81ec7385f479e64be037dc9`: updated the existing Recovery420 source-executed VM harness to model exact row counts, and added seven synthetic tests covering exact count request, missing/zero/multiple counts, backend error, thrown network rejection, and confirmed later uploads.
- Native workflow commit `c642d64ea90215f4625b00857dda57dd2d1b6164`: isolated Recovery421 branch added to offline-only Android/iOS workflow. Existing native `alpha:media:source:test` already runs the expanded Recovery420 test file.

## Verification boundaries
- Source checks: see Recovery421 GitHub Actions branch runs. The initial source run was superseded by subsequent commits. Do not claim final-head success until its actual run finishes.
- Native packaging: see Recovery421 GitHub Actions branch runs. It uses an intentionally unreachable packaging-only backend; even a compiled APK/Simulator package is not a backend-connected alpha.
- Vercel: the latest previously verified READY preview is Recovery420 code/test commit `68c4806d`. Recovery421 exact-head READY must be checked separately.
- No new Supabase migrations, Auth users, production deployments, aliases, Kinfolksworld changes, paid infrastructure or store submissions.
- Real signup/email verification, login/logout/session restoration, real two-client authenticated RLS, connected uploads and messaging, physical Android/iPhone QA and signed iPhone IPA remain unverified.

## Follow-up
Replace the legacy 365-day stored wallpaper signed URL with a private object-path reference and short-lived owner-authorized signing at render time, preserving existing user-supplied external URLs and handling legacy links carefully. Verify profile/Settings consumers and account-switch races with source tests. Then prioritize real isolated synthetic-account authentication and connected device testing.

**Status:** meaningful app fix and regression coverage committed; not yet a functioning backend-connected mobile alpha or launch-ready.
