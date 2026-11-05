# Recovery462 | Ambiguous Like write protection
Date: 2026-11-04. Started from Recovery461 final commit 4fd3c51854e9d1b7fc9451d53d0fdfe1d83d8d33 on isolated branch kinfolk-social/recovery462-like-uncertain-error-20261104.
Application commit 727158cba4ab7ba7b934d44ff4b765d3c296be8a. The Home Like handler previously locked unknown row counts but permitted immediate retries on Supabase errors and thrown network exceptions, potentially duplicating a committed mutation. Both paths now lock the account/post key until page reload, preserving account epoch checks and dark mobile layout.
Test: node kinfolk-social/tests/recovery462-like-uncertain-error.test.cjs. This is source-level regression, not a live Supabase test. CI, preview and device status must be checked separately.
No shared Supabase, production, Kinfolksworld, paid infrastructure or stores modified. Isolated Supabase organization and nonzero costs still need approval. Native builds and end-to-end tests outstanding.
