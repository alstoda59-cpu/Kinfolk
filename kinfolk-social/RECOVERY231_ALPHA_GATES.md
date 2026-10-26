# Recovery231 | Installable alpha release gates

Scope: Full main Kinfolk Social only. Based on Recovery230, with no production or Kinfolksworld changes.

## Evidence baseline
Recovery230 source checks passed (run 40300340369). Its READY isolated preview does not prove real auth or native operation. Supabase isolated development backend was not available in the Recovery230 report.

## Release-blocking verification matrix
| Gate | Required evidence | Status |
|---|---|---|
| Signup | Synthetic adult and teen create accounts; email verification; duplicate username rejection; no public native localhost redirect | BLOCKED: isolated backend |
| Login | Correct and incorrect passwords, logout, Stay Logged In, force-close/reopen, account switch | BLOCKED: isolated backend and device |
| Teen safety | Server-side age policy, private-account enforcement, content filters, RLS denial tests | BLOCKED: isolated backend |
| Mobile feed | Android/iOS navigation, Home, Reels swipe/pause, Channels, like/dislike/share/remix/save/download | NOT VERIFIED ON DEVICE |
| Profile/settings | Theme/music persistence, wallpaper, profile edits, two-account isolation | BLOCKED: isolated backend |
| Media/posts | Image/video upload and playback, threaded comments, deletion and RLS | BLOCKED: isolated backend |
| Messaging | Private conversations, disappearing settings, notification permissions, cross-account access denial | BLOCKED: isolated backend |
| Native | Capacitor Android APK/AAB and iOS archive, deep links, keyboard, safe area, accessibility, crash tests | NOT VERIFIED ON DEVICE |
| Store | Moderation/report/block, account deletion, privacy disclosures, teen policy, signing and store review | NOT VERIFIED |

## Execution order
1. Provision isolated Supabase environment and synthetic accounts without altering shared live project.
2. Run backend RLS and auth tests, document failures and fixes.
3. Build installable debug Android/iOS artifacts from this source and test on real devices.
4. Verify all primary flows and regressions; fix blockers without removing features.
5. Review store policy, privacy, accessibility and signed release packaging. No submission without owner approval.

## Safety and limitations
This checkpoint records the acceptance gates; it does not claim implementation or successful execution of them. No shared database changes, production deployment, alias changes, or store submission are authorized.
