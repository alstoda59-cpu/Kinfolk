# Recovery512: Scheme-relative and WebSocket APK endpoint audit (2026-11-07)

Base: Recovery511 `dcad68667772f529e791e0fe16bb52bf78495755`.
Branch: `kinfolk-social/recovery512-scheme-relative-apk-audit-20261107`.

## Reproduced source-level gap
The Recovery511 whole-APK endpoint matcher recognized only `http://` and `https://` project hosts. Scheme-relative `//other.supabase.co` and WebSocket `wss://other.supabase.co` endpoints could evade the unexpected-project check in compiled assets.

## Fix
Extend the whole-archive matcher to include scheme-relative, HTTP(S) and WS(S) Supabase project URLs. Preserve the synthetic CI endpoint allowlist and whole-APK streaming boundary checks. Add two regression cases covering unauthorized scheme-relative and WebSocket project endpoints. No runtime code, native project identifiers or production backend changed.

## Evidence and limitations
The Python regex was smoke-tested independently against HTTPS, scheme-relative, WSS and an unrelated host; matches were as expected. The full Python unittest suite and compiled APK audit have **not** been executed in this run. GitHub commit-associated workflow lookup for Recovery511 returned no PR-triggered runs; this does not establish that no push runs exist. Recovery511 had a successful Vercel commit status, not an independently verified READY deployment. Recovery512 CI, preview and native compilation are unverified. Earlier Recovery508 offline Android/iOS Simulator compilation is not proof of functional connected mobile authentication. No real isolated Supabase Auth/RLS tests or physical-device tests have been performed.

## Next
Run `python3 -m unittest discover -s kinfolk-social/native/scripts -p 'test_audit_compiled_apk.py' -v`, inspect push-triggered Actions jobs, then build and audit the compiled APK. Keep isolated Supabase provisioning gated on owner organization selection and any nonzero cost approval. Do not change shared live Supabase, production deployments/aliases, Kinfolksworld, or submit stores.
