# Recovery437 | Native signup pending-state regression

Date: 2026-11-03. Scope: FULL MAIN Kinfolk Social, kinfolk-social/ only. Based on Recovery436 head 42fa3361593ebe5a0a193e7292605018644aa4e7. Isolated, unmerged.

## Verified predecessor
Recovery436 exact-head source CI run 41628087376 completed SUCCESS (syntax-and-package job). This is synthetic/source verification only; no connected Supabase or physical device.

## Implemented
Commit 74c0dbc84ff38f3aac58c8bc32d65684a9610890 extends the executable authentication regression to cover the signup path with a delayed synthetic Supabase signUp response. Checks one network request for repeated native submit, restored submit control after resolution, retry availability, native capacitor:// origin omission from emailRedirectTo, and retained username metadata. This closes a test coverage gap: Recovery436 previously exercised only login. No application behavior or security settings changed.

## Boundaries
New exact-head CI is pending. No real email inbox verification, two-user authenticated RLS, connected uploads/messages, native compilation or physical-device acceptance was performed. No shared live Supabase, production deployment/aliases, Kinfolksworld, paid resources or store changes. Not launch-ready.
