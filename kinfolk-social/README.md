# Kinfolk Social | Recovery315 (2026-10-29)

Latest isolated checkpoint: [RECOVERY315.md](RECOVERY315.md). Moderation reports now require an exact confirmed insert count, preserving insert-only member RLS; report modals and pending submissions are account/target-scoped across rapid navigation and duplicate taps. Ten source-backed synthetic regressions are wired into native alpha verification and the reporting module is required in Capacitor packaging. GitHub Node regression stage passed after fixture repairs; full CI, real isolated report/auth/RLS testing and current Android/iPhone builds are separate gates. Nonproduction READY code preview is **not safe for test signups** because its web source still references the shared live backend. No production release.

# Kinfolk Social | Recovery314 (2026-10-29)

Latest isolated checkpoint: [RECOVERY314.md](RECOVERY314.md). Channel create/edit now pins uploads and database writes to the initiating account, owner-scopes edits, confirms returned database rows and prevents duplicate submissions or stale modal completions. Ten source-backed synthetic tests were added to native alpha verification; PR #14 targets Recovery313 only. GitHub Node regression stage passed; full CI and current native builds are not confirmed. An earlier code commit has a READY nonproduction preview, but the isolated backend still lacks channel/video tables and real auth/RLS/device QA remains blocked. No production release.

# Kinfolk Social | Recovery313 (2026-10-29)

Latest isolated checkpoint: [RECOVERY313.md](RECOVERY313.md). Fixed cross-account races in first-login profile hydration and legacy profile editor uploads/saves; added 15 source-backed synthetic regression cases to native alpha verification and updated four obsolete static fixtures without weakening the new runtime tests. Draft PR #13 targets Recovery312, not main/production. Source CI and preview verification are tracked in the report. Real isolated signup/email/RLS, missing community/video tables, current Android/iPhone builds and device QA remain blockers. No production release.

# Kinfolk Social | Recovery312 (2026-10-29)

Latest isolated checkpoint: [RECOVERY312.md](RECOVERY312.md). Community creation now requires exactly one backend-confirmed owner-matched UUID row and matching submitted fields before displaying success; added synthetic regressions for zero-row, wrong-owner, mismatched/multiple rows and empty descriptions. Draft PR #12 targets Recovery311 only. Isolated community tables, real RLS/auth, current Android/iOS builds and physical-device QA remain blocked. No production release.

# Kinfolk Social | Recovery311 (2026-10-29)

Latest isolated checkpoint: [RECOVERY311.md](RECOVERY311.md). Public Community Join/Leave now requires exactly one backend-confirmed matching membership row, preventing false success on zero-row or mismatched writes. Updated synthetic regressions and draft PR #11 target Recovery310 only. Isolated backend community tables, real RLS, current native builds and device QA remain launch blockers. No production release.

# Kinfolk Social | Recovery310 (2026-10-28)

Latest isolated checkpoint: [RECOVERY310.md](RECOVERY310.md). Community owners can edit their name, description and public/private visibility from My communities. Update requests require exactly one returned owned row before success, handle account-switch and pending-save races, and restore edit controls after search. Seven synthetic regression cases added to native alpha verification. Real isolated backend, RLS, current APK/iOS builds and device QA remain unverified; do not release production.

# Kinfolk Social | Recovery309 (2026-10-28)

Latest isolated checkpoint: [RECOVERY309.md](RECOVERY309.md). Community Join/Leave controls now survive search-triggered card rebuilding, including in-flight membership writes, without cross-account state leakage. Three additional synthetic Node regression cases; no real isolated backend community tables, native builds, or physical-device QA verified. Draft PR #9 targets Recovery308, not production.

# Kinfolk Social | Recovery308 (2026-10-28)

Latest isolated checkpoint: [RECOVERY308.md](RECOVERY308.md). Added public Community Join/Leave controls with account-safe async behavior and missing-backend fallback, native package parity and synthetic regressions. Added review-only community/membership RLS SQL; **not applied**. Real isolated community backend, full CI, native packages and physical-device QA remain unverified. Draft PR #8 targets Recovery307 only; no production release.

# Kinfolk Social | Recovery307 (2026-10-28)

Latest isolated checkpoint: [RECOVERY307.md](RECOVERY307.md). Community owners now see their own private spaces in **My communities** after creation; creation feedback survives a refresh and late account-switch responses are ignored. Added eight synthetic source regressions and made native alpha verification require the Communities module. This is **not** real backend/RLS or physical-device proof. Draft PR #7 targets Recovery306, not production.

# Kinfolk Social | Recovery303 (2026-10-28)

