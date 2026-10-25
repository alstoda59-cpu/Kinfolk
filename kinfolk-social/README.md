# Kinfolk Social | Recovery180 (2026-10-25)

Current isolated checkpoint: [RECOVERY180.md](RECOVERY180.md). Signup now rolls back partial Stay Logged In storage writes and attempts local sign-out when browser storage is blocked, rather than claiming an authenticated session was opened. Recovery179 regression fixtures were updated for realistic Web Storage reads. **9/9 synthetic V8-harness cases passed; Node CI, real Supabase, rendered browser and physical devices remain unverified.** Preview `dpl_3cedAWQGgoHito1LadgrzRh7M4of` is READY, target null. Production, Kinfolksworld and shared live Supabase remain untouched.

# Kinfolk Social | Recovery179 (2026-10-25)

Latest isolated checkpoint: [RECOVERY179.md](RECOVERY179.md). Fixed the one-tab session marker after **immediate-session signup with Stay Logged In unchecked**. The Recovery178 fix for unconfirmed signups remains intact. Five new synthetic checks passed against updated Phase79 source; a Node CI workflow and regression file were committed, but GitHub Actions execution is not yet confirmed. Isolated Vercel preview `dpl_4Y4W7VRxTEGpk6Tuzuj7g9NtV6zg` is READY; updated Phase79 was fetched over HTTP 200. No real backend or device tests. Production, Kinfolksworld and shared Supabase remain untouched.

# Kinfolk Social | Recovery178 (2026-10-25)

Latest isolated checkpoint: [RECOVERY178.md](RECOVERY178.md). Added a guarded **nonproduction Supabase authentication smoke harness** and offline tests for login, session refresh, logout, optional synthetic adult signup and live-project refusal. Also fixed signup so **Stay Logged In** is not saved before email confirmation creates a session, with new regression coverage. Prior Recovery174–177 features remain intact. **No real backend credentials were used, and no real backend/device tests passed in this checkpoint.** The shared live Supabase project, Kinfolksworld and production remain untouched.

# Kinfolk Social | Recovery177 (2026-10-25)

Latest isolated development checkpoint: [`RECOVERY177.md`](RECOVERY177.md). The existing login form cleanup now uses event-driven observation plus a 2-second foreground-only fallback instead of an 80ms background poll. Five synthetic checks passed against committed source; real backend, GitHub Actions Node results and device QA remain pending. Recovery176 appearance, Recovery175 music and Recovery174 safety protections are preserved. Production and Kinfolksworld are excluded.

# Kinfolk Social | Recovery176 (2026-10-25)

Latest isolated development checkpoint: [`RECOVERY176.md`](RECOVERY176.md). Main app source is in this folder; Kinfolksworld and production are excluded. Recovery176 protects delayed color/music saves and appearance reads across account switches. Five new synthetic regression cases were added, alongside prior music and safety suites. **Real backend and physical-device QA remain pending.**

## Recovery133 baseline | 2026-10-24

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
The full main Kinfolk Social source was imported to `alstoda59-cpu/Kinfolk` on `kinfolk-social/recovery132-integration` at commit `27a1c2253222029aaa578da1637da59194a56347`. The current isolated work is on `kinfolk-social/recovery178-isolated-auth-smoke`. Do not merge to main or promote a preview without approval. See `INTEGRATION.md` for the original Recovery133 import and `RECOVERY178.md` for current evidence.

## Next
Verify the Recovery178 GitHub Actions run, then test real nonproduction auth/session, teen authorization, media, messaging and Android/iOS native builds. The latest branch preview is not evidence of end-to-end functionality.
