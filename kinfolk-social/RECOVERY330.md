# Recovery330 | Mobile login/signup form request isolation

Date: 2026-10-29. Scope: full main Kinfolk Social app only, `kinfolk-social/`; continuation of Recovery329 final commit `4940a8cee8f6d3147bea4eaffed6ac35c8791dd4`. Isolated draft branch; no production changes.

## Inspected before implementation
- Recovery329 continuation report, README, native source suites, existing Recovery323/325 auth tests, and the current Phase73 login/signup handler in `kinfolk-phase76.js`.
- Recovery329 final-commit source workflow run `40972963971` reported SUCCESS. No native build or functional backend claim follows from this.
- Nonproduction Vercel deployments on Recovery329 were READY at intermediate commits `dcd00fc5`, `80f25d77` and `191ae184`, not a verified functional backend preview at final head.
- Library Kinfolk prelaunch audit identifies public media exposure, real auth/RLS, teen safety, native packaging and physical-device QA as launch blockers. The older shared live backend findings are not authorization to change it.

## Actual application fix
- The active Phase73 mobile login/signup submit handler previously read mutable global `mode` after asynchronous Auth calls, could show a stale success/error after switching between login and signup, and could allow repeated submissions when a new screen reused the same form.
- Capture the mode, exact form controls, submitted email/password and signup display name before dispatch; bind results to a per-form request token.
- On mode change, invalidate the old request token. Stale responses cannot display notices, save the Stay Logged In preference or re-enable a newer request's submit button. The backend request already dispatched cannot be cancelled by this client-side guard.
- Prevent duplicate submits, restore the button on current errors, and keep successful submissions disabled until navigation.
- Save Stay Logged In preference only after an Auth call succeeds. When email-confirmed signup returns no session, use a generic confirmation prompt rather than falsely claiming an account was created.
- Preserve the existing native signup redirect wrapper and approved callback safety policy; do not change password limits, styling, or the app's other features.

## Regression and native verification
- Added nine synthetic Node VM regression cases in `tests/recovery330-auth-form-request-isolation.test.cjs` covering login success/failure, duplicate taps, mode switching, input edits, detached screens, signup callback/metadata, validation and stale signup display name.
- Integrated the suite into `native/package.json` `alpha:auth:source:test`, included in `alpha:verify`.
- First Recovery330 source CI run `40979819751` executed 641 synthetic Node tests: 640 passed, 1 legacy static fixture failed because it still expected mutable `mode` rather than the new captured `submitMode`. The fixture was updated to check the same signup-only password bounds against the immutable submission mode; no password policy was weakened. A new exact-head CI run must pass before this can be called verified.
- Enabled isolated Recovery330 offline-only Android debug and iOS Simulator workflow. It uses intentionally unreachable CI backend credentials, not real isolated auth.
- CI, native compilation, Vercel preview READY, isolated Supabase real E2E and physical devices must be verified independently at the exact final commit.

## Remaining blockers and safety
- Real isolated signup/email confirmation, login/logout/session restoration and synthetic two-account RLS are not verified.
- Missing Communities/membership/Channels/Video tables, private media, messaging, notifications, teen server enforcement and approved HTTPS callback/device verification remain outstanding.
- No shared live Supabase schema/data/auth/security, production Vercel deployment or aliases, Kinfolksworld, paid infrastructure, app stores or real user accounts changed.