Latest isolated checkpoint: [RECOVERY303.md](RECOVERY303.md). Corrected post/story orphan upload cleanup on database failure and protected already-inserted video media from deletion when feed refresh fails. Added post/story and video regressions and repaired timing-sensitive Recovery302 Node fixtures. Draft PR #6 targets Recovery302 only, not production. Real isolated Supabase auth/RLS, missing tables, current Android/iPhone builds and device QA remain blockers.

# Kinfolk Social | Recovery301 (2026-10-28)

Latest isolated checkpoint: [RECOVERY301.md](RECOVERY301.md). Fixed cross-account notification reads and Mark All Read writes: explicitly recipient-scoped queries, defensive response filtering, stale-request rejection, duplicate-write suppression and navigation-safe completion. Nine synthetic V8 checks passed against exact committed handlers; committed Node tests and full CI remain unverified. Recovery301 preview is blocked by Vercel build-rate limit. Real isolated Supabase auth/RLS, current Android/iPhone builds and physical-device QA remain outstanding. No shared live backend, production or store changes.

# Kinfolk Social | Recovery300 (2026-10-28)

Latest isolated checkpoint: [RECOVERY300.md](RECOVERY300.md). Fixed cross-account direct-message races: delayed inbox/DM responses cannot reopen or overwrite another account's modal, and stale send forms cannot write as a newly signed-in member. Added eight Node regressions to the native alpha verification command; nine source-backed synthetic V8 scenarios passed, while Node CI and device/backend end-to-end tests remain unverified. Read-only isolated Supabase inspection confirms RLS-enabled messaging tables but also identifies 13 public tables referenced by the main app that are not yet present in the isolated alpha database. Nonproduction only; no shared live Supabase or app-store changes.

# Kinfolk Social | Recovery299 (2026-10-28)

Latest isolated checkpoint: [RECOVERY299.md](RECOVERY299.md). Repaired a mobile Reels layout race: the immersive player now recalculates its height when the age/content filter is inserted or updated after asynchronous video rendering. Existing account/teardown guards prevent stale viewport updates. Focused source-backed synthetic V8 checks passed; current Node/GitHub CI, real isolated Supabase auth/RLS and physical-device QA remain unverified. Nonproduction only, no shared live backend or store changes.

# Kinfolk Social | Recovery290 (2026-10-28)

Latest isolated checkpoint: [RECOVERY290.md](RECOVERY290.md). Bounded stalled private Reels signing so a hung media URL request cannot block the entire mobile feed; added regression coverage and repaired outdated synthetic mobile fixtures. A previous source CI run identified 9 fixture failures; replacement CI must be verified separately. Nonproduction preview READY does not establish real video playback. Real isolated-backend auth/RLS and physical Android/iPhone QA remain unverified. Production, shared live Supabase, Kinfolksworld and app stores untouched.

# Kinfolk Social | Recovery289 (2026-10-28)

Latest isolated checkpoint: [RECOVERY289.md](RECOVERY289.md). Reels now continues loading private video slides when reaction counts fail or stall; unavailable reaction controls are disabled without displaying stale counts. **4/4 focused synthetic V8 checks passed** against exact committed source, and the integration commit has a READY nonproduction Vercel preview. Full GitHub CI, real backend auth/RLS, functional Android/iOS builds and physical-device QA remain unverified. Production, shared live Supabase, Kinfolksworld and app stores untouched.

# Kinfolk Social | Recovery288 (2026-10-28)

Latest isolated checkpoint: [RECOVERY288.md](RECOVERY288.md). Reels now abort stale private-video rendering when the active account changes during reaction loading or signed URL requests. Two synthetic V8 runtime scenarios passed against the exact committed Reels source; the code/test integration commit has a READY nonproduction preview. Current full GitHub CI, real Supabase cross-account enforcement, native functional builds and physical-device QA remain unverified. No production, shared live Supabase, Kinfolksworld or store changes.

# Kinfolk Social | Recovery267 (2026-10-27)

Latest isolated checkpoint: [RECOVERY267.md](RECOVERY267.md). Hardened native startup JavaScript verification against disguised remote `src` attributes, duplicate sources, and quoted-angle-bracket parsing. **10/10 actual Node.js 22 regression tests passed** against files matching exact GitHub committed blobs. The code/test commit has a **READY nonproduction Vercel preview**. Full native package/build CI, real isolated Supabase auth/RLS, and physical Android/iPhone testing are **not verified**. No production, shared live Supabase, Kinfolksworld or store changes.

# Kinfolk Social | Recovery264 (2026-10-27)

