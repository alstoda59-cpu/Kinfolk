# Recovery260 | Signup email identity and verification copy

Date: 2026-10-27. Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only, excluding Kinfolksworld.

## Starting checkpoint
- Based on Recovery259 final commit `3503622dd8d861725403ad9ee98343b189747e16`. Inspected Recovery259/258 notes, Phase79 signup and its existing tests, native README, latest recovery branches, Library Recovery226/232 notes, Vercel previews and read-only Supabase project metadata.
- Existing Recovery259 preview `dpl_DmNKBiZuVZaK5qY1sR7SyERRTFb4` was READY at the final Recovery259 commit. The separate alpha project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY; shared live project `zojajuzmfjpvubzibzgg` was not modified.

## Implemented
- `75c244e2ae7d37eec19038b75798fc4a09f5c5fb`: Phase79 rejects a signup response with an explicitly different user email or a same-ID session carrying a different email, comparing case-insensitively to the submitted address. Missing email properties are tolerated for older adapters, while existing user-ID and session-ID guards remain mandatory. Unconfirmed signup copy no longer asserts that a confirmation email was sent, since Supabase may intentionally obscure duplicate-account outcomes.
- `1e75191392fa37b2284c04819a880272dc71fc7e`: three regression scenarios for wrong signup user email, wrong session email, and case-normalized matching email with neutral verification copy. No layout redesign.

## Verification
- Re-fetched exact committed Phase79 blob `9091d3ab6ed83ccbbda0a3a187cb78ff8b4a8e36` and test blob `b04d1ef51860270fb90d018f747a7b8c5f6c5604`.
- **13/13 tests passed in a synthetic V8 adapter**, executing the exact committed test source and Phase79 script with mocked DOM/auth and a minimal URL shim. This is **not** a Node test-runner execution, GitHub Actions CI pass, browser, real Supabase email delivery, or physical-device test.
- Nonproduction Vercel preview for application commit `75c244e2`: `dpl_432JZPyfyCgumLUJiD4KbSnC8iZ4` READY, https://kinfolk-social-demo-jsk3xw55m-alstoda59-9779.vercel.app/ . Test commit `1e751913` preview was BUILDING when checked, not yet READY.
- GitHub PR-filtered workflow-run lookup for test commit returned no runs; full CI unverified.

## Remaining alpha blockers
Real isolated synthetic signup and email verification, login/logout/session restoration, owner fixtures and two-user RLS, Home/Reels/Channels, uploads/posts/comments, messaging/notifications, teen safety enforcement, functional Capacitor builds and physical Android/iPhone QA. Native packaging and existing dark UI/features preserved. No shared live Supabase schema/data/auth/security changes, production deployment or aliases, Kinfolksworld edits, paid resources or store submissions.
