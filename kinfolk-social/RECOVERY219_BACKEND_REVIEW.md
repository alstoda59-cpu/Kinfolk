# Recovery219 backend privacy review (no changes applied)

## Read-only findings, 2026-10-25
Verified public schema and Postgres catalog for the existing Supabase project, without reading user rows or mutating auth/data/schema.

- `public.profiles.username` already has an exact unique constraint **and** a `lower(username)` unique index. Do not add duplicate indexes.
- `kinfolk_private.handle_new_user()` already enforces signup birthday between 13 and 99, creates a profile, user settings and safety row. On a username conflict it currently substitutes a generated fallback username. The UI must **not promise** that the requested username is reserved until the actual resulting profile is read.
- `kinfolk_private.apply_signup_profile_style()` already consumes `profile_display_name`, `profile_bio` and `profile_private` from signup metadata to populate the new profile.
- The first-account signup trigger supports optional `signup_gender` values `Female`, `Male`, `Nonbinary`, `Prefer not to say`.
- `kinfolk_safety_settings` already has age enforcement triggers and user-owned RLS policies. Teen content/DM/discoverability and daily limit protections are enforced there.
- **Gap to review:** `profiles.is_private` can be changed independently of `kinfolk_safety_settings`. A teen starting private on the client does not prove a teen cannot later turn off private mode. The signup metadata and age remain user supplied and are **not trustworthy for authorization** by themselves.

## Owner-review backend hardening plan
1. On an isolated nonproduction database, test teenage profile privacy after signup **and after a direct authenticated profile update** (using only synthetic accounts).
2. If the owner approves policy that teen profiles are always private, implement a database-side write guard for `profiles.is_private` based on the authoritative, immutable `kinfolk_safety_settings.birth_date` row. Fail closed for unavailable birthdates according to owner-approved legacy-account policy. Be mindful that the auth signup trigger creates `profiles` before the safety row, and the style trigger updates it afterward.
3. Verify RLS ownership, sign-up trigger order, 13th/18th birthdays, direct RPC/table edits, and existing adult private/public setting. Keep user metadata out of permission decisions.
4. Validate that a requested, case-insensitively colliding username results in either an explicit in-app confirmation of a generated handle or a secure backend rejection strategy approved by the owner. Do not rely on anonymous `profiles` reads as an authoritative username availability check.
5. Only with explicit approval: stage, test, and review a migration on an owner-authorized **isolated nonproduction** database. No production changes from these notes.

**Status:** Review/draft only, not a migration or an applied backend fix. Existing shared live Supabase remains unchanged.
