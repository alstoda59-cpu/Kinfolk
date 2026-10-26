# Recovery235 | Mobile profile-editor efficiency and failed media-cleanup diagnostics

Date: 2026-10-26. Scope: full MAIN Kinfolk Social under `kinfolk-social/` only. Kinfolksworld excluded.

## Verified starting point
- Continued from `kinfolk-social/recovery234-auth-header-native-ci`, after inspecting its Recovery234 report, Phase95/Phase79/Phase100 sources, native packaging/configuration, existing profile-save tests, root GitHub Actions workflow, Vercel deployment history, Recovery133 and Recovery232 Library continuation notes, README, INTEGRATION.md and validation.json.
- Recovery234 source-check run `40340356597` ended **cancelled** during simulated browser regressions, following successful Node regressions and dependency installation. It is **not** a full passing CI run. The workflow cancels older runs when a branch receives new commits.
- The existing native alpha packages are still offline-only until a separately approved Supabase testing project is available. No real authentication, cross-account RLS, physical-device or signed-store verification was performed here.

## Isolated Recovery235 changes
- Branch: `kinfolk-social/recovery235-profile-mobile-polling-cleanup`.
- Application commit `ddf036f27669d39ba98488d9ab0c26059391befb` modifies only `kinfolk-phase100.js`:
  1. Profile editor's fallback DOM repair poll now runs every **2 seconds while visible**, rather than every **120 milliseconds even in background**. Existing MutationObserver and immediate mounting remain, so dynamic profile forms still mount promptly. This reduces unnecessary background work on mobile WebViews.
  2. Profile-media cleanup now detects and logs **Supabase Storage's returned `{error}`**, not just thrown exceptions. Best-effort cleanup still cannot replace the original save error. Orphaned uploaded files may remain if storage deletion is rejected.
- Synthetic regression commit `7eeeab1e4553956f2f03944c6506cefa75dd8024`: `tests/recovery235-profile-mobile-cleanup.test.cjs` exercises the actual cleanup helper for success, returned error, thrown error and no-path behavior, and the actual foreground-only polling callback.
- The fetched application and test files both passed V8 syntax parsing. Four synthetic cleanup cases plus the visibility-polling callback passed an isolated V8 execution against the fetched Phase100 source. The full Node/browser/native CI result for Recovery235 is **not yet confirmed**.

## Deployment
- Vercel deployment `dpl_EBN4vRX7VmbnZFJCFLL8FTnMLyaE` from test commit `7eeeab1...` is **READY**, `target: null`, at `https://kinfolk-social-demo-g4n1r2zya-alstoda59-9779.vercel.app/`.
- READY is not proof of working profile persistence or mobile functionality. The web preview still references the shared live Supabase backend: do **not** create synthetic test users on it.

## Next actions and blockers
1. Confirm final Recovery235 GitHub Actions result and fix any genuine failures; distinguish cancellations from failures.
2. Owner-approved isolated Supabase testing environment is still blocked on organization selection and any nonzero cost approval. Do not change live Supabase project `zojajuzmfjpvubzibzgg`.
3. Run synthetic adult/teen signup and cross-account RLS checks on isolated backend, then functional Android/iOS builds using its publishable key. Validate native email callbacks, physical-device behavior, app-store compliance and signing before release.
4. Continue addressing observed user-facing defects, avoiding new features, production changes or merges.

No changes to Kinfolksworld, production deployment or aliases, shared live Supabase schema/data/auth/security, real accounts, or store submissions.
