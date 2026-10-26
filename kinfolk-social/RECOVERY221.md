# Recovery221 — email verification recovery and native asset repair

Date: 2026-10-25 (America/Los_Angeles).
Base: Recovery220, `4cdc30ed700c4dbc6cdc04450313f87d56261c32`.
Branch: `kinfolk-social/recovery207-signup-navigation-guard`.

## Inspected before changes
Read root/application README, Recovery220, Recovery219 backend review, native README, prior tests and recent git history. Local branch matched the supplied commit. Vercel listed Recovery220 application preview `dpl_CqPHv58zJqJcVoSrP1DbsLwU6nqB` READY (nonproduction, commit c62e59530a504fd8046a66936ff654f7033beb5b); authenticated root fetch returned HTTP 200. This was source/HTTP inspection, not rendered browser validation. GitHub workflow connector returned no PR-triggered runs for the checkpoint; it does not establish push-workflow success.

## Completed code
- Existing signup now provides an email-verification panel and resend control after a no-session response. Keeps the submitted address only in memory; uses existing Supabase SDK resend API and existing HTTPS callback selection.
- Prevents duplicate concurrent resends and adds a one-minute client cooldown, rate-limit/error feedback, and stale response guards for navigation or replacement signup. No password/token storage added.
- Avoids claiming that an ambiguous no-session signup definitely created a new account. Existing signup/login handlers, age/privacy protections and dark design retained.
- Fixed native asset selection: the previous copy rule omitted `kinfolk-reels159.js`, causing prepare:web to fail. All referenced Kinfolk modules are now copied.
- Repaired stale Node fixtures (missing querySelectorAll, session identity/storage/connected form, insufficient microtask wait) and source assertions superseded by newer guards. No production safeguards removed to make tests pass.
- Added six resend regression cases and a byte-for-byte native bundle regression. CI now runs the full Node suite and includes a network-blocked mobile Chromium/WebKit resend script.

## Executed verification
- Actual Node v24.22.1: **124/124 tests passed**, no skipped tests, in `node --test kinfolk-social/tests/*.test.cjs`.
- **27/27** legacy `test_*.js` scripts passed (mixture of synthetic behavior/static checks).
- All `kinfolk-*.js` and service-worker JavaScript syntax checks passed.
- `npm run prepare:web --prefix kinfolk-social/native`: passed, **23 referenced modules** checked. Native regression confirms each copied module matches source bytes.
- `git diff --check`: passed.

## Unverified / blockers
- Browser regression committed but not executed locally: Chromium download archives were invalid; WebKit downloaded via fallback but required system libraries are missing; system package installation failed due host permissions. No Android/iOS rendered or physical-device pass is claimed.
- No isolated Supabase backend is configured here. No real signup, email delivery/link confirmation, login/logout/refresh, uploads, messaging or notifications were exercised. Shared live Supabase remains untouched.
- Native web assets are packaged, but Capacitor Android/iOS projects, signed AAB/IPA, native callbacks, push/media/streaming permissions and store submission remain outstanding. Existing external CDN SDK dependency remains.
- Teen privacy backend hardening and assigned-username reconciliation remain as described in Recovery219 review; no draft migration applied.
- Home/Reels/Channels/music/session regressions are synthetic/static only; Gold Star and streaming end-to-end behavior is not verified.

No production release, merge, alias change, Kinfolksworld edits, live backend changes or real account use.
