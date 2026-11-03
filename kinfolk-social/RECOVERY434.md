# Recovery434 | Native-safe signup email verification redirect

Date: 2026-11-03. Full main Kinfolk Social, kinfolk-social/ only. Based on Recovery433 c9d2a5d35302f1c9e757d7e3e66ed243e168bf90. Isolated, unmerged.

## Verified predecessor
Recovery433 source CI run 41603790391 completed SUCCESS. Isolated backend viantpfagtbgyyzavmtv was previously inspected read-only: 27/27 public tables RLS-enabled, 85 policies, zero Auth users. These facts do not establish two-account RLS enforcement or successful email confirmation.

## Application change
Commit 3d55e183b61d955b7a8a75e93671f7dc00d16a88 changes signup to pass emailRedirectTo only when location.origin is an HTTP(S) origin. Capacitor, ionic, file and opaque native origins omit the override and use Supabase's configured Site URL. Existing username/display-name signup metadata and web same-origin behavior remain. This prevents sending an invalid native scheme as the email confirmation redirect; actual confirmation still requires a correctly configured HTTPS Site URL, allowed redirect URLs, inbox and a connected device.

## Regression coverage
Commit 543f1d9a2e1cb86de6b1498e8879ff97b57a3294 adds source-executed Node tests for HTTPS, localhost HTTP, native/opaque origins and signup metadata preservation. Execution/CI for Recovery434 is pending verification; committed tests are not claimed passed.

## Boundaries
No Supabase settings, Auth users, RLS, production Vercel, Kinfolksworld, paid resources or stores changed. Real synthetic-account confirmation, login/session restoration, authenticated RLS, backend-connected Android/iOS builds and physical-device QA remain unverified. Not launch-ready.
