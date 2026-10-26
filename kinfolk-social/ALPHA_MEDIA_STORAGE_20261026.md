# Alpha media storage verification

2026-10-26. Isolated Supabase test project: viantpfagtbgyyzavmtv.

Applied migration alpha_private_media_bucket_owner_rls to the isolated test project only. Created private kinfolk-media bucket (50 MiB per object) and authenticated owner-folder INSERT, SELECT, UPDATE and DELETE storage policies. SQL verified bucket privacy and four policies. Security advisor reported zero findings.

Reviewed existing index.html uploads for posts, stories, channels, profile pictures and albums: each constructs paths beginning with state.user.id, compatible with owner-folder upload policy. This is static inspection, not an actual upload test.

Blocker: the signed() media reader requests signed URLs for content owned by other users, but the current SELECT policy only allows the uploader. Do not loosen SELECT without a privacy-aware media authorization design. No live auth or upload tests, native builds, or physical-device QA verified. Live Supabase and production unchanged.
