# Kinfolk Social Recovery152 | login preference storage failure

Scope: full main app only; no Kinfolksworld, production, or shared Supabase mutations.

Inspected Recovery151 notes, phase95.js, index.html, prior Recovery133 README/INTEGRATION.md/validation.json and Recovery151 Vercel preview READY. Recovery151 phase95 saveStay silently logged warning and continued login when local/session storage was blocked, undermining Stay Logged In enforcement.

Fix: saveStay now throws a user-readable error when storage fails; Phase95 submit catch shows error and does not call adopt(tokens). Code commit 9a1da710a2a1e9fe268dcea3ab757c4ede02b4ef. Added Node vm-based test file test_recovery152_storage.js commit cd5318695c2185bf1273895c4db2e6747c75167e. Test has not yet been executed in this run.

Preview deployment dpl_93x2rA7uawWMpNWDRP8zFsr6tfVL, URL https://kinfolk-social-demo-f23a9jcqo-alstoda59-9779.vercel.app/ started, initially INITIALIZING. Not yet confirmed READY or browser-tested.

Known limitations: storage writes are not transactional; partial writes should be addressed in later hardening. No authorized isolated Supabase test account, real backend auth, Android/iOS device or store validation. No production deployment or shared backend writes. Keep feature preservation and branch-only development.
