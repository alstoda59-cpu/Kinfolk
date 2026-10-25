# Kinfolk Social Recovery187 | login/signup submit ownership

Date: 2026-10-25. Scope: full MAIN Kinfolk Social. No Kinfolksworld, production or shared live Supabase changes.

## Inspected before editing
Recovery186 README, RECOVERY186.md, INTEGRATION.md, validation.json, Phase95 and Phase79 source, existing offline auth tests, Recovery182 auth workflow, Library Recovery133 continuation notes and latest Vercel preview history. Recovery186 remains the prior checkpoint.

## Bug and fix
Phase95 login form's onsubmit handler previously called preventDefault and stopPropagation **before** checking whether the form was still in login mode. When the UI reused the same form element for signup, this stale handler could swallow signup submissions. Also stopPropagation alone allowed later handlers on the same form to run during login. Now Phase95 checks mode first; it does not intercept signup. For login only, it prevents default and calls stopImmediatePropagation where supported (fallback stopPropagation), reducing competing-handler races. Existing signup capture-phase handler in Phase79 remains the owner of signup.

## Commits and verification
- App fix: a6a2592f79e834b4c61a3f5b8a03c3590424c7f7
- New test: df5d4700adcfee45f3685eee608861c9cc231459 (tests/recovery187-login-submit-isolation.test.cjs)
- Workflow update: 704fe6e2a8d67bbeaa665ca91f9aab6daf111a9e (Node 22 auth regression suite)
- Exact committed Phase95 source and new test were fetched and evaluated using an offline V8 adapter (fake Node test/assert/fs/vm), **3/3 new scenarios passed**: login interception, reused signup form, stopPropagation fallback. This is NOT a real Node/GitHub Actions run or browser/backend test. Existing tests were not re-run in this checkpoint.
- Preview dpl_CLB1pjPqFSphChK3SVR91yKpm8jL, https://kinfolk-social-demo-jj0ted9mp-alstoda59-9779.vercel.app/, READY target null at inspection, commit df5d4700adcfee45f3685eee608861c9cc231459; includes application fix and new test. A newer workflow deployment dpl_F8wskm7TuQW5iFNNbKedBew98U3Z was BUILDING at inspection; no claim of READY.
- No rendered browser signup/login, isolated real backend or physical-device test performed. A READY preview is not release evidence.

## Remaining blockers
Owner-authorized isolated Supabase project and synthetic accounts, real signup/login/logout/session restoration and email confirmation, browser Home/Reels/media/messaging tests, backend age/privacy/RLS checks, Android/iOS native build and device QA, content policy and store review. Do not merge or promote without approval.
