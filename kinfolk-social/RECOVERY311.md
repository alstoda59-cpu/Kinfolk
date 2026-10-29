# Recovery311 | Confirmed community membership writes

Date: 2026-10-29 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only in `kinfolk-social/`; Kinfolksworld excluded. Based on Recovery310.

## Source and evidence inspected
- GitHub Recovery300–310 branches, Recovery310/308 reports, Communities discovery, membership and owner-edit source, Recovery307/308/310 synthetic tests, native packaging and module-parity scripts.
- Recovery310 source CI [40829118537](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40829118537): full syntax-and-package job SUCCESS, including Node, browser mocks, JavaScript syntax and native web packaging. No real backend or device coverage.
- Nonproduction Vercel READY deployment `dpl_2cWn46neBbDtbCZ8Hmf2ezHFVUyA` for Recovery310 application commit `7eec1bf33e4b21928c8c6dd6ace24db2b36db1cd`: https://kinfolk-social-demo-5yk9dnvte-alstoda59-9779.vercel.app/ . Later Recovery310 commits were not confirmed deployed.
- Library Recovery226 and Recovery232 notes: historical Android debug APK and iOS Simulator package were built, but they predate current Communities changes; not evidence of a current installable alpha.
- Read-only isolated Supabase alpha project `viantpfagtbgyyzavmtv` table listing on 2026-10-29: 14 public RLS-enabled tables, zero rows; `kinfolk_communities` and `kinfolk_community_members` absent.

## Implemented
- `03923aa75db02cd1516fe286fc461f2e43f36bfd`: Join/Leave now requests returned `community_id,user_id` and requires exactly one row matching the initiating account/community before changing UI membership state. This closes false-success on zero-row DELETE or mismatched results, without loosening server authorization.
- `cd09489fd4843d18ec8f29e9419ae03e042baf82`: updated synthetic membership harness to model Supabase `.select()` write confirmations and added denied/wrong-user scenarios.
- `2027f131a3afdd3e38c84db5bafd1a2ea9237444`: corrected zero-row leave regression to start with existing membership and assert the button stays Leave.
- Draft [PR #11](https://github.com/alstoda59-cpu/Kinfolk/pull/11) targets Recovery310, not main or production.

## Verification and blockers
- GitHub Actions [40835496528](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40835496528) for test commit `2027f131`: Node synthetic regression stage SUCCESS at initial inspection; remaining full workflow was in progress. Do not call full CI passed unless the run later completes successfully.
- No Recovery311 preview READY yet; no real community join/leave, two-account RLS, email signup, messaging, uploads, Android APK, iOS build or physical device QA verified.
- Proposed community SQL remains review-only and unexecuted. Backend table/RLS provisioning needs approved isolated environment/organization and confirmation of any nonzero cost.
- No shared live Supabase schema/data/auth/security, production deployment/alias, Kinfolksworld, paid infrastructure or store submission changed.
