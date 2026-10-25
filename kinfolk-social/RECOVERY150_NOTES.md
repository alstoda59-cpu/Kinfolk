# Recovery150 | auth event session policy

Scope: full main Kinfolk Social only; Kinfolksworld excluded.

Inspected prior to change: Recovery149 index.html and notes, Recovery133 README, validation.json and INTEGRATION.md, Recovery149 phase76.js, Library listing, prior Recovery145 preview READY evidence. Recovery149 session helper protected boot and Retry but SIGNED_IN / USER_UPDATED called kf129ActivateSession(session) directly.

Changes: index.html now defers auth event processing via setTimeout and calls kf129RestorableSession before activation; checks user ID to avoid stale event activation. Auth callbacks do not await Supabase operations while the auth lock is held. New test_recovery150_auth_event.js contains six static source assertions, but has not been executed in this session. This is not a browser or backend integration test.

Code commit cd33d4a7339d51348126a83b21c6d8b69489dac8. Test commit 067c2716da22f0bf00113c449438387e2e873261. Preview deployment dpl_5Vrz9zHpwJMgzZsjbFfrf4XZDi6e URL https://kinfolk-social-demo-qze2tk53k-alstoda59-9779.vercel.app/ started; status BUILDING at last check. No production or shared Supabase changes.

Outstanding: run regression and GitHub CI; test actual auth state event sequencing with authorized synthetic accounts in isolated backend; verify login/logout and persistence on physical Android/iPhone; review race behavior, backend RLS, media, messages and native packaging. Do not declare release-ready.
