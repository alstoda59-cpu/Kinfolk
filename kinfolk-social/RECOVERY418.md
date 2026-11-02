# Recovery418 | Private threaded media comments and mobile session-safe saves

Date: 2026-11-02 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social under `kinfolk-social/` only. Kinfolksworld and all production systems excluded.

## Starting checkpoint
- Continued from Recovery417 draft PR #114, head `f8c35dc80241eb1f6528de3c45d8a4bf44f4d812`. Reviewed newest recovery branches, Recovery415/416 notes, effective `index.html`, native package/test gates, isolated migrations, Library Recovery226/232 notes, GitHub Actions, Vercel nonproduction deployments and existing Alpha Test Supabase tables.
- Recovery417 source CI run 41454874568 succeeded. Recovery417 Android debug APK succeeded; iOS Simulator job in run 41454863997 was **cancelled**, not a pass.
- The existing isolated Alpha Test backend lacked `public.media_comments`, even though both Channels video and Photos UI query and insert it.

## Substantive code and schema
- New isolated branch: `kinfolk-social/recovery418-media-comment-privacy-20261102`, based on Recovery417.
- `3d6d04bfb2fb6c67e5a44c8c46e472b4853a79ea`: `migrations/ALPHA_only_media_comments_rls.sql`. Added threaded photo/video comments, same-target parent composite FK, body limit, owner-only INSERT/DELETE, authenticated-only SELECT, private/teen-profile and reciprocal block visibility checks, and immutable client-side timestamps. SECURITY DEFINER target/parent checks explicitly enforce visibility without self-referential RLS recursion.
- **Applied that committed migration only** to existing `Kinfolk Social Alpha Test` project `viantpfagtbgyyzavmtv`; migration returned `success:true`. Never touched shared live `zojajuzmfjpvubzibzgg`.
- `a11989f09cb5787fee93c985c9c3681842335720`: corrected effective `index.html` media comment modal. Stale account/session/view/modal loads cannot open or replace another viewer. Reply targets must belong to the loaded modal. Submits lock before network dispatch and require exactly one matching saved row; uncertain responses remain locked, confirmed zero-row responses may retry.
- `701bc439d07d3e6488dcac43b16b89f67f6de7be`: 12 synthetic source-executed/static media-comment tests covering video/photo, duplicate sends, uncertain/zero-row responses, forged parents, account switch, same-user relogin, modal replacement and migration contract.
- `dd0c5e5d38e71fc51a8ea343b46b79dfc1d98586`: included new tests in native media verification.
- `c9994f319825b955a7e8db153b60aa33af934781`: enabled offline-only Android/iOS compilation for this isolated branch.
- `53d3a1fe93e85bd0594f8e3d1b4f6035dd4a7cc7`: repaired the older Recovery346 test's source-extraction boundary after the media-comment handler was replaced. The earlier source CI failed only that obsolete fixture (1,133/1,134 tests passed). Its replacement run passed the Node regression step; browser checks were pending when this note was written.
- Draft PR #115 targets Recovery417 and remains unmerged.

## Actual verification, separated by evidence level
- Real isolated database: `public.media_comments` exists, RLS enabled, three policies, no anonymous SELECT, no authenticated INSERT grant on `created_at`; security advisor **zero findings**.
- SQL planning as an authenticated role for SELECT and INSERT succeeded without recursive RLS failure. Synthetic nonexistent video/photo/parent visibility probes all returned false. This is SQL verification, **not** a real two-account Auth/RLS test.
- The isolated backend still has **zero Auth users and zero media comment rows**. No synthetic email-confirmed user sessions or backend-connected media comments have been exercised.
- Source CI: initial run 41464077398 failed the legacy Recovery346 extraction fixture; corrected in 53d3a1fe. Replacement source CI run 41464311758 passed Node regressions; full workflow was in progress at report creation. Check later final-head results before claiming CI success.
- Native build: run 41464311733 was queued at report creation. The workflow deliberately packages against an unreachable CI-only backend, not the isolated Supabase project. A compiled APK/Simulator package is not proof of real mobile login.
- Vercel: nonproduction READY preview at `dd0c5e5d` (`https://kinfolk-social-demo-q7if42w2k-alstoda59-9779.vercel.app/`). The final source/test/documentation head is **not** confirmed READY; Vercel free-tier rate limits may apply.

## Unresolved alpha gates
- Real synthetic signup/email confirmation, login/logout/session restoration and two-account RLS tests; real backend-connected media comments, posts, Channels, messaging, notifications, uploads and teen safety; physical Android/iPhone QA and signed physical-iPhone IPA.
- Polymorphic target deletion can leave inaccessible orphan media-comment rows. Target visibility RLS hides them, but server-side cleanup is not yet implemented.
- No shared live Supabase schema/data/auth/security, production Vercel deployment or aliases, Kinfolksworld files, nonzero paid resources or app-store submissions were changed.

**Status:** Media-comment backend deployed and privacy-checked in the existing isolated project; substantive mobile comment fixes and synthetic regressions committed. Full backend-connected installable Android/iPhone alpha is **not launch-ready**.