Latest isolated checkpoint: [RECOVERY264.md](RECOVERY264.md). Consolidated both divergent Recovery263 authentication fixes into one branch: stalled mobile signup requests now have a bounded wait and duplicate-request hold, while stale verification resends and signup results cannot target a changed email address. **24/24 synthetic V8 regression scenarios passed** against exact committed source, and the test commit has a **READY nonproduction Vercel preview**. This is not actual Node CI, real Supabase/email verification, native packaging or physical-device proof. Full main Kinfolk Social features and dark UI preserved. Production, shared live Supabase, Kinfolksworld and store releases untouched.

# Kinfolk Social | Recovery228 (2026-10-26)

Latest isolated checkpoint: [RECOVERY228.md](RECOVERY228.md). Added client-side teen private-profile locking in Settings for valid signup birthdates ages 13–17, guarded asynchronous Settings loading/saves against account switches, and aligned legacy message audience options with the live `nobody` enum. **5/5 focused synthetic V8 checks passed** and the source/test commit has a READY isolated Vercel preview `dpl_84LUcsMQjhoxHPs91hWzUEEDZJam`. Full Node/browser CI, real Supabase/RLS and physical Android/iPhone verification are **not confirmed**. Client checks do not establish backend teen safety. Production, Kinfolksworld and shared live Supabase remain untouched.

# Kinfolk Social | Recovery227 (2026-10-25)

Latest isolated checkpoint: [RECOVERY227.md](RECOVERY227.md). Repaired a mobile login hang when authentication response headers arrive but the JSON body stalls: the 15-second abort timeout now remains active through body parsing. Added three synthetic Node regression scenarios. Committed Phase95 and test file passed V8 syntax and in-memory synthetic timeout/success/error checks; **full Node CI, real backend and physical-device verification for Recovery227 remain unconfirmed**. Vercel reports a build-rate limit; last verified READY preview is Recovery226 `dpl_EzTtvNRfGx54GngrAwcswfGaF4um`. No production, Kinfolksworld or shared live Supabase changes.

# Kinfolk Social | Recovery225 (2026-10-25)

Latest isolated checkpoint: [RECOVERY225.md](RECOVERY225.md). Main app now displays an accessible mobile retry screen when its external authentication SDK fails to load, rather than an unusable startup screen, and the app document title no longer says Recovery131 Preview. **6/6 focused synthetic V8 tests passed**, and a mocked Chromium/WebKit mobile regression is committed to CI but not verified executed. The isolated READY preview `dpl_H8sKhgoY4Vzw62D1Ei6h6VcyEjUm` delivered the recovery script (HTTP 200), but predates the final page-title and test edits. Local SDK bundling, real backend auth, native builds and physical Android/iPhone QA remain outstanding. Recovery224 concurrent login fixes preserved. Production, Kinfolksworld and shared live Supabase untouched.

# Kinfolk Social | Recovery224 (2026-10-25)

Latest isolated checkpoint: [RECOVERY224.md](RECOVERY224.md). Repaired stale login completions when Phase76 reuses the same form across Login -> Signup -> Login. Phase95 now verifies the original login title DOM element at asynchronous checkpoints and before messages, retains rollback/session cleanup, and blocks overlapping old/new login attempts. **6/6** focused source/functional checks passed in a synthetic V8 Node-style adapter, not actual Node/Playwright/backend/device. Added a mocked Chromium/WebKit mobile regression to CI, not yet verified executed. Vercel build-rate-limit prevents a new Recovery224 preview; last READY preview `dpl_GYaC6BLBwdfRacmbVkFUEYpEE2dC` contains Recovery223 only. Production, Kinfolksworld and shared live Supabase remain untouched.

# Kinfolk Social | Recovery223 (2026-10-25)

Latest isolated checkpoint: [RECOVERY223.md](RECOVERY223.md). Fixed a signup race caused by reusing the same form element after Login -> Signup navigation; stale asynchronous responses now verify the original title DOM element before updating messages or persisting Stay Logged In. Added new Node regression scenarios (7/7 passed in a synthetic V8 adapter) and a mocked mobile Chromium/WebKit test in CI, not yet verified run. READY nonproduction Vercel preview `dpl_GYaC6BLBwdfRacmbVkFUEYpEE2dC` contains the code and served the updated JS with HTTP 200. Full native Node/Playwright CI, real isolated Supabase sessions and Android/iPhone device tests remain outstanding. Production, Kinfolksworld and shared live Supabase untouched.

# Kinfolk Social | Recovery222 (2026-10-25)

