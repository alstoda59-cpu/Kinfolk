# Kinfolk Social Recovery229 | account-isolated profile wallpaper

Date: 2026-10-26 (America/Los_Angeles). Scope: **full main Kinfolk Social app** only, excluding Kinfolksworld.

## Baseline and safety

- Continued from isolated `kinfolk-social/recovery228-teen-settings-account-guard` after inspecting its README, INTEGRATION.md, validation.json, RECOVERY228.md, RECOVERY227.md, Settings implementation, and previous tests.
- Reviewed Library Recovery133/Recovery226 notes and Vercel deployment history. Shared Supabase project `zojajuzmfjpvubzibzgg` lists **zero development branches**; no real backend writes/tests authorized.
- No merge, production deployment, production alias, live database mutation, real account action, or store submission.

## Application repair

- Commit `05ee64764c284c484c0a4fed47617776aceebba0` updates the existing `kinfolk-phase76.js` wallpaper refresh lifecycle.
- The profile wallpaper fetch now records the active account ID and a monotonically increasing request number. A delayed response from a prior account or older refresh cannot overwrite the active account's wallpaper.
- Signing out clears the wallpaper layer and cache without waiting for the backend. The cache now includes account ID, URL, fit, dimming and autoplay, so changing wallpaper presentation without changing the URL still applies.
- No design changes, new features, or unrelated module rewrites.

## Regression evidence

- Commit `f885cd9fef65d0605ca89dc26ab463b961c3137f` adds five synthetic Node tests: account switch, out-of-order responses, wallpaper options, logout, and navigating away.
- Local isolated V8 compilation of the full updated Phase76 source passed. Three synthetic in-memory checks passed before commit (account switch, changed dimming, logout).
- Initial GitHub Actions source-check run `40292492493` **FAILED**: 154 of 155 tests passed, including all five new tests. The one failure was an existing Recovery228 fixture that searched for an exact wallpaper cache declaration changed by this fix.
- Commit `c9d8ae3bc9f9fb3da518c12b057fefc0fc920cea` updates that existing test's extraction marker without weakening its settings assertions. New source-check run `40292617249` was **in progress at documentation time**. Check final result before claiming a full pass.

## Isolated preview

- Vercel deployment `dpl_H1b5Nuw52pWMJZj3q8T23BzEL6EH`, URL `https://kinfolk-social-demo-rimr9qml1-alstoda59-9779.vercel.app/`, source commit `c9d8ae3bc9f9fb3da518c12b057fefc0fc920cea`, state **READY**, `target: null`.
- READY does not establish rendered browser functionality, real Supabase behavior, email callbacks or physical Android/iPhone behavior.

## Remaining launch gates

1. Verify latest full GitHub Actions source checks and mocked browser suites; correct any failures.
2. Obtain owner-authorized isolated Supabase backend with synthetic test accounts; verify signup/login/logout, session restoration, teen/privacy RLS, media, messaging and notifications.
3. Verify native callback, actual Android/iPhone device flows, safe areas, keyboard, performance and store policy; no store submission without explicit approval.
4. Preserve all existing Kinfolk Social features and keep Kinfolksworld/production/shared live backend untouched.
