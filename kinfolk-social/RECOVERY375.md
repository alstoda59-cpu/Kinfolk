# Recovery375 | Preserve album media after ambiguous database insert outcomes

Date: 2026-10-31. Scope: full MAIN Kinfolk Social app in `kinfolk-social/`; Kinfolksworld excluded.

## Continuation and source inspection
- Based exactly on Recovery374 draft PR #71, final head `4fcd47847d9c77d3597eff8b34d1d60f92221ffe`, with no merge or redesign.
- Inspected newest recovery branches, Recovery374/373, README, effective Phase106 upload helper, Recovery236 and Recovery373 source-executed tests, isolated-alpha migration drafts, native package scripts, Library prelaunch audit and earlier native build notes, and recent nonproduction Vercel previews.
- Latest verified inherited READY preview was `https://kinfolk-social-demo-m2hho95zs-alstoda59-9779.vercel.app/` at Recovery374 intermediate commit `ca802bd279bb56f2f56cb7fe52a8c0d76785ef99`. It is NOT proof of Recovery375 deployment or functional QA.
- Recovery374 source CI succeeded in GitHub Actions run `41224777682`. Do not treat that result as Recovery375 CI.

## Application defect and fix
- Previous Phase106 cleanup deleted an uploaded object whenever `album_photos.insert()` returned an error or threw, even though a transport error can arrive **after** a committed database row. This could leave a saved album photo pointing at deleted media.
- The Phase106 helper now tracks when the database INSERT has been attempted and only cleans storage when the INSERT has **not** been attempted, or when PostgREST explicitly confirms `count: 0`.
- A returned PostgREST error, thrown network failure, missing count, or unexpected count is treated as ambiguous; preserve the object and tell the member to refresh the album before retrying. A confirmed one-row insert still succeeds. Album owner preflight and account/form checks remain intact.
- This deliberately prioritizes preventing broken references over automatic orphan cleanup. Ambiguous objects may require a later reviewed reconciliation process; never blindly delete by client guesswork.

## Synthetic source tests
- Extended `tests/recovery373-album-insert-ack.test.mjs` with a thrown-after-insert network failure and changed error-response expectations.
- Updated historical `tests/recovery236-album-account-guard.test.cjs` so it no longer expects destructive cleanup on an ambiguous insert error.
- Tests execute the effective Phase106 helper with synthetic accounts, mocked PostgREST and storage. They are not real Supabase, email, or device tests.
- Application commit `484cf7a89c548ce7f24a1f5a59c0ebb9fbecd304`, tests `a1960a65b0c44b268512dd62319d371901bd833c` and `85fa32a99ae6e32322fdffeb577a7e6379701140`.
- Final CI, exact-head preview and native artifact status must be checked independently after this report.

## Unchanged safety boundaries and blockers
No production deployment or aliases, shared live Supabase schema/data/auth/security, Kinfolksworld files, paid resources, real accounts or app-store submissions were touched. Isolated Supabase alpha still needs reviewed album-table migration, synthetic two-account RLS enforcement, real email confirmation and backend-connected media/messaging. Signed installable native builds and physical Android/iPhone QA remain unverified. **Not launch-ready.**
