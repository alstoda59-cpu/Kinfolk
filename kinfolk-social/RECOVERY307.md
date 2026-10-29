# Recovery307 | Community ownership, private discovery and native verification

Date: 2026-10-28 (America/Los_Angeles). Scope: full MAIN Kinfolk Social app, folder `kinfolk-social/`. Kinfolksworld excluded.

## Verified starting state

- Recovery306 is the newest Recovery checkpoint in the GitHub branch search at the start of this run. Read `RECOVERY306.md`, `kinfolk-communities.js`, native packaging and test scripts, and Library Recovery226/232 notes.
- Vercel deployments confirmed a Recovery304 Communities preview READY; Recovery305/306 did not have a confirmed READY preview at inspection.
- Read-only isolated Supabase project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY, with **14 public RLS-enabled tables**. It does **not** have `kinfolk_communities`; community creation cannot currently work end to end. Shared live project `zojajuzmfjpvubzibzgg` was not modified.

## Committed application work

- `7f620dfeb1bd4197c7d83c2ac821b5bace6d9d08`: Replace community directory with separate **My communities** and **Discover public communities** views. Owner-only query and defensive owner-id filtering ensure private spaces do not appear in public discovery. Escape all community text. Preserve successful creation feedback across refresh. Block duplicate submissions per account and suppress stale account-switch results. Independent error states for public and owned queries.
- `eacd022da09405e7c36bbd94ff5ba5749fdabbde`: Eight Node VM tests covering public/private separation, HTML escaping, search, private creation visibility, duplicate submissions, account switching during writes, delayed reads, missing backend, and validation.
- `baa32f8bc17962f058aed434c8a7a58573ddf011`: Wire the new test suite into native `alpha:verify`.
- `2b284ac6bf1d01b0a696b341849b9e34d90df135`: Make native packaging verification fail if `kinfolk-communities.js` is missing.
- `0ea806a26dfac7cedb2162893ee3981308b95363`: README continuation link.

## Evidence categories

- **Local synthetic Node tests:** 8/8 passed with Node `--test` on the authored module and test harness in an isolated local workspace. This is mock-only, not real backend access. The committed source has equivalent behavior, but a complete GitHub CI pass has not yet been confirmed.
- **GitHub:** All code and test commits confirmed through the GitHub Contents API. Draft [PR #7](https://github.com/alstoda59-cpu/Kinfolk/pull/7) targets Recovery306 only; no merge.
- **Vercel:** Nonproduction deployment [`dpl_MTsW94ttNnEdbnMRj6r2kCdbrpeK`](https://vercel.com/alstoda59-9779/kinfolk-social-demo/MTsW94ttNnEdbnMRj6r2kCdbrpeK) for application commit `7f620dfe` is **READY**, URL https://kinfolk-social-demo-2gz2gykvy-alstoda59-9779.vercel.app/ . Later test/doc commits are **not** confirmed deployed; Vercel status on latest commit reported build-rate-limit failure. READY is not a browser functionality pass.
- **Backend:** Read-only inventory only. No real signup, community insert, two-account RLS, private community access, or storage tests.
- **Native:** New module is included by the existing dynamic `kinfolk-*.js` copy rule; verification now requires it. No current Android APK, iOS Simulator package, signed store build, or physical Android/iPhone QA.

## Remaining launch blockers

1. Approve organization and any nonzero cost before creating/provisioning additional isolated resources. The existing isolated project lacks community, video, story, and other required tables. Do not change shared live schema/data/auth/security.
2. Implement and enforce community membership, posts, moderation, teen protections, and server-side private visibility with reviewed RLS; client-side filters are not security boundaries.
3. Real synthetic adult/teen signup/email verification/login/session restoration and cross-account RLS tests, then complete native build and physical-device QA.
4. Do not merge into production or submit to stores without explicit owner approval.

No production aliases, Kinfolksworld, shared live Supabase, paid resources or app-store submissions were changed.
