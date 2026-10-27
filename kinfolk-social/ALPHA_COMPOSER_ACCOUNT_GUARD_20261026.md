# Kinfolk Social alpha: account-safe post and story composers (2026-10-26)

## Scope and baseline
- Main `kinfolk-social/` only, excluding Kinfolksworld. Continued from `kinfolk-social/alpha-signed-media-isolation-20261026` commit `3bdcd6ddaa7eec80022abcdaf537537a670e9dde`; did not merge or modify production.
- Reviewed the Recovery246/247 isolated-backend reports, latest Library Recovery226/232 notes, the existing native packager and CI workflows, Vercel preview deployments, and current app post/story upload handlers.
- The approved separate nonproduction Supabase project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY. Read-only inspection found 14 public tables with RLS enabled, 14 recorded isolated migrations and zero security-advisor lints. No database writes or new users in this run.

## Actual changes
- `e5b8c72e0d0b167816a6c2f8aada3a55e83a7bea`: changed `index.html` so createPost/createStory capture the initiating user ID and login epoch, require the original modal form still to be active before database insert, use the captured author/owner ID, suppress stale completion UI after account switches, and prevent duplicate form submits during an upload. The button is re-enabled after failure or completion.
- `22b4daff7980980108d4c2c9024d295774573999`: added 8 synthetic Node regression scenarios in `tests/alpha-composer-account-guard.test.cjs` for logout, same-user re-login, modal replacement, duplicate submissions, late DB completion, story logout, successful post/story, and retry.
- `19f8e95195a549a790d1b1ff0bd3be8f3208c91a`: corrected the retry scenario to exercise an actual upload error, not a text-only submission.
- All features, dark mobile design, existing upload paths and media types retained. This is client race protection, **not** a replacement for server RLS.

## Verification
- Retrieved the final GitHub HTML and test file. Five of five inline scripts passed V8 syntax compilation.
- Eight of eight focused tests passed in an in-memory V8 adapter with Node-like test/assert/file shims. This is **not** a GitHub Actions Node run, real browser, real Supabase Auth, or physical-device test.
- The source/test commit `22b4daff` had a nonproduction Vercel READY preview `dpl_9qpT6BZbNTq1HFsFxEpzFVdpgU81`; the subsequent test-correction commit `19f8e951` was BUILDING when checked. READY is only a deployment state, not functional verification.
- GitHub Actions full CI was not confirmed in this run; the available workflow-run lookup filters to PR-triggered runs.

## Remaining release blockers
- End-to-end synthetic signup, email confirmation, session restore and two-account RLS testing against the isolated Supabase Auth API.
- Isolated backend still lacks stories, videos, Channels, subscriptions and some group/album tables used by the app. Native CI uses an unreachable packaging-only backend; its artifacts cannot prove working authentication.
- Uploaded media may remain orphaned if a user logs out during upload before the database insert. Cleanup and storage quotas/retention need server-side design.
- Android APK and unsigned iOS Simulator app built on earlier checkpoints do not include this fix; no physical Android/iPhone QA, signed IPA/AAB or app-store submission.
- No changes to shared live Supabase, production deployments/aliases, Kinfolksworld, real users, or paid resources.

## Next
- Verify full GitHub Actions source checks on this branch; repair any failing fixtures.
- Complete isolated stories/Reels/Channels schema and storage RLS, then test with two synthetic signed-in JWTs.
- Rebuild native artifacts from the verified branch with isolated publishable credentials, followed by physical-device testing and release gates.
