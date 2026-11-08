# Recovery513: APK Supabase hostname boundary audit (2026-11-07)

Base: Recovery512 `ac1da607949ab2aa5e60b7895dacddb29d1ecbf1`.
Branch: `kinfolk-social/recovery513-apk-host-boundary-20261107`.

## Source-level defect and fix
The Recovery512 endpoint matcher captured an allowed project prefix even when it was followed by extra hostname characters, e.g. `https://aaaaaaaaaaaaaaaaaaaa.supabase.co.attacker.example` or `//aaaaaaaaaaaaaaaaaaaa.supabase.company`. Since the allowed synthetic endpoint was already in the entry HTML, a malicious lookalike URL could pass the whole-APK endpoint-set check. The matcher now captures any suffix continuing the hostname and fails closed on that suffix. A terminal punctuation dot does not count as a hostname suffix.

Added two synthetic APK regressions for the deceptive hosts, retaining existing HTTP(S), WS(S), scheme-relative, and streaming boundary cases. A local isolated Python regex smoke test passed five positive/negative samples. This is NOT a successful execution of the full unittest suite or a compiled APK audit.

## Verification boundaries
Recovery512 push-triggered CI previously passed native Android/iOS offline builds, source and security checks. Recovery513 exact-head CI, native APK compilation, preview READY, connected Supabase signup/email/RLS and physical-device tests are not yet verified. No shared live Supabase, production alias, Kinfolksworld, paid resources or store submissions changed.

## Next
Run `python3 -m unittest discover -s kinfolk-social/native/scripts -p 'test_audit_compiled_apk.py' -v` and push-triggered Android audit CI. Then advance isolated Supabase Auth/RLS once organization and any cost are approved.