Latest checkpoint: [RECOVERY222.md](RECOVERY222.md). Fixed false-success logout, duplicate requests and stale-account completion; signed-out transitions stop media and clear remaining private caches. **131/131 Node tests, 27/27 legacy scripts and 11 actual mocked mobile Chromium regression scripts pass.** Native packaging includes 23 referenced modules. WebKit, physical devices, real email/backend verification and signed native builds remain unverified. Existing development branch, production restrictions and main-app scope retained.

# Kinfolk Social | Recovery221 (2026-10-25)

Latest checkpoint: [RECOVERY221.md](RECOVERY221.md). Continued from Recovery220 on `kinfolk-social/recovery207-signup-navigation-guard`. Added guarded email-verification resend to the existing signup and repaired missing Reels native assets. Actual local Node: 124/124 tests plus 27/27 legacy scripts pass; native web packaging checks 23 referenced modules. Browser/device/backend verification remains blocked and is explicitly separated in the checkpoint. Production, Kinfolksworld and shared Supabase unchanged.

# Kinfolk Social | Recovery220 (2026-10-25)

Latest isolated checkpoint: [RECOVERY220.md](RECOVERY220.md). Expanded the existing mobile signup with optional gender and age-aware private-profile defaults, aligning metadata with current backend profile triggers. Added mocked Android-size Chromium privacy regression to CI and verified the exact Phase79 source via V8 synthetic signup checks. Read-only schema inspection confirmed a preexisting case-insensitive username unique index, so a redundant index was removed from the **unapplied** Recovery219 SQL draft. Nonproduction preview `dpl_CqPHv58zJqJcVoSrP1DbsLwU6nqB` is READY and delivered the updated JS with HTTP 200, but native CI, real backend and physical Android/iPhone tests are unverified. No production, Kinfolksworld or shared Supabase changes.

# Kinfolk Social | Recovery219 (2026-10-25)

Latest isolated checkpoint: [RECOVERY219.md](RECOVERY219.md). Signup metadata now matches existing backend profile bio/display-name trigger keys, with clearer username feedback. Read-only schema inspection found a silent username-collision fallback and unsynced signup locale; a **draft-only** migration proposes corrections, not applied to shared Supabase. Three synthetic V8 static tests and a mocked signup handler passed; GitHub Actions, real Supabase and Android/iPhone devices remain unverified. Vercel build-rate limit prevents a new READY preview. Production and Kinfolksworld remain untouched.

# Kinfolk Social | Recovery218 (2026-10-25)

Latest isolated checkpoint: [RECOVERY218.md](RECOVERY218.md). Fixed the Recovery217 confirmation-field DOM insertion error that could abort birthday/signup mounting; added optional mobile bio/language/interests and a three-section signup explanation without changing the existing auth handler. Updated legacy Chromium signup fixtures and added Recovery218 mocked mobile regression to CI. V8 synthetic mounting and source syntax passed. Native CI, real Supabase and Android/iPhone tests remain unverified; new previews are Vercel-rate-limited. Production, Kinfolksworld and shared Supabase were not changed.

# Kinfolk Social | Recovery214 (2026-10-25)

Latest isolated checkpoint: [RECOVERY214.md](RECOVERY214.md). Phase95 now performs guarded local sign-out of a newly adopted account when login adoption/activation fails, preventing a failed login from leaving an unintended session. Recovery151/154 synthetic fixtures were repaired, and five new cleanup regressions were added to CI. V8-adapter tests passed; native Node CI, real backend and physical mobile tests remain unverified. Vercel build-rate-limit blocked confirmation of a READY preview containing the application fix. Production, Kinfolksworld and shared Supabase remain untouched.

# Kinfolk Social | Recovery213 (2026-10-25)

Latest isolated checkpoint: [RECOVERY213.md](RECOVERY213.md). Repaired four legacy signup test fixtures for the active DOM guard, prevented a delayed signup storage-error message from overwriting the Login screen, and added three deferred-auth regression tests to CI. **21/21 targeted synthetic V8-adapter tests passed**, not native Node/real Supabase/device tests. Isolated preview `dpl_A2qQBmYaCx24Tzu2YiHtNPNtpAin` is READY and served the updated Phase79 script over HTTP 200, but predates new test/CI commits. Production, Kinfolksworld and shared Supabase remain untouched.

# Kinfolk Social | Recovery212 (2026-10-25)

