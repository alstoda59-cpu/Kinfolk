# Recovery358 | Cross-tab ownership of Stay Logged In preferences

Date: 2026-10-30 America/Los_Angeles. Scope: **FULL MAIN Kinfolk Social** under `kinfolk-social/`; Kinfolksworld excluded.

## Verified baseline
- Started from Recovery357 isolated branch head `fd06c38137b89c8a4c5355215921936d9d2020db`, not the repository default branch.
- Reviewed `README.md`, `RECOVERY357.md`, Phase95 runtime, Recovery356/357 synthetic tests, native package verification, Library prelaunch/Recovery232 notes and current Vercel preview history.
- Recovery357 exact-head source CI `41164488078` reported success; earlier native Android debug and iOS Simulator builds were reported successful. These do not prove backend/device readiness.
- Vercel preview `dpl_8Ffy3X7xZZE2hfpCWdxBz7KQyFVf` was READY for an intermediate Recovery357 commit `99e0b3e`, not the Recovery357 final head.

## Application fix
- `kinfolk-phase95.js`: previous version-counter rollback was tab-local. Another tab could save the **same** Stay Logged In values and the first tab's pending failed-login rollback could mistakenly erase that newer preference.
- Added a shared `localStorage` write-ownership marker, changed at the beginning of each save. Rollback checks both its own local version and this cross-tab marker before touching preferences. Successful rollback leaves a tombstone rather than reviving a prior owner's marker, preventing ABA/replay.
- Existing preferences remain `0`/`1`; the session-tab marker, dark mobile UI and authentication flow remain unchanged. The marker is metadata, not an authentication token or security secret.
- This is still best-effort coordination across browser tabs: localStorage writes are not transactional, and older app versions that do not write the marker cannot provide the same guarantee.

## Source regressions
- New `tests/recovery358-cross-tab-preference-owner.test.mjs` executes the real Phase95 preference closure in two synthetic VM tab contexts sharing local storage. Cases cover identical-value and opposite-value updates, valid rollback, owner tombstone and partial storage-write failure.
- Recovery356 test snapshots now omit only the new internal metadata key, retaining assertions for both real user-facing preferences and session marker.
- `native/package.json` alpha auth gate now includes the new source test.

## Evidence boundaries and remaining gates
- Code and test changes are committed to isolated Recovery358 branch; CI and native build status must be checked at the exact final commit before claiming success.
- No real isolated Supabase signup/email delivery, two-account RLS, private uploads/messaging, teen-safety E2E, backend-connected native packages or physical Android/iPhone QA has been performed in this recovery.
- The separate Supabase Alpha Test project is the intended nonproduction target, but no schema/auth/data/security mutation was made. No production or alias changes, Kinfolksworld changes, paid infrastructure or store submissions.
- **Not launch-ready.**
