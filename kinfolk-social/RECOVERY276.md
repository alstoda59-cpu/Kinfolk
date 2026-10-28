# Recovery276 | Signup verification redirect URL hardening

Baseline Recovery275. Inspected Recovery275 report, Phase79 signup email redirect handling, existing signup validation, native alpha package verification, and RLS test harness.

- `bafd424e0128b179d3f33a1183939f8b6cf0f7f7`: reject HTTPS email verification redirect URLs containing embedded username or password. This prevents credential-bearing redirect URLs from being supplied to the isolated Supabase signup flow. Existing HTTPS and loopback restrictions are preserved.
- `4fb4217f5422848e7f5f6e3dc319601a1aef797d`: add five Node test cases for HTTPS origin, valid custom redirect, username, password, and insecure/loopback redirects.

**Evidence:** Changes committed on isolated branch only. The five tests have not been executed; no new CI, READY preview, real email delivery, backend auth, native Android/iOS builds or physical QA was verified. The redirect restriction does not prove that a custom domain is authorized by Supabase; that remains a separate configuration and E2E check. No production, shared live Supabase, Kinfolksworld, paid infrastructure or app-store changes.
