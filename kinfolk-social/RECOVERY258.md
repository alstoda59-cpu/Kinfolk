# Recovery258 | Phase79 alternate signup heading is now functional

Date: 2026-10-27. Main Kinfolk Social only, `kinfolk-social/`. Base: `kinfolk-social/recovery257-signup-title-guard`.

## Problem
Recovery257 taught the Phase88/98 legacy password guards to recognize both "Create your Kinfolk" and "Create Account". The actual Phase79 signup owner still recognized only the first heading at eight separate guard sites. Under the alternate heading, the account form could fail to mount signup fields, capture submission, show the verification panel, resend email, or safely handle delayed auth results.

## Implemented
- `b4bcc88fc728b19866fc489a0c597d0585265143`: introduce one `isSignupTitle` predicate for both headings in Phase79, used consistently for mounting, submission, resend and six asynchronous navigation checks. Login remains excluded.
- `b0a3ee269788b063593b499f2192718d941538fa`: add real Phase79-script synthetic DOM regression tests for alternate heading signup, verification panel, email resend, original heading, login isolation and stale completion.
- `93a4e92a7ae3fb688936b0df0b19390cc4ce104a`: add predicate coverage and underage rejection cases. The existing CI's `node --test kinfolk-social/tests/*.test.cjs` picks up the new test automatically.

## Evidence and limitations
- Five focused runtime scenarios **passed against exact GitHub-fetched Phase79 source** in a synthetic V8 DOM/auth harness: alternate-title signup and verification panel, resend, original title, login isolation, and stale completion. No real Supabase network requests or accounts were used.
- Exact committed source inspection confirms mount/resend use the predicate, all six async title guards use it, and no old single-title guards remain.
- Seven Node regression tests are committed but a passing Node CI run has **not yet been independently verified**. This V8 harness is not Node CI or a real mobile browser.
- Vercel READY only establishes a deployment state, not signup, backend or device functionality. Verify this branch's SHA before attributing a preview to Recovery258.

## Remaining alpha blockers
Isolated synthetic-account signup/email confirmation/session restoration, two-account RLS fixtures, storage and messaging backend integration, full CI and functional Capacitor Android/iOS packaging, physical-device QA, and explicit release approval. No production, shared live Supabase, Kinfolksworld, paid resource or app-store changes.
