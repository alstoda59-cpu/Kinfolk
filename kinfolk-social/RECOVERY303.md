# Recovery303 | Post/story media integrity and CI fixture repair

Date: 2026-10-28 (America/Los_Angeles). Scope: full MAIN Kinfolk Social in `kinfolk-social/`; Kinfolksworld excluded.

## Baseline inspected
- Recovery302 report and code, current Recovery300-302 branches, Recovery302 GitHub Actions failure logs, native package scripts, latest nonproduction Vercel deployments, Library Recovery226/232 notes and read-only isolated Supabase project inventory.
- Recovery302 Actions run 40800937829: **480/484 Node tests passed, four failed**. Failures were all in the new video-upload regression harness: it assumed a single `setImmediate` always advances cross-realm VM Promise continuations to the metadata insert. This was not evidence of four confirmed app defects.
- Isolated alpha Supabase project `viantpfagtbgyyzavmtv` remains ACTIVE_HEALTHY with 14 public tables. `kinfolk_videos` and `kinfolk_stories` are absent; no schema changes were made. Read-only `pg_policies` inspection confirmed `posts` insert checks `author_id = auth.uid()`; policy text is **not** a real two-account RLS test.

## Implemented
- `ab3399cee4d79e3d6468e3dfb07f233614db21f0`: post/story composers now best-effort remove orphan media when storage succeeds but database insertion fails, only if the initiating account/session/form remains current. Video upload cleanup now checks an `inserted` flag, so a successful video row's storage file cannot be removed merely because subsequent feed refresh fails. The same committed-row protection applies to posts and stories.
- `b167519faa42faeacd96d84f8273716413b79f76`: repair timing-sensitive Recovery302 Node VM tests by waiting for the observable insert boundary rather than one event-loop turn.
- `63f12dbab7b783ee377568e0f054b582b189084b`: add regression for saved video surviving refresh failure.
- `988f401d99db491f4fe76c33420f6254770bf21a`: eight post/story regression scenarios for failed inserts, successful inserts with refresh failure, account switch during storage, and text-only posts/stories.
- `9e309126ed12fe1b23e364c4fce13cb32ffc3ab9`: wire post/story regression suite into native `alpha:media:source:test`.
- `6091d3a1fbc38691502730918dbb6468bcb8c613`: README continuation link.

## Verification (separate evidence types)
- GitHub Actions run [40806619348](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40806619348) showed **Complete Node regression suite (synthetic only) SUCCESS** at inspection, with browser dependencies and remaining full workflow still in progress. This run tests source commit `988f401d`, not later native script or documentation commits. Latest full run for `9e309126`: [40806681779](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40806681779), pending at inspection.
- Nonproduction Vercel deployment `dpl_BxLNnG5BeV2nfKatax2289GfEHSu` for `63f12dba` is READY: https://kinfolk-social-demo-a7mudkwgk-alstoda59-9779.vercel.app/ . This includes the application fix and video regression, not subsequent post/story tests or native script. READY does not prove functionality.
- Draft [PR #6](https://github.com/alstoda59-cpu/Kinfolk/pull/6) targets Recovery302, not main/production; do not merge without owner approval.
- **No real synthetic-user backend tests, email verification, upload/storage/RLS enforcement, Android APK, iOS package, or physical-device QA performed.**

## Remaining blockers
- The isolated alpha backend lacks video/story/channel and other required app tables. Do not call Reels/Stories end-to-end functional.
- Post/story media cleanup is best effort and cannot safely delete a storage object after account/session switch; server-side RLS/storage policies and scheduled orphan reconciliation remain necessary.
- Client-side guards are not a replacement for authenticated RLS enforcement.
- No live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, paid resources, or store submissions changed.
