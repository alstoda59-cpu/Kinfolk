# Kinfolk Social Recovery148 continuation (2026-10-24)

Scope: FULL MAIN Kinfolk Social only; Kinfolksworld excluded. This is an isolated development branch, not a production release.

## Source and changes
- Repo: alstoda59-cpu/Kinfolk
- Branch: kinfolk-social/recovery148-reaction-fallback, forked from recovery147.
- JavaScript fix commit: 82a5c587ca549d0d2d22d64f32a5a4951148a227.
- Offline Node regression test: test_recovery148_reactions.js, commit f715fed643551e4163dec83e60fd5973ba5aa67d.
- CI wiring: .github/workflows/kinfolk-social-ci.yml, commit b96f26aaeecf2d076099ea53052b0c5da57cedb9.
- RLS draft improvement: security/drafts/recovery146_post_dislikes_review.sql, commit 5944bcb71d7c2d724ff4dbb96a35b6b1f86ca04a.

The UI now preserves existing likes and comments if the new post_dislikes table is not yet installed. Only a recognized PostgREST missing-table error (PGRST205 or SQL 42P01) triggers fallback; unexpected errors remain visible failures rather than being swallowed. Dislike is disabled until its backend exists. Like/dislike buttons expose aria-pressed, and reaction controls wrap on narrow screens. The code still switches opposite reactions client-side; server-side mutual exclusion remains a release blocker.

## Read-only backend inspection
Project zojajuzmfjpvubzibzgg. Supabase list_tables verified posts.id, profiles.id, post_likes user_id/post_id are UUID; post_dislikes is absent. pg_policies read-only query verified post_likes SELECT/INSERT policies require a SELECT-visible post, with user ownership on writes. Draft dislike RLS now mirrors these rules and references profiles. NO schema, data, auth, RLS, or live settings changed. Draft not applied.

## Verification
- Direct isolated JavaScript execution of the actual reaction functions in a V8 mock: PASS for like when dislike table missing, dislike disabled when table missing, switch like -> dislike when table available, and mobile CSS wrap.
- New checked-in Node regression also covers unlike, reverse switch, permission error propagation and accessible pressed state. GitHub Actions result for this new test has NOT been independently verified in this run.
- Preview deployment dpl_HD8FcE42yqtJBRowfvAV4NXsFNuR from code+CI commit b96f26aaeecf2d076099ea53052b0c5da57cedb9: READY, target null (preview).
- URL: https://kinfolk-social-demo-no22f729y-alstoda59-9779.vercel.app/
- Authenticated Vercel fetch: HTTP 200 for /, /kinfolk-phase76.js and /manifest.webmanifest; phase76 response contains dislikesMissing and flex-wrap:wrap. HTTP 200 is not rendered browser QA.
- No real backend account tests, no physical device tests, no APK/AAB/IPA build or store submission.

## Remaining blockers
1. Review and test dislike schema/policies on a dedicated nonproduction Supabase database. The live shared project must not be mutated without explicit owner approval.
2. Server-side atomic like/dislike exclusivity and role-separated RLS checks, including private/blocked/teen content.
3. Real signup/login/logout/session restore and settings/media/messaging E2E with authorized synthetic accounts in isolated backend.
4. Android/iOS debug builds, deep links, safe areas, accessibility, content-policy review and physical device QA.
5. Production deployment, merge and store submission require explicit owner approval.
