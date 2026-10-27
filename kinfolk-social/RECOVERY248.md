# Recovery248 | Native alpha backend project pin

Date: 2026-10-26 America/Los_Angeles. Scope: full MAIN Kinfolk Social, excluding Kinfolksworld.

## Source and reason
- Started from latest verified alpha composer checkpoint `ac77149a92d18583b4799eb3d42c4c97223cb01f`; this branch descends from Recovery247. Reviewed Recovery246/247, native scripts, Library Recovery226/232 notes, and Vercel preview history.
- Existing native config rejected the shared live project but accepted any other valid Supabase project. That could accidentally package a mobile alpha against an unrelated backend.
- Commit `0d987247450c236558e1d3f6a973ea86cb762451` pins functional native builds to isolated project `viantpfagtbgyyzavmtv`. Existing offline CI markers still work only when explicitly enabled for packaging checks.
- Commit `37879192f16c9dc2f5eb304d3f6716b6e9a3e2fa` adds seven Node regression cases for the pin, live-project rejection, invalid keys, CI stub, and native asset replacement.
- Commit `40275db9e98c432e695ce588e4d3932ccb5ae9aa` includes these tests in `npm run alpha:verify`, and provides `npm run alpha:config:test` for isolated testing.

## Evidence and limits
- Executed `node --test` using Node v22.16.0 on local copies of both committed files: **7 tests passed, 0 failed**. Verified Git blob hashes of those exact local copies match GitHub blob SHAs `8f4e8f69dc8e12b2eb4568a4f66d8c20415c3e98` and `7282ea89f8c10531ec795568004e76d6213f20e8`.
- This is static/config unit testing only. Full GitHub Actions CI, Vercel READY for this branch, real Supabase authentication/RLS, complete native packaging, Android/iOS installations and physical-device QA are NOT established by these checks.
- The publishable key was not committed. Pinning the project ref does not cryptographically validate the key's association with the project; actual backend tests remain necessary.
- No production, shared live Supabase, Kinfolksworld, store or paid infrastructure changes.

## Next blocking work
- Complete isolated schema for profiles/feed/Channels/Reels/media/messaging, then test two synthetic authenticated accounts and RLS, email verification, logout/session restoration.
- Run native alpha CI with isolated backend configuration and test physical Android/iPhone devices. Do not claim release readiness without this evidence.
