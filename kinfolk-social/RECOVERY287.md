# Recovery287 | Reels private media loading and CI regression repair

Date: 2026-10-28 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/`; Kinfolksworld excluded.

## Baseline inspected
Recovery286 report and source, latest recovery branches, Vercel READY preview for Recovery286 final commit `9402687f`, native packaging scripts and package.json, legacy Reels tests, and Library Recovery232/139/133/137 notes. The source CI pipeline has strict activation-result checks introduced in Recovery285; several older synthetic fixtures still returned undefined on success.

## Implemented
- `3959261cd4237a21b8b2a5deb0fc9308e0920963`: Reels signed private-video URLs now resolve with up to four concurrent requests, preserving slide order. A single failed URL yields an unavailable media card rather than rejecting the entire Reels render. A navigation/generation check prevents scheduling further URLs after leaving Reels and prevents stale rendering. Existing swipe, pause, reactions, comments, share, remix, save, download, dark mobile design and privacy URL sanitation are preserved.
- `46b1c1d8ed0d6d5df195b811ddafcf9b3aebc256`: six Node tests for empty/external feeds, bounded concurrency and order, failure isolation, navigation cancellation and renderer integration.
- `aaf83c265763bd887ff3efd8deb0f99dea9d47ca`: native alpha verification runs the new Reels test file.
- `61b9395c`, `4d6032fe`, `d2132d86`: repair three old login fixture mocks to explicitly return true on successful activation, consistent with Recovery285 production fail-closed behavior. Do not relax the application guard.
- `0cb7426c2bf78a77978e10f7f1789ceca0f80b14`: update the old Recovery201 source assertion to check the new bounded signed URL path and stale navigation guard.

## Verification and boundaries
- Initial GitHub Actions run `40671771107` failed with 8 synthetic Node regressions: seven obsolete successful-activation mocks and one obsolete Reels direct-await source assertion. These were inspected in job logs and corrected. A subsequent run for commit `0cb7426c` reached and passed the complete synthetic Node .cjs suite; the remaining browser/native steps and final outcome must be checked from Actions.
- Nonproduction Vercel preview was READY for application commit `3959261c` and integration commit `aaf83c26`. READY is deployment evidence only, not real playback or backend validation.
- No real Supabase signup/email/login/RLS, private-video playback, physical Android/iPhone QA, current native functional build, signed store artifact or production release was performed. Functional native alpha still requires the owner-approved isolated backend configuration and HTTPS callback/App Links proof.
- No shared live Supabase schema/data/auth/security, production aliases, Kinfolksworld, paid resources or store submissions modified.

## Next work
Check the latest CI job and fix any remaining failures without weakening safeguards. Then use the designated isolated backend and approved callback for synthetic-account end-to-end auth/RLS, private media and native-device QA.
