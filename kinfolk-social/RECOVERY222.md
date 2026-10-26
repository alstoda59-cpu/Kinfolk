# Recovery222 — confirmed logout and mobile browser verification

Date: 2026-10-25 (America/Los_Angeles).
Base commit: `ac20eec875fcee15c7f8626517136cba24406124` (Recovery221).
Development branch: `kinfolk-social/recovery207-signup-navigation-guard`.

## Completed
- Logout checks SDK errors and confirms the session is absent before clearing the app. Failed logout retains the current account and shows retry feedback instead of pretending it succeeded.
- Duplicate taps cannot start overlapping logout requests. Pre/post account checks prevent completion of an old logout from clearing a newer account's UI.
- Logout is scoped to this device/session (`local`); it does not intentionally sign out other devices.
- Signed-out transitions stop Reels and profile music, clear remaining account-specific channels/friend requests/likes/comments/subscriptions, reset navigation selections, and remove the one-tab marker. Existing auth transition owner remains responsible for rendering login.
- Added seven Node regression cases and a mobile Chromium/WebKit logout test with all network blocked and the existing synthetic SDK.
- Updated obsolete Recovery137 browser expectation: blocked preference storage must prevent login rather than bypass the current persistence policy.
- Recovery221/222 browser tests accept `KINFOLK_TEST_ENGINES=chromium` for locally available engines; default CI still requires both Chromium and WebKit.

## Executed checks
- Actual Node v24.22.1: **131/131 tests passed**, zero skips.
- **27/27 legacy JavaScript scripts passed** (static/synthetic checks).
- Inline application JavaScript syntax: passed.
- Native web packaging: passed; all **23 referenced modules** included and byte-compared by existing regression.
- **11 actual Chromium mobile browser scripts passed**: Recovery129, 133, 137, 138, 139, 141, 143, 218, 219, 221 and 222. Local Playwright 1.51.0 / Chromium Headless Shell 134.0.6998.35, 390×844 mobile emulation. Previous newer Chromium downloads failed; this compatible headless-shell download succeeded. Tests use a mocked SDK and synthetic credentials, not live accounts.
- Recovery129 covers mobile login/navigation/profile/settings; dedicated tests cover timeout, blocked storage/restoration, signup fields/age/privacy, resend cooldown/errors/navigation, and logout failure/retry/cleanup. This is not proof that all app features work end to end.
- `git diff --check`: passed.

## Remaining limits
- WebKit/iPhone execution remains unverified: installed WebKit requires missing host libraries. Physical Android/iPhone, real email delivery/confirmation, refresh across real sessions, and isolated backend E2E remain outstanding.
- CI uses Playwright 1.58.0 and Node 22. Local pass does not establish that GitHub Actions or those exact versions passed.
- No authorized isolated Supabase backend configured; no live Supabase writes, schema/auth/security changes, or real account tests performed.
- Native assets are prepared, not signed APK/AAB/IPA builds. Native callbacks, permissions, streaming, notifications, Gold Star/store policy and store readiness remain unverified.
- No production release/merge, Kinfolksworld edits or live backend changes.
