# Recovery373 | Verified album-photo write acknowledgment

Date: 2026-10-31. Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only. Kinfolksworld excluded.

## Verified starting point
- Continued from Recovery372 draft PR #69, exact head `ed694af254c0e0ee9ae59074b5d320468fcc25b7`, without merge, restart, or redesign.
- Inspected current Recovery branches and PRs, Recovery372/236 reports, Phase106 album implementation and historical tests, native source gate, GitHub Actions, Library continuation notes, and Vercel nonproduction previews.
- Recovery372 source CI run 41215015623 succeeded with 910 Node tests, 0 failed. Its READY Vercel preview `https://kinfolk-social-demo-b8vtyh6yh-alstoda59-9779.vercel.app/` is at intermediate commit `8863663a`, not the final Recovery372 head.
- Read-only isolated Supabase project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY; 14/14 public tables have RLS enabled, but 0 Auth users and 0 confirmed users. Neither `photo_albums` nor `album_photos` exists in the isolated public schema; 2 of 3 inspected app media buckets exist. No real album upload or two-user RLS proof is possible there yet.

## Actual application fix
- `kinfolk-phase106.js`: album-photo inserts now request `{count:'exact'}` and require exactly one affected row before reporting that a photo is linked. Previously an error-free but zero-row insert could be mistaken for success and leave an orphan storage file.
- A confirmed zero-row result rejects the save and best-effort removes the unlinked upload.
- Missing, null, or unexpected counts fail closed, **but preserve** uploaded media because the insert might have committed. This prevents a failed acknowledgment from deleting a file already referenced by a database row. The UI directs the member to refresh before retrying.
- Existing account/form guards still run after the acknowledged insert, and already-linked media is never removed merely because a user switched accounts during the request.
- No new features or dark UI changes.

## Source changes
- Application fix: `8ad4fd084baae1f53dc7e3ab7549f4fc6ee0a0ae`.
- Historical synthetic album fixture updated for exact PostgREST counts: `e52150af4bf1451fe47c88825dede346c7cb5d97`, corrected cross-realm assertion: `a51f2b6bc0d027bc0fc795f20ea12a778bf4e039`.
- Seven new source-executed synthetic regression cases: `bb797793e98baced58c3f40a4c94ee61f38712b2`, corrected explicit missing-count fixture: `639993b7ccee2cec69db959e18c42221d29e6689`.
- Native Android/iOS media source gate includes the new regression: `10bd14dd3a19dbe11ae5f0351b7629465e202d28`.

## Verification and remaining release blockers
- GitHub Actions on the final branch commit and any exact-commit READY preview must be verified separately after documentation is committed. Intermediate cancelled runs are not test passes.
- Synthetic Node tests cannot prove real Supabase writes, media storage, two-account RLS, email delivery, or device behavior.
- Isolated alpha backend is missing the two album tables, so the feature is **not backend-functional** even if source CI passes. This is a backend schema parity blocker, not approval to alter shared live data or production policies.
- Real signup/email confirmation, confirmed synthetic accounts, two-user RLS, backend-connected uploads/messaging/notifications, signed Android/iPhone packages and physical-device QA remain unverified.
- No production aliases, shared live Supabase schema/data/auth/security, Kinfolksworld, paid infrastructure, real user data or store submissions changed. **Not launch-ready.**
