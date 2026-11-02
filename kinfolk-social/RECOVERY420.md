# Recovery420 | Isolated private wallpaper storage and session-safe uploads

Date: 2026-11-02 (America/Los_Angeles). FULL MAIN Kinfolk Social only, `kinfolk-social/`. Continued from Recovery419 draft PR #116 at `5694876f8265152aa39750a0ce832f097b25a447`. Isolated draft PR #117; no merge, production or Kinfolksworld change.

## Starting evidence
- Read Recovery419 and earlier Recovery reports, native packaging scripts, existing signup smoke verifier, Library alpha notes, current branch/PR, GitHub Actions and Vercel nonproduction deployments.
- Recovery419 source CI run 41473257321 completed SUCCESS; Android job from 41473226534 succeeded; iOS Simulator job was CANCELLED, not successful.
- Read-only isolated Alpha Test Supabase inspection showed zero Auth users and no `kinfolk-wallpapers` bucket, even though Phase76's animated-wallpaper upload and Phase115's account deletion reference it.
- Existing `kinfolk-media` and `kinfolk-video` buckets and production project were left unchanged.

## Actual implementation
- Branch `kinfolk-social/recovery420-wallpaper-upload-isolation-20261102`, based exactly on Recovery419.
- `b9b5bbe750f6a673ee704ad795682e22e0df196b`: new isolated-only migration `migrations/ALPHA_only_wallpaper_bucket_owner_rls.sql`, private `kinfolk-wallpapers` bucket, 15 MiB maximum, six image/video MIME types, authenticated owner-path INSERT/SELECT/DELETE policies, no UPDATE or anonymous policy.
- `3e3b3ff0b55e3315971370bf81936c2dc37d2f42`: effective Phase76 wallpaper uploader now captures the initiating user and exact access token, checks session identity around async storage/signing, suppresses concurrent uploads, writes only the initiating user ID and avoids updating a switched account's Settings UI.
- `a2e4d11cf68d0c09cde4dd6f6cc96b35e82f1c2a`: nine source-executed synthetic regression cases, including duplicate uploads, account switch, same-account token replacement, late signing and late database save.
- `68c4806db39e48eee081a4dfe1e6f2e493b04647`: wired the new tests into existing offline native media gate.
- `91883ca9b7190410ccca6ab7f818ddd8092ac4ec`: enabled isolated Recovery420 Android/iOS workflow.

## Isolated backend verification
- Applied `recovery420_wallpaper_bucket_owner_rls` successfully to **only** existing Kinfolk Social Alpha Test project `viantpfagtbgyyzavmtv`.
- Read-only verification confirmed private bucket, 15,728,640-byte limit, six MIME types, three authenticated owner-only storage policies and zero Auth users.
- Transactional SQL with synthetic authenticated role and JWT claim proved owner INSERT/SELECT works and foreign-owner INSERT is denied. Test transaction was rolled back. Subsequent read-only query confirmed **zero** wallpaper objects and **zero** Auth users.
- This is database role simulation, **not** two real signed-in accounts or physical mobile upload testing.

## CI, preview and remaining blockers
- Source CI final code/workflow head: https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41483691509 (in progress at report preparation; Node regression step passed).
- Offline native Android/iOS workflow: https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41483501306 (queued at report preparation).
- READY nonproduction Vercel preview at code/test gate commit `68c4806d`: https://kinfolk-social-demo-o5otwty2e-alstoda59-9779.vercel.app/ ; final workflow/report head not yet confirmed READY.
- The legacy uploader still stores a long-lived signed wallpaper URL. Its expiry/revocation semantics need additional privacy hardening before public release.
- Real synthetic email confirmation, login/logout/session restoration, authenticated two-account RLS, backend-connected media/messaging/notifications, physical Android/iPhone QA and signed iPhone IPA remain unverified.
- No shared live Supabase `zojajuzmfjpvubzibzgg`, production deployment/aliases, Kinfolksworld, paid resources or app-store submissions changed.

**Status:** substantive application and isolated-backend changes committed and deployed; not a functional connected alpha or launch-ready.
