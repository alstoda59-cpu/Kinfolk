# Recovery397 | Prevent duplicate Create Album submissions after a confirmed commit

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only. Kinfolksworld excluded.

## Starting evidence

- Recovery396 PR #93 is open and unmerged, final source head `8fc976dd7941232fc3341b08410f42872a93678b`.
- Recovery396 final-head source checks [41326364769](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41326364769) completed SUCCESS, with 1001/1001 Node tests and 47/47 workflow steps.
- Recovery396 Vercel READY preview was at `bd087d54`, preceding the final test-only commit.
- Reviewed the effective `kinfolk-phase106.js` Create Album handler, the source-executed `tests/recovery376-album-create-ack.test.mjs` harness, native `alpha:media:source:test` wiring, Library continuation notes, latest GitHub PR and Vercel deployment records.
- The isolated `Kinfolk Social Alpha Test` Supabase project `viantpfagtbgyyzavmtv` is the only permitted backend for later testing. Do not change shared live `Kinfolk` project `zojajuzmfjpvubzibzgg`.

## Application correction

Recovery396 correctly reports that an album was created even if subsequent photo upload fails. However, the same mounted Create Album form still re-enabled its button after that partial failure, so a repeated tap could issue a second album INSERT. Recovery397 stores the verified committed album identity on that exact form, prevents any repeated Create Album INSERT from it, and gives an explicit instruction to open Photos and add missing photos there. On partial failure, the button stays disabled and displays `Album created · Open Photos`. A successful creation also cannot be resubmitted from a stale still-mounted form. The guard is scoped to the original account and form; unconfirmed INSERT results do not set a committed marker.

- Application commit: `c016c68c6c0219d366329ace1abb76444c7fa5fc`.
- Source-executed regression commit: `bbcfb3d6ecadc2b9f34f0603699cf26c75f063ce`.
- Existing Recovery376 harness adds three synthetic repeated-submit cases: after a failed photo upload, after a failed Photos render, and after successful creation. No duplicate runner or visual redesign.
- Draft PR [#94](https://github.com/alstoda59-cpu/Kinfolk/pull/94), unmerged and based on Recovery396.

## Verification and boundaries

- [Recovery397 nonproduction Vercel preview](https://kinfolk-social-demo-7w0vo9f32-alstoda59-9779.vercel.app/) is READY at exact test commit `bbcfb3d6`; target is null, not production.
- [Recovery397 source CI](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41331909535) started for `bbcfb3d6`; final outcome must be independently checked before claiming success.
- Synthetic Node/browser checks and offline Capacitor checks do **not** prove real signup/email confirmation, authenticated two-user RLS, connected uploads/messages, signed Android/iPhone installation, or physical-device QA.
- No production aliases, shared live Supabase schema/data/auth/security, Kinfolksworld, paid resources, real accounts or store submissions were modified.

**Not launch-ready.** Next: complete Recovery397 CI verification; obtain approved synthetic inboxes for isolated real auth/RLS tests; then generate and install fresh native Android/iOS alpha artifacts for device acceptance.
