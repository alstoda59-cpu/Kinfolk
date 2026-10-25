# Recovery162: Reels lifecycle

Based on Recovery161. Inspected current source and previous notes. Changes: kinfolk-reels159.js exposes kf159StopReels, pauses active videos on document visibilitychange hidden, and skips observer-driven autoplay when document.hidden. index.html setView invokes teardown when leaving Reels. Code commits f7b47cc4 and 6ef3aa87. Added static regression test_recovery162_reels_visibility.js commit 769d45e and CI step commit 2ad08a9. Full CI and actual browser/phone tests not verified.

Attempted isolated Vercel preview at 2ad08a9 for project prj_ua4HgXAphEgWrUx80AWc596AWJiv; deployment blocked 402 api-deployments-free-per-day, retry after 24 hours. No Recovery162 preview ID or URL. Older Recovery158 preview does not include vertical viewer. Like/Dislike persistence awaits owner-approved staging RLS migration; Remix publishing not built. Production, Kinfolksworld and shared live Supabase unchanged.
