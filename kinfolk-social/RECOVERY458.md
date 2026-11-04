# Recovery458 | Comment submission account isolation and uncertain-write handling

2026-11-04. Continued from Recovery457 (94cc1ce9034fb04bafaff18d44b283f9be4760f0) on isolated branch `kinfolk-social/recovery458-comment-account-isolation-20261104`. Main Kinfolk Social only.

The base feed comment handler previously read the active account during submission and refreshed the UI after an awaited insert without checking whether the login changed. It also treated ambiguous insert failures as ordinary retries. The handler now captures the initiating account and auth epoch, rejects duplicate submits, requires an exact one-row insert acknowledgment, and avoids loading or rendering private state when a response arrives after an account change. Explicit zero-row acknowledgment unlocks the form; ambiguous results remain locked to avoid accidental duplicate comments.

Application commit: 189d6b09917926ad10c00551d988c9315fbba904. Synthetic test commit: 10f69f8581e01ece08bc6f5dcf0163b4f9ccd069. Test: `node kinfolk-social/tests/recovery458-comment-account-isolation.test.cjs`. Five source-executed scenarios were added but not independently executed; do not count them as a CI pass.

Recovery457 final deployment dpl_4UHsqz1fhupk7qQrhoAXeHrtaFCT was READY. Recovery458 exact-head CI, preview, real isolated Supabase two-user RLS/email verification, Android/iOS native compilation and physical-device QA remain unverified. No shared live Supabase, production aliases/deployments, Kinfolksworld, paid infrastructure or store changes. Separate Supabase organization/cost approval remains outstanding.
