# Recovery451 | Delayed mobile webview body isolation
Date: 2026-11-04. Scope: main kinfolk-social only; Kinfolksworld excluded.

## Baseline
Continued from Recovery450 branch kinfolk-social/recovery450-preview-network-lockdown-20261104. Inspected Recovery449/448 reports, preview isolation source, existing synthetic regression and CI workflow. Recovery450 preview READY and CI pass were not independently established in this run.

## Changes
- kinfolk-social/kinfolk-preview-isolation.js: when document.body is absent, add a MutationObserver on document.documentElement, retaining DOMContentLoaded/pageshow callbacks. The observer mounts the blocking overlay once body becomes available, even if both events fired too early, and disconnects after success. Immediate restrictive CSP and submit interception remain in place.
- kinfolk-social/tests/recovery444-preview-isolation.test.cjs: model delayed body insertion after both lifecycle callbacks, assert observer registration, eventual overlay and disconnect, and idempotent callback behavior.

## Evidence and boundaries
Source commit da74ac1ba901129a777f260a96767df0760da8b8; test commit 289031fc4ef82eef9607937164c9c2f8a314d955. GitHub accepted writes. Neither Node regression nor GitHub Actions CI was executed/verified in this run. No Recovery451 READY deployment, real isolated Supabase test, native build or device QA is claimed.

## Next
Verify Node regressions and Actions; prioritize real synthetic email-confirmed signup and two-account RLS in owner-approved isolated Supabase organization, then Android/iOS Capacitor builds and device QA. No shared live Supabase, production alias, Kinfolksworld, paid project or store changes authorized.
