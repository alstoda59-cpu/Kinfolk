# Recovery428 | Native mobile message submit and iOS IME ghost-submit isolation

Date: 2026-11-02 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/`, excluding Kinfolksworld. Continued directly from Recovery427 final commit `5f777b3b02f6d3df21fbafb7d04c2dfdd029a22c`, draft PR #124, on a new isolated and unmerged branch.

## Starting verification
- Inspected Recovery427/426 reports, latest branch and PR, effective Phase107 messaging forms, source-executed Recovery239/400/404/427 tests, native package scripts, historical Kinfolk Library notes and Vercel preview deployments.
- Recovery427 final-head source CI [41545137285](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41545137285) completed SUCCESS. Recovery427 native run [41545118218](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41545118218) was still QUEUED at the starting inspection.
- Last verified Vercel nonproduction READY was `https://kinfolk-social-demo-72ut7dju7-alstoda59-9779.vercel.app/` at Recovery427 documentation commit `a7da9e51`. Do not infer Recovery428 READY from this.
- Existing isolated Alpha Test Supabase project `viantpfagtbgyyzavmtv` identified from prior reports; shared live project `zojajuzmfjpvubzibzgg` not accessed or modified.

## Actual application implementation
- Application commit `05b8bd6a12e1bf3b539627836ba3108e725c6dc8`: effective Phase107 DM/group/create-group forms now intercept native `submit` events in capture phase and route them through the same async request lock as the Send button and Enter key. This covers mobile keyboard Go and accessibility `requestSubmit()`, which can bypass the keydown path.
- Added composition lifecycle tracking and a 200ms post-composition suppression window for iOS keyboards that dispatch a ghost Enter/submit with `isComposing=false` immediately after text confirmation. Explicit Send button taps remain available.
- Detached stale forms and disabled Send buttons cannot invoke a new send through the wrapper. Existing Shift+Enter and direct button behavior are preserved.
- Test commit `5844c6a81ee04effd5277d9aa2143d883339e882`: nine source-executed synthetic cases cover native submit, repeat binding, async duplicate lock, active/post-composition events, stale form, disabled button and explicit Send tap.
- Native gate commit `eefb88e201bc34d5f91cb9ae9344dfe872592d42`: `alpha:messages:source:test` includes Recovery428 regressions. Workflow commit `a1742bcfe14209ec500813592ee6aee3fbf6fe0d` enables this isolated branch for offline Android/iOS CI.
- An intermediate source CI [41546002467](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41546002467) failed an old Recovery239 fixture which initialized a form as detached *before* the request, conflicting with the new intentional fail-closed behavior. Commit `540c8da2c2cdbeee7aceb4103f990eea0db72f65` updated that test to detach *after* the pending request starts, preserving its original async-cleanup purpose. The new detached-before-submit test independently verifies the new guard. Do not count intermediate CI as passed.

## Verification boundaries and next
- Recovery428 source and native jobs must finish on the exact final head before success is claimed. Source CI: [branch Actions](https://github.com/alstoda59-cpu/Kinfolk/actions?query=branch%3Akinfolk-social%2Frecovery428-native-submit-ime-guard-20261102). Native workflow: [Kinfolk alpha native](https://github.com/alstoda59-cpu/Kinfolk/actions/workflows/kinfolk-alpha-native.yml).
- These are synthetic Node/DOM events, not physical iOS or Android keyboard testing. Native packaging still uses an intentionally unreachable backend. A compiled debug APK or unsigned iOS Simulator app does not prove a backend-connected alpha.
- No real synthetic Auth users created; no email delivery, login/logout/session restoration, authenticated two-account RLS, connected media/messaging or physical-device QA verified. No signed physical-iPhone IPA.
- No shared live Supabase schema/data/auth/security, production Vercel deployment or aliases, Kinfolksworld, paid infrastructure, real user data or app-store submissions changed.
- Next: confirm final-head source CI, native jobs and exact-head nonproduction preview. If CI fails, repair source or fixtures without weakening account/IME safety. Then pursue owner-approved isolated synthetic-account authentication and backend-connected native QA.

**Status:** substantive mobile messaging fix and tests committed on isolated branch; release remains blocked pending connected end-to-end and physical-device evidence.
