# Recovery200 mobile release evidence gates

This checkpoint builds on Recovery199 commit `6b98703de752c4a45d2f8535824815b497abbc07`. No production, Kinfolksworld, or live Supabase changes are authorized.

## What is already covered
- Synthetic Android Chrome and iPhone Safari Shorts viewport resizing, fixed bottom navigation clearance, listener cleanup.
- Static Shorts control presence and reduced-motion checks.
- Existing offline authentication and navigation regression suites in GitHub Actions.

## Required acceptance evidence before a mobile release candidate
| Area | Test on both Android and iPhone | Status |
| --- | --- | --- |
| Auth | Authorized synthetic account signup, email callback, login, logout, cold-start restoration, Stay Logged In on/off | NOT VERIFIED |
| Home / Reels | For You, Subscriptions, Shorts swipe, pause, like/dislike, share, remix, save, download, back navigation | SIMULATED ONLY |
| Settings | Theme and profile music persist after restart, single playback, play/pause | NOT VERIFIED ON DEVICES |
| Media | Photo/video upload, readback, signed URL expiry, comments/replies | NOT VERIFIED |
| Messaging | Two authorized test accounts, delivery, notifications, disappearing message toggle | NOT VERIFIED |
| Safety | Teen safety enforcement, content privacy, two-account RLS isolation | NOT VERIFIED ON NONPRODUCTION BACKEND |
| Native | Capacitor Android AAB and iOS IPA, deep link callback, keyboard/safe areas, accessibility, offline resume | NOT BUILT / NOT VERIFIED |
| Stores | Privacy policy, account deletion, moderation/reporting, content classification and review | NOT APPROVED |

## Release gate
Do not treat GitHub CI success, HTTP 200, or Vercel READY as actual-device or backend acceptance. Never submit stores or promote production without owner approval.

## Next safe implementation
Add test-only mobile QA coverage in the isolated branch; obtain a dedicated nonproduction Supabase environment and authorized synthetic test accounts before running real auth/RLS/media tests. Record device model, OS, browser, build SHA, observed results and screenshots for every manual run.
