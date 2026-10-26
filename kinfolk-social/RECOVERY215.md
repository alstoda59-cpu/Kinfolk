# Kinfolk Social Recovery215

Scope: full main Kinfolk Social, excluding Kinfolksworld. Isolated development branch `kinfolk-social/recovery207-signup-navigation-guard`.

## Fix
Phase95 login now rechecks the connected Login screen after the asynchronous active-account lookup, immediately before saving Stay Logged In and adopting the token. This closes a navigation race in which the user could switch to Create Account while that lookup was pending.

## Commits
- Application: `3af7ec6923788af3c67a1c4ed4b569e1774d7609`
- Static regression test: `b10b9230df7718641284b2f4069941d22983ac27`
- CI workflow: `73cf60ab4fda417c1b9e4e8b4d1382cd2743fbc9`

## Verification
- Source change and regression test committed. Native Node CI and browser tests not verified in this run.
- Latest previously verified READY preview is Recovery214 predecessor `dpl_HjbdznVvJpy3kZUY2tcFCnc4zbMc`, commit `860b2952fe4f9df1a0822768adea25ce8249cbcb`, not containing this fix.
- Recovery214 GitHub Vercel status returned build-rate-limit failure. No Recovery215 READY preview, real Supabase authentication, or physical Android/iPhone testing confirmed.

## Next
Confirm Node CI, then test login/signup/logout/session restoration on a dedicated owner-authorized nonproduction backend. Verify Android/iPhone Home/Reels, settings/music, uploads, messages, RLS and native packaging. Do not touch production, Kinfolksworld, or shared live Supabase.
