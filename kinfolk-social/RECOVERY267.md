# Recovery267 | Native script attribute integrity hardening

Date: 2026-10-27 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social `kinfolk-social/` only, excluding Kinfolksworld.

## Baseline inspected
- Latest Recovery266 branch/report and exact helper/test source, native package scripts, app `index.html`, native README, Recovery226 and Recovery232 Library notes, GitHub commit history/comparison/status, and Vercel nonproduction deployment metadata.
- Recovery266 branch is 5 commits ahead and 0 behind Recovery265; its latest source/test Vercel preview was READY. The Recovery266 helper used `/\bsrc\s*=/` and `/\bsrc\s*=...` on whole script tags, which can confuse `data-src` with the actual `src` attribute and fail to reject a disguised remote startup dependency.

## Changes
- `12932cdbc2ead55effe7476401321c2404892804`: parse complete script opening tags with quoted `>` support; parse actual attribute names, ignore `data-src`, reject duplicate or unquoted real `src` attributes. Retain local-only JavaScript path validation and file existence checks.
- `39b6c4006a3bf6a4d14ad87381e991576d31e14e`: add five Node regression cases (10 total): remote `src` hidden behind `data-src`, `data-src` alone, duplicate `src`, quoted angle brackets/embedded `src` text, and missing `src` value.
- No main app HTML/feature/UI, production, Supabase schema/auth/data, Kinfolksworld, or store release changed.

## Verification
- Node.js v22.16.0 `node --test`: **10/10 passed** locally against files matching the exact committed GitHub blobs. GitHub helper blob `94d621a2432c150b577ec2156a11404bb90583c1`, 1,688 chars, FNV-1a `cafeab3d`; GitHub test blob `a252df8ec4b9e6ecb93c18e45d005891e3460b77`, 3,078 chars, FNV-1a `8e3d6742`. Local Node file fingerprints match both.
- Exact branch main `index.html` checked using equivalent attribute parsing: 29 script opening tags, **24 external script sources** (23 local Kinfolk modules and 1 remote Supabase SDK). The native packager replaces the remote SDK with a bundled local script; this check is not a full native package run.
- Vercel nonproduction deployment `dpl_6WM9mXYQc4UvKHvrtKeawZ75y8oh` is **READY** for exact test commit `39b6c400`, target null, URL https://kinfolk-social-demo-mkxo8wt2h-alstoda59-9779.vercel.app/ . This only confirms preview deployment, not actual app functions.
- GitHub combined status shows Vercel success only. PR-filtered workflow lookup returned no runs, so GitHub Actions CI is **unverified**, not failed or passed.

## Blockers and next
- Current-branch full `npm run prepare:web && npm run alpha:verify`, Android debug APK, iOS Simulator app, physical-device tests and functional isolated-backend builds are not verified.
- Real synthetic-account signup/email delivery/login/logout/session restoration, two-user RLS, Home/Reels/Channels, profile music/themes, uploads/posts/comments, messaging/notifications and teen privacy E2E remain unverified.
- Isolated Supabase project exists per earlier Recovery reports. No project, billable resource, backend auth/security/schema/data, production alias, or store submission created or modified.
- Next: execute full isolated native packaging with approved publishable config, rebuild current-branch Android/iOS test artifacts, then run real synthetic-account E2E and physical-device QA before any launch claim.
