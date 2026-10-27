# Kinfolk Social alpha: signed-media and profile-render account isolation (2026-10-26)

## Checkpoint and scope
- Full main Kinfolk Social in `kinfolk-social/` only. Kinfolksworld, production, shared live Supabase, store releases and Vercel aliases unchanged.
- Continued from latest verified `kinfolk-social/alpha-account-load-isolation-20261026` at `b33b2ada909d8cc01f2a8a5701a0655d181fedc8`. Reviewed current app source, prior alpha account-load notes, Recovery247, native isolation scripts, GitHub Actions native workflow, Library Recovery226/232 notes and latest Vercel deployments.
- Isolated development branch: `kinfolk-social/alpha-signed-media-isolation-20261026`. No merge to production or shared main.

## Implemented
1. `4ce1e1f4a7a0589247dd3b0ca0fca3ea0cee665d`: `signed(bucket,path)` now captures user ID and auth epoch before a storage request and rejects delayed signed URLs if the account/session changes. Stale results are not written to `state.signed`. Home and feed rendering discard late work after logout, account switch or Home navigation.
2. `b5fb73b05bf5c23b81ea1c6505417cd78665c85e`: six synthetic regressions in `tests/alpha-signed-media-isolation.test.cjs`.
3. `20538f1d7026ac104ecd9d48488886433b3a91bb`: profile renderer guards delayed profile lookups, cache writes, avatar loading and final DOM output against account switches and navigation to another profile.
4. `e3f418369610063bde13267415639b2e80e217e6`: four synthetic regressions in `tests/alpha-profile-render-isolation.test.cjs`.

## Verification
- Fetched back the exact committed test files and current HTML, then executed all **10 of 10** synthetic test cases in a V8 runtime with Node test/assert/file shims. These are **not** GitHub Actions or actual Node CI results.
- All five inline JavaScript scripts in the current `index.html` compiled using V8 `new Function`; 24 external/empty script tags were not evaluated.
- GitHub comparison from base showed four commits ahead and zero behind before this note.
- Vercel nonproduction deployment `dpl_C1H29LSPXGNik3QzBWnWnVudcHUV` reported **READY** for exact application-and-test commit `e3f418369610063bde13267415639b2e80e217e6`: https://kinfolk-social-demo-hnv6ajeqe-alstoda59-9779.vercel.app/ . READY does **not** establish login, rendered UI, backend RLS, device or media-access success. Do not enter personal information or real accounts; web preview backend isolation has not been verified.
- The native GitHub Actions workflow `.github/workflows/kinfolk-alpha-native.yml` currently triggers on a limited set of branches and uses an **offline packaging-only** Supabase stub. It did not run for this branch, and its output would not prove functional authentication.

## Remaining alpha gates
- Real synthetic signup, email confirmation, login/logout/session restore and two-account RLS tests against the isolated Supabase project `viantpfagtbgyyzavmtv`; no real backend tests were performed in this run.
- Secure cross-account media access for public posts and profile avatars, teen protections, privacy, stories, Channels, Reels, messages and notifications.
- Android APK and iOS Simulator builds containing this branch, then physical Android/iPhone QA. Existing Recovery226 artifacts predate these fixes and use an offline-only backend. iOS Simulator ZIP is not an installable physical iPhone IPA.
- No production deployment, shared live backend modification, paid resource, or app-store submission without explicit owner approval.
