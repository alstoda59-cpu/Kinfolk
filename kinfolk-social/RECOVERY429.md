# Recovery429 | Reject stale mobile message controls after rerender

Date: 2026-11-02 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/`, excluding Kinfolksworld. Continued directly from Recovery428 final commit `117febb05ccdf61478ad2193f8335247e51595d4` on isolated, unmerged branch `kinfolk-social/recovery429-stale-message-controls-20261102`, draft PR #126.

## Starting verification
- Inspected latest GitHub branches, Recovery428/427, PR #125, effective Phase107 mobile messaging handlers, Recovery404/427/428 regression tests, native package gate, older Kinfolk Library notes, and nonproduction Vercel deployments before editing.
- Recovery428 exact-head source CI [41546206657](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41546206657) completed SUCCESS. Recovery428 native workflow [41546189792](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41546189792) compiled an Android debug APK; iOS Simulator job was CANCELLED, not successful.
- No Recovery428 exact-head READY deployment was found in the inspected Vercel branch listing. Recovery427 earlier previews were READY.
- Historical Library notes confirm prior source/native builds but no physical-device or real backend proof.

## Actual application implementation
- `90da29f7410d98708794524190405e3d4ea9c8de`: effective Phase107 Send button handler now rejects events from replaced/detached buttons whose old `onclick` survived a modal rerender while the form stayed connected. It verifies the event's button is the current button, is connected, and (where supported) is still contained in the form.
- The effective Enter-to-send handler now rejects events from removed/replaced input fields with stale keydown listeners, even if their form remains connected. Active controls retain their existing send behavior and IME protections.
- `75c8339a8b3e2f7d5384b03f61fdae32f9e349fd`: seven source-executed synthetic regression tests cover current controls, replaced/detached buttons, replaced/detached inputs, repeated binding, and native submit.
- `97154a09ebf95c040046903d21a43806bea50fce`: include the new tests in `alpha:messages:source:test`, part of the offline Android/iOS native verification gate.
- `561accd083b7fce4d1161c4ffa0462c6c99afbda`: enable the isolated Recovery429 branch in native workflow.
- `76910d930cdf5c2d909fc5471e5fb98084a2032d`: preserve the older Recovery404 pending-request remount test by starting its request on the mounted original button, then checking the replacement cannot duplicate it.

## Evidence boundaries
- The new source changes and synthetic tests are committed. Recovery429 final-head source CI and native Android/iOS builds require independent completed-job verification; do not infer passing results from commit creation or Vercel READY.
- A nonproduction Vercel preview was READY at `561accd0`, before the Recovery404 fixture correction. The latest `76910d93` Vercel status reported a free-tier build-rate-limit failure; no exact-final-head READY claim.
- No real synthetic Auth users, email confirmation, authenticated two-account RLS, backend-connected messaging/media, physical Android/iPhone QA or signed iPhone IPA were verified. Native packaging uses an intentionally unreachable backend.
- No shared live Supabase schema/data/auth/security, production Vercel or aliases, Kinfolksworld, paid infrastructure, real user data, or store submissions changed.

## Next
1. Check Recovery429 exact-head source and native jobs. Repair actual failures without relaxing stale-control protections.
2. Continue authorized isolated synthetic-account signup/email confirmation and authenticated RLS verification once a zero-cost nonproduction inbox/project configuration is available.
3. Produce backend-connected native alpha packages and run physical Android/iPhone QA before any launch-readiness claim.

**Status:** substantive mobile messaging fix and regression coverage committed, draft PR open; not yet a proven connected Android/iPhone alpha.
