# Alpha media storage verification

2026-10-26. Isolated Supabase test project: viantpfagtbgyyzavmtv.

Applied migration alpha_private_media_bucket_owner_rls to the isolated test project only. Created private kinfolk-media bucket (50 MiB per object) and authenticated owner-folder INSERT, SELECT, UPDATE and DELETE storage policies. SQL verified bucket privacy and four policies. Security advisor reported zero findings.

Reviewed existing index.html uploads for posts, stories, channels, profile pictures and albums: each constructs paths beginning with state.user.id, compatible with owner-folder upload policy. This is static inspection, not an actual upload test.

Blocker: the signed() media reader requests signed URLs for content owned by other users, but the current SELECT policy only allows the uploader. Do not loosen SELECT without a privacy-aware media authorization design. No live auth or upload tests, native builds, or physical-device QA verified. Live Supabase and production unchanged.

2026-10-26 continuation: Applied `alpha_private_video_bucket_owner_rls` on isolated test project. Created private `kinfolk-video` bucket, 50 MiB max, MP4/WebM allowed, authenticated owner-folder INSERT/SELECT/DELETE policies. SQL confirmed both media and video buckets are private; Supabase security advisor returned zero findings. Existing `index.html` uses `kinfolk-video` for uploaded videos and paths prefixed with `state.user.id`. Signed-media cross-account access remains blocked pending privacy-aware design. No live uploads, CI or device tests were run.
