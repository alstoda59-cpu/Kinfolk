# Recovery237 | DM block account isolation and foreground mobile polling

Date: 2026-10-26. Scope: full MAIN Kinfolk Social app under `kinfolk-social/`, excluding Kinfolksworld.

## Verified starting checkpoint
- Continued from Recovery236 `kinfolk-social/recovery236-album-account-guard`, latest documentation commit `190b30c9ef1bf36507f1e70f976ac809943977f7`. No restart or replacement of existing app features.
- Reviewed Recovery236, README, validation.json, INTEGRATION.md, original Recovery133 Library continuation notes, Recovery142 security audit notes, GitHub Actions and Vercel deployments.
- Recovery236 preview `dpl_CWEZy71UeeFCtb5u3jdvrMEZmsUJ` was READY with `target:null`. Its GitHub Actions run `40360002984` was still in progress when inspected; no full CI success claim.
- No authorized nonproduction Supabase project exists yet. Shared live Supabase project `zojajuzmfjpvubzibzgg` was not modified.

## Changes
- New isolated branch: `kinfolk-social/recovery237-dm-block-account-isolation`.
- `kinfolk-phase107.js`: DM block button now reads the **current** form peer at activation instead of capturing a potentially stale peer when the form was first bound. Prevents blocking the wrong account if a DM form is reused for another conversation.
- Block request captures the original account ID, refuses self-block, and suppresses success/error UI after logout or an account switch. Existing duplicate-block behavior remains.
- Reduced legacy messaging form fallback polling from 120ms continuously to 2000ms only when the document is visible. MutationObserver remains for immediate DOM changes.
- `tests/recovery237-dm-block-account-isolation.test.cjs`: 8 Node regression tests for successful block, original account capture, success/error account-switch races, insert rejection, duplicate block, self-block, reused DM form, and foreground-only polling.

## Evidence
- The committed Phase107 source passed V8 parsing.
- All eight new test cases passed in a synthetic V8 adapter against the fetched committed source. This is not a Node CI or live backend result.
- Application commit: `aad5c1a347f7bec3a3f1ea0782b0eceeac9a04fa`.
- Test commit: `3b308250d0450b4153cd8219b8d1cd3b3edeab5b`.
- GitHub Actions run for test commit: `40369338490`, pending at inspection.
- Vercel preview from test commit: `dpl_5Ar3CHLz8V2P9VFUoNxsFb6eiMNo`, READY, `target:null`, URL `https://kinfolk-social-demo-hh6x2c2v5-alstoda59-9779.vercel.app/`. READY does not prove rendering, messaging or real auth.

## Blockers and next priority
- Real Supabase signup/login/logout/session restoration, two-account DM/block/privacy RLS, media and teen-safety backend testing still need a separate nonproduction Supabase project. Organization selection and any nonzero cost approval remain unresolved. Do not touch shared live Supabase.
- Android/iPhone physical-device QA, signed store packages, legal/content moderation/store compliance and native email callbacks remain unverified.
- Continue with account-isolated messaging/notifications, then test real two-account flows when isolated backend becomes available.
- Production deployment and aliases, Kinfolksworld, and shared live Supabase schema/data/auth/security remain unchanged. Do not merge or release without explicit approval.
