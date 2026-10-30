# Recovery346 | Effective post-comment and reply session isolation

Date: 2026-10-30 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only, excluding Kinfolksworld. Base: Recovery345 final commit `06d1bd83834a29555f009af7f25b8bcc4c2bd975`. Draft PR #44, isolated branch `kinfolk-social/recovery346-post-comment-session-isolation-20261030`. No merge or production release.

## Starting verification

- Inspected Recovery345 report, README, active inline post/comment handlers, Recovery303 post/story tests, Recovery343 messaging isolation tests, native verification scripts, Library continuation notes, GitHub PRs/commits/Actions and Vercel previews.
- Recovery345 exact-head source CI [41081004057](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41081004057) was SUCCESS. Its native workflow [41080972216](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41080972216) concluded FAILURE: Android debug APK job succeeded but iOS Simulator job was cancelled. Do not report that workflow as a complete native pass.
- Read-only Vercel inspection found Recovery345 preview READY (not functional browser/auth verification). Read-only isolated Supabase project `viantpfagtbgyyzavmtv` remained ACTIVE_HEALTHY with 14 empty RLS-enabled public tables, including `comments`. RLS policy behavior has not been tested with two real synthetic accounts. No shared live project access or writes.

## Actual application change

- `bf1da97d6813145115d029f17780bcc04d240dce`: fixed the **effective** `window.addComment` and `window.setPostReply` override in `index.html`. The older earlier `addComment` definition was being overridden by this later handler.
- Capture initiating user, `kf129Epoch`, current view and exact comment form. Reject stale completions after logout, same-user relogin, account switching, navigation or form replacement. Never refresh or reopen the new account's comments from an old response.
- Bind reply parent to the same account/epoch/form, preventing a reply target selected before account switching from being silently reused. Cancel clears the current reply target.
- Lock a form during an in-flight write to suppress duplicate sends, restore its button on errors, preserve pinned sender identity, and reopen only the active post's comments after a successful current-session refresh.
- No visual redesign; post, reply, media, dark mobile layout and other existing features are preserved.

## Synthetic tests and packaging

- `0706d1494a3aecb193a26aaf1f15c0a0ede8085c`: added `tests/recovery346-post-comment-session-isolation.test.mjs` with 11 source-extracted VM scenarios for duplicate taps, pinned sender, failed retry, account switch, same-user relogin, replaced form, navigation, account switch during refresh, reply binding, reply cancellation and blank text.
- `8df1263d60913007fb3a198261cd032767975c30`: added regression to `native/package.json` alpha media source verification.
- `11c453f7ac4f7b14da2509c70ea71e9055b45e5a`: enabled isolated offline Android/iOS compilation workflow for Recovery346.
- Verify **exact final commit** source CI, native Android and iOS jobs, and Vercel READY separately before reporting success. All source tests are synthetic; native CI deliberately uses an unreachable packaging-only Supabase URL.

## Remaining gates and safety

- No real signup/email delivery, session restoration against isolated Supabase, two-user RLS or comment writes, missing Community/Channel/group backend schema, physical-device testing, signed iPhone IPA or production launch proof.
- No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld files, paid infrastructure or app stores were changed.
- Next: inspect CI and repair any test failures, then prioritize isolated-backend signup/email/RLS and Android/iPhone end-to-end QA when properly authorized and configured.
