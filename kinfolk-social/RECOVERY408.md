# Recovery408 | Fail-closed group message acknowledgments

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social, `kinfolk-social/`; Kinfolksworld excluded.

## Starting verified checkpoint
- Continued from Recovery407 draft PR #104 at `bab3c43874ae8f8f735688f6f23ccbcacbc516ea`, without merging, restarting or redesigning.
- Reviewed Recovery407 and Recovery405 reports, effective `index.html` group send and creation handlers, Recovery343/405 source-executed tests, native package scripts/workflow, Library prelaunch audit, Vercel nonproduction deployment history, and isolated Supabase table metadata.
- Recovery407 source CI run 41383193660 completed successfully. Android debug APK and unsigned iOS Simulator builds completed in run 41383189495. Both deliberately use an unreachable CI-only backend, not real Auth.
- Separate Supabase Alpha Test `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY, with three group tables RLS-enabled. Read-only SQL confirms 0 Auth users, 0 groups, 0 members and 0 group messages. Shared live Supabase `zojajuzmfjpvubzibzgg` was not accessed for mutation.

## Actual mobile application fix
- Application commit `5553f418a90c811a7fb4c84f72b2b91dca689c67` updates the effective Group Chats Send handler in `index.html`.
- Group-message INSERT now requests `{count:'exact'}` and refreshes the chat only when the backend confirms exactly one affected row. A null/missing count, multiple rows, PostgREST error or thrown network failure is treated as an uncertain write.
- After an uncertain write, the original form remains locked and tells the member to reopen Group Chats to check for the saved message before retrying, preventing accidental duplicate messages from lost responses. Only an explicit error-free zero-row result unlocks the original form.
- Pending requests remain tied to the original account, auth activation, group and modal; a newer session cannot be refreshed or unlocked by an older request. The dark mobile UI and other features remain unchanged.

## Regression and native packaging
- Test commit `99c6a573fe142684adeb7bdd6197b85274b395fe` extends the existing source-executed `tests/recovery343-group-chat-isolation.test.mjs` from nine to fourteen cases and updates historical expectations for exact-row acknowledgment. It covers network throws, missing and multiple counts, safe zero-row retries, duplicate taps, stale auth and confirmed refresh.
- The test file is already included in `native/package.json` `alpha:messages:source:test`, so no duplicate runner was added.
- Native workflow commit `f2346a27cb477a0136faf9094e0bc07d2cc12e2d` opts the isolated Recovery408 branch into existing offline-only Android/iOS compilation, without credentials, production signing or app-store submission.
- Draft PR #105: https://github.com/alstoda59-cpu/Kinfolk/pull/105 (unmerged).
- Source CI run https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41389012424 passed the main Node regression step; browser checks and final-head CI/native conclusions were pending when this note was written. Recheck before claiming success.
- Nonproduction preview at application/test commit `99c6a573` was READY: https://kinfolk-social-demo-38bfme1at-alstoda59-9779.vercel.app/ . This is deployment status only, not real backend or device proof.

## Release boundaries and next actions
- No shared live Supabase schema/data/Auth/security, isolated Supabase schema/data/Auth, production Vercel deployment or alias, Kinfolksworld files, paid resources, store submissions or PR merges were changed.
- Real isolated synthetic-account signup/email confirmation, login/logout/restoration, two-account RLS, connected group-message writes, media/posts/notifications, and physical Android/iPhone QA are still unverified.
- Verify final-head CI and native artifacts, then exercise actual synthetic-account Auth and RLS on the isolated backend before producing a backend-connected Android/iPhone test build. An unsigned iOS Simulator bundle is not an installable physical-iPhone IPA.

**Status:** Actual mobile group-message fix and source tests committed; launch readiness not established.
