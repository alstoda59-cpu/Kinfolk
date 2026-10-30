# Recovery344 | Alpha video upload storage preflight

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only. Base Recovery343 commit `5e679bb099da13da4995365a752cd0b265ae6c14`, draft PR #41. No production merge/release.

## Verified before changes

- Recovery343 exact-head source CI [41063862108](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41063862108) and offline Android/iOS native CI [41063847587](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41063847587) both concluded SUCCESS at `5e679bb099da13da4995365a752cd0b265ae6c14`. This proves synthetic source/build checks only.
- Read-only Supabase SQL on the isolated `Kinfolk Social Alpha Test` project `viantpfagtbgyyzavmtv` confirmed private `kinfolk-video` bucket `file_size_limit=52428800` (50 MiB), `allowed_mime_types=['video/mp4','video/webm']`. `kinfolk-media` is also private with 50 MiB limit. Shared live project `zojajuzmfjpvubzibzgg` was not queried or changed.
- Read Recovery343, Recovery342, README, existing Recovery302 video upload regression, native package/workflow and Library prelaunch notes. Vercel READY previews exist for intermediate Recovery343 commits; final-commit preview readiness was not established in this inspection.

## Actual app fix

- The active video upload modal previously offered MOV/QuickTime despite the isolated alpha bucket refusing that MIME type. It also attempted storage writes for arbitrarily large videos despite a 50 MiB object limit.
- The existing `index.html` video form now advertises MP4/WebM and 50 MiB alpha limits; `uploadVideo` rejects empty, oversized and unsupported MIME files *before* locking the form, generating a storage path or making a network request. It preserves owner/channel checks, session-epoch isolation, upload metadata and cleanup.
- Extended `tests/recovery302-video-upload-account-isolation.test.mjs` with six real-source synthetic regression cases for over-limit, zero-byte, MOV, missing/unsupported MIME, exact 50 MiB WebM boundary and visible UI guidance. Existing Recovery302 tests remain intact.
- Enabled this isolated branch in the existing offline Android/iOS native workflow; no real backend credentials are embedded.

## Limits and next work

- This is an alpha backend compatibility guard, **not** large-video/transcoding support. Kinfolk's long-video product goal remains pending a separately approved storage/resumable-upload design. Do not silently raise the server bucket limit or route to shared production.
- Exact Recovery344 commit, source CI, native compilation and Vercel preview must be verified independently after commit. No real upload, signup/email, two-account RLS, signed Android/iPhone release, or physical-device QA has been performed.
- No shared live Supabase schema/data/auth/security, production Vercel/aliases, Kinfolksworld, paid resources or app stores were modified.
