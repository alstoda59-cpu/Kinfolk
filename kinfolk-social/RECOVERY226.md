# Kinfolk Social Recovery226 | stale login button cleanup and first native alpha artifacts

Date: 2026-10-25 America/Los_Angeles (2026-10-26 UTC).
Scope: **full main Kinfolk Social only**; Kinfolksworld excluded.

## Inspected before work
- Library Recovery133 continuation and Recovery175 notes; GitHub `README.md`, `validation.json`, `INTEGRATION.md`, Recovery225, current Phase95 and Recovery224 tests.
- GitHub `kinfolk-social/alpha-installable-build` at `2a4687643e80017ba981787e1c666e83826e84f8` includes pinned Capacitor 7.6.9, Supabase JS 2.118.0, esbuild 0.25.12 and a lockfile. Native `prepare-web.mjs` builds a local SDK bundle, preserving the main app.
- Isolated Vercel previews and GitHub Actions. Latest successful native workflow: [run 40278490955](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40278490955), commit `624c0945de75cede1beb66b15465d36f52019000`.

## Changes on this isolated branch
- Branch `kinfolk-social/recovery226-login-remount-cleanup` from alpha source commit above, not merged into alpha/main.
- `kinfolk-phase95.js`: after a pending login returns to a reused Login button, clear its disabled state and stale "Logging in…" label when the old request settles. Do not modify the button if the user is currently in Signup mode. Preserve original title-node identity guard, session rollback and existing features. Code commit `6f3b7cb1c0dd731beea474d078dfdff249b2709e`.
- `test_recovery224.py`: assert that the reused Login button becomes enabled with the correct label before retrying. Test commit `70a1c153561393a97595f68f8e1fa8ad750ae139`.
- `tests/recovery215-login-navigation-check.test.cjs`: replace a brittle exact-string assertion with an assertion covering both lock release and button restoration. Test commit `06234a7f9796d68125f19eee1e74ed2b33f69d41`.
- `native/README.md`: replace outdated claim that native cold start depends on a remote SDK; document the verified debug Android and unsigned iOS Simulator artifacts, exact dependencies, and unverified release gates. Commit `495272202e01c19cc228bd7dd988243541889f68`.

## Verification boundaries
- Re-fetched the modified Phase95 from GitHub; V8 `new Function` syntax **PASS**.
- GitHub Actions run [40280295432](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40280295432): the complete Node synthetic suite step **PASS** after the static-test correction; mocked browser suite was still in progress at documentation time. Earlier intermediate commits had **failed** Node CI due to the brittle exact-string test, not a successful full CI result. Do not treat pending CI as passed.
- Android/iOS native build run **SUCCESS** at `624c0945...`, before Recovery226. GitHub artifacts: Android debug APK `12630863109` and iOS unsigned Simulator `12630729913` (both expire 2026-11-02 UTC).
- Downloaded and inspected the actual Android APK and iOS Simulator archive: both contain **24 referenced local JavaScript scripts, 0 missing**, including Reels and the locally bundled Supabase SDK. Native entry HTML does **not** reference the external jsDelivr Supabase SDK. This is **archive inspection**, not a launch or device test.
- READY isolated preview `dpl_7nJ6ePkLWW7ui64fEcRz2pkosDn6`, target null, URL `https://kinfolk-social-demo-2q6h0xpnc-alstoda59-9779.vercel.app/`, source `6f3b7cb1...`. This preview contains the app fix but predates the test/docs commits. READY is deployment status, not proof of rendered auth.
- **No** authorized isolated Supabase backend test, real email callback, physical Android/iPhone test, signed AAB/IPA, or app-store submission. The downloadable alpha artifacts predate this branch's login fix.

## Next
1. Confirm complete GitHub Actions browser regressions for Recovery226, investigate failures and keep test evidence honest.
2. Merge only after review into the isolated alpha development branch (never production/main without approval), then rebuild the native alpha artifacts to include Recovery226.
3. Verify signup/login/logout/session restoration and native email callback with synthetic authorized accounts on an isolated nonproduction backend; validate teen protections/RLS before broader testing.
4. Test physical Android and iPhone cold start, Home/Reels, settings/music, uploads, messaging, keyboard and safe areas, then prepare signed store builds only after explicit approval.

No production aliases, live Supabase schema/data/auth, Kinfolksworld files, payments, or release channels were changed.
