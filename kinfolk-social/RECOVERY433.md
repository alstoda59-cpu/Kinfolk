# Recovery433 | Isolated backend RLS inventory and repeatable gate

Date: 2026-11-03. FULL MAIN Kinfolk Social only. Based on Recovery432 final head e1f7f018c9c2b15b6cacf26724ef48003bf7bd23. Isolated branch, unmerged.

## Verified source checkpoint
Recovery432 exact-head source workflow 41591754278 completed SUCCESS. Draft PR #129 remains open and unmerged. Earlier Recovery432 exact-head nonproduction Vercel READY was reported; this run did not independently repeat Vercel inspection. No native build/device proof inferred.

## Read-only isolated backend inspection
Queried ONLY existing isolated Kinfolk Social Alpha Test Supabase project viantpfagtbgyyzavmtv (ACTIVE_HEALTHY); explicitly did NOT query or change shared live project zojajuzmfjpvubzibzgg. At inspection: 0 Auth users, 27 public base tables, 85 public RLS policies, 3 storage buckets. All 27 public base tables had RLS enabled and at least one policy. Inspected specific policies for messages, profiles, posts, photo_albums, album_photos and kinfolk_safety_settings: policy definitions include authenticated role restrictions and owner/participant/block checks as applicable. This is **metadata evidence only**, NOT a proof that policies enforce isolation against two real authenticated synthetic accounts.

## Committed reusable diagnostic
Added diagnostics/isolated-alpha-rls-readonly.sql with a nonmutating metadata gate for 17 high-priority tables and aggregate Auth-user/RLS counts. It is intentionally read-only and explicitly restricted to the isolated project. No migrations, Auth users, secrets, data writes, production aliases or stores were changed.

## Remaining blockers
Real signup and email confirmation require opt-in synthetic accounts and controlled test inboxes; no Auth users exist yet. Two-account RLS, media storage, messaging, device deep links, backend-connected Android/iOS packaging, and physical-device QA remain unverified. Metadata checks cannot replace those tests. This branch does not assert launch readiness.
