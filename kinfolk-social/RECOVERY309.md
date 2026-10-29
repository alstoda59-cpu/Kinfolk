# Recovery309 | Community membership controls survive directory search

Date: 2026-10-28 America/Los_Angeles. Scope: full MAIN Kinfolk Social app in `kinfolk-social/`. Recovery308 is the base. Kinfolksworld excluded.

## Starting evidence
- Inspected Recovery308 report, Communities and membership modules, committed tests, native alpha packaging scripts, Library prelaunch audit, recent GitHub branches, Vercel previews, and GitHub Actions run 40817786544. That Recovery308 run's Node stage succeeded, but the full job was cancelled during browser dependencies, not a full pass.
- Read-only Supabase inventory: isolated project `viantpfagtbgyyzavmtv` ACTIVE_HEALTHY with 14 public tables, all with RLS enabled. Neither `kinfolk_communities` nor `kinfolk_community_members` exists. No SQL writes.

## Implementation
- `e45fa6903c375450517768bda6845aa9b559d8ed`: fix Community Join/Leave buttons disappearing when typing in directory search. Search re-renders cards via innerHTML; controls now reattach to visible cards from the account-scoped membership snapshot without redundant backend reads. In-flight join/leave state follows rebuilt cards and prevents duplicate writes. Late results are ignored after account/view change.
- `6dcdbcbd8dace1289db71d9121dc27572f2dfb7a`: add three synthetic Node regressions for search rebuild, pending write and account switch. Existing six membership tests remain.
- `e64c486cb9d1569d09f8abf042bf615e0243229f`: README continuation pointer.
- Draft PR #9 targets Recovery308, not main or production: https://github.com/alstoda59-cpu/Kinfolk/pull/9

## Verification categories
- **Source-backed synthetic V8 execution**: 4 scenarios, 15 assertions passed against the exact committed membership module: search controls restored, pending join survived rebuild without duplicate writes, stale account controls suppressed, missing membership table failed closed. This is mock-only, not real backend or device QA.
- **GitHub CI**: run 40823685176 pending at inspection: https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40823685176 . Do not claim full pass before it completes.
- **Nonproduction preview READY**: commit `e64c486c`, https://kinfolk-social-demo-35bmdd5av-alstoda59-9779.vercel.app/ . READY is deployment status only, not browser or backend functional proof.
- **Backend**: read-only schema inventory, not authenticated RLS enforcement. No synthetic-user signup/email, community membership writes or private-access tests.
- **Native**: existing Capacitor packaging untouched; no Android APK, iOS build or physical-device tests performed.

## Remaining blockers
- Missing isolated community tables and other app tables, verified real auth/email, two-account RLS, content moderation/teen safety, uploads, notifications, messages, current Android/iPhone builds and device QA.
- No shared live Supabase schema/data/auth/security, production deployments or aliases, Kinfolksworld, paid resources or app-store submissions modified. Do not declare launch-ready.
