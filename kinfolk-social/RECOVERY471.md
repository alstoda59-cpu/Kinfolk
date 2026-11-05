# Recovery471 | Preview hostname and delayed WebView regression

Date: 2026-11-05. Base: Recovery470 (37048e82d5a49622da56a73b0482a7605f2e6624).

Added executable synthetic-DOM cases to the existing preview-isolation regression for uppercase Vercel hostnames, trailing-dot normalization, deceptive non-Vercel suffixes, native localhost/127.0.0.1 exemptions, and delayed body mounting through MutationObserver. The existing GitHub Actions workflow already tracks this test file, so no workflow edit was necessary.

Code commit: 8b29257d51e1ebe6fe4c1b89c40bc39f851d57ce.

The cases are committed but execution has not been independently confirmed. GitHub PR-run inspection does not establish push CI status. No real backend, RLS, native builds, or physical devices tested. Preview READY not established for this branch. No production resources, shared Supabase, Kinfolksworld, aliases, paid resources, or stores changed.

Next priority: isolated Supabase organization approval and zero-cost confirmation; then real two-user auth/RLS and private-media tests. Not installable-alpha ready.
