# Recovery250 | Functional native alpha packaging gate

Date: 2026-10-27 (America/Los_Angeles). Scope: full main Kinfolk Social, `kinfolk-social/`, excluding Kinfolksworld.

## Starting point
- Based on `kinfolk-social/alpha-signup-password-guard-20261027` after Recovery249. Read Recovery247/249, native package scripts and isolated alpha backend SQL migration notes; checked Vercel previews and Library continuation notes.
- GitHub compare showed the base contains Recovery247 plus 71 later commits, with no commits behind Recovery247. Existing signup password fix, Reels, Channels, Home, themes and messaging code are preserved.
- The isolated backend has more than the early Recovery247 baseline: later committed notes document applied signup/profile and Home/posts/comments RLS migrations. Real Auth API and physical device E2E are still not verified.

## Implemented
- `native/scripts/alpha-backend-config.mjs`: added `requireFunctionalAlphaBackend` to reject offline CI packaging credentials even when offline packaging is explicitly enabled.
- `native/scripts/verify-functional-alpha.mjs`: new strict entrypoint; checks designated isolated backend first, then executes the existing complete native asset verifier.
- `native/package.json`: `alpha:verify:functional` is the functional-build static gate; the existing offline `alpha:verify` remains available for CI and now includes the new regression tests.
- `native/tests/alpha-functional-backend-gate.test.mjs`: five Node tests for allowed isolated config, offline stub rejection, live project/key rejection, foreign project/service-role rejection, and verifier wiring.
- This does not change the web app UI, production configuration, live Supabase, Kinfolksworld, or native release signing.

## Verification
- Local Node 22.16.0: 5/5 focused tests passed against a reconstructed local copy of the changed modules. This is not an exact-blob Node CI result.
- In-memory V8 checks executed the exact fetched GitHub `alpha-backend-config.mjs` blob `c59ad877de800a905993c56e23b377b422c86e10`: 6/6 checks passed (isolated allowed, offline/live/foreign/secret rejected, verifier wiring).
- Full GitHub Actions CI, `npm run alpha:verify:functional` on a generated package with isolated publishable key, actual Supabase signup/email/RLS tests, signed Android/iOS builds and physical device QA have **not** been verified.
- Vercel READY only establishes a web preview build, not backend or device functionality.

## Release blockers
- Configure isolated Auth redirect/email, test two independent synthetic JWT users, complete Reels/Channels/stories/DM/storage dependencies, and verify teen/privacy RLS end to end.
- Run `cd kinfolk-social/native && npm ci && npm run sync && npm run alpha:verify:functional` with isolated project URL and publishable key supplied securely. The offline CI stub must not pass the functional gate.
- Produce Android/iPhone installable builds, run physical-device QA and signing/release checks. No production/store submission without owner approval.
