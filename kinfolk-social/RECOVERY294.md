# Recovery294 | Profile music navigation and overlap cleanup

Baseline: Recovery293 (`92f05304`). Inspected Recovery293 report, full main app navigation, `kinfolk-phase81.js` profile player and `kinfolk-reels159.js` immersive mobile Reels implementation, plus owner-supplied mobile screenshots. No Kinfolksworld changes.

## Code
- `628ee9b015be186ac62f1365b8a7e0db88bbb97d`: stop the active profile music player synchronously on navigation to any non-profile view. Previously `setView` stopped Reels but relied on a delayed observer to stop profile music, leaving a possible audio overlap during Reels navigation.
- `56fd8d435709fbbc2618f9d7c18cfa662a9d8171`: stop and mute any legacy `.kf51Music audio` elements on profile player teardown, in addition to stopping the current audio/iframe and removing the older YouTube player.
- `beeec234dbbf15de4b53183bf0efd47f5b1aa665`: two source-level Node regression checks.
- `757baac15e488c13bab7e16939cb863219e3e19f`: include those checks in `alpha:verify`.

## Owner-requested follow-up, not yet implemented
- Settings hub with categorized navigation, safe-area/Save button layout.
- Reels should render as immersive vertical swipe feed with Like/Dislike, Comments, Share, Remix, Save, Download, and tap-to-pause. `kinfolk-reels159.js` already implements this interface in code, but the owner's screenshot shows a legacy video card, so actual device routing/render behavior must be investigated rather than duplicating buttons.
- Exactly one Gold Star next to a subscriber name, and owner-authorized gifting. Before changing entitlements, inspect the existing star source and isolated backend authority. No subscription grants or billing changes made.

## Evidence and boundaries
Commits confirmed by GitHub. The two tests were added but **not executed** here. No CI, Vercel READY for this branch, real backend E2E, native APK/iOS build or physical-device QA verified. No shared live Supabase, production aliases, Kinfolksworld, paid resources or store submissions modified.
