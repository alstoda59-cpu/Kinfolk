# Recovery419 | Delete orphan media comments with their video/photo targets

Date: 2026-11-02 (America/Los_Angeles). FULL MAIN Kinfolk Social only, under `kinfolk-social/`. Continued from Recovery418 draft PR #115, head `c79882b9ff0150c652b0d978698abbb838bb2b06`. No Kinfolksworld or production changes.

## Starting verification
- Reviewed Recovery418, media-comments RLS migration and synthetic tests, native package source gates, GitHub Actions 41464430723 / 41464430678, Library prelaunch audit, nonproduction Vercel deployments and the existing isolated Supabase Alpha Test schema.
- Recovery418 final-head source CI 41464430723 **succeeded**. Its Android offline debug APK build succeeded (artifact `13150951508`); iOS Simulator job **cancelled**, not a pass.
- The isolated backend had `media_comments` with threaded parent cascade but no cleanup when a video or album photo was deleted. This left inaccessible orphan comments.

## Implemented
- New branch `kinfolk-social/recovery419-media-comment-orphan-cleanup-20261102` based on Recovery418.
- `e4eeb8d385519de6e60613940e97cfad3c03c686`: `migrations/ALPHA_only_media_comments_target_delete_cleanup.sql`. Adds two AFTER DELETE triggers for `kinfolk_videos` and `album_photos`, with a tightly scoped SECURITY DEFINER function that deletes comments for the exact target type and ID, including threaded replies through the existing parent cascade. Unexpected trigger attachments raise an exception; API roles cannot execute the function directly.
- `e5f56f51283c255069eb3c97d44853490a8f7f64`: seven static source regression cases for exact-target cleanup, fail-closed trigger binding, parent cascade and private execution.
- `ac258f582a1d68498b09f1da76cc390bcb410ef0`: added Recovery419 tests to the existing Android/iOS native media verification gate.
- Applied the migration **only** to existing isolated Supabase Alpha Test project `viantpfagtbgyyzavmtv`. Migration result: `success:true`. Shared live `zojajuzmfjpvubzibzgg` was never accessed for writes.

## Real isolated database verification
- Read-only catalog inspection confirmed both AFTER DELETE triggers, fixed `search_path`, SECURITY DEFINER and no direct EXECUTE privilege for `anon` or `authenticated`.
- Executed an explicit `BEGIN; DO ...; ROLLBACK;` transactional synthetic-data test against the isolated database. It inserted one synthetic Auth/profile owner, two videos, an album with two photos, four root comments and two threaded replies. Deleting the first video removed its root/reply but preserved the other video's comment. Deleting the first photo removed its root/reply but preserved the second photo's comment. Deleting the album cascaded to its photo and removed the remaining photo comment. Final video deletion left no comments. No assertion raised.
- A separate read-only query after rollback confirmed **zero** Auth users, media comments, videos and photos remained.
- Security advisor: zero findings.
- This is a real database transaction test of cleanup triggers, **not** signup/email confirmation, an authenticated client-session RLS test, or physical-device QA.

## Remaining alpha gates
- Real synthetic-account email confirmation, login/logout/session restoration and two-account authenticated RLS tests; backend-connected media/posts/messaging/notifications; physical Android/iPhone testing and a signed iPhone IPA.
- The native workflow deliberately packages with an unreachable CI-only backend; no connected alpha claim.
- No shared live Supabase changes, production Vercel deployment/aliases, Kinfolksworld files, paid resources or store submissions.
