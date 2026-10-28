# Recovery285 | Require successful account activation before reporting login success

Date: 2026-10-28 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only. Kinfolksworld excluded.

## Baseline reviewed
- Latest Recovery284 branch and report, Phase95 login, the actual `kf129ActivateSession` implementation in `index.html`, Phase79 signup, native alpha test scripts, earlier Recovery226/232 Library notes and current nonproduction Vercel deployments.
- Recovery284 source CI and physical device QA were not confirmed. Recovery284 READY preview was for integration commit `fece159f`.
- `kf129ActivateSession` explicitly returns `false` when hydration, feed loading, rendering or activation epoch validation fails, rather than always throwing. Phase95 previously ignored this return value and could treat a failed account startup as successful login, leaving the user on a startup error screen while retaining the authenticated session.

## Implemented
- `911f20841c4a1ba8bf2b06c9c43ce992e988d854`: Phase95 now awaits an activation helper and requires the result to be exactly `true`. Missing callback, false/undefined result, or thrown startup error enters the existing preference rollback and guarded local session cleanup path instead of reporting successful login.
- `a16f1105a054c89fd63109994b0304f31df3a165`: seven Node regression tests against the actual Phase95 helper source for success, false, undefined, missing callback, thrown error, session identity forwarding and login-handler integration/rollback.
- `1298d6ff0c28eafc76c96fad4fe669169eae2553`: include new regression in native `alpha:auth:source:test` and `alpha:verify`.

## Verification
- Re-fetched exact committed Phase95 blob `270ee17b618a7a8fa463ae7a21746743d75d89fd`; **10/10 synthetic in-memory V8 checks passed** for successful activation, rejected false/undefined/null/zero, missing callback, propagated startup error, session forwarding, handler integration, ordering and cleanup. These are **not** the committed Node test runner or full GitHub Actions CI.
- Vercel nonproduction deployment `dpl_5LhVBBViv38HYVGiQKBJfggQzQVa` is **READY** for test-integration commit `1298d6ff`: https://kinfolk-social-demo-ifwuxloes-alstoda59-9779.vercel.app/ . READY does not verify login functionality.
- GitHub combined status reported Vercel success; no matching pull-request workflow runs returned. Full CI remains **unverified**.
- Real synthetic account signup/email/login/logout/session restoration, RLS, mobile feature E2E, current native builds and physical device QA remain **unverified**.

## Safety and next blockers
No shared live Supabase schema/data/auth/security, production aliases, Kinfolksworld, paid infrastructure or app-store submissions changed. No real accounts or data used. Isolated Supabase callback allowlisting and App Links, real two-synthetic-account E2E/RLS, and functional-backend Android/iPhone QA remain launch blockers.
