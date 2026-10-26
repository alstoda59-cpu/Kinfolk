# Recovery236 | Album upload account isolation and mobile efficiency

Date: 2026-10-26. Scope: full MAIN Kinfolk Social app under `kinfolk-social/`, excluding Kinfolksworld.

## Starting point
Continued from Recovery235 branch `kinfolk-social/recovery235-profile-mobile-polling-cleanup`. Reviewed Recovery235/234 notes, main source README, INTEGRATION.md, validation.json, Recovery133 Library continuation notes, latest Vercel READY preview and Phase106/Phase100 album/profile upload code. Recovery235 preview `dpl_Hq6JUVCJefqd3raiEHkhsswweHKt` was READY with target null. A READY preview is not real-backend or device verification.

## Changes
- Branch: `kinfolk-social/recovery236-album-account-guard`.
- `kinfolk-phase106.js` now captures the originating account ID and form for album creation and adding photos. It checks both before and after asynchronous operations, preventing an upload initiated by one account from inserting photo ownership under a different account after logout/account switching.
- When upload succeeds but the album-photo insert fails or the account changes, best-effort cleanup removes uncommitted storage media and logs returned or thrown removal errors. Media already linked to a database record is not deleted.
- Album UI messages, progress and button reset are limited to the originating account and form. Existing dark UI, albums and all other features remain.
- Reduced legacy album form rebind polling from 120ms always to 2 seconds while foregrounded. MutationObserver still provides immediate rebind on DOM changes.
- `tests/recovery236-album-account-guard.test.cjs` adds five synthetic Node regression cases for account isolation, cleanup and foreground polling.

## Verification and limitations
- The patched actual source passed V8 parsing and four in-memory synthetic upload scenarios before commit (normal, switch after upload, switch after insert, rejected insert). The new test source passed V8 parsing.
- GitHub Actions full source checks and preview deployment should be checked after commit. No claim of full CI success until verified.
- No real Supabase users, RLS, native physical devices or signed app-store packages were tested.
- Separate nonproduction Supabase project still requires owner selection of organization and approval of any nonzero quoted cost.
- Do not merge or promote to production. Shared live Supabase project, production aliases and Kinfolksworld remain untouched.
