# Recovery381 | Signed album media must match the exact owner and album path

Date: 2026-10-31 (America/Los_Angeles). Scope: full MAIN Kinfolk Social in `kinfolk-social/`; Kinfolksworld excluded.

## Verified continuation
Continued from Recovery380 commit `b9fd63b34238216e68ee39c88ab7c0065219c859` and draft PR #77. Inspected Recovery380, effective Phase106 album viewer and prior synthetic tests, native Android/iOS source suite, Library prelaunch notes, GitHub Actions baseline run `41252865862` (SUCCESS), nonproduction Vercel deployment history and the existing isolated Supabase Alpha Test project. No restart or merge.

## Application and test changes
The effective Phase106 viewer previously checked each photo's owner_id and album_id but passed any nonempty storage_path to `signed('kinfolk-media',...)`. A malformed or malicious row with matching owner columns could request a signed URL for an unrelated storage object. The viewer now requires the storage path to be a flat, sanitized filename in the exact `<album owner>/albums/<album id>/` namespace before requesting any signed media URL. It rejects foreign owners, foreign albums, nested paths, backslashes, encoded slashes, URL delimiters, empty/dot basenames and unsanitized filenames. Valid photo tiles, Comments & replies, and Add Photos are preserved.

Extended the existing source-executed `tests/recovery378-album-view-session-isolation.test.mjs` suite with 11 synthetic cases (10 rejected paths plus one valid path). That suite is already part of `native/package.json` `alpha:media:source:test` and the Android/iPhone offline alpha verification gate; no duplicate runner was added.

Code commits: `4e31582096543dda4b7132877fc8aae3d65df076`, `641b32fbadc35d7ba1ee4ff9a9b460f627f5a349`.
Test commits: `6973691240a23a0138c5f6f2805c09aed91bc582`, `381eef425fa999284e7f089da870d7aa646fcbf2`.
Draft PR #78 targets Recovery380 only; do not merge or promote without review.

## Verification boundaries
- GitHub Actions source run `41257102272` tests the application/test head `381eef425fa999284e7f089da870d7aa646fcbf2`; check its final result independently. CI tests are synthetic, not real authenticated backend or physical-device QA.
- Vercel preview must be checked at exact final commit. A READY deployment is a build status, not rendered/authenticated or device proof.
- Read-only SQL on existing isolated Supabase project `viantpfagtbgyyzavmtv` returned 0 Auth users, 0 albums, 0 photos, and 16/16 public tables with RLS enabled. This does not prove two-account enforcement.
- No shared/live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, paid infrastructure or app-store submissions changed.

**Not launch-ready.** Real email verification, two synthetic-user JWT/RLS tests, backend-connected media/messaging and signed physical Android/iPhone QA remain required.
