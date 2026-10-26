# Kinfolk Social Recovery246 | isolated alpha backend security baseline

Date: 2026-10-26. Main app only. No production/Kinfolksworld/live Supabase changes.

## Verified nonproduction backend
- Supabase project: Kinfolk Social Alpha Test, ID `viantpfagtbgyyzavmtv`, organization Shadowdono, region us-east-1.
- Project creation cost quote: $0/month. Separate project ACTIVE_HEALTHY.
- Applied migration `isolated_alpha_blocks_and_reports_rls` **only** to this project.
- `public.blocks`: owner-scoped SELECT/INSERT/DELETE, self-block CHECK, unique pair, RLS enabled, no anon access.
- `public.kinfolk_reports`: authenticated INSERT only, reporter must match auth.uid(), allowed report types, max 700 chars, RLS enabled, no anon access or authenticated SELECT.
- Post-migration SQL verified both tables have rowsecurity=true, and all four named policies exist. list_tables verified two tables, zero rows.
- No synthetic users created yet; no real auth, report submission, two-account RLS or device QA verified.

## Next
Build isolated schema compatible with existing app, configure auth email redirect, use synthetic test accounts and test RLS from user JWTs. Do not put service-role keys in public repo. Never connect an installable alpha to the shared live backend.
