# Kinfolk Social | isolated alpha account baseline (2026-10-26)

Scope: **Main Kinfolk Social only**. Supabase isolated project `viantpfagtbgyyzavmtv` (Kinfolk Social Alpha Test). No Kinfolksworld, shared live Supabase, production Vercel alias or store release changes.

## Code and actual changes
- The migration `migrations/ALPHA_only_signup_profile_baseline.sql` is committed in this branch.
- Applied Supabase migration `alpha_signup_profile_safety_baseline` **only to the isolated alpha database**, after an execution/rollback dry run.
- Six new public tables: `profiles`, `kinfolk_safety_settings`, `user_settings`, `kinfolk_user_preferences`, `notification_preferences`, `kinfolk_profile_extras`.
- Added auto-profile creation for declared-age 13–99 email signup metadata, case-insensitive unique usernames, account-owner settings RLS, and teen private-profile / immutable birthday / daily-limit guards.
- Old `blocks` and `kinfolk_reports` alpha security tables retained.
- No user credentials, real users, paid products or service-role keys created or copied.

## Verified
- The migration was accepted and recorded in `supabase_migrations.schema_migrations`.
- All 8 project public tables have RLS enabled. Expected new policy sets and three new triggers verified through catalog queries.
- Supabase security advisor returned zero findings for isolated project after migration.
- Transactional synthetic-fixture SQL passed: two `auth.users` inserts created the matching profile/settings records; teen birthdate/profile visibility mutation guards rejected unsafe changes; an adult could not read another synthetic user's safety/settings/preferences after setting a local JWT subject and `authenticated` role. All fixture inserts were **rolled back**, not retained.

## Still unverified (do not claim launch ready)
- Actual Supabase Auth API signup, email confirmation, password reset, session restoration and two independent signed-in JWTs.
- Attempt to `SET ROLE supabase_auth_admin` in the SQL test was denied by the database console, so the test did **not** verify the GoTrue service runtime.
- The signup trigger uses initial user-declared birthdate; it is **not independent age verification**. OAuth/phone signup without birthday metadata currently fails in this isolated alpha backend.
- Posts/feed/reels/channel/message/storage tables and RPCs are not yet mirrored into alpha; a full app run is expected to have missing backend dependencies.
- Private-profile access patterns and blocked-peer visibility across all app resources need complete RLS testing.
- The latest Vercel Git preview still uses the shared live backend: do **not** create synthetic accounts through it.
- Current native CI uses offline-only backend placeholder. No installable alpha connected to this isolated backend, physical Android/iPhone test, signed IPA/AAB, or app-store submission has been verified.

## Legacy loader diagnosis
Read-only shared Supabase check found `phase30-rebuild` is valid Base64 and gzip, but computed SHA-256 differs from the checksum hardcoded in the old October 10 loader. Do not disable hash checking or change the shared production record to address this archived deployment. Latest Recovery246 preview serves HTML with HTTP 200.

## Next
1. Configure an isolated HTTPS auth redirect and create two disposable test accounts using Supabase Auth API (not direct database fixtures). Verify email flow and the user-created trigger.
2. Complete alpha schema, storage bucket and RPC compatibility with current source without weakening RLS.
3. Package the full mobile app against the isolated URL/publishable key using existing `native/scripts/alpha-backend-config.mjs` tooling; do not embed shared live project or production credentials.
4. Run end-to-end Android/iPhone account, privacy, media and messaging checks. Keep release gate NO-GO until verified.
