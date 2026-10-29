# Recovery321 | Native signup callback isolation across all login forms

Date: 2026-10-29. Scope: FULL MAIN Kinfolk Social (`kinfolk-social/`) only. Based on Recovery320 final commit `f648c9ecf69b61fa54105372a81029ba5c422920`. Isolated development branch; draft PR #20 targets Recovery320, not main.

## Inspected before changes
- Recovery320/319 reports, root and native READMEs, the Phase76 signup wrapper, Phase79 email redirect logic, native packager, callback validator, source/native tests and GitHub workflows.
- Library Recovery226 notes and Vercel preview history. Recovery320 source checks succeeded on GitHub Actions runs 40902051221 and 40902018525. Recovery320 native run 40902018463 compiled Android successfully, but its iOS Simulator job was cancelled; this is **not** a completed two-platform build.
- Read-only isolated Supabase project `viantpfagtbgyyzavmtv`: ACTIVE_HEALTHY; 14 public tables, all RLS-enabled and empty; security advisors reported zero lints. Community, membership, Channel and Video tables remain absent. No database or Auth writes.

## Actual application fix
- `ba3b85c`: the existing Phase76 signup wrapper now overrides a legacy form's local `location.origin` redirect with the packaged approved HTTPS email callback on Capacitor. Without an approved callback it returns an error **before** calling Supabase signup. Prevents silent fallback to the Supabase Site URL. Web behavior and caller input are preserved.
- `cc8c9dc`: recognize an early native-alpha marker even before Capacitor's JavaScript bridge is ready.
- `6d55b3b`: native packager always injects `window.KINFOLK_NATIVE_ALPHA=true` into the HTML head before the bundled SDK and app scripts, including offline packages.
- `af36a38`: package verification checks marker presence and startup order.
- `5ee1e5c`, `a01264e`: seven synthetic runtime regression cases for valid/absent/blocked callbacks, override, native marker before bridge startup, and unchanged web behavior.
- `fdf0eeb`, `ad8669d`: integrate regression tests into existing native `alpha:verify` and callback packager test.
- `1b601d5`, `ead496a`: native password recovery now fails closed without a separately approved HTTPS recovery callback, rather than sending a reset email to an unrelated backend Site URL. Existing web behavior is retained.
- `b69d6e3`: optionally inject `KINFOLK_ALPHA_PASSWORD_RESET_REDIRECT_URL` after the same HTTPS safety validation; never inject a local or preview URL.
- `f9d8022`, `43fc9c4`: native package verifier checks the configured recovery callback or proves it is absent.
- `bed973f`, `50e0952`: four additional synthetic password recovery regressions. `a54f1cf`, `98d1d09` include them in native alpha verification and static callback tests.
- `d1beaf4`: add this isolated branch to the existing offline-only Android/iOS native build workflow.

## Verification boundaries
- Code commits and test inclusion do not prove tests passed. Inspect the latest source CI and native jobs separately after the final documentation commit.
- Vercel previews remain fail-closed to shared live Supabase. A READY preview is only deployment evidence, not a functional alpha.
- Native CI builds use the unreachable packaging-only Supabase placeholder. No real signup, email delivery, callback association, two-account RLS, uploads, messages, physical-device QA or signed iPhone IPA is verified.

## Blockers
- Functional alpha needs owner-confirmed isolated backend configuration, verified HTTPS App Links / Universal Links and Auth redirect allowlist. Do not change the shared live backend or incur paid infrastructure costs.
- Missing Community, membership, Channel and Video backend tables; server-side teen privacy and RLS need real two-account tests with synthetic accounts only.
- Android debug APK and iOS Simulator packages are not store-ready. No production release or app-store submission is authorized.

No changes to shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, or paid resources.
