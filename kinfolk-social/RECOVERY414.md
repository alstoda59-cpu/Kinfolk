# Recovery414 | Post/story metadata acknowledgment and media preservation

Date: 2026-11-02 (America/Los_Angeles). Scope: **FULL MAIN Kinfolk Social** `kinfolk-social/` only; Kinfolksworld excluded.

## Verified starting checkpoint
- Continued from Recovery413 draft PR #110, final commit `13fabf95fd0285dd78c92875501278d6961f2725`, on isolated branch `kinfolk-social/recovery414-post-story-write-ack-20261102`. Recovery413 report, effective `index.html`, media regression fixtures, native package workflow, Library notes and Vercel deployments inspected first.
- Recovery413 final-head source CI [41421926417](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41421926417) is now confirmed **success** (Node and simulated browser/source workflow).
- Recovery413 nonproduction Vercel preview READY at commit `46b940a1`; READY does not prove backend or device functionality.

## Actual application development
- `5a32b69d0f91fa1e17256bba5ea89977f725a86f`: fixed the effective `createPost` and `createStory` handlers in `index.html`. Previously, after an uploaded photo, a failed/lost PostgREST INSERT acknowledgment could delete a possibly referenced media object, and the original form could immediately retry, risking duplicates or broken posts.
- Both composers now request `count:'exact'`, select `id`, owner column and `media_url`, and require exactly one confirmed row with the initiating owner and matching path (including null for text-only posts). Uncertain responses or thrown requests **preserve media and lock the original form**; members are instructed to inspect Home or Stories before retrying. Confirmed saves remain saved after a feed-refresh error. Existing account/session/modal isolation, MIME preflight and dark mobile UI remain.
- No changes to live Supabase schema, Auth, security, production deployment or aliases, Kinfolksworld, paid infrastructure or app stores.

## Tests and CI
- `5953c58cf221e3ded66a0623c1ff1d5853cad349`: expanded source-executed post/story VM regression suite for exact affected-row counts, wrong owner/path, missing ID, rejected metadata promises, duplicate submission prevention, stale account changes, text-only uncertainty and post-save refresh.
- `d4ae6c98bc190224cae6c20242529f6cbf9ead4e`: repaired a JavaScript syntax error in the new PostgREST chain fixture before subsequent CI.
- `e23297747f5bf2da6069e2368a4a9dea735f369f`: added this isolated branch to the existing **offline-only** Android/iOS compilation workflow. Native builds still intentionally use an unreachable CI backend, never shared live credentials.
- First source CI [41429130153](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41429130153) found three outdated assertions in `alpha-composer-account-guard.test.cjs` (1,110/1,113 tests passed). `86cdcd5db0af5259b97411774c84b951e573c018` repaired its mocked insert chain to return verified exact-count owned rows; [replacement source CI 41429203727](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41429203727) was queued at last inspection. Do not claim final-head CI success until it completes.
- Draft [PR #111](https://github.com/alstoda59-cpu/Kinfolk/pull/111) targets Recovery413 and remains unmerged.

## Isolated backend and launch blockers
- Read-only Supabase Alpha Test project `viantpfagtbgyyzavmtv` is ACTIVE_HEALTHY. The public table listing shows 25 RLS-enabled tables, but **`public.kinfolk_stories` is absent**, blocking real story persistence there. The project has **zero Auth users, zero posts and zero videos**. The separate shared live `zojajuzmfjpvubzibzgg` project was not accessed or changed.
- Real signup/email confirmation, authenticated two-account RLS, backend-connected posts/stories/videos/messages, physical Android/iPhone QA, signed physical-iPhone IPA and store readiness are **unverified**.
- No project organization selection or nonzero cost was authorized or incurred.

**Status:** Substantive post/story safety fix and synthetic tests committed; first CI revealed a legacy fixture incompatibility which was repaired. Complete Android/iPhone alpha is **not launch-ready**.
