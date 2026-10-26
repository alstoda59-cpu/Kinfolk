# Recovery249 | consistent signup and password length across active mobile flows

Date: 2026-10-26. Main Kinfolk Social only. Isolated branch `kinfolk-social/alpha-password-flow-consistency-20261026` from `2bb6df324b58f3064153dc6696b041d26e73fe1f`.

## Code
- Fix active Phase79 signup validator and confirmation field to accept 12–128-character passwords. Recovery248 only updated the legacy inline HTML; the active signup handler still rejected passwords above 12.
- Fix Phase76's Supabase signUp wrapper, account-security password update, signup HTML and mobile form hardener to use the same range.
- Remove legacy login's signup-only password caps. Login must accept existing passwords regardless of signup length. Form hardener now determines signup from the active form title instead of scanning all body text, preventing the visible Create account tab from making login look like signup.
- Preserve all Home/Reels/Channels, teen privacy, profile music, messaging, native packaging, and dark mobile design.

## Verification
- Parsed both modified JavaScript files with V8 `new Function` without executing DOM effects.
- Ran 6 focused synthetic source/guard checks covering boundaries, signup wrapper, login compatibility, form limits, and account-security settings.
- Added `tests/alpha-password-policy-regression.test.cjs` for Node CI. Actual Node/GitHub Actions run on this commit is **not yet verified**.
- No live Supabase/email account tests, Android/iPhone device tests, native signed build, or new Vercel preview performed in this checkpoint.
- Do not interpret a READY older Vercel preview as containing these fixes; free deployment quota was reported exhausted.

## Next
Run the Node regression in CI; integrate the isolated backend publishable key only into native alpha packaging; test synthetic verified email signup/login/logout/session restore and upload/privacy on isolated Supabase; produce an installable debug APK and iOS Simulator artifact; physical-device QA before launch. Never change live Supabase, production or Kinfolksworld.

## CI regression repair
- GitHub Actions source run `40413001198` on `e1d117486422418392e8c1d9062b0c34928d4a63` **failed**: 198/227 Node tests passed, 29 failed because six existing synthetic signup fixtures still used eight-character `testpass` and were rejected by the corrected 12-character minimum. All six fixtures were updated to `testpass2026!` (13 characters), without weakening production validation. This fixture-only commit needs a fresh CI run before calling the suite green.

- GitHub Actions run `40413148623` on `35aec1ab6ae6d418d732f7a8a4d8c8cb7881f46a` confirmed **227/227 Node tests passed**; browser stage then failed in `test_recovery129.py` because its old synthetic signup used a seven-character password. Updated seven mocked Python browser regression fixtures to 12+ characters, preserving short-password login fixture checks. A new full CI run is required; do not claim the entire workflow passed yet.
