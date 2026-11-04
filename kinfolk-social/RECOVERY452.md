# Recovery452 | Rootless mobile WebView preview isolation
Date: 2026-11-04. Main Kinfolk Social only, excluding Kinfolksworld.

Baseline: Recovery451 exact-head commit 46c62d5f584bef9f4997155bc848533397396786; Vercel deployment dpl_HVQTgNRCJMTVxNThwf53JEw2mUcm READY. Reviewed Recovery451 report, preview isolation implementation, synthetic regression and CI workflow.

Fix: preview guard now observes document rather than document.documentElement so it can mount its security overlay even when an embedded WebView initially exposes neither html nor body. Existing immediate CSP network lockout, submission interception, mobile styling and non-preview behavior remain unchanged.

Source commit caff6bbd0c151078f9554d40fc21d2d59effaa04. Regression commit 8041791948567832e5831a36c981a4f1af940396 adds rootless startup case, document observation and observer disconnect assertions.

Evidence: GitHub accepted commits. Regression execution, Actions CI, Recovery452 deployment READY, isolated Supabase auth/RLS, Capacitor native builds and physical-device QA not yet independently verified. No shared Supabase, production aliases, Kinfolksworld, paid infrastructure or app-store changes.

Next: run committed Node regressions and inspect Actions, then prioritize isolated-backend synthetic signup/email verification, two-user RLS and Android/iOS packaging once approved backend organization/cost are known.
