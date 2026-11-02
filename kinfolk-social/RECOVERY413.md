# Recovery413 | Video upload commit acknowledgment and media preservation

Date: 2026-11-02 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social `kinfolk-social/` only; Kinfolksworld excluded.

## Verified starting checkpoint
- Continued from Recovery412 draft PR #109, final commit `04876d5a3cabe52c8bc822627fc0838f433555e4`, on isolated branch `kinfolk-social/recovery413-video-upload-commit-guard-20261102`. No merge, redesign or restart.
- Verified Recovery412 final-head source CI [41415354570](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41415354570): successful job, all workflow steps passed. Native [41415333124](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41415333124): both offline jobs successful; Android artifact 13126514963 and iOS Simulator artifact 13126913924, expiring 2026-11-09.
- Inspected Recovery412 report, migration, current effective `uploadVideo` in `index.html`, source-executed video regression, native package gate, Library notes, Supabase Alpha Test and Vercel. Recovery412 preview READY at `c7feb0c8`, not backend/device proof.

## Actual application development
- `076d188f`: repaired effective video uploader in `index.html`. Previous code deleted an uploaded `kinfolk-video` object when metadata INSERT returned an error, even if Supabase committed the row but its acknowledgment was lost. This could leave a broken video record and allow duplicate retries.
- New code requires `insert(...,{count:'exact'}).select('id,creator_id,storage_path').single()` to confirm exactly one owned video row at the initiating storage path. Errors, malformed results, missing counts and network rejection are treated as **uncertain**: uploaded media is preserved, the same composer remains locked and the member is told to inspect Videos before retrying. Confirmed writes may refresh; pre-insert storage failures can release the form. Existing session/account/modal guards remain.
- `8e2974e8`: corrected the error-handler scope of the upload progress element after CI identified a regression.
- No new app features or dark mobile layout changes.

## Tests, CI and preview
- `1ca9216d`: updated the real-handler VM regression harness to exercise PostgREST exact-count and row identity; added cases for ambiguous results, foreign owner/path, missing row, duplicate retry prevention and post-save feed failure. Historical test that expected destructive cleanup now asserts media preservation.
- `d69d7b83`: strengthened the test to reject a metadata promise, not merely return a malformed result.
- `46b940a1`: opted isolated branch into existing **offline-only** Android/iOS native workflow, preserving unreachable CI Supabase URL and no credentials.
- First source CI [41421618324](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41421618324) failed four new cases due to the progress variable's scope; corrected at `8e2974e8`.
- Corrected source CI [41421731772](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41421731772) passed its complete Node regression step; browser/full workflow still running at last inspection. A newer source run is expected after `d69d7b83`; do not claim final-head success until checked.
- Nonproduction [preview READY at `46b940a1`](https://kinfolk-social-demo-auy67oz27-alstoda59-9779.vercel.app/). Newer commits are not yet confirmed READY. Vercel READY is not real upload, Auth or device proof.
- Draft [PR #110](https://github.com/alstoda59-cpu/Kinfolk/pull/110), unmerged, targets Recovery412 branch.

## Isolated backend and release gates
- Read-only SQL against **only** Supabase Alpha Test `viantpfagtbgyyzavmtv`: zero Auth users, zero video/channel/playlist rows, and 6/6 new Channels tables have RLS enabled. No schema, Auth, data, security settings or buckets changed. Shared/live project `zojajuzmfjpvubzibzgg` untouched.
- Real signup/email delivery, login/logout/session restoration, authenticated two-account RLS, actual video upload/stream, connected messaging, native installation, physical Android/iPhone QA and signed iPhone IPA remain unverified.
- Existing post/story upload cleanup still deserves an equivalent uncertainty review. No production deployment/aliases, Kinfolksworld, paid resources or store submission changed.

**Status:** Actual video upload safety fix and synthetic regression code committed. Full Kinfolk Android/iPhone alpha is **not launch-ready**.
