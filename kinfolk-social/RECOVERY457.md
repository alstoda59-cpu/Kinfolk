# Recovery457 | Stale authentication cleanup UI isolation

Date: 2026-11-04. Main Kinfolk Social only. Baseline Recovery456 commit 4e76b49c8d5c4d2ac908435f58739b5ff10f3a67.

The Recovery456 cleanup checked exact token before signout, but cleared the private interface *before* checking the current token. A delayed unconfirmed-session callback could therefore erase a newer confirmed session's interface. The Recovery457 handler first reads the active session; if a different or confirmed session is active, the stale rejection returns without clearing UI or signing out. Matching rejected sessions clear UI and sign out locally. Missing sessions clear UI; unreadable sessions fail closed. Regression covers six synthetic scenarios in tests/recovery457-stale-cleanup-ui.test.cjs.

Commits: application 5698852e7ec4ca5fbe09d69e4e11dff22f815e1f. No CI success or native/backend tests claimed. The isolated Supabase organization and cost approval, real email confirmation and two-account RLS, private media, native builds and device QA remain release blockers. No live Supabase, production, Kinfolksworld or store changes.
