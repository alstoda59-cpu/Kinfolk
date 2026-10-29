# Recovery313 | Cross-account profile hydration and editor isolation

Date: 2026-10-29 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/`, excluding Kinfolksworld. Continued from Recovery312; no redesign, restart, production merge, or store submission.

## Baseline inspected

- GitHub branches through Recovery312; README and Recovery312/311 reports; existing profile editor, startup/session restoration, Phase79 signup, native Capacitor packaging/verification, legacy profile fixtures and existing source-backed tests.
- Library Recovery226/232 notes: Android debug APK and unsigned iOS Simulator build were compiled previously but are outdated for Recovery313. No physical Android or iPhone test.
- Vercel nonproduction deployment history: Recovery312 `d087a10a` READY; later Recovery313 application commit `a6f52c46` READY at https://kinfolk-social-demo-klk8onm17-alstoda59-9779.vercel.app/ . READY is not real backend, device or login proof. Later test commit `14854421` received a Vercel build-rate-limit status; no paid upgrade.
- Read-only isolated Supabase project `viantpfagtbgyyzavmtv` ACTIVE_HEALTHY, 14 public tables all RLS enabled, 0 rows. Community and membership, video/story/channel tables still absent. Security advisors returned no lints, but this is NOT an end-to-end security test. Profiles have owner-update RLS and an auth.users creation trigger; no real signup test performed.

## Application changes

- `e85af5bf2faedff6b91322ed1a38e2f2d3847bcc`: profile hydration snapshots user ID and activation epoch, checks both after every awaited profile/extras read or write and before publishing state; stale account results cannot populate a new user's profile or continue extra backend operations.
- `a6f52c461b7b6a9da228302bf9bb4c0acea55eb7`: legacy profile editor captures initiating account and form, snapshots input/files before uploads, locks duplicate submits, pins storage paths and DB writes to that account, and rejects stale upload/write completions.
- `9f6aa1661611332788f244d1e2367b082c23b670`: only close profile editor after successful account-current hydration, preserving the error path and avoiding a stale save closing another editor.

## Tests and integration

- `b94a52b4da231c5333fd6fb269303d818a63eb77`: nine source-backed Node tests for current hydration, stale profile read/upsert, extras read/insert/reload, same-user new activation, new-account creation and read errors.
- `4121272709accbb1c3e009cb1c4c5475abed215c` and `200795d2da50599fc3538a7b7af6a867382c0c58`: six source-backed editor tests for normal save, stale upload, stale DB write, duplicate submit, replaced form and stale hydration.
- `1f8ae55cbc7b62761c8f329805c5da1424dbfb93`, `148544212b17cc82ac01fa36b95b9308f49c41e0`: wired both test files into `native/package.json` alpha verification.
- `039e10d1`, `8e0de0d6`, `02fa1d83`, `50a1359d`: repaired four obsolete source-string-only profile fixtures to match the guarded implementation; the substantive runtime tests remain active.
- Draft PR #13 https://github.com/alstoda59-cpu/Kinfolk/pull/13 targets Recovery312 only, not main.

## Verification by evidence category

- GitHub Contents API confirmed application and test commits.
- GitHub Actions run https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40850373105 failed its synthetic Node stage: 533/538 passed, five failed old static string assertions after refactor. All 14 newly added runtime tests passed in that run. Fixed the old assertions rather than reverting account isolation.
- Replacement run https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40850499209 completed its Node regression stage SUCCESS; browser stages were still in progress at inspection. This predates the final stale-hydration editor regression.
- Newest application/test run https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40850675351 for `200795d2` was pending at inspection. No full CI success is claimed for final code.
- Nonproduction Vercel preview for `a6f52c46` is READY; final `9f6aa166` and test/doc commits are NOT confirmed READY.
- No real synthetic-user backend auth/email, two-user RLS, actual upload, messaging, Android APK/iOS package, or physical-device tests completed in Recovery313.

## Remaining blockers and next steps

- Isolated alpha backend lacks essential app tables; org selection and any nonzero project cost require explicit approval before new resources. Do not modify shared live backend.
- Run final source CI, resolve any failures; complete real isolated signup/email callback, login/logout/session, uploads, teen RLS and two-account privacy tests using synthetic users once approved.
- Compile current native Android/iPhone alpha packages and perform physical-device QA, signing and store-policy readiness. Historical Recovery226 artifacts are not current.
- No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, paid resources or app stores were changed.
