# Kinfolk Social Recovery238 | Login retry CI and DM block lifecycle

Date: 2026-10-26. Scope: FULL MAIN Kinfolk Social app in `kinfolk-social/` only. Kinfolksworld, production and shared live Supabase remain untouched.

## Starting point and verified regression
- Base: Recovery237 branch `kinfolk-social/recovery237-dm-block-account-isolation`, commit `9c9db04e9f1b04d1e30279f7ba4b25f9919de322`.
- Inspected latest branch, Recovery237 notes, README, INTEGRATION.md, validation.json, Library continuation notes, Vercel previews and GitHub Actions.
- Recovery237 GitHub Actions run `40369436917` **failed**, despite passing its Node regression suite. The mocked browser `test_recovery224.py` retried login with an empty password field after a stale attempt; the retry never reached the token endpoint. This is a fixture expectation problem; not evidence that a real backend login succeeds or fails.

## Committed changes on isolated Recovery238 branch
1. `c7d4df7fba182c71ef3128af7d02b93b0ba8984d` — `test_recovery224.py` explicitly re-enters the password after the stale request clears, verifies form validity, and asserts that the retry token request uses the NEW email and password. Does not relax the stale-session or wrong-account assertions.
2. `859718e4a91e206b606a530417eb6e7f005a1473` — `kinfolk-phase107.js` DM Block action uses a single native click event instead of touchend + pointerup, so taps and keyboard activation do not double-trigger. In-flight blocks for the same account/peer are deduplicated, and an async result cannot close/toast a different conversation after the DM peer changes.
3. `0b6aa7adec93fc16f0c9a2938956e36a209c681a` — updated and expanded `tests/recovery237-dm-block-account-isolation.test.cjs` with single-click, stale-peer, and duplicate-request cases (11 cases total).

## Verification and limits
- Exact committed Phase107 source parsed in V8.
- Four focused in-memory V8 checks passed: source parsing, in-flight duplicate suppression, stale peer UI suppression, and single click binding.
- New test file parsed in V8. Full Node and mocked Chromium/WebKit suite **not yet confirmed** at note creation.
- GitHub Actions latest source-check run: `40377851027` pending at note creation. Earlier `40377745253` was still in progress.
- Isolated Vercel preview for `0b6aa7a`: `dpl_32LwTpE4XQ3ZQF1RfwNoajwkdwr9`, READY, target null, URL `https://kinfolk-social-demo-5g74s1y71-alstoda59-9779.vercel.app/`. Deployment READY is not browser/device/backend verification.

## Remaining blockers
- Separate nonproduction Supabase project awaits owner selection of organization and any nonzero cost approval. No live schema/auth/security/data mutations are authorized.
- Real email signup/login/session restoration, two-account DM/block and teen/privacy RLS, uploads, notifications, and physical Android/iPhone testing remain unverified.
- No signed Android AAB/iOS IPA, store submission or production release authorized.
- Next run: inspect latest CI for Recovery238, repair failures if any, then continue account-safe messaging/notifications and native QA.
