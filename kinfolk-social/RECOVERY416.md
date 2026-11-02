# Recovery416 | Prevent stale Story media after account, modal or navigation changes

Date: 2026-11-02 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only. Kinfolksworld excluded.

## Starting point and inspection
- Started from Recovery415 final commit `735cefbef7b3ea74a9338d4702aaf33aa7659600`, draft PR #112. Reviewed Recovery415 report, the effective `index.html` Story viewer and session epoch, prior album-view isolation tests, native test scripts, latest branches, GitHub Actions and Vercel preview history, Library continuation notes and existing isolated Supabase tables.
- Recovery415 source CI `41437473011` completed successfully. Recovery415 Android compilation passed but the iOS Simulator job was cancelled, so the full native workflow `41437465980` did not succeed.
- Isolated Supabase project `viantpfagtbgyyzavmtv` has 0 Auth users and 0 Stories rows. The Stories table has RLS enabled with 3 policies. These are read-only database observations, not two-account enforcement tests.

## Actual code and regression work
- Isolated branch: `kinfolk-social/recovery416-story-view-session-privacy-20261102`.
- Application commit `cdc311708a761d171e4043e6077f3f32ffa24020`: corrected `index.html`'s effective `viewStory` handler. Previously a delayed signed media URL could open a Story modal after the viewer logged out, switched accounts, reauthenticated, navigated to another tab, opened another modal, or tapped another Story. The new viewer captures the initiating auth epoch, account, view, modal generation, Story row and request generation; it checks each again after signing and refuses expired or removed Stories. Signing failures are reported without opening a stale modal.
- Regression commit `e497e82dc4fa386d5df00187494d9ed19ef2e8ef`: 11 synthetic source-executed tests for successful media and text Stories, expiry, account switch, same-user reauthentication, navigation, modal replacement, latest-tap precedence, feed replacement, expiry during signing and signed-URL rejection.
- Native package commit `63110958485977e7bedb23a9bf38f1266414ba42`: includes the new test in the existing `alpha:media:source:test` verification gate.
- Native workflow commit `4410e8e0d1244463fd3160a9aa4e6502276fea8b`: enables offline-only Android debug APK and unsigned iOS Simulator compilation on this isolated branch. No backend credentials are introduced.
- Draft PR [#113](https://github.com/alstoda59-cpu/Kinfolk/pull/113) targets Recovery415, unmerged.

## Verification
- Final application/test/workflow head `4410e8e0d1244463fd3160a9aa4e6502276fea8b`.
- Final-head source CI [41445634546](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41445634546): Node regression step passed; full browser/source workflow was still running at report creation.
- Offline native build [41445564649](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41445564649): Android and iOS jobs pending/running at report creation. No Recovery416 physical-device test or signed iPhone IPA.
- Vercel nonproduction preview READY at exact code/workflow head `4410e8e0`: https://kinfolk-social-demo-5ygehrr8n-alstoda59-9779.vercel.app/ . READY is deployment state only, not successful real backend login.
- Read-only isolated Supabase query confirmed 0 Auth users, 0 Stories rows, Stories RLS enabled and 3 Story policies.

## Release gates and next work
- Real synthetic signup, email verification, login/logout, restoration and two-account RLS cannot yet be claimed. The existing isolated project is available, but no approved deliverable synthetic inbox/account credentials are configured for the opt-in smoke flow. Do not bypass email confirmation or modify shared live Auth.
- Backend-connected Home, Reels, Channels, Stories, messaging, notifications, uploads and teen/privacy enforcement still need actual end-to-end tests. Existing native workflow intentionally packages against an unreachable CI backend.
- Physical Android/iPhone QA, signed physical-iPhone IPA, store readiness and production release remain unverified. Verify complete final-head CI/native results before reporting success.
- No changes to shared live Supabase project `zojajuzmfjpvubzibzgg`, production Vercel deployment/aliases, Kinfolksworld, paid infrastructure, or app stores.

**Status:** Substantive Story viewer privacy fix committed with source-executed synthetic tests and a READY nonproduction preview. Not a backend-connected or launch-ready mobile alpha.
