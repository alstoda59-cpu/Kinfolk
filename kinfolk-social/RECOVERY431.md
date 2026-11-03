# Recovery431 | Guard deferred mobile messaging rebinding

Date: 2026-11-03. Scope: full main Kinfolk Social, kinfolk-social/ only. Based on Recovery430 final head f642618f731304f8aa2b02e0491a6ea58b8be320. Isolated branch, not merged.

## Implemented
- 34d912a154fe03cd54a7b3a66dbe820eaf88f68e: safeRun now refuses a send when the previously bound Send button is detached or no longer belongs to the form. The MutationObserver rebind is asynchronous (12ms debounce), so an existing Enter listener or native submit could previously send using a stale handler before the replacement Send button was rebound. This closes that interim gap.
- f24fabcb5ccf5826c77eb54b41487f963b183b18: two source-executed regression cases added to the existing Recovery429/430 harness: deferred button replacement and disconnected Send control. Tests assert submission resumes once a live button is bound.

## Verification boundaries
- Code and tests are committed; test execution and CI have not yet been confirmed for Recovery431. Container network access to GitHub raw files failed (DNS), so no local Node pass is claimed.
- Recovery430 source CI was previously confirmed passed and exact-head nonproduction Vercel preview READY. Neither status establishes Recovery431 results.
- No isolated Supabase Auth API email confirmation, authenticated two-user RLS, connected upload/messaging, Android/iOS final-head build or physical-device acceptance was performed in this recovery.
- No shared live Supabase, production Vercel alias, Kinfolksworld, paid resource, or store submission changed.

Next: confirm Recovery431 CI; prioritize isolated zero-cost synthetic-account auth/RLS and backend-connected mobile packaging. Not launch-ready.
