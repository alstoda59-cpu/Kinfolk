# Recovery159 immersive Reels & Shorts

User supplied a vertical Shorts screenshot and requested full-screen Reels/Shorts, right-hand Like/Dislike/Share/Remix controls, tap-to-pause/play and swipe up/down. Preserve existing features, comments, content safety and user settings.

Branch kinfolk-social/recovery159-immersive-reels from Recovery158. Commit 417ae3c routes base renderReels to optional kf159RenderReels and loads new script before phase82 safety wrapper. Commit 3311a924 adds kinfolk-reels159.js with vertical CSS scroll-snap viewer, native uploaded video play/pause by tapping, IntersectionObserver autoplay/pause on slide changes, ArrowUp/Down support, right-side Like/Dislike/Comments/Share/Remix/Save/Download controls and creator/title overlays. External videos show an open-external-player link. Phase82 General/XXX gating remains in place. Existing channel video grid remains unchanged.

Syntax of new JS evaluated successfully using isolated V8 new Function. Static test file commit 51b2b69 and CI wiring f223ebe added. Full GitHub Actions and actual Android/iOS playback or swipe tests NOT verified.

Vercel preview creation failed with 402 payment_required api-deployments-free-per-day, retry after 24 hours. No preview ID/URL exists for Recovery159. CLI fallback not available in container (no vercel binary). DO NOT imply the older Recovery158 preview includes this code. User must resolve Vercel quota/plan or wait until quota resets before preview deployment.

Like/Dislike remain disabled until approved backend reaction migration. Remix publishing still not implemented; Save is local to device; Download applies to Kinfolk-uploaded media and needs browser/device validation. No production, Kinfolksworld or shared Supabase changes.
