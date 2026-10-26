# Kinfolk Social Recovery228 | Teen privacy and account-safe Settings

Date: 2026-10-26 (America/Los_Angeles).
Scope: **full main Kinfolk Social app**, not Kinfolksworld. No production deployment, production alias, live Supabase mutation, real account activity, or store submission.

## Baseline inspected
- Previous isolated source: `kinfolk-social/recovery227-auth-response-timeout`, commit `32f9ccdab8cea32a953214600740b8e3408fb0d0`. Recovery227 fixed the login response-body timeout.
- Reviewed current `README.md`, `INTEGRATION.md`, `validation.json`, `RECOVERY227.md`, the Recovery133 Library continuation notes, Phase76 Settings, Phase79 signup metadata, Phase95 login, and prior test files.
- Read-only Supabase public schema: `user_settings.allow_messages` accepts `everyone`, `friends`, `nobody`; two obsolete fallback Settings templates used invalid `none`. Shared project `zojajuzmfjpvubzibzgg` has **zero** development branches available.
- Prior confirmed READY preview Recovery226: `dpl_EzTtvNRfGx54GngrAwcswfGaF4um`. Recovery227 had no verified READY preview in its continuation notes.

## Changes committed to isolated branch
Branch: `kinfolk-social/recovery228-teen-settings-account-guard` created from Recovery227.
- `059c0a9f16f4add5e81d231fb338f4b1472c4091`: Phase76 Settings now reads the existing `signup_birthdate` auth metadata, checks valid birthdates and the 13–17 boundary, and prevents the **client Settings UI** from unchecking Private Account for identified teens. Saves reassert private=true. This is **not server-side enforcement**; birthdate metadata and RLS policies require backend verification.
- The same fix snapshots the account ID when Settings opens. If the account changes during asynchronous Settings loading, the old screen is not mounted. If it changes before save, the save is rejected. All six settings writes use the captured ID and post-save UI state is discarded if the active account changed.
- Two legacy fallback Settings templates now use the live database enum `nobody` instead of `none` for "No one" messaging.
- `c9a2f86326eb82424ed118dacc37fa26aaab8fb6`: added `tests/recovery228-settings-teen-guard.test.cjs` with five focused tests for teen age boundaries, stale account loading, private toggle, account-pinned writes and message audience enum.

## Verification
- Fetched committed Phase76 and the new test file back from GitHub. Both compile in V8.
- **5/5 focused synthetic V8-adapted checks passed** against the committed files. This is not an actual Node `node --test` run or rendered browser/mobile test.
- Vercel isolated preview **READY**, target `null`: `dpl_84LUcsMQjhoxHPs91hWzUEEDZJam`, source commit `c9a2f86326eb82424ed118dacc37fa26aaab8fb6`, URL `https://kinfolk-social-demo-8ctfbuq0c-alstoda59-9779.vercel.app/`. Earlier code-only preview `dpl_ATfk3RomdUhTv6o9Nr2WL2FfYBAS` also READY.
- READY confirms deployment state, **not** browser rendering, actual Settings saves, signup/login, backend authorization or device behavior. The Vercel deployment file tree API did not expose the Git-sourced tree, so runtime file content was not independently fetched.
- Full GitHub Actions/Node suite for Recovery228: **not verified**. The GitHub commit status endpoint returned Vercel success, not a source-check result.
- No authorized isolated Supabase test environment or test accounts; no real backend/RLS, Android/iPhone hardware, native callback or app-store test performed.

## Open risks / next work
1. **Critical:** server-side teen birthdate, privacy, content restrictions and RLS are not proven. Client checks are bypassable; never call this full teen enforcement. Prepare/review migration in an authorized isolated Supabase branch before touching shared production.
2. Real signup/login/logout/session restoration, native email callbacks, Settings persistence, uploads, comments, messages and notifications need two-account isolated-backend QA.
3. Run full Node and mocked Chromium/WebKit regression suites, and test on real Android/iPhone devices with keyboard/safe-area/background lifecycle.
4. Keep production and Kinfolksworld untouched; review isolated branch before any merge. Do not declare launch readiness without end-to-end evidence and owner approval.
