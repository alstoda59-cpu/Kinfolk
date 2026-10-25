# Recovery198 | Android and iOS visual viewport

Date: 2026-10-25. Full main Kinfolk Social only, excluding Kinfolksworld.

Inspected Recovery197 committed source, notes, and Vercel deployment history. The last verified READY preview remains Recovery195 dpl_HUrJfobmt4d4rnvAG5AL6rRSZYuA at https://kinfolk-social-demo-5si9seupl-alstoda59-9779.vercel.app/ (target null).

Mobile Shorts viewport now uses `window.visualViewport.offsetTop + window.visualViewport.height` as the visible screen boundary, and listens to visualViewport resize/scroll in addition to window resize. The existing AbortController cleans up the listeners on feed teardown. This is intended to reduce overlap with Android Chrome and iOS Safari browser chrome and keyboard resizing. App commit 6666b98baf232b82575c79532769d27ab82319f1.

Source change committed but not yet tested on physical Android/iPhone devices. No Recovery198 READY preview verified. Mobile-only QA required for portrait, landscape, browser toolbar changes, keyboard, fixed navigation, vertical swipe and action buttons. No production deployment/promotion, live Supabase writes, or Kinfolksworld changes.
