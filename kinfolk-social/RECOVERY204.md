# Kinfolk Social | Recovery204 (2026-10-25)

Scope: FULL MAIN Kinfolk Social only. This isolated development branch is `kinfolk-social/recovery204-reels-input-safety`, based on Recovery203 commit `263af63030d2ab52c663723dc2a009a55a0cebc4`. The concurrent Recovery203 login preference test improvement from `917035de2d2970207211090cc7cbe5933000c057` was also carried forward. No Kinfolksworld, production, or shared live Supabase changes.

## Implementation
- `kinfolk-reels159.js`: dynamically generated action handlers now JSON-encode video IDs and HTML-escape the resulting handler attributes. A quote-bearing ID is delivered intact as a string argument, instead of being interpreted as JavaScript.
- `kinfolk-reels159.js`: reject external media URLs using executable or local schemes such as `javascript:`, `data:`, `blob:`, and `file:`. HTTPS videos and YouTube external links continue to render.
- `tests/recovery204-reels-input-safety.test.cjs`: added synthetic runtime checks for all nine Reels interactions (eight action buttons plus tap-to-pause), hostile IDs, blocked URL schemes, and valid HTTPS/YouTube rendering.
- `.github/workflows/kinfolk-social-ci.yml`: run the new test alongside the existing mobile regression suites.
- `tests/recovery201-mobile-release-guards.test.cjs`: carried forward the newer Stay Logged In and auth adoption guards from the concurrent Recovery203 branch.

## Verification
- **16/16** targeted synthetic tests passed in a JavaScript V8 adapter executing the actual committed Node test sources. This is **not** a GitHub Actions run, real browser, real backend, or device result.
- Existing source and previous test fixtures were inspected before changing the player.
- Latest previously READY preview from Recovery203: `dpl_69KLW9M5pDG8byoQpj4hAjtu1NkL` (commit `263af63030d2ab52c663723dc2a009a55a0cebc4`), `target: null`. It does **not** contain Recovery204 changes.
- Recovery204 preview deployment attempt using the explicit Vercel project/team and preview target was **blocked** with HTTP 402, `api-deployments-free-per-day` (more than 100 deployments; retry after 86400 seconds). No new preview ID/URL was created. No billing or project settings were changed.
- GitHub Actions CI result for Recovery204: **not yet verified**.

## Remaining launch blockers
- Dedicated nonproduction Supabase backend and authorized synthetic accounts are needed for actual signup/login/logout, session restoration, storage/media, RLS, and messaging end-to-end tests. Shared project `zojajuzmfjpvubzibzgg` is not a safe test environment.
- Physical Android/iPhone device testing, signed native builds, email callback, content/age enforcement, privacy/account deletion, and app-store review remain unverified.
- Do not merge or promote to production, modify Kinfolksworld, or declare store readiness without owner approval and end-to-end evidence.
