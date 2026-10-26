# Kinfolk Social Recovery218 | mobile signup expansion and Recovery217 repair

Scope: FULL MAIN Kinfolk Social, excluding Kinfolksworld. Isolated development branch `kinfolk-social/recovery207-signup-navigation-guard`. Date: 2026-10-25.

## Source review
Inspected latest Recovery217 source/notes, branch README, integration/validation notes, Phase76 auth form, Phase79/95/98 handlers, offline Chromium signup tests 129/133/139 and existing CI. Consulted original Recovery133 Library continuation notes. Vercel latest READY preview found at inspection was Recovery215 `dpl_C1Upfbzr1uMneuKCEziwSaqiocLn` from `b10b9230df7718641284b2f4069941d22983ac27`, target null. It does NOT include these changes.

## Bug fixed
Recovery217 attempted `form.insertBefore(...,pass.nextSibling)`, but the password input is nested within `.kf73Password`. Its sibling is not a direct child of the form. This raised NotFoundError and could abort birthday input, confirmation input and other signup mounting. Confirmation fields now insert after the direct-child password wrapper. Commit `38c56e9ef5f9e2739be7517da7a3b22fd3dffba0`.

## Implemented
- Optional expandable mobile profile setup: short bio (160 characters maximum), preferred language (English, Spanish, French, Portuguese or German) and up to three interest tags.
- A clear Step 1 introduction, Step 2 optional personalization section and Step 3 review/create information panel, preserving the existing pink/dark mobile appearance and the single Phase79 signup handler.
- Client-side bounds/choices are checked before signup. Optional choices are placed in Supabase signup user metadata; **this does not mean profile-table synchronization, discoverability/privacy settings or uniqueness enforcement are implemented**.
- Confirmation password remains masked by default with an accessible, styled visibility toggle.
- Existing login, email confirmation redirect behavior, stay logged in and mandatory signup birthdate checks unchanged.

## Tests and evidence
- Re-fetched exact Phase79 script after code changes and compiled using V8 `new Function`: PASS syntax.
- Used a local mocked DOM/SDK in V8 to exercise form mounting and adult signup. Exactly one each: username, confirmation, birthday, optional profile details and review panel; one mocked SDK signup call with display name, birthday, username, bio and language metadata. This is **synthetic only**, not a rendered browser or real Supabase session.
- Added `test_recovery218.py` for simulated mobile Chromium: form mounting, mismatched passwords, optional profile fields, metadata. Added it to CI.
- Updated `test_recovery129.py`, `test_recovery133.py` and `test_recovery139.py` fixtures for new required username and password confirmation.
- Native Python Playwright suite, GitHub Actions and physical Android/iPhone tests **not verified as executed** at this checkpoint.
- GitHub Vercel status on latest app commit `2c53ec9c985c9588f9348c562302435a8d4cf4f2`: failure with target `https://vercel.com/alstoda59-9779?upgradeToPro=build-rate-limit`. This is a quota error, not proof of app runtime failure. No verified Recovery218 READY preview.

## Commits
- Repair confirmation DOM insertion: `38c56e9ef5f9e2739be7517da7a3b22fd3dffba0`
- Optional profile setup: `8c8ec3d2e525d69bfd66ded79a94f6574a069afd`
- New Chromium test and extension: `c73d344151d814df9799dbba16fdb2d6acf68606`, `a513bb043fb347bc93bfcf67af00dca4da004975`
- Update older mobile test fixtures: `f6d4a51f28a9eb0dca91a6003db3d08452c41067`, `3fca3089aaed5a6ef637513f3e5e41aeb65780ea`, `18589eebd08b1d0f39d997b11a46579904b9e58b`
- CI: `2c067a29d4e2eb77f7af7a6523712c7842247f77`
- Copy and mobile toggle style: `a8ee98ebc1697df3a1641419f83c17a64684f396`, `2c53ec9c985c9588f9348c562302435a8d4cf4f2`

## Release blockers / next
Run CI and inspect real build logs. Verify signed-up accounts, email confirmation and session restoration on owner-authorized isolated Supabase only; enforce unique usernames and age/teen/privacy RLS on backend (draft migration for review). Build guided profile completion without duplicating profile forms, verified native callback, accessible keyboard/safe areas, and Android/iOS physical tests. Complete store policy review including adult-content filters.

No merges, production deployments, Kinfolksworld changes, shared Supabase changes, real-user messages or app-store submissions.
