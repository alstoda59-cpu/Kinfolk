# Recovery480 | Hidden Capacitor server override rejection

Date: 2026-11-05. Continued the main Kinfolk Social app from Recovery479, commit df90e07c9ea64e5cb2d9e6521c6d2790c1a74fb0, on an isolated branch.

## Actual changes
- Changed the native bundled-origin configuration guard to enumerate all own server property keys, including nonenumerable properties. Previously Object.keys omitted hidden allowNavigation, hostname, iosScheme and errorPath overrides, allowing those unreviewed settings through.
- Added four synthetic regression cases for hidden WebView navigation/origin overrides, retaining the existing valid bundled-alpha case.
- No application UI, authentication, backend schema, data, production or Kinfolksworld changes.

## Verification boundary
- GitHub accepted the source and test commits. CI and local execution remain separate from committed test coverage; do not infer passing tests from a READY Vercel preview.
- No isolated Supabase synthetic account, real email delivery, two-account RLS, current Android/iPhone binary or physical-device validation was performed.
- Separate Supabase organization selection and any nonzero project charge still require owner confirmation.

## Next
Run the native test suite in CI, inspect failures, and prioritize real isolated Auth/RLS/private-media integration and installable native builds. Do not approve launch without end-to-end proof.
