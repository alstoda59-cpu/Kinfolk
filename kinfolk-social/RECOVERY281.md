# Recovery281 | Restore current auth regression coverage after Recovery280 native builds

Date: 2026-10-27 America/Los_Angeles (UTC 2026-10-28). Scope: FULL MAIN Kinfolk Social only, excluding Kinfolksworld.

## Baseline and actual Recovery280 verification
- Inspected Recovery279 and current GitHub branches, Phase79 signup, Phase95 login, native packager, native workflows, Vercel nonproduction previews, Library Recovery226/232 notes, and read-only isolated Supabase schema/policies.
- Recovery280 application commit `169e3a74f0c37196acd162009853da7dee666fa5` rejects verification redirects with URL fragments. Two regression cases were added; current native offline build trigger was explicitly scoped to Recovery280.
- Recovery280 repair commit `943b20479259e9f81a164196b811afed323d3a13` corrected a malformed regular expression in `native/scripts/native-module-parity.mjs` that prevented native verification from starting. It also repaired the Recovery258, Recovery182 and Recovery275 test fixtures.
- **GitHub Actions native build run [40632858388](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40632858388) succeeded for Android and iOS** at commit `943b2047`. Android debug APK artifact ID `12792262235`; iOS unsigned Simulator artifact ID `12792456822`. Both used unreachable CI-only backend `aaaaaaaaaaaaaaaaaaaa.supabase.co`, never the shared live project. **Login, signup, feeds and messaging cannot work in these offline packaging artifacts.**
- Downloaded and inspected both actual artifacts. Android APK SHA-256 `f92075ede540a76964701f4ede9dc46b3d2fff409b7d7e37039d2e8c2a54d368`; iOS Simulator App ZIP SHA-256 `d360f185698f27ff2eff4490f9ae1dfcc94121ae2872aaa21012346bfcde16af`. Both contain 24 referenced local Kinfolk JavaScript modules with zero missing, bundled local Supabase SDK, CI-only backend marker, and no shared live project ref in their HTML.
- The Android APK is a debug/test artifact, not a signed release AAB. The iOS artifact is Simulator-only and cannot be installed on a physical iPhone. No device execution was performed.

## Recovery281 test harness repairs
- `1d487a9a82ddc3e0c1327f66eae9dbe290f3d5c1`: update historical synthetic login/signup fixtures for the current preflight no-active-session guard, signup user/email identity checks, and token/session email checks. Preserve negative identity tests.
- `a09772e0aac7c975dad17f4e43ba705047d98ff7`: update signup navigation, verification resend, static source and form-race fixtures to match current application semantics.
- `ee38cf40acd5a9d7cedf4ec74656f27b49d279e3`: ensure the Recovery275 regression asserts the preflight and post-request field guards independently.
- Recovery280 source CI run `40632858489` failed at the Node synthetic regression step with 41 failures, mainly historical fixtures expecting old login tokens without email or signup without preflight. The Recovery281 corrections have **not yet been verified by a completed source CI run** at the time of this report.

## Read-only isolated backend inspection
The designated isolated Supabase project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY. All 14 public tables inspected have RLS enabled; the security advisor reported zero lints. Trigger/policy inventory was read only. This is **not** proof of real synthetic-account signup, email delivery, teen enforcement or two-user RLS isolation. No database rows or auth records were changed.

## Remaining blockers and boundaries
- Owner-approved HTTPS email callback and corresponding Supabase redirect allowlist/App Links are not yet verified. Real synthetic-account signup/email confirmation/login/logout/session restoration and cross-account RLS remain untested.
- Home/Reels/Channels, profile/music/themes, uploads/posts/comments, messaging/notifications, teen safety/privacy need integrated real-backend mobile QA.
- Current functional isolated-backend Android/iPhone artifacts, physical-device QA, signed distribution, app-store policy and owner release approval are missing.
- No production, shared live Supabase schema/data/auth/security, Kinfolksworld, paid infrastructure or store submission changes.
