# Recovery345 | Isolated alpha post/story image upload preflight

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only. Base: Recovery344 commit `779ff72e0caa0a793326b4ddd87cf965ae5c0ed7`. Isolated draft branch; no production merge or release.

## Read-only verification before changes

- Inspected Recovery344 report and README, active `index.html` post/story handlers, Recovery303 media-integrity regressions, legacy composer account-isolation tests, offline native package/workflow, Library continuation notes, GitHub Actions and Vercel preview.
- Vercel Recovery344 exact-head deployment `dpl_qR15Kyrt5ioyCqtzSakCVNuL8pNH` was READY. This is only deployment readiness, not backend functionality.
- Read-only query of **isolated** Supabase project `viantpfagtbgyyzavmtv` confirmed private `kinfolk-media` bucket: 50 MiB (`52428800` bytes), permitted images `image/jpeg`, `image/png`, `image/webp`, `image/gif` (plus separately permitted video/audio). The `kinfolk-video` bucket permits MP4/WebM only and is also limited to 50 MiB. Shared live `zojajuzmfjpvubzibzgg` was not queried or modified.

## Implemented

- `df210853df2a0f410e6e1bec5d455595eb1171cc`: actual post/story composers now reject zero/invalid-size, over-50 MiB, missing MIME, and unsupported photo types **before** locking the form or calling Supabase Storage. Both forms explain supported image types and alpha size. Text-only posts and stories remain allowed; existing account-epoch and orphan cleanup protections remain unchanged.
- `1bb298281ffea830dc81532ad075751ff967ae98`: extend the real-source Recovery303 Node VM suite with 11 new cases (two composers each: oversized, empty/invalid, unsupported/missing MIME, exact-size boundary, text-only; plus visible UI guidance).
- `45705543506dd99d427b8720e58d8a6743fd9ea4`: include Recovery345 in offline-only Android/iOS native CI trigger.
- `6bc1d5b2916d0336a31b176c35bacf4a854aa0be`: repair legacy synthetic composer fixtures to include actual image MIME and size. Earlier source run [41080784997](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41080784997) passed 720/724 Node tests; four old fixtures failed because they supplied only a filename, not a valid image. This is not evidence of four application failures.

## Verification boundaries

- Source CI after the legacy fixture repair: verify exact-head run before reporting success.
- Android/iOS CI: offline packaging only, uses intentionally unreachable CI backend, not real signup/email/RLS or physical devices.
- Nonproduction Vercel READY means assets deployed, not that Supabase uploads work.
- No real synthetic-account Supabase writes, email delivery, two-account RLS, Community/Channel schema validation, physical-device tests or signed iPhone IPA performed.
- Real alpha backend still needs its missing story/video/channel/group tables and approved setup/functional tests. Do not treat client-side preflight as server-side enforcement.

## Safety

No production Vercel or aliases, shared live Supabase schema/data/auth/security, Kinfolksworld, paid resources, or app stores modified. All tests use synthetic local fixtures. No launch-readiness claim.
