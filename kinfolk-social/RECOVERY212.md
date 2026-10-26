# Kinfolk Social Recovery212 | reused login/signup form repair

Date: 2026-10-25 (America/Los_Angeles).
Scope: FULL MAIN Kinfolk Social only; no Kinfolksworld changes.
Isolated branch: `kinfolk-social/recovery207-signup-navigation-guard`.

## Bug and fix
- Phase98 login cleanup converts the shared auth button to `type="button"` and attaches a login click handler. When the same form switches to signup, the old code returned without restoring the submit button. Tapping Create account could therefore keep calling login or fail to submit through Phase79's capturing signup handler.
- Phase98 also installs a login-only password length override and MutationObserver. On switching back to signup, those could keep suppressing the 5–12 character native password limits.
- `kinfolk-phase98.js` now recognizes signup mode, disconnects the login-only password observer, removes its own max/min length overrides, reapplies signup min/max/autocomplete, and restores the reused button to `type="submit"` with its login onclick cleared. Switching back to login re-enables its original behavior.
- Application commit: `be64c99ad9fe87d6509dedfc80fbb3187e226e0d`.

## Tests and evidence
- Added `tests/recovery212-auth-mode-toggle.test.cjs` to simulate login → signup → login with a synthetic DOM, commit `62e8f2ee714d5dff84535bef980db822edeb7918`.
- Fixed missing `addEventListener` in the synthetic password fixture, commit `464598008a5113145d34438fe8c6391fd2a8af01`.
- CI workflow includes this Node test, commit `9763db6eff9b2a5e96086ca533e5a1659988f404`.
- Fetched committed Phase98 and executed an isolated V8 synthetic-DOM test: PASS for login button/password state, signup button submit and 5–12 password limits, and return to login behavior. Both Phase98 and test source compiled in V8 syntax checks. This is **not** a native Node test, actual browser, backend or physical-device result.
- Latest READY Vercel preview inspected: `dpl_FeMSf5dN8rrEfUe6eKPSXc2bKN7f`, URL `https://kinfolk-social-demo-jibsy9ttu-alstoda59-9779.vercel.app/`, target null, commit `816b33d8c6a3738eed3b2591a800e6a8c6c636ed`. This preview **predates Recovery211/212**.
- Latest checked Recovery212 commit had Vercel status **failure** linking to build-rate-limit. No Recovery212 READY preview or successful GitHub Actions run confirmed.

## Next verification
1. Execute committed Node test via GitHub Actions; confirm result.
2. Obtain new isolated READY preview after deployment quota permits, and test reused signup/login form in a rendered Android/iOS-sized browser.
3. Test real signup/login/logout/session restoration with authorized synthetic accounts against isolated Supabase. No shared live backend writes.
4. Continue Home/Reels, settings/music, uploads, messaging, RLS, and Capacitor Android/iOS builds and store-policy audit.

No production deployment, promotion, live Supabase mutation, or store submission. This is **not** a launch-ready declaration.
