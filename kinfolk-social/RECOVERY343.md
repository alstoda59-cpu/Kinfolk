# Recovery343 | Group-chat account, modal and conversation isolation

Date: 2026-10-30 (America/Los_Angeles). Scope: full MAIN Kinfolk Social in `kinfolk-social/`, excluding Kinfolksworld. Continued from Recovery342 `e0edc5e4da49b966e8b7cd80f6da9d7e2d9e7d18` on isolated draft PR #41. No production merge or release.

## Starting verification

- Read Recovery342, README, existing message regressions and Library prelaunch notes. Recovery342 exact-head source CI [41055532070](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41055532070) succeeded, as did its offline native Android and iOS workflow [41055522658](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41055522658). Those results apply to Recovery342, not automatically to Recovery343.
- Read-only Vercel inspection found nonproduction Recovery342 READY previews. READY does not establish browser functionality or real backend authentication.
- Read-only Supabase inspection: `Kinfolk Social Alpha Test` (`viantpfagtbgyyzavmtv`) is ACTIVE_HEALTHY with 14 empty RLS-enabled public tables. The group conversation/message tables are absent. RLS-enabled does not mean RLS policies are verified. Shared live `Kinfolk` (`zojajuzmfjpvubzibzgg`) was not changed.

## Actual code changes

- `index.html`: the existing `openGroup` path previously rendered returned group messages without checking their `conversation_id`, and allowed delayed responses or send completions to open private chat UI after logout, same-user relogin or modal replacement.
- The effective group-chat handler now captures initiating account ID, `kf129Epoch`, group request sequence and modal generation. It checks them after asynchronous reads and profile loading, and again before sending or refreshing.
- Reject a returned group record whose ID differs from the requested group. Filter returned group messages by `conversation_id` before profile loading or rendering, even if a backend response is overbroad. Server-side RLS still remains essential.
- Capture sender ID at open time; lock the active form while a write is pending; prevent duplicate taps and stale forms; unlock only the same still-owned form on errors. Preserve existing group UI and sending behavior.
- `tests/recovery343-group-chat-isolation.test.mjs`: nine source-extracted synthetic runtime regressions cover cross-group response filtering, account switch, same-account relogin, modal replacement, newer group selection, mismatched group records, duplicate send taps, stale send completion, and successful current-group refresh.
- Added regression to `native/package.json` `alpha:messages:source:test` and enabled isolated offline Android/iOS compilation for Recovery343 in `.github/workflows/kinfolk-alpha-native.yml`.

## Verification and limitations

- Source workflow [41063669792](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41063669792) and native workflow [41063613330](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41063613330) were running at the time of writing. Check their conclusions and exact head SHA before reporting PASS.
- Vercel preview for commit `4f41a04b6c8c08d5a6744428183f7928a4f2215b` was READY with `target=null`, not production: https://kinfolk-social-demo-od0ge2va4-alstoda59-9779.vercel.app/. This is a deployment result only, not authenticated UI QA.
- No real isolated Supabase signup, email delivery, session restoration, two-account RLS, group membership tests or physical-device QA was performed. Current native CI uses an unreachable backend; iOS artifact is Simulator-only, not an installable iPhone IPA.
- Missing isolated group conversation/message schema blocks functional group messaging against the separate alpha backend. Do not modify any shared live Supabase resource; separately review/test a migration only after appropriate approval.
- No production deployment, aliases, shared live Supabase schema/data/auth/security, Kinfolksworld files, paid infrastructure or app stores were modified.

## Next

Finish exact-head source and offline native verification, then move to real isolated-backend synthetic-account auth/RLS and group membership tests after backend setup approval. Continue securing group inbox/create flows and media with session-scoped tests. Do not claim launch readiness without end-to-end evidence.
