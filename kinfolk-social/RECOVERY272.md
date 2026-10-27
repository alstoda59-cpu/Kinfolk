# Recovery272 | Login/signup mode consistency

Baseline Recovery271. Inspected Recovery271 report, Phase95 auth/login/session logic and isolated Auth readiness gate. Phase95 `mode(form)` recognized `Create your Kinfolk` as signup but not `Create Account`, although Phase79 supports both headings. The mismatch could cause Phase95 login binding to misclassify or skip the alternate signup screen.

Commit `2e3c2bde9de59ec3e73b3243089865bf7fbe8358` makes Phase95 recognize both signup headings without changing login identity protections, Supabase settings, or mobile UI.

Committed source only. No executed regression tests, GitHub CI, Vercel READY, real backend E2E, native APK/iOS build or physical-device QA verified here. No production, live Supabase, Kinfolksworld, paid project or store changes.
