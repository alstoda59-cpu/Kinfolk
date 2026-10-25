# Recovery167: per-video reaction lock

Continued from Recovery166 on isolated branch kinfolk-social/recovery167-reaction-lock. Introduced pendingVideoReactionIds Set in index.html to prevent concurrent reaction writes to the same video from any UI (Reels or video grid). The lock is acquired before the request and released in finally, including on error. Existing disabled controls remain. Code commit 7841be59c465f856fadf1ff9a9659ef32c3c519c. Static regression test 2947b776 and CI step 59c76b11 committed; execution and live backend testing not verified.

Preview deployment attempt at 59c76b11 blocked 402 api-deployments-free-per-day, retry in 24 hours. No Recovery167 preview. Reactions schema/RLS review-only migration not applied. No production, Kinfolksworld or shared Supabase modifications.
