# Kinfolk Social isolated alpha Home backend | 2026-10-26

**Scope:** FULL MAIN Kinfolk Social only, `kinfolk-social/`. Source branch `kinfolk-social/alpha-signup-baseline-20261026`; current branch `kinfolk-social/alpha-feed-rls-20261026`. No changes to Kinfolksworld, production, live Supabase project `zojajuzmfjpvubzibzgg`, or aliases.

## Actual implementation
- Commit `500937050d7060d2532348517482105da9605ffb`: added `migrations/ALPHA_only_home_posts_comments_rls.sql`, then applied migration `alpha_home_posts_comments_rls` **only** to isolated Supabase project `viantpfagtbgyyzavmtv`.
- Created `posts`, `comments`, and `post_likes` tables matching the current main app's Home feed / like / comment / delete queries. Includes owner foreign keys, uniqueness, length checks, cascading deletes, indexes, RLS and explicit grants.
- Private profile posts are owner-only for now, not accessible to friends. This is intentionally restrictive until friendship policies are implemented. Public posts are visible to signed-in users unless either account has blocked the other. Likes/comments inherit post visibility; writes are owner-scoped.
- Updated `profiles` SELECT policy to hide blocked profiles from either direction.
- The reciprocal-block helper lives in nonexposed `kinfolk_alpha_private` schema, with EXECUTE restricted to authenticated users.
- Commit `80d516c3fd82158471f4a534e9a116b4a79416dd`: rollback-only synthetic RLS fixture `tests/alpha-home-rls-transaction.sql`.

## Verified against real isolated Postgres
- Migration applied successfully. All three new tables plus profiles have RLS enabled.
- Nine new post/comment/like policies and updated profile SELECT policy exist. Authenticated roles have only SELECT/INSERT/DELETE on the new tables; anon has none.
- Transactional fixture with three synthetic users checked two public posts visible, teen private post hidden, comment and like visibility, and reciprocal block hiding public posts, profiles and comments. All changes rolled back.
- Committed negative fixture was executed successfully: forged post authorship, commenting/liking a private post, and deleting someone else's private post were denied. All changes rolled back.
- Post-test tables and profiles each had zero rows. Supabase security advisor reported zero security lints.
- **These are SQL/RLS tests with synthetic auth rows, not actual Supabase Auth API signup or device tests.**

## Current blockers
- Existing app's actual email signup/login, redirect, and session restoration have not been tested against isolated backend. Main signup Phase79 already submits `signup_birthdate`; do not confuse it with older inline HTML signup.
- Reels/Channels/stories/messaging/notifications, storage buckets, RPCs and friend relationships still need isolated backend schema and end-to-end QA.
- A previously committed Recovery248 password regression test expects 12–128 characters but the old app still enforces 5–12 across multiple layers. Do not claim it passes.
- Vercel commit status for current commit is **failure**, pointing to build-rate-limit upgrade URL. Do not trigger additional paid deployment or production changes.
- No new native APK/IPA, GitHub CI pass, real signup, or physical-device test verified. Release gate remains **NO-GO**.
