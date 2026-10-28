# Recovery276 | RLS probe JWT expiration safety

Baseline Recovery275. Inspected Recovery275 report, read-only two-account RLS verifier and its Node regression suite.

Changes:
- `57fbed4d960f4e7ad160af1e4c66782f1f58f633`: reject missing, expired, noninteger or malformed JWT `exp` claims before contacting isolated Supabase.
- `65298a1cd30604a3c152d2771536e74277a2ce36`: update existing synthetic JWT fixture to include future expiration and add three fail-closed expiry scenarios.

Tests have **not been executed** in this turn. This is committed source and regression coverage, not proof of actual two-user RLS. GitHub CI, Vercel READY, real email verification/session, Android/iPhone builds and physical-device QA are not verified. No shared live Supabase, production, Kinfolksworld, paid resource or app-store changes.
