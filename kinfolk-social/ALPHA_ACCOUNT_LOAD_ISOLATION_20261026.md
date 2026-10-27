# Kinfolk Social mobile alpha: account-scoped feed and navigation loading (2026-10-26)

## Source and safety
- Scope: full main app in `kinfolk-social/`, not Kinfolksworld.
- Continued from latest verified messaging checkpoint `kinfolk-social/alpha-dm-account-guard-20261026`, commit `f6b19dbd4a9467f95494ddc14d09f9712abc6474`.
- Reviewed the branch's integration notes, Recovery247, current app source and tests, native backend isolation script, Vercel previews, and Library Recovery226/232 notes before editing.
- Development branch: `kinfolk-social/alpha-account-load-isolation-20261026`; no production merge or database writes.

## Implemented
- Application commit `801a65bab2ef35faa3f189ba04c5183c14e53345` updates active `index.html` account-scoped loaders for Home/feed, stories, Channels/subscriptions, Reels/videos, friend requests, notifications, and profile lookup.
- Each async fetch captures both authenticated user ID and the `kf129Epoch` activation generation. Responses are discarded after logout, account switch, or a newer account activation, including nested profile, comment, likes, and subscription requests.
- Empty-feed refresh now clears stale likes and comments instead of leaving reactions for posts no longer in the feed.
- Test commit `d5972a97f06f8588997a83d7a09d5b957c7cff11` adds four synthetic regression cases in `tests/alpha-account-load-isolation.test.cjs`.

## Verified evidence
- The modified loader region compiled using V8 `new Function`.
- Four committed regression cases were fetched back from GitHub and executed in an equivalent V8 runtime with mocked Node test/assert/file modules: **4/4 passed** (six pending fetches after account switch; stale profile lookup; late likes/comments; empty-feed cleanup). This is NOT an actual Node CI run.
- GitHub comparison against the prior messaging branch: ahead by 2 commits, behind by 0; changed only `kinfolk-social/index.html` and the new regression test.
- Vercel deployment `dpl_5emCVpLoKDGdLEKj78HZ7S6TV7i3` reports READY, `target=null`, for exact test commit `d5972a97f06f8588997a83d7a09d5b957c7cff11`: https://kinfolk-social-demo-8tjwi425s-alstoda59-9779.vercel.app/ . READY is a build status, not verified rendering, backend auth, or physical-device acceptance.
- GitHub combined status contains Vercel success. The available commit-associated workflow lookup returned no runs, so no GitHub Actions full CI pass is claimed.

## Outstanding alpha gates
- Real synthetic signup/email confirmation/login/logout/session restoration against isolated Supabase, and two-account RLS verification for profile privacy, teen safety, posts/media, friends and messaging.
- Backend schema and RLS for all Reels/Channels/stories features; private storage signed URLs, upload/post/comment and notifications end-to-end.
- Functional Android debug APK and iOS Simulator build using isolated backend credentials, then physical Android/iPhone QA for safe areas, navigation, keyboard, media, music, background/resume and network failures.
- Signed store packages, age/content policy, moderation, account deletion, and explicit owner release approval.
- Existing Recovery226 Android and iOS artifacts were offline packaging-only checks and do not prove working login.

No shared live Supabase project, production Vercel aliases, Kinfolksworld, store submissions, or paid resources were changed. Use synthetic accounts only. Do not claim launch readiness.
