# Recovery322 | Native verification resend callback isolation

Date: 2026-10-29. Scope: full MAIN Kinfolk Social app (`kinfolk-social/`) only; excludes Kinfolksworld. Started from verified Recovery321 final commit `6ab8baeedfe9641758596647635223efd8b3403a`. Draft-only isolated branch, no production release.

## Inspection before changes
- Read Recovery321/320 reports, current app README, Phase76 signup wrapper, Phase79 signup and verification-resend helper, native packaging/callback validator, existing auth regression tests, source CI and Android/iOS workflow.
- Recovery321 full source CI run 40913180423: **completed success** at the exact Recovery321 head.
- Recovery321 native run 40913169403: Android debug job **success**; iOS Simulator job **cancelled**, so overall native workflow **failure**. Do not describe as two-platform success.
- Read-only isolated Supabase Alpha Test project `viantpfagtbgyyzavmtv`: ACTIVE_HEALTHY; 14 empty public tables, all RLS enabled; zero security-advisor lints. Community/membership/Channel/Video tables absent.
- Vercel Recovery321 previews have READY deployments for earlier application commits, but intentionally block access to shared live Supabase; not functional alpha tests.
- Library prelaunch audit warns about private media, teen safety and real-device testing. No live backend changes authorized.

## Application change
- `kinfolk-phase79.js`: verification resend and Phase79 signup now treat `window.KINFOLK_NATIVE_ALPHA===true` as native before Capacitor's bridge is ready. The resend helper previously could classify Android `https://localhost` as web before bridge startup and call `sb.auth.resend` without `emailRedirectTo`, falling back to Supabase Site URL. The helper now fails closed before the resend request when the packaged callback is missing or unsafe.
- Harden Phase79 callback validation to reject Vercel preview and Supabase API hosts, local/.local/.localhost names, IP literals, fragments, credentials and nonstandard ports, matching the native packaging safety policy. Ordinary HTTPS web origin and valid custom callback behavior remain.
- `tests/recovery322-native-verification-resend.test.cjs`: six synthetic runtime/source regressions for early marker, bridge and iOS scheme, unsafe URLs, unchanged web behavior and signup/resend helper wiring.
- Add new tests to `native/package.json` `alpha:auth:source:test`, hence `alpha:verify`. Include Recovery322 branch in existing offline-only Android/iOS workflow; this does not configure a real backend.

## Evidence and boundaries
- GitHub source and native CI must be checked at their **final** commits. Code commits and test inclusion are not test-pass proof.
- A READY Vercel preview is deployment evidence only; no real auth traffic is allowed there.
- Offline-only CI uses an unreachable placeholder Supabase URL. No real signup, email delivery, password recovery, two-account RLS, media, messaging, teen enforcement, Android device or physical iPhone QA was performed.
- A signed physical iPhone IPA, Universal Links/App Links ownership, allowlisted callbacks and functional isolated backend are still missing.

No shared live Supabase schema/data/auth/security, production Vercel deployment/aliases, Kinfolksworld, paid infrastructure or store submissions changed.
