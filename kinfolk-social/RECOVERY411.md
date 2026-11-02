# Recovery411 | Channels playlist creation: session isolation and confirmed writes

Date: 2026-11-01 (America/Los_Angeles). Scope: full MAIN Kinfolk Social only, `kinfolk-social/`; Kinfolksworld excluded.

## Starting checkpoint and inspection
- Continued from Recovery410 draft PR #107 and verified commit `f644743bbc17623d3f730efe27de8c1523847d1b`; new isolated branch `kinfolk-social/recovery411-playlist-create-session-ack-20261101`, draft PR #108, unmerged.
- Recovery410 exact-head source CI [41399606281](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41399606281) SUCCESS, 47/47 steps, 1,078/1,078 Node tests. Native [41399601442](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41399601442) SUCCESS for offline Android debug APK and unsigned iOS Simulator app, not real backend/device tests.
- Inspected latest branches/commits, Recovery410 report, README, native package scripts/config and workflow, existing channel source tests, Library notes, Vercel preview and separate Alpha Test Supabase metadata.

## Application and regression changes
- `54b67b3fd3c7ed9b1907a048aa8eb00036de804c`: `index.html` Channels Create Playlist handler now binds the initiating account, auth epoch and modal; rejects duplicate taps and invalid inputs; requires exactly one affected INSERT row with matching playlist owner/channel; locks ambiguous/lost acknowledgments to avoid duplicate playlists. The existing playlist editor load accepts an optional original-modal guard and checks it after each asynchronous read before rendering. The full dark mobile UI and existing playlist editor flow remain.
- `1befb77aa2c675fac52973a1b98639f1e2992600`: nine source-executed synthetic regression tests for duplicate taps, account switch, same-account reauthentication, modal replacement, invalid fields, uncertain counts, wrong owner/channel and thrown requests.
- `25b42540850494207a913972b205c83927c3bc42`: wire these tests into the existing native Channels source gate.
- `2d09f4621df5e5ae8b7e2f129960deadc66bb435`: opt this isolated branch into offline-only Android/iOS compilation; workflow still uses unreachable CI backend, never live or functional credentials.

## CI and preview
- Source CI [41407221107](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41407221107) and native [41407202712](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41407202712) were in progress when this note was written. Do not claim final-head success until jobs finish.
- Nonproduction Vercel preview READY at workflow commit `2d09f462`: https://kinfolk-social-demo-dywdpa508-alstoda59-9779.vercel.app/ . READY is deployment status, not real signup, backend, browser or device acceptance.

## Newly confirmed isolated backend gap
- Read-only list of `Kinfolk Social Alpha Test` (`viantpfagtbgyyzavmtv`) shows 19 public tables, all with RLS enabled, but **no `kinfolk_pages`, `kinfolk_playlists` or `kinfolk_playlist_items`**. The Channels playlist feature cannot work against this isolated backend until a reviewed isolated-only schema is added and tested. No schema/data/Auth changes were made.
- The isolated project still has **zero Auth users**. Real email verification, authenticated two-account RLS, backend-connected Channels, messaging/media and physical-device QA remain unproven.

## Safety and next work
- No shared live Supabase project `zojajuzmfjpvubzibzgg`, production deployment/aliases, Kinfolksworld files, paid infrastructure, app-store submission or PR merge changed.
- Verify final-head CI and native build results, then review isolated-only Channels schema and RLS, create synthetic adult/teen Auth accounts through the supported signup flow and prove real login/email/session/two-user access controls before functional Android/iPhone builds.
- **Not launch-ready.** Offline source tests and compilation do not prove backend-connected mobile acceptance.
