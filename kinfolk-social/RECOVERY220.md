# Kinfolk Social Recovery220 | signup gender, initial privacy and backend index audit

Date: 2026-10-25 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social, excluding Kinfolksworld. Source of truth: isolated branch `kinfolk-social/recovery207-signup-navigation-guard`.

## Inspected
Read current Recovery218/219 source, prior regression tests, README/continuation notes, Vercel preview history and GitHub CI. Consulted Recovery133 Library continuation notes. Performed **read-only**, schema/catalog-only inspection of the existing Supabase project. No account rows, passwords, tokens, or personal data queried.

Verified existing backend:
- `public.profiles` has both `profiles_username_key` and **`profiles_username_lower_unique`** indexes. The latter already enforces case-insensitive unique usernames.
- `kinfolk_private.handle_new_user` enforces ages 13–99, creates the profile/safety row, and reads `signup_gender`. Its existing conflict fallback can silently generate a different handle.
- `kinfolk_private.apply_signup_profile_style` reads `profile_private`, `profile_display_name` and `profile_bio`.
- `kinfolk_safety_settings` has age-related DB triggers and owner-scoped policies. This does not prove that teen `profiles.is_private` remains true after a direct later update.
- Supabase `list_branches` returned no isolated database branch for E2E tests.

## Implemented
- Added optional gender selection to the existing mobile signup profile section, using supported values `Female`, `Male`, and `Nonbinary`.
- Added a private-profile choice, review summary and age-aware behavior: 13–17 begin private and cannot turn it off **on the signup screen**; eligible adults may select private/public, defaulting to the previous public behavior. Birthday changes restore prior adult choice.
- Signup sends `signup_gender` and `profile_private` ('true'/'false') to existing creation triggers without adding a second handler or changing the core sign-up/session flow.
- Fixed Recovery219's **unapplied SQL draft** to avoid a redundant new lower(username) unique index; corrected static tests and Recovery219 notes.
- Wrote [RECOVERY219_BACKEND_REVIEW.md](RECOVERY219_BACKEND_REVIEW.md) for an owner-reviewed backend teen-privacy hardening plan. **No schema migration applied.**

## Commits
- Application: `cf72721ac3a7c47671ea8be637534c2bc36fe52b`
- Mocked Android-size Chromium privacy test: `6c2da99409ef28985cac4d66aec5745eeda1fad5`, `c62e59530a504fd8046a66936ff654f7033beb5b`
- CI test inclusion: `122c04150c14fdec8e0d5e8f88a5c24314dad1e2`
- Security review note: `19caaa16766fa4aba71eaeae41d09172a68c84df`
- Correct redundant draft index: `bc872f4d3da53710530bf1122f33da6f440aec5e`
- Align static regression: `5c4d1fd185657eeeef81729d1627a8240c26734c`
- Recovery219 correction: `d98c8aabd1f0425327cf2a007a0c1fa8d0e734b1`

## Verification, without overstating
- **JavaScript syntax:** exact fetched Phase79 source compiled in V8: PASS.
- **Synthetic DOM/SDK behavior:** mocked form built successfully with username, DOB, confirmation, optional profile fields, gender, privacy and review; age 16 automatically selected/disabled private and age 26 restored editable public default. One adult mock signup included `signup_gender: Nonbinary`, `profile_private: 'true'` when selected, correct DOB. One teen mock signup included `profile_private: 'true'` with correct teen DOB. **Not a real backend/device test.**
- **Static Node-style tests:** three exact tests in `tests/recovery219-signup-backend-alignment.test.cjs` evaluated against fetched app/draft in a V8 Node-API adapter: **3/3 pass**. Not native Node CI.
- **Simulated mobile Chromium test:** `test_recovery219.py` committed and referenced by GitHub Actions. No verified GitHub Actions/native Playwright execution yet.
- **READY nonproduction preview:** Vercel `dpl_CqPHv58zJqJcVoSrP1DbsLwU6nqB`, URL `https://kinfolk-social-demo-pmiibctn0-alstoda59-9779.vercel.app/`, target null, commit `c62e59530a504fd8046a66936ff654f7033beb5b`, contains updated Phase79. Authenticated HTTP fetch for `/kinfolk-phase79.js` returned **200** with privacy/gender fields. This does not verify rendered UI, actual signup, session restore, or native behavior.
- Later GitHub CI-only commit Vercel status reported a **build-rate-limit failure**; no fresh READY preview of later docs/CI commits confirmed.
- No real Supabase synthetic-account test, physical Android/iPhone test, APK/AAB/IPA or app-store submission.

## Remaining blockers / next
1. Review actual Node/GitHub Actions results; fix test regressions and verify Android/iOS Chromium/WebKit layout.
2. Owner-authorized **isolated nonproduction** Supabase needed for real account/signup/email-confirmation/session testing. Do not use shared live auth/data for tests.
3. Teen private-profile state is a client-side signup default plus existing profile-style trigger, **not an immutable backend policy**. Implement owner-approved DB guard only after isolated tests, including direct edits.
4. Username fallback must be exposed accurately to the user (actual assigned handle) or replaced by owner-reviewed secure rejection. A case-insensitive unique index is already present.
5. Complete step-by-step mobile onboarding, real persistence for language/interests, profile avatar after auth, reliable native email callback, accessibility, safe areas, keyboard, Reels/Home/upload/messaging and store policy QA.

Production, Kinfolksworld, shared live Supabase, aliases and stores were not changed.
