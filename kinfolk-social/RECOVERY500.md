# Recovery500: Native alpha verification regression repair (2026-11-06)

Base: Recovery499, c3cd9c1342321f1cffdbe9d9ed265cfd944b2056.
Scope: full main Kinfolk Social, kinfolk-social/ only. No production or shared Supabase changes.

## Actual failing evidence
GitHub Actions run 42269918200, Android job 128071561500, failed in 'Prepare and validate full Kinfolk native bundle'. Job logs report 77 native regression tests: 75 pass, 2 fail.
- Test 32 alpha-functional-backend-gate: expected a stale error message for the offline CI stub; actual code rejects packaging-only mode earlier with 'Packaging-only mode is forbidden for functional alpha verification'. Adjusted the assertion to the current fail-closed behavior; did not loosen the backend gate.
- Test 44 alpha-local-capacitor-config: combined invalid server:null with invalid appId, so the server shape validator rejected first. Split into independent invalid appId and null server assertions, preserving both guards.

## Evidence boundary
These are test corrections based on exact GitHub Actions logs and inspected implementation. New commits were accepted; a new successful CI run, Gradle compilation, APK artifact, iOS simulator compilation, real isolated Supabase/RLS testing, and physical-device testing have NOT yet been verified.

## Next
Inspect the next native push-triggered workflow run for this branch. If all 77+ tests pass, continue to Gradle compilation and package artifact integrity. Do not interpret offline CI packaging as functional signup or backend proof. Separate Supabase organization selection and any nonzero cost require owner confirmation.
