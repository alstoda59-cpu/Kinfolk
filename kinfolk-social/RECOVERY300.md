# Recovery300 | Direct-message account isolation and isolated-backend inspection

Date: 2026-10-28 (America/Los_Angeles). Scope: full MAIN Kinfolk Social in `kinfolk-social/` only. Excludes Kinfolksworld.

## Baseline inspected
- Recovery299 branch and report, current README, main `index.html` messages/notifications/modal/auth-session code, native alpha scripts/package verification, and Library Recovery226/232 notes.
- GitHub branch search found Recovery299 as latest numbered Kinfolk Social checkpoint before this work. Comparison against Recovery298: six commits ahead, zero behind; only `kinfolk-social/` changed.
- Vercel's Recovery299 preview `dpl_2sjxZS64z1ePnsDCTDCHqHqWAqwm` was READY at `47e46598`. READY is not real functional QA.
- GitHub commit status lookup for Recovery299 showed Vercel success but no verified GitHub Actions run from the available PR-scoped workflow-run lookup.

## Defect and application fix
- The original `openMessages()` and `openDm()` read `state.user.id` at multiple points separated by asynchronous Supabase requests. A delayed request could display the prior account's DM/inbox data after switching accounts, or replace a newer conversation/modal. The old DM form also read the current account ID at send time, rather than binding to the account that opened it.
- `1a952092c0e97c58ef877d443aa8f83074d94e2e`: capture auth epoch, initiating user ID and monotonically increasing message request; reject stale responses and stale forms; filter fetched messages defensively to the captured account and conversation; bind writes to the captured sender; reject stale send completions; invalidate pending message renders when any modal is opened/closed; prevent duplicate in-flight form submissions.
- `21d966ccf71bd2693034b6cf2a85a04668375843`: eight source-backed Node regression cases covering stale account reads, peer switching, modal close, overbroad backend rows, stale send form, in-flight send completion, and inbox isolation.
- `a049662b6c7209dc13215f5e4ac7839e38d91ab1`: add `alpha:messages:source:test` to native package scripts and append to `alpha:verify`.
- `f18a773eff26e687284fab160645b8f6682b060d`: README checkpoint.

## Verification evidence
- Re-fetched exact committed `index.html` blob `628ff6adb928bfe32b1b4e235185f4acc7b1f538` and Node regression blob `7b048602da85a8ee7b4a81da97ba14ae14df60cd`.
- Executed **9/9 source-backed synthetic V8 behavioral scenarios** against the actual committed DM/inbox and modal functions. Scenarios: stale-account DM, competing peer requests, close-modal race, overbroad DM rows, stale form submission, captured-sender/stale send completion, stale inbox, overbroad inbox, and competing modal. The Node test file passed syntax parsing after stripping Node imports and replacing `import.meta` for script-mode parsing.
- The eight committed Node test cases were **not run with Node or GitHub Actions** in this run. No actual Supabase message requests or physical-device tests were performed.
- Vercel nonproduction deployment `dpl_NZFKQzn8R3DTaVcDJAs1SEfLyWT1` was READY at code/test integration commit `a049662b`: https://kinfolk-social-demo-gaqxds6bx-alstoda59-9779.vercel.app/ . Later README/report commits are not confirmed deployed.

## Read-only isolated Supabase inspection
- `Kinfolk Social Alpha Test` project is present and ACTIVE_HEALTHY, distinct from the shared live Kinfolk project. No project, organization, billing, schema, auth or data mutations were made.
- Read-only `list_tables` on isolated `public` showed **14 tables, all RLS-enabled**, with zero rows reported in the table summary. Messaging policies exist: participant-only SELECT, sender/friend/contact-limited INSERT, recipient-only mark-read UPDATE. Notifications policies restrict SELECT/UPDATE to recipients. These are **policy definitions, not a successful two-account RLS test**.
- Compared table references in the committed main `index.html` with isolated public schema. **13 referenced tables absent**: `album_photos`, `group_conversations`, `group_members`, `group_messages`, `kinfolk_channel_subscriptions`, `kinfolk_pages`, `kinfolk_playlist_items`, `kinfolk_playlists`, `kinfolk_stories`, `kinfolk_video_reactions`, `kinfolk_videos`, `media_comments`, `photo_albums`. Additional phase modules may reference more tables. This blocks full alpha feature testing on the isolated backend.
- Owner confirmation still required before selecting an organization for new resources or incurring any nonzero project cost. Do not modify the shared live project. No isolated schema migration was applied in this run.

## Remaining launch blockers
- Execute current full Node/GitHub Actions CI and repair any failures without weakening security checks.
- Review and complete the isolated alpha schema safely, then use synthetic adult/teen accounts for real email confirmation, login/logout/session restoration, uploads/posts/comments, messages/notifications and two-account RLS.
- Rebuild current Android APK/iOS Simulator app, verify Capacitor deep links and safe areas, then perform physical Android/iPhone QA. Historical Recovery226 debug/Simulator builds are not current or signed releases.
- Production aliases, shared live Supabase, Kinfolksworld, paid resources and store submissions remain untouched. **Not launch ready.**
