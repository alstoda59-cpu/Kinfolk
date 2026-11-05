# Recovery468 | Executable preview isolation regression
Date: 2026-11-05 (America/Los_Angeles)
Base: Recovery467 commit 7c7f5c717307f32a18a5aa0f286494738e016662
Branch: kinfolk-social/recovery468-preview-runtime-isolation-20261105

Added an executable Node vm synthetic-DOM regression for the actual kinfolk-preview-isolation.js rather than another static source-contract assertion. It exercises Vercel preview hostname matching, immediate CSP network/form blocking, submit interception, visible overlay, native localhost and custom-domain exemptions, suffix spoofing, and delayed document.body creation / idempotent overlay. No live accounts or network calls.

Commits:
- db932946d785a56ed0085dac012c4485712134da: synthetic runtime regression
- bbcd9ec88cefa7e3bdca714ad32ac46cc8f1b294: correct mock DOM id property tracking

Command: node kinfolk-social/tests/recovery468-preview-isolation-runtime.test.cjs

Execution status: NOT VERIFIED. The local execution container cannot resolve raw.githubusercontent.com, so the committed source could not be downloaded and run there. A committed test is not a passing test. Verify in GitHub CI or a checked-out repository.

Recovery467 final Vercel deployment dpl_HCseT3rTFggst55WQdYNB3QK9ZRF was READY on inspection; this does not prove application functionality. Recovery468 preview and CI status require independent checks.

The preview still deliberately blocks backend access until an owner-approved isolated Supabase environment is configured. This is a security regression test, not signup/RLS/media/device end-to-end evidence. The prelaunch Library audit flags public kinfolk-media storage, disabled leaked-password protection, and unverified RLS. Do not change live Supabase or production aliases. No native APK/IPA or physical-device testing completed. Kinfolksworld unchanged. Not launch-ready.
