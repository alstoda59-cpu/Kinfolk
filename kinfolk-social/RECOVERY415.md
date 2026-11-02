# Recovery415 | Isolated Stories schema, 24-hour expiry and media privacy

Date: 2026-11-02 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only; Kinfolksworld excluded.

## Verified starting checkpoint
- Continued from Recovery414 final commit `7abde8e11c9669393635871e9fe3d09fd5aeecfa`, draft PR #111. Reviewed Recovery414 report, actual `index.html` story handlers, existing Home/Channels/Albums SQL, native workflow, Library prelaunch/continuation notes and Vercel deployments.
- Recovery414 final-head source CI run [41429258587](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41429258587) completed **success**, including synthetic Node and browser regressions.
- Recovery414 nonproduction preview READY at `e2329774`, not the final documentation commit.

## Actual development
- Created isolated branch `kinfolk-social/recovery415-isolated-stories-rls-20261102` from Recovery414.
- `81be9a5062640c978f2847fe9ec777a19cc763aa`: added `migrations/ALPHA_only_stories_rls.sql`. It supplies missing `kinfolk_stories` with the exact `id,owner_id,body,media_url,created_at,expires_at` fields used by the effective app. Stories expire 24 hours after server creation. Owner-path checks prevent linking someone else's storage path; private-profile, block and expiry RLS restrict viewing. Only the owner can insert/delete. Column-specific INSERT grants prevent client-controlled creation/expiry timestamps. An authenticated storage SELECT policy permits signed reads only for an unexpired visible story, keeping the media bucket private.
- Applied the migration **only** to the pre-existing nonproduction `Kinfolk Social Alpha Test` Supabase project `viantpfagtbgyyzavmtv`, using the committed SQL. Result: `success:true`. Shared/live `zojajuzmfjpvubzibzgg` was not accessed or changed.
- `c97ca140b8b0b43b7b2fab1219da12bd44c90c90` and `d6e3ee5dde41c4daa68921ecc9ff4e665b28c777`: eight synthetic/static Stories schema/privacy regression tests, with corrected regex assertions.
- `b37d8eaaf592f5e7552e7fc658cd6065c2d2d596`: integrated Stories contract tests into the existing Android/iOS native media source-test gate.
- `0489ea4cd38fdd47086ba30d515767b76277d097`: enabled the isolated Recovery415 branch in the offline-only Android debug APK/iOS Simulator compilation workflow. Native CI still uses an intentionally unreachable test backend, never production credentials.
- Draft PR [#112](https://github.com/alstoda59-cpu/Kinfolk/pull/112) targets Recovery414; unmerged.

## Read-only post-migration verification
- `kinfolk_stories` has 6 columns, 3 authenticated RLS policies and RLS enabled. The linked private media storage has 1 additional authenticated story read policy. `kinfolk-media` remains `public=false`.
- `anon` has no SELECT privilege. Authenticated users cannot INSERT `created_at` or `expires_at` and cannot UPDATE stories. Owner_id is writable only subject to owner-equality INSERT RLS.
- Supabase security advisor returned **0 findings**.
- Isolated backend still has **0 Auth users and 0 Stories records**. These are real database schema/privilege checks, **not** authenticated two-account RLS tests or successful app uploads.
- Nonproduction Vercel preview was READY at `b37d8eaa` containing migration/test/native-script changes. READY is not end-to-end proof.
- Recovery415 source CI and native compilation were pending at initial report writing; inspect the final-head Actions results before reporting success.

## Remaining blockers
- Real synthetic signup/email confirmation, login/logout/session restoration and two-account private/teen/block/expiry RLS enforcement remain unverified.
- Backend-connected Stories, Home, Channels, media, messages and notifications remain untested. Server-side expired-story row/object cleanup is not implemented; read RLS hides expired Stories but does not delete their objects.
- Native packages are offline-only. Physical Android/iPhone QA, signed iPhone IPA, device callback allowlists and store readiness remain unverified.
- No new paid resources, production deployment/aliases, shared live Supabase schema/data/auth/security, Kinfolksworld files or store submissions were changed.

**Status:** Missing Stories backend implemented and deployed to existing isolated alpha project, with verified RLS and private media policies. Complete installable Android/iPhone alpha is **not launch-ready**.
