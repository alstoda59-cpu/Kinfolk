# Recovery157 Share and Remix

Branch kinfolk-social/recovery157-share-remix from Recovery156. Shared Reels/Channels video card now includes Share and Remix actions (b6574e59). Share uses navigator.share on supported devices, clipboard fallback, and a URL query parameter video=<id> (924a2fb2). Shared link resolves to a specific video card after authenticated startup (0a75efa7); switching tabs clears query parameter (b80ae33e). Sharing blocked for videos explicitly marked non-public. Note: actual access enforcement must still be verified via Supabase video RLS and media storage.

Remix action checks login, private visibility, and allow_remix===false; currently displays an explicit not-enabled message. This is UI scaffolding, NOT functional remix editing or publishing. Do not present as completed remix feature. A functional remix editor requires consent defaults, attribution, media rights, safe editing/uploading, moderation, privacy/teen policy and backend persistence. No schema changes approved.

Static regression file test_recovery157_share_remix.js committed e28ad36b and wired to CI 01ff42df. No full CI or real device/browser test confirmed. Preview deployment dpl_8bwdxSAhqd29u54s2S2AFFuYRaCr URL https://kinfolk-social-demo-5dzf6tlz7-alstoda59-9779.vercel.app/ initially INITIALIZING. Production, Kinfolksworld and shared Supabase unchanged.
