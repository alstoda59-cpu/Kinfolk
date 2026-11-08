# Recovery516: password-bearing userinfo APK audit regression (2026-11-08)

Base: Recovery515, commit 1c705d7a36799c5491db54753e64670a2be54214.

## Confirmed defect
The Recovery515 regex used `[^/@\\s?#]*` in a Python raw bytes regex. This excludes the literal letter `s` rather than whitespace, causing password-bearing userinfo URLs such as `https://aaaaaaaaaaaaaaaaaaaa.supabase.co:password@attacker.example/auth` and `wss://aaaaaaaaaaaaaaaaaaaa.supabase.co:secret@attacker.example/realtime` to escape the deceptive-hostname rejection.

## Changes
Added two synthetic compiled-APK regression tests for HTTP and WebSocket password-bearing userinfo URLs and a numeric-port non-regression test. Changed the matcher to `[^/@\s?#]*`, correctly excluding whitespace and allowing ordinary letters in userinfo. No production/backend changes.

## Verification
A local Python regex smoke test passed the three focused URL cases. The full Python unittest suite, compiled native APK audit, GitHub Actions status, Vercel preview and physical-device QA have NOT been verified for Recovery516. The prior branch's test suite did not include the new password-bearing cases.

## Remaining release blockers
Connected email signup/verification, login/logout/session restoration, two-user Supabase RLS and private-media checks, uploads, messaging, teen privacy and native physical-device QA remain unverified. An isolated Supabase organization and any nonzero charge require owner confirmation. Never touch shared live Supabase, production deployment, Kinfolksworld or store submission without explicit approval.
