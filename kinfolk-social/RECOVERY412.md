# Recovery412 | Isolated Channels, videos, playlists and reactions with RLS

Date: 2026-11-02 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social `kinfolk-social/` only; Kinfolksworld excluded.

## Verified starting checkpoint
- Continued from Recovery411 draft PR #108, final commit `dcd6c1ee8ff504dda4d83460beaaeb1b41d7266d`, on new isolated branch `kinfolk-social/recovery412-isolated-channels-rls-20261102`. No merge, redesign or restart.
- Recovery411 final-head source CI [41407318402](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41407318402) SUCCESS, 1,087/1,087 Node tests and 47/47 workflow steps. Native [41407312097](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41407312097) SUCCESS for offline Android APK and unsigned iOS Simulator package.
- Inspected README, Recovery407/411 reports, effective Channels/playlist/video/reaction handlers, native source test gate, prior Library notes, Vercel deployments, and existing Alpha Test schema/migrations. The latest Recovery411 Vercel preview was READY at `2d09f462`, not proof of backend functionality.

## Actual backend development (isolated Alpha Test ONLY)
- Migration `migrations/ALPHA_only_channels_video_playlists_rls.sql` added at `ed8e0e56`, then hardened at `0dfb806c` to prevent channel avatar/banner references to other members' private storage and prevent external videos from referencing uploaded storage paths.
- Successfully **applied** as `recovery412_alpha_only_channels_video_playlists_rls` to existing isolated Supabase project `viantpfagtbgyyzavmtv` ONLY. Shared/live `zojajuzmfjpvubzibzgg` untouched.
- Created six tables: `kinfolk_pages`, `kinfolk_channel_subscriptions`, `kinfolk_videos`, `kinfolk_playlists`, `kinfolk_playlist_items`, `kinfolk_video_reactions`.
- Added owner/channel composite FKs, media MIME/50 MiB/path checks, title/visibility constraints, subscriber preference limits, playlist same-channel write policy, owner-only edits, public-profile/reciprocal-block-gated reads, and private bucket signed-media read policies. Teen privacy relies on the existing enforced private-profile trigger. Unlisted playlists are conservatively owner-only until direct-link semantics are separately implemented.
- Read-only post-apply inspection: all **6/6 new tables have RLS**, **23 authenticated-only policies** across them, **0 anonymous SELECT grants**, and **0 Supabase security-advisor findings**. Existing tables remain present. This is actual schema/policy deployment and metadata verification, **not** two-account authenticated enforcement.
- No Auth users created, no real email delivered, no production data copied, no paid project or organization change.

## Regression and native gates
- `deb00852`: ten static security contract tests in `tests/recovery412-channels-rls.test.mjs`. These assert isolation, six RLS tables, authenticated ownership, profile/blocked visibility, safe media references, subscription ownership, same-channel playlists and reaction guards. Static contracts do not replace real RLS tests.
- `c7feb0c8`: integrate into `native/package.json` Channels source verification.
- `2ec58509`: opt isolated branch into existing **offline-only** Android/iOS compilation workflow, still using deliberately unreachable CI Supabase URL and no functional credentials.
- At note creation: [source CI 41415213937](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41415213937) had passed its main Node regression step; browser/full workflow not yet final. [Native build 41415229769](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41415229769) in progress; do not claim final success or artifact IDs until confirmed.
- [Nonproduction preview READY at `c7feb0c8`](https://kinfolk-social-demo-feoni5t7m-alstoda59-9779.vercel.app/) with migration/test/package changes; exact later workflow/report commit deployment unverified.

## Remaining critical acceptance blockers
1. Isolated backend still has zero synthetic Auth users. Real signup/email confirmation, login/logout/session restoration and authenticated two-account positive/negative RLS have **not** been exercised.
2. Backend-connected Channels, video uploads/storage, playlist create/edit, reactions, Home/Reels, profiles/music, messaging, notifications and teen privacy remain **untested end to end**. Static SQL and READY preview are not functional proof.
3. Offline Android APK/iOS Simulator compilation does not prove physical-device installation or connectivity. No signed physical-iPhone IPA, real Android/iPhone device QA or store readiness proof.
4. Subscriber counts for non-owner viewers are limited by privacy-scoped subscription SELECT; a secure aggregate count API/UI adaptation remains future work. Unlisted playlist sharing is not yet implemented.
5. No shared live Supabase schema/data/Auth/security, production Vercel aliases, Kinfolksworld, PR merge, paid resources or store submission changed.

**Status:** Isolated Channels backend is deployed with RLS metadata checked. Full Kinfolk Android/iPhone alpha is NOT launch-ready.
