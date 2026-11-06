# Recovery484 | Reject expired synthetic JWTs in RLS verification

Date: 2026-11-05. Main Kinfolk Social only; branched from Recovery483.

## Implemented
- Reject JWT payloads with expired or malformed `exp` before read-only RLS probes, preventing a stale session from being treated as privacy evidence.
- Preserve optional `exp` for existing offline synthetic fixture tokens; real Supabase access tokens carry expiry.
- Add regression cases and include the existing full two-user RLS transport suite in recovery-branch CI.

## Commits
- `da2943a06faf42191a97774bf4ede6b88ee0d649` source
- `9c10a59fadecc56fe6ed4b645d26550543421047` tests
- `f9e4da399cb215ba3e06bdf9b14ea6a95d3f820f` CI

## Verification limits
GitHub accepted changes. Actual Actions passing, Vercel final-head READY, real isolated Supabase two-account access, confirmed email delivery, native binary packaging and physical-device QA require independent evidence. No shared live Supabase, production aliases, Kinfolksworld, paid infrastructure or store submissions changed.

## Next
Verify CI job execution; resolve any failing suites. With approved isolated backend organization/cost, run synthetic real-account Auth and read-only two-account RLS. Build current Android/iPhone artifacts and test on devices.
