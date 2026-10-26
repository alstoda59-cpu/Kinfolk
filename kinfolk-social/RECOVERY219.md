# Kinfolk Social Recovery219 | signup metadata integration and username integrity draft

Date: 2026-10-25 (America/Los_Angeles). Full main Kinfolk Social only, NOT Kinfolksworld. Work remains on isolated GitHub branch `kinfolk-social/recovery207-signup-navigation-guard`. This checkpoint builds on Recovery218.

## Source of truth and review
Read latest branch README, `validation.json`, `INTEGRATION.md`, `RECOVERY218.md`, Phase76/79/95/98 signup/login sources, test_recovery218 and the CI workflow. Rechecked Recovery133 Library continuation notes `Kinfolk_Social_Recovery133_Run_Notes_2026-10-24.md`. Inspected recent Vercel deployments and commit status.

Read-only inspection of shared Supabase project `zojajuzmfjpvubzibzgg`:
- `public.profiles.username` has a case-sensitive UNIQUE constraint and a 3–24 character check.
- `kinfolk_private.handle_new_user()` currently creates profiles from `username`, `display_name` and `signup_birthdate`, and silently substitutes a generated username if a requested username is taken.
- `kinfolk_private.apply_signup_profile_style()` reads `profile_bio` and `profile_display_name`, **not** the Recovery218-only `bio` metadata key.
- `public.kinfolk_user_preferences.locale` exists but the current signup trigger does not initialize it from `preferred_language`.
- No public interests table was found; signup interests currently remain in Auth user metadata, not a profile-level interests feature.
- Existing backend safety triggers enforce the age 13 minimum and teen defaults. These are not proof of complete age/authorization security.
- Read-only aggregate query returned **zero case-insensitive username collision groups** at inspection. No individual usernames were retrieved.
- `list_branches` returned no isolated Supabase development branch.

## Code implemented
- Phase79 signup now sends `profile_display_name` and `profile_bio` in addition to the existing `display_name` and `bio` keys. This aligns new signups with the existing profile-style trigger so optional bio can be persisted when that trigger runs.
- Username hint now clarifies assignment is confirmed after signup.
- When a backend error explicitly mentions a duplicate/taken username, signup shows a friendly retry message. Generic Auth errors cannot reliably be interpreted as username collisions.
- Added `test_recovery218.py` assertions for both backend-consumed metadata keys.
- Added `tests/recovery219-signup-backend-alignment.test.cjs` and included it in GitHub CI.
- Added `migrations/DRAFT_recovery219_signup_integrity.sql` for **review only**. It proposes case-insensitive uniqueness, removing the silent duplicate fallback, and persisting preferred locale, while preserving the existing signup age/teen logic. The SQL was not applied to any database.

## Verification, clearly scoped
- Re-fetched Phase79 and compiled its JavaScript using V8 `new Function`: PASS.
- Three Recovery219 Node-style static assertions executed in a V8 adapter: PASS (metadata names, handler ownership, draft safety checks).
- A separate synthetic V8 handler test: one signup request included `profile_bio`, `profile_display_name`, birthday, username, language and interests; a mocked duplicate-username response produced the intended friendly error and re-enabled the submit button. These are mocked, **not** real Supabase auth or browser tests.
- `test_recovery218.py` was updated in source but native Playwright execution is not verified in this run. GitHub Actions execution and SQL staging execution are also not verified.
- No Android APK/AAB or iOS IPA built, and no physical-device tests.

## Deployment state and blockers
At the last Vercel listing, latest READY preview was `dpl_8wcFgZ6h9EeW7qiVtFdPWSNnT1Ut` at `https://kinfolk-social-demo-gxdv2vmi0-alstoda59-9779.vercel.app/`, target null, from commit `a8ee98ebc1697df3a1641419f83c17a64684f396`. It **predates** Recovery219 code and the latest Recovery218 mobile style. Latest app/CI commit `35b7aa667a1496c630a7be3320038d0e17d87938` has Vercel failure status linking to the build-rate-limit upgrade page. No Recovery219 READY preview verified. Do not treat READY/HTTP 200 as functional auth verification.

Remaining blockers: authorized isolated backend with synthetic accounts, end-to-end signup/email confirmation/session restore, backend username collision error behavior, safe staging migration verification, locale/interests feature persistence, RLS two-account adversarial tests, native callback, signed Android/iOS builds, physical devices, accessibility, content moderation and store policies.

## Commits
- Signup metadata alignment: `28cd01ab8ab6c06f65138989b5613cda225a04fc`
- Mobile signup metadata test: `f31dc04b425c81c32a5233a90d04bd46d0d3f823`
- Username copy and duplicate feedback: `12eb5f71c91890e3c7d90b54e6a272c3b2822164`
- Draft SQL migration and repair: `28e034c43aa96d5f6bfa88f1000c2068ae0c9dbe`, `4aade0002264da7f04393c1a72ef02103960fe0b`
- Static regression test: `b495af6d7e0a13072ebb5d22c5e3067532968200`
- CI registration: `35b7aa667a1496c630a7be3320038d0e17d87938`

No production deployment, no merge, no live schema/auth/data/security changes, no Kinfolksworld modifications, no real-user messages, and no app-store submissions.
