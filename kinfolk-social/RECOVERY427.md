# Recovery427 | Mobile messaging IME and repeated-Enter protection

Date: 2026-11-02 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social, `kinfolk-social/`, excluding Kinfolksworld. Continued from Recovery426 final commit `24ebaac84eeabbf6d1fc56153948fcee4b07c8f1` on an isolated, unmerged branch.

## Starting verification
- Reviewed Recovery426/425/424/423 reports, latest draft PR #123, effective Phase107 messaging form handler, previous Recovery239/240/245/404 source-executed tests, native packaging scripts, Library historical Kinfolk notes, and nonproduction Vercel deployments.
- Recovery426 final-head source CI [41537092231](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41537092231) completed SUCCESS, including its Node and simulated browser regressions.
- Recovery426 native run [41537082572](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41537082572): Android debug APK job SUCCESS; iOS Simulator job CANCELLED, not compiled.
- Latest inspected nonproduction Vercel READY preview `https://kinfolk-social-demo-7z720kefl-alstoda59-9779.vercel.app/` was built at Recovery426 test commit `2945cd82`, not the final documentation head. The final-head Vercel check reported a free-tier build-rate limit.
- Existing isolated Alpha Test Supabase project `viantpfagtbgyyzavmtv` is identified from prior read-only verification; the shared live project `zojajuzmfjpvubzibzgg` was not accessed or modified.

## Actual application change
- `9df61a227e43b32d7b9565a2b5d7890ea86eab23`: the effective Phase107 messaging Enter-to-send handler now ignores keyboard events during IME composition, Android's legacy keyCode 229 composition event, and held Enter key auto-repeat. These events previously could invoke the DM/group message handler or group creation before the member finished typing with an international keyboard. Ordinary Enter, Shift+Enter for multiline textarea, and the Send button remain available.
- `17ca12fafaa5eca4595393d7101247a3af73f760`: six source-executed synthetic regressions cover composing Enter, Android 229, auto-repeat, a normal Enter after composition, Shift+Enter, and button tap.
- `f0ac292e489caee428b0a5092971e728fe556e1c`: added the new regression to `alpha:messages:source:test` so both offline Android and iOS native package verification require it.
- This changes no database schema, permissions, Auth users, backend data, production deployment or app-store configuration.

## Verification boundaries and next
- Recovery427 source CI, native jobs and any exact-head Vercel deployment must be checked separately. Committed tests are not claimed passed until GitHub Actions reports a successful run.
- Synthetic DOM keyboard events are not physical Android/iOS IME QA.
- Native CI packages still use an intentionally unreachable backend; Android APK compilation does not prove a working connected alpha. An unsigned iOS Simulator build is not a physical iPhone IPA.
- Real signup/email confirmation, login/logout/session restoration, authenticated two-account RLS, connected media/messaging, physical Android/iPhone QA, signed iPhone packaging and store readiness remain unverified.
- Next priority is the authorized isolated synthetic-account email flow and backend-connected native QA, subject to confirmed inbox/project configuration and zero unapproved cost.

**Safety:** no shared live Supabase schema/data/auth/security, production Vercel/aliases, Kinfolksworld, paid resources, real user data or store submissions changed.
