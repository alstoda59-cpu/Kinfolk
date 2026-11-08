# Recovery514: APK authority userinfo boundary (2026-11-08)

Base: Recovery513 e9f9053e9d3064e8fc0a0a415e8ca08c6d50bb8f.
Branch: kinfolk-social/recovery514-apk-userinfo-boundary-20261108.

## Implemented
The compiled APK URL audit previously accepted an allowlisted project URL followed by an HTTP URL userinfo separator, for example `https://aaaaaaaaaaaaaaaaaaaa.supabase.co@attacker.example/auth`. The URL's actual network host is attacker.example, not Supabase. Extended the existing authority-suffix matcher to flag `@hostname` and reject it as a deceptive Supabase hostname. This also applies to WebSocket URLs. Added two synthetic APK regression tests for HTTP and WSS userinfo redirects.

## Verification
An independent isolated regex smoke check matched the malicious HTTP userinfo suffix and preserved recognition of an ordinary allowlisted URL and deceptive dotted hostname. This is **not** the full unittest suite, GitHub Actions, compiled APK audit, connected backend validation, or physical-device QA. Exact-head CI and preview status must be checked separately.

## Scope and blockers
Only `kinfolk-social/native/scripts/` and this report were changed, on a nonproduction branch. No shared live Supabase, production aliases, Kinfolksworld, paid infrastructure, real accounts or store submissions changed. The connected email verification, signup/session, two-user RLS, media, messaging and physical Android/iPhone testing remain release blockers. A separate nonproduction Supabase organization and any nonzero cost require owner confirmation.
