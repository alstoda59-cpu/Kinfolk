# Recovery351 | Profile music URL and auth-activation playback safety

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only. Based on Recovery350 exact head `c1f9f258364662f7e96edefea9c57837ad9a6ff2`. Isolated branch `kinfolk-social/recovery351-profile-music-url-session-safety-20261030`. No merge or production release.

## Verified starting point

- Inspected Recovery350 branch/head and `RECOVERY350.md`, README, effective Phase81 music runtime, Recovery348/349/350 source tests, native `alpha:profile:source:test` gate, native CI workflow, Library Kinfolk notes, and nonproduction Vercel deployments.
- GitHub compare verified the Recovery350 branch was identical to `c1f9f258364662f7e96edefea9c57837ad9a6ff2`.
- Recovery350 exact-head source CI run `41123348231` concluded SUCCESS. This is synthetic CI, not a real backend/device test.
- Recovery350 nonproduction Vercel READY preview was an intermediate commit `fc60d0d1a2fcc434bc7487837b908095c4696d1e`, not the Recovery350 final head.
- No shared live backend, production deployment, aliases, paid resources, Kinfolksworld, or app stores were changed.

## Actual application fix

- `kinfolk-phase81.js`: validate persisted profile music links before building a player or external Open link. Reject non-HTTPS, malformed and credential-bearing URLs.
- Only exact recognized YouTube hostnames with valid 11-character video IDs can become embedded players. Lookalike domains remain ordinary HTTPS external links rather than embedded YouTube.
- Direct audio recognition now checks the validated HTTPS URL's pathname instead of treating arbitrary query text as an audio file.
- Capture the authentication activation epoch around async music lookups. Old same-account relogin results cannot mount a player. An existing player from a previous activation is torn down and reconstructed even if the URL is identical.
- Queue one recheck when a new request arrives while an old music lookup is pending. Late `audio.play()` completion after leaving the profile or changing activation pauses the stale audio rather than marking it Playing.
- Existing music removal behavior, dark mobile UI, play/pause controls, Settings and profile features are preserved.

## Synthetic tests and native verification gate

- Added `tests/recovery351-profile-music-url-session-safety.test.mjs`: eight source-extracted tests for unsafe URLs, YouTube lookalikes, audio path classification, persisted unsafe URL rejection, same-user relogin, queued refresh, old player teardown and late audio playback.
- Added the suite to `native/package.json` `alpha:profile:source:test`, transitively included in `alpha:verify`.
- Enabled the isolated Recovery351 branch in `.github/workflows/kinfolk-alpha-native.yml` for offline-only Android debug APK and unsigned iOS Simulator compilation. CI uses an unreachable packaging-only Supabase placeholder, not the live backend.
- Verification must be recorded from exact-head GitHub CI and deployment results. A READY Vercel preview is not real auth/RLS QA, and an iOS Simulator ZIP is not an installable physical-iPhone IPA.

## Remaining release gates

Real isolated Supabase signup/email delivery and confirmation, login/logout/session restoration, two-synthetic-account RLS and private storage tests, backend-connected posts/uploads/messaging/notifications, teen-safety enforcement, missing Community/Channel/group schema, functional Android/iPhone packages, physical-device QA and signed iPhone IPA are not demonstrated. Do not claim launch readiness or change production/shared resources without owner approval.
