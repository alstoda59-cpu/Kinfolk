# Recovery398 | Prevent duplicate Add Photos replay after partial completion

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social, `kinfolk-social/` only. Kinfolksworld excluded.

## Starting checkpoint and inspections

- Continued directly from Recovery397 final commit `f290f871b48fc37e2f1967e53a3bd9556d9611b4`, draft PR #94, without merging or restarting.
- Recovery397 final-head GitHub Actions run [41331997509](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41331997509) completed SUCCESS with 1004/1004 synthetic Node regressions and all 47 steps. Its nonproduction Vercel preview at that exact commit was READY.
- Reviewed newest Recovery branches, Recovery396/397 reports, existing Phase106 album code, Recovery373/376/379/380 source-executed tests, native media test gate, prior Library continuation notes and Vercel previews.
- Read-only isolated Supabase Alpha Test project `viantpfagtbgyyzavmtv`: ACTIVE_HEALTHY, zero Auth users, 16/16 public tables with RLS enabled, and zero security-advisor findings. These counts are **not** two-account RLS proof.
- Separate shared live Kinfolk project `zojajuzmfjpvubzibzgg` was not changed.

## Actual application correction

The existing Add Photos form could upload some selected files successfully, then encounter a failure on a later file or on the album viewer. A subsequent tap on the still-mounted form would replay **all** selected files, duplicating previously committed photos. A lost INSERT response was especially dangerous because the failed photo might also have committed.

The effective `kinfolk-phase106.js` `hardAddSubmit` handler now records a confirmed or potentially partial upload outcome on the exact mounted form, scoped to account and album. It blocks repeat submissions from that form after an upload attempt has returned, and instructs the member to reopen the album, inspect what actually saved and add only missing files. Successful uploads cannot be replayed from a stale mounted form either. Pre-upload validation errors remain retryable. Account-switch, activation-epoch and operation ownership guards remain intact. Dark mobile UI and other features are unchanged.

- Application commit: `798e402424a934256dc0ab7930537435d7566da7`.
- Source-executed synthetic regression: `de1a0b146d612773bbf4a521dce0408ed56fb006`, six cases in `tests/recovery398-album-add-duplicate.test.mjs`.
- Native Android/iOS offline media gate integration: `d53f76eb3a81a21f6fda32d60979ad53e7bb135f`.
- Existing Recovery379/380 synthetic expectations aligned with the new one-shot committed editor: `a3012a7a4c77d6afe3eb4da6bd50a9ad3a9a5d2b`, `7d8876e9f895d218133128236974ca89d38e7a6c`.
- Draft PR [#95](https://github.com/alstoda59-cpu/Kinfolk/pull/95), based on Recovery397, remains unmerged.

## Verification and boundaries

- [Recovery398 GitHub Actions run 41337028684](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41337028684): the main synthetic Node regression step passed; complete workflow was still running at note creation. Check final result independently.
- [Recovery398 nonproduction Vercel preview](https://kinfolk-social-demo-2mkfu0ex4-alstoda59-9779.vercel.app/) READY at `a3012a7a`, an earlier test-only commit. Exact final-head preview status requires separate verification.
- Source-executed regressions, CI and Vercel READY are not real Supabase signup/email delivery, authenticated two-user RLS enforcement, connected uploads/messages, signed native installation or physical Android/iPhone device QA.
- No production/aliases, shared live Supabase schema/data/auth/security, Kinfolksworld, paid resources, real accounts or app-store submissions were changed.

**Not launch-ready.** Next: verify final-head CI and preview, then use approved synthetic inboxes for isolated Auth/email/RLS and media/message end-to-end tests. Native signed install and physical-device QA remain blocked pending real evidence.