Latest isolated checkpoint: [RECOVERY212.md](RECOVERY212.md). Fixed reused login-to-signup forms retaining the login-only button click handler and password-length overrides; restored Phase79 signup submission and 5–12 character UI rules. The fetched Phase98 source passed a synthetic V8 login → signup → login runtime check. GitHub Actions, real backend and physical Android/iPhone testing remain unverified. Latest READY preview is older Recovery210 (`dpl_FeMSf5dN8rrEfUe6eKPSXc2bKN7f`), not Recovery212; current Vercel build-rate limit blocks fresh preview confirmation. Production, Kinfolksworld and shared Supabase remain unchanged.

# Kinfolk Social | Recovery206 (2026-10-25)

Latest isolated checkpoint: [RECOVERY206.md](RECOVERY206.md). Phase79 signup now refuses to save Stay Logged In preferences if the active Supabase session cannot be verified; Recovery179–181 fixtures and CI coverage were updated. **18/18 targeted signup scenarios passed in a synthetic V8 adapter**; GitHub Actions, real Supabase and Android/iPhone device tests remain unverified. Isolated READY preview `dpl_8CLMQy4do52Kz3HQGdMuoD2C2xmu` corresponds to the code/CI commit, not a verified working app. Production, Kinfolksworld and shared Supabase remain untouched.

# Kinfolk Social | Recovery204 (2026-10-25)

Latest isolated checkpoint: [RECOVERY204.md](RECOVERY204.md). Hardened Reels/Shorts video action IDs against JavaScript injection and rejected executable media URL schemes while retaining HTTPS/YouTube playback. **16/16 targeted synthetic cases passed in a V8 adapter, not GitHub Actions, real browser, backend, or devices.** Recovery204 preview deployment blocked by Vercel's daily deployment quota (HTTP 402); no new preview exists. Production, Kinfolksworld, and shared live Supabase remain untouched.

# Kinfolk Social | Recovery187 (2026-10-25)

Latest isolated checkpoint: [RECOVERY187.md](RECOVERY187.md). Phase95 login now checks form mode before intercepting submit, allowing the existing Phase79 signup handler to own reused signup forms; login stops competing same-element handlers. **3/3 new offline V8-adapter scenarios passed; Node CI, real backend/browser and devices remain unverified.** READY preview `dpl_CLB1pjPqFSphChK3SVR91yKpm8jL` includes the application fix. No production, Kinfolksworld or shared Supabase changes.

# Kinfolk Social | Recovery186 (2026-10-25)

Latest isolated checkpoint: [RECOVERY186.md](RECOVERY186.md). Password login now requires the identity in the password-token response to match the adopted Supabase session before account activation. **4/4 targeted offline V8 scenarios passed; new Node tests committed but CI execution, real backend and device tests remain unverified.** Preview `dpl_Cgj4an9DY756poAMiGggQjcDAxWR` READY, target null. No production, Kinfolksworld, or shared live Supabase changes.

# Kinfolk Social | Recovery185 (2026-10-25)

Latest isolated checkpoint: [RECOVERY185.md](RECOVERY185.md). Expanded offline login activation regression coverage and repaired the synthetic DOM fixture to model a connected form. **13/13 offline runtime cases passed in a V8 adapter harness, plus source-order checks.** Vercel preview `dpl_E1oAMPRxBG3X2erM7siHnAMEbajC` is READY (target null), but Node CI, real browser/backend login and mobile-device testing are unverified. No production, Kinfolksworld or shared live Supabase changes.

# Kinfolk Social | Recovery182 (2026-10-25)

Latest isolated checkpoint: [RECOVERY182.md](RECOVERY182.md). Phase95 login now refuses to activate a session belonging to another account or an unverified session, with pre/post password-request account checks and preference rollback on mismatch. **7/7 new synthetic V8 regression scenarios passed; GitHub Actions Node, real browser/backend and physical devices remain unverified.** Isolated preview `dpl_HrpVZgiFix1RFJZWVSpAiNU5nycP` is READY, target null, and served the updated Phase95 script over HTTP 200. No production, Kinfolksworld or shared live Supabase changes.

# Kinfolk Social | Recovery181 (2026-10-25)

Current isolated checkpoint: [RECOVERY181.md](RECOVERY181.md). Signup now rejects delayed responses from another active account before saving Stay Logged In preferences, rechecks account ownership before local sign-out after storage failure, and warns when sign-out itself fails. **14/14 synthetic V8-harness scenarios passed across Recovery179–181; GitHub Actions Node results, real Supabase, rendered browser and devices remain unverified.** Isolated preview `dpl_6xWXjoYwfY7mPSF56EJzSeq2mXwD` is READY (target null) and served the updated Phase79 script over HTTP 200. Production, Kinfolksworld and shared live Supabase remain untouched.

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
