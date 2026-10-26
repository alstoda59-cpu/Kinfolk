# Kinfolk Social Recovery223: reused signup form async lifecycle

Date: 2026-10-25 (America/Los_Angeles).
Project: **FULL MAIN Kinfolk Social only**, excluding Kinfolksworld.
Development branch: `kinfolk-social/recovery207-signup-navigation-guard`.

## Source inspected
- Inspected latest branch `README.md`, Recovery222 continuation notes, current Phase79/95/98 source, Recovery213/207/221 authentication regression tests, Vercel preview history, and the existing GitHub Actions workflow before editing.
- Recovery222 was latest pre-work checkpoint: 131/131 native Node tests and 11 mobile Chromium regression scripts reported passed in its own recorded run; **none of those complete suites were re-run as part of Recovery223**.
- Current shared backend remains untouched. No new account, live Supabase test, production deployment or Kinfolksworld modification.

## Actual code fix
Phase76 retains the same `#authForm` node while replacing all its children when switching between Log in and Create account. Earlier Phase79 async signup guards checked only `form.isConnected` and the text 'Create your Kinfolk'. If someone navigated Signup -> Login -> Signup, the original pending request could treat the *new* signup screen as its own and display an old success/error, confirmation email panel, or persist prior Stay Logged In preference.

In `kinfolk-phase79.js`:
- Capture the original `.kf73Title` **DOM element identity** when the signup request starts, not only its text.
- Check that the captured title element remains in the same connected form after every asynchronous step (signup response, session verification, storage failure/sign-out cleanup, success and error handlers).
- Keep the global request-in-flight lock so quick navigation does not create overlapping accounts. On a newly mounted signup form, display a clear temporary-busy message instead of silently swallowing the submit.
- Track the active signup title with the request lock and clear the lock only from its original request completion.
- Preserve one capture-phase signup handler, unchanged login ownership, 13–17 protections, existing fields, email resend and Stay Logged In safeguards.

## Changes and commits
- Application fix: `663ba50b34f2eca7db7289f0e7f92ed38824e11c`.
- Extended `tests/recovery213-signup-async-navigation.test.cjs` with 4 regression cases (signup success and failure after same form is reused for a new signup, delayed session validation, delayed storage sign-out). Commit `27f2de312a78a04be32e60c9ba30f4dd7e5f4bbb` plus follow-up `c2f3e190a5d08e61ea23a2cc3a11dcfc147ae662`.
- Added `test_recovery223.py`: mobile 390x844 Chromium/WebKit offline mocked SDK regression for Signup -> Login -> Signup, pending SDK response, retry and verified new email panel. Commit `6381d926b0199032e58679a895dc41859c8d787d`.
- Added Recovery223 mobile script to existing CI matrix, commit `0d29ed60729a7f06edbc579751ff846c1ead763d`. Existing workflow already runs all `tests/*.test.cjs`; no duplicate Node step.

## Verification with accuracy
- Fetched updated Phase79 source and compiled via JavaScript `new Function`: PASS.
- Fetched exact regression test and Phase79 source, executed all **7/7** Recovery213 regression functions using a synthetic V8 Node-like `vm`/storage/DOM adapter: PASS. This is **not native Node**, browser, GitHub CI, real backend or physical Android/iPhone.
- The new `test_recovery223.py` is committed and included in GitHub Actions, **not verified executed** in this run. No full application Playwright rerun reported.
- **READY isolated preview containing the application fix:** Vercel ID `dpl_GYaC6BLBwdfRacmbVkFUEYpEE2dC`, target null, branch `kinfolk-social/recovery207-signup-navigation-guard`, commit `663ba50b34f2eca7db7289f0e7f92ed38824e11c`. URL: `https://kinfolk-social-demo-a81ci0q8u-alstoda59-9779.vercel.app/`. Authenticated read-only HTTP fetch of `/kinfolk-phase79.js`: 200, contains captured-title and all 5 async identity checks. READY/200 do **not** prove rendered signup or server sessions.
- GitHub combined Vercel status for later CI commit `0d29ed60729a7f06edbc579751ff846c1ead763d`: `failure` with link indicating **build-rate-limit**, not evidence of runtime failure. No newer READY preview of test/docs commits confirmed.
- No production/alias changes. No physical Android/iPhone, real Supabase auth, real email-delivery, signed AAB/IPA or app-store submission.

## Next work
1. Verify GitHub Actions results for all Node and mocked Chromium/WebKit checks; fix test-version regressions if present.
2. Create owner-authorized isolated backend for real signup (including requested username and actual assigned username), email confirmation, login/logout/restore, database privacy/RLS, and safe cancellation/navigation races. Shared live Supabase may not be used for test account creation without owner authorization.
3. Complete app functionality QA for Home/Reels/Channels, media uploads, profile/theme/music persistence, messaging and notifications on Android/iOS.
4. Finish native Capacitor projects, bundled SDK/offline startup audit, authenticated callback routing, keyboard/safe areas, permissions and store policy review. Release only after device end-to-end evidence and explicit owner approval.

**Restrictions preserved:** no restart, guest demo, merge, production deployment, Kinfolksworld edits, live Supabase mutation, secret disclosure, messages to real users or store release.
