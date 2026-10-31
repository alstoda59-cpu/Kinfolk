# Recovery377 | Isolated album schema and privacy RLS migration

Date: 2026-10-31. Full MAIN Kinfolk Social, `kinfolk-social/` only. Kinfolksworld excluded.

## Starting evidence
- Continued from exact Recovery376 head `79cb9c587c368fa94a50899d822e60df8719f21e` and draft PR #73; no merge or redesign.
- Inspected Recovery376/375, Phase106 create/upload handler, native source gates, existing isolated alpha SQL baseline, Library prelaunch privacy audit, Vercel nonproduction deployments, and Supabase project/table/migration listings.
- Recovery376 inherited GitHub Actions SUCCESS at run 41234123576 (933 main Node tests, 69 offline native media tests); READY preview at `08a6499bcf745d799ca4fca4f12a2efeab1d736c`, not the Recovery376 final head.
- Isolated project `viantpfagtbgyyzavmtv`: 14 public tables RLS-enabled, no album tables, zero Auth users at last check; private `kinfolk-media` storage and owner-folder policies exist.

## Actual development
- Added `migrations/ALPHA_only_photo_albums_rls.sql` as an applied isolated-alpha migration targeting ONLY the existing isolated alpha project. It creates `photo_albums` and `album_photos` with UUID keys, bounded inputs, owner-album composite FK, owner-prefixed storage paths, private default visibility, authenticated-only CRUD, and row-level privacy.
- Public album visibility requires a public owner profile and no reciprocal block; private/teen albums remain owner-only. Linked public album media receives a narrow authenticated storage SELECT policy while `kinfolk-media` remains private. No shared/live schema touched.
- Added `tests/recovery377-isolated-album-rls.test.mjs` with seven static SQL contract checks and wired it into `native/package.json` offline media source gate. Static checks are not JWT or RLS enforcement proof.

## Performance follow-up
- Supabase performance advisor identified the composite `(album_id,owner_id)` foreign key as missing a covering index. Added `migrations/ALPHA_only_album_photo_fk_index.sql` to fix only that isolated-alpha table; other preexisting index advisories remain separate.

## Verification boundary
- CI and exact-head preview must be checked after commit. Applied the migration to the existing isolated Supabase Alpha Test project only (migration `20261031202926 alpha_photo_albums_owner_visibility_rls_recovery377`); no new project or charge was created. Read-only verification confirms 16/16 public tables with RLS, nine new album/storage policies, private `kinfolk-media`, zero Auth users and zero album rows. Security advisor returned zero findings. SQL impersonation-based test execution was blocked by safety controls; real two-account RLS remains unverified.
- Two-account real JWT RLS, email delivery, backend uploads/messaging, signed installable APK/IPA and physical-device QA are unverified.
- No shared live Supabase, production Vercel deployment/aliases, Kinfolksworld, paid resources or store submissions changed. **Not launch-ready.**
