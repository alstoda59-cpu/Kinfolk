# Recovery365 | Mobile signup stale-form browser regression and identity gate

Date: 2026-10-31. Scope: FULL MAIN Kinfolk Social, `kinfolk-social/` only.

## Starting evidence
- Continued from Recovery364 isolated branch at `2b7a41fc4e19c99c42f6bf8ea176f839b755ab99`, not default `main`.
- Recovery364 source CI run [41181168686](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41181168686) **FAILED** in simulated browser regressions. Its Node suite was **867 passed, 0 failed**, but Playwright `test_recovery223.py` timed out waiting for `#kf221Verification`.
- Root cause: the older Recovery223 mocked successful signup responses omitted `data.user.email`. Recovery364's stricter runtime signup identity guard correctly rejected those responses, so the test could not reach the verification panel. This is a test fixture issue, not evidence of a real Supabase signup success.

## Changes
- `test_recovery223.py` now returns explicit matching `old@example.test` and `new@example.test` identities for its synthetic success cases.
- Expanded Chromium/WebKit mobile browser scenarios to prove a response carrying a **different** email does not render verification and displays the mismatch error, while matching email permits verification and an older signup's response cannot overwrite the newer form.
- The test keeps external network blocked and uses synthetic identities. It does not send email or touch any Supabase backend.

## Verification boundaries
- Source commits: `c1094e2ed74f2680d5f8e3ed0c47d571bca647c2` (fixture repair), `085c8431b74e0a26787db1cae5fe33c13b327c5f` (negative browser coverage).
- Automated CI on final branch head must be checked separately before claiming green. Vercel preview READY only demonstrates build/deployment, not functional signup.
- No shared/live Supabase schema/data/auth/security, isolated backend records, production deployment or aliases, Kinfolksworld, paid infrastructure, store submissions, or physical devices changed/tested.

## Remaining release gates
Real approved-mailbox signup/email confirmation, two confirmed isolated synthetic accounts with RLS fixtures, backend-connected Android/iPhone builds, uploads/messaging/notifications E2E, teen enforcement and physical-device QA remain unverified. Draft/unmerged. **NOT launch-ready.**
