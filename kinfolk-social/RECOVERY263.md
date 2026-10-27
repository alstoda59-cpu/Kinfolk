# Recovery263 | Verification resend email identity guard

Base: Recovery262. Scope: main Kinfolk Social only.

- `61c4c2a9`: introduced a current-email check for verification resend controls.
- `a52e42f0`: aligned the check with the real `#kf73Email` field, with email-input fallback.
- `c2401016`: added a synthetic regression that changes the signup email after verification panel creation and requires zero resend requests.

The guard prevents a stale verification panel from sending another request for a previous address after the signup email changes. It does not cancel an already submitted network request. Existing login/signup and mobile design are retained.

The test is committed but an exact-source Node execution, full CI, real Supabase email delivery, Vercel READY for this branch, native builds and physical Android/iPhone QA are not verified. No live backend, production, Kinfolksworld or app-store changes.
