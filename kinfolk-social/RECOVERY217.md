# Kinfolk Social Recovery217: fuller account creation, first increment

User requested a full mobile account creation flow inspired by Instagram/Facebook/X while retaining Kinfolk's dark design and existing app.

## Implemented
- Mounted a required username input (3–24 ASCII letters, numbers or underscores) in the existing Create Account form.
- Added a required password confirmation input with a separate show/hide control. Both new fields use native mobile autocomplete hints.
- Signup validates username and matching password before sending the signup request, and includes the username in signup user metadata. Existing display name, email, birthday, age rules, Stay Logged In and Supabase signup path are preserved.
- Regression source checks and GitHub Actions step added.

## Known limitations and next steps
- This is **not** the complete Instagram/Facebook/X-style onboarding yet. Still needed: guided step flow, account-specific username uniqueness enforcement (must be backend-safe), verified email callback, privacy/interests/profile setup, accessible validation, full Android/iPhone E2E tests.
- The current 5–12 character signup password rule remains unchanged and needs product/security review. Passwords should be masked by default; avoid exposing credentials in screenshots.
- Username is stored as auth metadata only. Do not claim uniqueness or handle availability without an authorized isolated backend and enforced constraint.
- No native Node/GitHub Actions run, isolated preview, backend signup or real mobile test confirmed for this commit.

## Commits
- App: `8df1f7eb1ac947a9959e22c663fd15f3f5909773`
- Test: `788e93d4eda93b23c034ec31d041e3a5eb1ef24d`
- CI: `87617512d1bd8794080173b24e480130c1ac1188`

No production, Kinfolksworld, or shared Supabase mutation.
