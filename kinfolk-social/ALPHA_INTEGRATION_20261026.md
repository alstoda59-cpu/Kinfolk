# Main Kinfolk Social alpha integration checkpoint (2026-10-26)

Scope: `kinfolk-social/` in `alstoda59-cpu/Kinfolk` only. **Not Kinfolksworld**. This is an isolated development branch; do not merge to production, change the shared live Supabase project, release an alias, or submit app stores without owner approval.

## Why this branch exists

The isolated `alpha-dm-friends-20261026` branch contains the newer friend-only messaging/RLS work, but the independent `alpha-password-flow-consistency-20261026` branch corrected **active** Phase76/Phase79 signup and login password validation. They diverged from the same media-storage ancestor. A user could still be blocked from signing up with a valid 13-character password on the messaging branch, despite the main inline form advertising 12–128.

This branch is based on `alpha-dm-friends-20261026` and integrates the complete two active JavaScript files, the six-case Node password regression, seven Python browser test fixtures, and six Node signup/session fixtures from the password-consistency branch. Existing messaging code, profile hydration, privacy rules and dark UI remain on the branch.

## Additional fix

The Phase76 `sb.auth.signUp` wrapper now drops non-HTTPS, malformed, native localhost, and loopback `emailRedirectTo` values before making a Supabase signup request. It preserves valid HTTPS redirects and user metadata. This covers the legacy inline and Phase76 signup paths even if the Phase79 capturing handler is bypassed. Phase79 already validates its redirect independently. Native email verification still needs a configured, owner-approved HTTPS confirmation destination; dropping an invalid callback is **not** a verified native deep-link flow.

Added `tests/alpha-native-email-redirect.test.cjs` to exercise invalid and valid redirect handling and 11/12/128/129-character boundaries with a mocked Supabase client.

## Evidence

- Both integrated Phase76 and Phase79 files parsed using V8 `new Function` before committing.
- Executed 10 focused wrapper cases using a small URL constructor shim in the tool runtime (native Android/iOS, loopback, HTTP, malformed, valid HTTPS and password boundaries). **10/10 passed.** The committed Node test uses the actual Node URL implementation; it has **not** been run in CI in this checkpoint.
- Verified GitHub compare: this branch is ahead of `alpha-dm-friends-20261026` by 18 commits, with no behind commits. The password-consistency files are now included; no production merge.
- Vercel READY previews were found for early integration commits `28bf022`, `0f4596d`, `432ab96`. They **do not include** the latest callback fix or test. Latest commit status has Vercel failure due to build-rate limit; do not claim latest preview READY.
- GitHub commit-associated workflow search returned no runs for latest test commit. **No new passing CI or native build is verified.**
- Earlier password-consistency branch recorded 227/227 Node tests passing at an intermediate commit but browser stage failing on outdated Python fixtures. These fixtures were brought forward here, but the full workflow still requires a fresh run.

## Remaining gates

Real isolated-project signup, email confirmation, login/logout/session restoration, cross-account RLS tests, upload/post/comment tests, friend messaging/notifications, teen protections, and full Reels/Channels backend tables are unverified. Native packaging has compiled previously with an offline-only backend stub, not a working account backend. A functional Android debug APK, iPhone simulator package with isolated credentials, physical-device QA, signed store packages, and owner launch approval are outstanding.

Do not use personal or real accounts for preview testing. Use synthetic test accounts only. No new nonzero costs authorized.
