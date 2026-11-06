# Recovery481 | Functional alpha rejects packaging-only mode

Date: 2026-11-05. Continued from Recovery480 on the existing isolated Recovery481 branch, without touching production or Kinfolksworld.

## Implemented
- The functional backend gate now rejects `KINFOLK_ALPHA_PACKAGING_ONLY=1` even when a designated isolated Supabase URL and publishable key are supplied. Previously only the CI stub URL/key combination was rejected; a packaging-only marker could coexist with the real isolated project and pass the configuration gate.
- Added a synthetic regression to the existing `alpha-functional-backend-gate.test.mjs`, already included in `alpha:verify` and `alpha:functional:gate:test`.
- No UI redesign, shared live Supabase modifications, production deployment, aliases, store submissions or paid resources.

## Evidence and limitations
- GitHub accepted source commit `27e38e6e22fae8f515824d5473beae8e8afa57a8` and test commit `76fc32da6f823963e960f460fa4266fe906a4e9d`.
- Committed tests are not proof of executed/passing CI. Vercel READY is separate from functional backend success.
- No synthetic email-confirmed signup, real two-account RLS/media test, current physical Android/iPhone installation or signed iPhone build was performed.

## Next
Run `npm run alpha:functional:gate:test` in `kinfolk-social/native`, inspect exact-head CI, then verify real isolated Auth/RLS and device behavior after owner-approved organization/cost decisions. Do not label the alpha launch-ready without full end-to-end evidence.
