# Recovery474 | Preview transport isolation

Date: 2026-11-05. Base: Recovery473 (8d76b7800fd6097bea2c94e678bb86f5df721591).

Application commit 0be6f94df8cc7c95f0bcaf153e95bb4967b05879 blocks WebTransport and WebSocketStream constructors on Vercel preview hosts, extending existing worker/WebRTC and HTTP transport blocking. Native localhost and custom domains are exempt. Test commit a9131df445a77c6946e561e24a11845b32aafcf9 expands the executable synthetic DOM harness and asserts preview denial plus native/custom-domain exemptions.

Verification: GitHub accepted commits. CI passing and Vercel READY for this branch are not established by commit acceptance. Local attempt to fetch repository test files failed due to raw.githubusercontent.com DNS resolution; no local test pass is claimed. No real Supabase backend or physical device tests were performed.

Remaining alpha gates: approved isolated Supabase organization and any nonzero project cost, email verification/login/session E2E, two-account RLS and private media, connected posts/uploads/messages, Capacitor Android/iOS binaries, and device QA. Do not deploy production or modify shared live backend. Kinfolksworld untouched.
