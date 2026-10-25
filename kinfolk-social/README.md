# Kinfolk Social Recovery133 | 2026-10-24

Incremental repair based on Recovery132. Preserves full main app, dark mobile UI, features, and native Capacitor scaffold. Kinfolksworld excluded.

## Code changes
- Phase79 signup is handled by a single capture-phase submit listener. It stops late legacy submit handlers from racing or bypassing the 13+ check, while Phase95 continues to own login.
- Strict ISO birthday validation rejects invalid dates (including rolled-over calendar dates). Ages 13–99 allowed; 13–17 remain subject to existing teen safety behavior.
- Native signup no longer sends `https://localhost` as a Supabase email callback; a future approved HTTPS callback can be supplied through `window.KINFOLK_EMAIL_REDIRECT_URL`. Signup sends birthdate in metadata as before. **Client-side validation is not server-side age enforcement.** Supabase policies/triggers have NOT been changed or verified.
- Native packaging and other features preserved.

## QA scope
- Mocked Chromium mobile login, navigation, profile, settings, underage signup, adult signup, duplicate submission, 13-year-old age boundary, over-99 rejection, and callback selection: see validation.json and test output. Three additional full regression reruns passed.
- No live Supabase test accounts, real Android/iPhone devices, signed AAB/IPA or app-store approval. Do not call this release-ready.
- No production or shared backend changes. No Recovery133 preview deployment as of this source checkpoint.

## GitHub coordination
The GitHub branch `kinfolk-social/recovery132-integration` currently contains only an integration note, not this full source. The GitHub-linked Vercel project automatically generated a READY **branch preview** `dpl_8KEdPtM1bK9n3nu7MxSAQvVKPpSx` from that docs-only commit; that preview is NOT a validated Kinfolk Social app preview. Latest verified actual main-app login-screen preview remains Recovery129 `dpl_9p5ymsbuxSbMMChtRobYYznRsxFD` at https://kinfolk-social-demo-i0cjbv3r0-alstoda59-9779.vercel.app/ .

## Next
Import the complete reviewed main app source to GitHub under `kinfolk-social/` with branch protection and CI, then configure isolated Vercel preview root; verify real backend auth/session, teen authorization, media, messaging and mobile native builds.
