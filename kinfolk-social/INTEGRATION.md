# Kinfolk Social main app | Recovery132 integration

This branch is reserved for the **main Kinfolk Social app**, **not Kinfolksworld**. Do not edit `kinfolksworld/`.

## Source of truth handoff
- Verified source artifact: `Kinfolk_Social_Full_Preview_Recovery132_2026-10-24.zip` in the user's ChatGPT Library (ID `libfile_601b0eb37eec81919e1307715da1a86a`).
- SHA-256: `885f48d4db7163113570cb18444d4f9cddaedd0930845ac4f3331e95fd99f679`
- Recovery132 is SOURCE ONLY, not a Vercel deployment.
- Latest verified READY preview: Recovery129 deployment `dpl_9p5ymsbuxSbMMChtRobYYznRsxFD`, at https://kinfolk-social-demo-i0cjbv3r0-alstoda59-9779.vercel.app/
- Preserve all app content, dark mobile design, profiles, Reels/Channels, custom music/themes, posting, messaging and age protections.

## Next integration steps
1. Import and review contents of the source ZIP **into `kinfolk-social/` on this branch**, maintaining the existing `kinfolksworld/` untouched. Do not merge this branch or trigger an auto production release before review.
2. Scan for secrets and environment/configuration hazards before committing. Only publish client-safe anonymous keys; never add service-role keys, tokens, real user data or credentials to public GitHub. The repository is PUBLIC.
3. Resolve the failing simulated adult signup regression. Preserve 13+ and existing teen safety rules, and 5–12 character constraints for new passwords, not login to preexisting accounts.
4. Add deterministic smoke/regression tests for auth and navigation; run syntax and native `npm run prepare:web` checks.
5. Build Android/iOS with Capacitor, test real session restoration and WebView redirects in non-production.
6. Only create isolated Vercel previews. Never promote production or mutate the shared Supabase project without explicit authorization.

## Known results at Recovery132
- 22 local JavaScript modules checked in native packaging.
- Syntax checks passed.
- Mocked login, Home/Reels/Channels navigation, profile editing and under-13 checks passed.
- Adult-signup final mock assertion failed (`signupCalls` remained 0).
- Real backend, physical Android/iPhone, signing, and app-store reviews are not complete.

## Replit integration
No Kinfolk Replit app was found in the connected account. Do not create a new guest demo or separately generated replacement app. After this source tree is pushed to GitHub, use a Replit agent only if it can **import this existing GitHub branch** and preserve history; write fixes back as reviewed GitHub PRs.

**Important:** As of this commit, this branch contains the integration/handoff notes, not the source ZIP's application files.