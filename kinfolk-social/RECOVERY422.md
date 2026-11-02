# Recovery422 | Private wallpaper references and short-lived owner-only signing

Date: 2026-11-02 (America/Los_Angeles). FULL MAIN Kinfolk Social only, `kinfolk-social/`. Continued directly from Recovery421 final commit `88cbffef4ea6802fdfb1cb9656a8857ad7ae3e1d` on isolated branch `kinfolk-social/recovery422-wallpaper-private-short-links-20261102`; no merge or production release.

## Starting verification
- Inspected Recovery421/420 reports, current GitHub branch and draft PR #118, exact-head source/native CI, Library notes and nonproduction Vercel deployments.
- Recovery421 source CI run [41491506928](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41491506928) completed successfully; native run [41491479524](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41491479524) produced an Android debug APK, while the iOS Simulator job was cancelled.
- The previous nonproduction Vercel preview at commit `c642d64e` was READY; this is not connected-device evidence.
- Read-only Alpha Test Supabase inspection confirmed `kinfolk_safety_settings.animated_wallpaper_url` is nullable text without a URL-only CHECK and `auth.users` is empty. Separate test project `viantpfagtbgyyzavmtv`; shared live project `zojajuzmfjpvubzibzgg` excluded.

## Substantive application implementation
- `58687756d9a29c5996aeec6a196059704c844967`: effective Phase76 wallpaper uploader now persists `kinfolk-wallpapers:<owner>/<object>` instead of a 365-day signed URL. Its upload-time signature is limited to 300 seconds and is never written to the database.
- Both the profile background layer and owner profile-cover renderer now resolve private references with fresh owner-authorized 300-second signed URLs. The resolver verifies current account and exact Auth token before and after asynchronous signing, rejects foreign/malformed/traversal references, caches signatures for at most 240 seconds and coalesces concurrent signing requests. It keeps existing external HTTP(S) and historical signed URLs readable without rewriting them.
- Account switches during signing cannot render the prior owner's private wallpaper. Existing session-isolated upload and exact-one-row acknowledgment protections are preserved.
- `439524abcdd8091fabef88d3a2fdd76704af8c5e`: updated source-executed upload regressions to require private path persistence and 300-second signing.
- `28cfcae923d54c1e50f0e2b13210545f3f629cdb`: new source-executed signing regressions for cache renewal, foreign/traversal paths, account/token changes, concurrent rendering, signing errors, external URL compatibility and both rendering consumers.
- `8f22e3447c5ba7e50917018e12e165342318b6ce`: integrated tests into offline native media gate.
- `c475131cdc7202ac599ca96dc76bacad4c982870`: enabled isolated Recovery422 Android/iOS workflow branch.

## Verification boundaries and follow-up
- New Recovery422 CI, native builds and exact-head Vercel READY must be checked independently. Code and tests are committed, but tests are not considered passed until Actions reports success.
- Historical 365-day signed URLs cannot be retroactively revoked by this client-side change. Their eventual expiry and future migration/revocation need a separate approved design.
- No new Supabase migration, Auth users, schema, data or security change; no shared live backend, production Vercel, aliases, Kinfolksworld, paid resources or store submissions.
- Offline native packaging still uses an intentionally unreachable backend. Real signup/email confirmation, login/logout/session restoration, two-client authenticated RLS, connected media/messaging and physical Android/iPhone QA remain unverified. No signed physical-iPhone IPA.
- Next: inspect Recovery422 CI and native jobs, fix any failing regressions, then prioritize real synthetic-account signup and backend-connected alpha/device QA.

**Status:** substantive private-wallpaper app code and source regressions committed; not yet a proven backend-connected Android/iPhone alpha or launch-ready.
