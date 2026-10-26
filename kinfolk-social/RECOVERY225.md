# Kinfolk Social Recovery225 | mobile authentication SDK startup recovery

Date: 2026-10-25, America/Los_Angeles.
Scope: **FULL MAIN Kinfolk Social only**, excluding Kinfolksworld.
GitHub branch: `kinfolk-social/recovery207-signup-navigation-guard`.

## Inspection and concurrent checkpoint preservation
- Reviewed latest branch README and Recovery223, Phase79/95/98, the native packaging script/Capacitor scaffold, root `index.html`, test fixture and GitHub Actions workflow.
- A separate development task committed **Recovery224**, repairing stale login responses across Login -> Signup -> Login. This Recovery225 work deliberately preserves Recovery224 and does not overwrite its Phase95 code, fixtures or notes.
- Inspected Vercel READY preview history and existing native packaging/readme. External `@supabase/supabase-js@2` script from jsDelivr remains an app startup dependency on both web and native packaging. If blocked/unavailable, the inline app immediately references `window.supabase.createClient`, which would otherwise cause an uncaught startup error.

## Actual changes
- Added an inline, independent JavaScript startup preflight after the SDK CDN tag in **main** `kinfolk-social/index.html`. If the SDK is missing when the DOM becomes available, it shows a responsive, full-screen dark Kinfolk error panel with accessible alert semantics, clear explanation and a working **Try again** reload button. It never writes credentials or changes session persistence, and it avoids duplicating the recovery panel.
- When the SDK loaded successfully, no recovery panel is shown. A script that becomes available before DOM ready suppresses the panel.
- Corrected the stale `Recovery131 Preview` browser/native app page title to `Kinfolk Social`.
- Added focused `tests/recovery225-auth-sdk-startup.test.cjs` and `test_recovery225.py` for mocked offline Chromium/WebKit mobile (390×844, 375×812) plus healthy-SDK branch. The new browser script is wired into GitHub Actions.
- Updated `native/README.md` to say explicitly that this is an **error recovery UI**, not an offline auth solution. A pin-reviewed, locally bundled Supabase SDK and dependency lockfile remain a native launch blocker.

## Commits
- Initial startup guard: `ea1fa26a50a8a0dd0d5eb0dcbaaadd90bcf51498`
- Startup Node-style tests: `b37da6e9fb7408d38a225718716b292d2d1cdae1`
- Rebase label on top of concurrent Recovery224 and adopt consistent Recovery225 marker: `d7ff64c740d9eeb9def4a5542dd152a9e10225c3`
- Rename/finalize source-backed test: `2001f1bbb9eb8fb3e92b158db13f656be5e413e0`, `5aea2912c9cceffe9d8ef45f55ff0414a8ab9196`
- New emulated Chromium/WebKit startup script: `d0700b4d07bd24f5de87eabe5ff1a84635770be9`
- CI: `f14472e1e928760035e34334bf26f469a38425cd`
- App title: `b28b9e26a35ed39971eba7474e0f08e0efcdbdc3`
- App title test: `ae16cf84c76c40068516971f2fd460ee8a258583`
- Native documentation: `623efcaed52aa8915ffc985480573ee0eb2ff52f`

## Verification hierarchy
- Re-fetched exact GitHub `index.html` + `tests/recovery225-auth-sdk-startup.test.cjs`; `new Function` syntax check on startup guard **PASS**.
- Executed all **6/6 focused tests** with a synthetic V8 Node-API adapter against those exact fetched sources: missing SDK draws accessible screen, SDK present leaves normal login alone, late SDK availability suppresses error, immediate execution works after document ready, preflight precedes inline SDK usage, and app title is no longer a Recovery preview.
- This is **not native Node execution**, GitHub Actions confirmation, rendered Chromium/WebKit, Android or iPhone testing. `test_recovery225.py` is committed/wired to CI but not verified as executed in this run.
- **READY isolated Vercel preview** `dpl_H8sKhgoY4Vzw62D1Ei6h6VcyEjUm`, target null, commit `d7ff64c740d9eeb9def4a5542dd152a9e10225c3`: `https://kinfolk-social-demo-92yhvdlz5-alstoda59-9779.vercel.app/`. Authenticated HTTP request to preview root returned **200**, with Recovery225 recovery code. This preview was generated **before** the subsequent app title and test/doc changes. READY/200 is delivery evidence, not rendered startup or auth proof.
- No account created, no backend data accessed or changed, no real email tests, no signed APK/AAB/IPA, no production release. Later Vercel builds may be rate-limited; verify specific commit before claiming updated preview.

## Next
1. Run full Node 22 GitHub Actions suite plus Chromium **and WebKit** mobile tests and verify results; investigate failures.
2. **Bundle and pin** an audited Supabase JS SDK with lockfile for Capacitor so the native shell is not dependent on CDN cold-start. Test offline/startup/reconnect on physical devices, not just a fallback panel.
3. Test actual signup/login/logout/session restore/email callbacks and teen privacy RLS with an **owner-authorized isolated nonproduction backend**. Never mutate shared live Supabase without explicit approval.
4. Finish Android/iPhone Home/Reels, profile/theme/music, uploads, messages, push, store permission declarations and full end-to-end release gates.

Production, Kinfolksworld, shared live Supabase, release aliases and store submissions remain untouched.
