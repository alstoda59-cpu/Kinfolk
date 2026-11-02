# Recovery407 | Isolated group-chat schema and private RLS

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, `kinfolk-social/`; Kinfolksworld excluded.

## Starting checkpoint
- Continued directly from Recovery406 draft PR #103, commit `d151f1aa120d8305586ae182169ab0c2f4bd32a9`, on new isolated branch `kinfolk-social/recovery407-isolated-group-rls-20261101`.
- Inspected Recovery406 report and GitHub branch/PR/CI, effective Group Chats handlers, native verification scripts and build workflow, prior Library recovery notes, nonproduction Vercel deployments, and existing Supabase Alpha Test schema.
- Recovery406 CI job was completed successfully. The exact Recovery406 Vercel preview was READY at `d151f1aa`; neither is backend or physical-device proof.

## Actual backend implementation
- `5ef1ae42bffdb0d72010635ed1bbb421df75a4ad`: new `migrations/ALPHA_only_group_chats_rls.sql` creates `group_conversations`, `group_members`, and `group_messages` with UUID foreign keys, text-length constraints, timestamps, indexes, and private RLS.
- RLS permits only the owner or invited members to read groups and messages. Only the authenticated owner can create/edit/delete groups. Only the owner can invite **accepted friends**, subject to block and recipient DM settings. A member can leave; an owner can remove a member. Message INSERT requires the authenticated sender to be a participant, and blocked senders are filtered from reads.
- Security-definer membership helpers use `auth.uid()` internally and a locked search path to avoid recursive RLS and caller-provided identity impersonation. No anonymous table grants; no public storage or group visibility.
- **Applied successfully** with migration name `recovery407_alpha_only_group_chats_rls` to existing **isolated** Kinfolk Social Alpha Test project `viantpfagtbgyyzavmtv` only. The shared live project `zojajuzmfjpvubzibzgg` was not touched.
- Post-apply read-only inspection: all three tables exist with RLS enabled and zero rows; ten authenticated policies; zero anonymous SELECT privileges; no security-advisor findings. There are still zero Auth users. This is actual schema/policy deployment, **not** authenticated two-account RLS proof.

## Source and native regression
- `41b6d005f76219b99b3402c1f604b126eaba8efd` adds eight static security-contract tests, corrected in `55be8751af168188a45de1538a5a0cd40ac46ed7`.
- `24f5bf53c80ef938cdc0a04488e879f427d7036d` includes them in Android/iOS `alpha:messages:source:test`.
- `ab5abd8c0072195028ff6e768f1bf8cffb490041` opts this isolated branch into the existing **offline-only** native build workflow. Its CI backend URL is deliberately unreachable and its package key cannot authenticate; native artifacts cannot prove live functionality.
- Draft/unmerged PR #104: https://github.com/alstoda59-cpu/Kinfolk/pull/104
- At report creation, source CI run https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41383118265 and native compile run https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41383112309 were still running. Do not report them as successful without checking final conclusions.
- Existing READY nonproduction preview at application/test commit `24f5bf53`: https://kinfolk-social-demo-9il9n7y53-alstoda59-9779.vercel.app/ . The later workflow-only final commit `ab5abd8c` is not yet verified as deployed.

## Remaining acceptance blockers
1. Create **synthetic** adult and teen accounts using the real isolated Auth signup/email flow, then verify confirmation, login/logout, restored sessions, and two-account positive/negative RLS against all three group tables and the rest of the app.
2. Exercise backend-connected Group Chats, Home/Reels/Channels, profiles/themes/music, media/posts/comments, notifications, privacy and teen protections.
3. Confirm final-head source CI, offline Android APK and iOS Simulator compilation, inspect artifacts, and perform physical Android/iPhone installation/interaction QA. iOS Simulator .app is not a signed physical iPhone IPA.
4. No production merge, shared live schema/data/Auth/security, Kinfolksworld, production alias, paid project, store submission, or release authorization was performed.

**Status:** Backend group schema/RLS deployed only to isolated alpha, with policy metadata inspected. Full Android/iPhone alpha and launch readiness remain unproven.
