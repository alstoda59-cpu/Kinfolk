# Recovery305 | Communities mobile navigation and discovery search

Based on Recovery304, full main Kinfolk Social only. No redesign.

## Committed
- 30c75831: replaced Communities directory module with escaped, searchable public-only discovery, account/request guard, accessible search input, and explicit backend-unavailable state.
- f89694ea: fixed mobile bottom navigation seven-column grid (was six columns for seven tabs), added overflow-safe labels and correct Communities label/icon.

## Evidence and blockers
GitHub Contents API returned both commits. No runtime tests, GitHub Actions, preview READY, real backend authentication/RLS, Android APK, iOS package or physical device QA verified for this branch. Communities create/join/leave/posts/moderation are not implemented yet. The isolated backend still requires schema/RLS validation; do not modify shared live Supabase or select a billable organization without approval. No production, store, Kinfolksworld or paid changes.
