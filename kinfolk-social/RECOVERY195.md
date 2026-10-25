# Recovery195 | Mobile Shorts layout

Date: 2026-10-25. Full main Kinfolk Social, excluding Kinfolksworld.

User supplied two screenshots contrasting Kinfolk's boxed Reels layout with YouTube Shorts' immersive vertical player. Inspected the existing `kinfolk-reels159.js` on Recovery194 before editing. It already implements vertical swipe/snap, tap play/pause, reactions, comments, share, remix, save, download, sound, and visibility pausing; preserved these behaviors.

Updated mobile CSS for full-height portrait video (`object-fit:cover`), dark edge-to-edge player, vertical floating action rail, lower-left creator/title overlay, safe-area-aware height and reduced-motion support. App commit `e2b672f4932a0c7c0a645a29ebc6761ba4762177`. Added source regression tests covering mobile layout and existing actions, commit `7e5d507eeb4db9fdfa533b78ea26ab576a033e6d`.

**Not yet verified:** tests have been committed but not executed, and no Recovery195 Vercel preview or Android/iPhone rendering has been verified. The CSS is an initial layout pass and may need viewport calibration against the app's header/bottom navigation. Portrait video uses `object-fit:cover`, which may crop landscape videos; a fit-mode control is a future refinement. Existing content filter and teen safety code were not changed. No production or shared Supabase mutations.
