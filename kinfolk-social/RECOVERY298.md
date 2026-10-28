# Recovery298 | Concurrent Home/Reels render source preservation

Date: 2026-10-28 America/Los_Angeles. Scope: full main Kinfolk Social under `kinfolk-social/`, excluding Kinfolksworld.

## Baseline inspected
- Recovery297 final checkpoint `c689a910686dfc594027b17b966154306977e264`, Phase82 content-lane wrapper, Recovery297 tests, Reels159 immersive player, native alpha scripts and historical Recovery226 Library notes.
- Nonproduction Vercel Recovery297 deployment `dpl_7XVzbVyeGXdNkw5rh3eSkqXdCTrU` READY at `dad704cf`, not physical/mobile QA.
- Historical Recovery226 Android debug/iOS Simulator artifacts and source CI do not validate current source.

## Fixed
Phase82 temporarily replaces `state.feed` or `state.videos` with a safety-filtered array while awaiting the asynchronous Home/Reels renderer. A second render previously could capture that temporary array as its source. After both renders finished, the account's in-memory feed could remain filtered and omit otherwise permitted content until a reload.

- `963da939484ada28bf0da2518940b751ec6097b0`: track original source arrays with a WeakMap and derive each overlapping Home/Reels render from the original source. Preserve the existing account-change guard when restoring state.
- `08414769b8686840eac777044eb63021b06f46a0`: add four source-backed Node regression scenarios for overlapping Home/Reels renders and account changes.
- `cacd69ec5de4a9087862b19f558dc519444bf16f`: include Recovery298 tests in native `alpha:reels:source:test` and `alpha:verify`.

## Verification
- Re-fetched exact committed Phase82 source blob `14e7f272060a17103789957a95db7b038bfbd98c`, extracted and executed the actual Home/Reels wrappers in synthetic V8 harness: **4/4 passed** (Home overlap, Reels overlap, Home account switch, Reels account switch).
- Committed Node regression file was **not executed in Node or GitHub Actions**. No current full CI, native packaging, real backend authentication/RLS or physical device testing verified.
- Vercel nonproduction deployment `dpl_Au57pjjL33tmJwDX93aNtM9xxbtg` reported **READY** at commit `cacd69ec5de4a9087862b19f558dc519444bf16f`: https://kinfolk-social-demo-gse3nm53k-alstoda59-9779.vercel.app/ . READY does not establish functional UI or device QA.
- GitHub compare against Recovery297: three commits ahead, zero behind, only `kinfolk-social/` changed.

## Remaining blockers and boundaries
- Isolated nonproduction Supabase organization and any nonzero project cost still need owner confirmation. No shared live Supabase changes.
- Real synthetic-account signup/email confirmation/login/logout/session restore, cross-account RLS, uploads/messaging/notifications, native Android/iOS builds and physical-device QA remain outstanding.
- No production alias, Kinfolksworld, paid infrastructure or store changes. Not launch ready.
