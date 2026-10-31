# Recovery379 | Album upload session activation isolation

Date: 2026-10-31. Scope: FULL MAIN Kinfolk Social in `kinfolk-social/`; Kinfolksworld excluded.

## Verified starting point
Continued from Recovery378 exact final commit `cf66ce98e7a56d414340b5ae1c08b2272f497b78` and draft PR #75. Reviewed Recovery378, effective Phase106 album create/upload/viewer, Recovery373/376/378 synthetic tests, native source verification, Library prelaunch audit, isolated Supabase migrations, and nonproduction Vercel preview history. No restart or redesign.

## Implemented
- Bind Create Album and Add Photos to the initiating authentication activation epoch, not merely the same user ID and form. An old operation cannot continue storage or database writes, show stale success, or unlock a new session's editor after logout/login or same-account reactivation.
- Carry the epoch through album ownership lookup, upload and photo insert. Clean up media if the activation changes before insert; preserve potentially linked media if an insert was already attempted.
- Refresh successful Add Photos using the effective `window.viewAlbum` guarded viewer, rather than relying on the legacy global function binding.
- Add six synthetic source-executed epoch regression cases, extend the album-create acknowledgment fixture with one same-user reactivation case, and include the new suite in Android/iPhone offline media source checks.

## Evidence and limits
Changes are isolated to this branch and draft PR; GitHub CI and preview verification must be checked separately after the commit. No production or shared live Supabase schema/data/auth/security, production Vercel deployment or aliases, Kinfolksworld, paid resources, or store submissions were modified. The isolated Supabase Alpha Test is existing, but real email delivery, two-user JWT/RLS enforcement, backend-connected media and messaging, signed installable APK/IPA and physical Android/iPhone QA remain unverified. **Not launch-ready.**
