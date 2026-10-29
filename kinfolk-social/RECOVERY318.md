# Recovery318 | Community auth lifecycle isolation

Date: 2026-10-29. Scope: full MAIN Kinfolk Social only. Continued from Recovery317; Kinfolksworld excluded.

## Inspection
Recovery317 source and report confirmed preview traffic blocked from the shared live Supabase backend; Recovery312 confirmed community create code already exists. Isolated community tables/RLS and functional native testing remain blocked pending environment approval.

## Committed
- `4dd98ab5`: community creation and directory reads now compare the auth lifecycle epoch in addition to account ID. This prevents delayed same-account logout/login responses from refreshing a new session's community screen or displaying stale creation results.
- `6de25b68`: two source-level regression assertions.
- `f6484cc7`: wire regression file into `alpha:communities:source:test`.

## Evidence
GitHub Contents API confirmed commits. New Node tests, complete GitHub Actions, Vercel preview, real isolated Supabase RLS, APK/iOS packaging and physical QA are **not yet verified** for Recovery318. This is not launch readiness.

## Next
Use an approved isolated backend to test real signup, community creation/membership and two-account RLS; implement community posts and moderation; build Android/iOS and run device QA. No production, shared live Supabase, Kinfolksworld, paid resource or store changes.
