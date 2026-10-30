# Recovery336 | Browser mock adopted-session email confirmation

Date: 2026-10-29 (America/Los_Angeles). Scope: full MAIN Kinfolk Social only, `kinfolk-social/`. Isolated continuation from Recovery335 commit `0100c8d9f2fa79d06e9ec8b5955151f9244317e1`. Draft PR #34 targets Recovery335, not production.

## Verified before editing
- Recovery335 exact-head source CI run [41009012028](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41009012028) **failed**. Its complete synthetic Node stage passed **667/667**; the Chromium browser stage stopped in `test_recovery129.py` at `login did not open main app`.
- Inspected full CI job log and existing Phase95 `adopt` logic. The browser mock's password-token endpoint included `email_confirmed_at`, but the mock user returned by `auth.setSession` and `auth.getSession` did not. Recovery335 correctly rejects an unconfirmed adopted/active session.
- Inspected Recovery335 report, native auth test suite, Library Kinfolk continuation notes, and recent Vercel previews. Earlier Recovery335 previews were READY at intermediate commits only; no real backend/device proof.

## Actual change
- In `test_recovery129.py`, add an explicit confirmation timestamp to the synthetic mock user shared by `setSession` and `getSession`.
- Assert that the adopted mock session is email-confirmed after the browser login opens.
- Preserve Phase95 production checks, the Recovery335 negative tests, existing Home/Reels/Channels/profile navigation assertions, and all native alpha modules. No application feature or security gate weakened.

## Evidence and boundaries
- Fixture repair commit: `6925b7b209b8ec0c8a8680018c8707d038f975ad`.
- Vercel preview `dpl_DzsFEFkwTrDR9ZvRs2N1T4AFCdAZ` READY at that exact repair commit, target nonproduction. This is a build result only; preview backend remains intentionally blocked from shared live Supabase.
- Exact-head GitHub source CI and native Android/iOS compilation must be verified separately; neither can be inferred from READY. No real isolated Supabase signup/email delivery, two-account RLS, physical Android/iPhone QA or signed distribution has been demonstrated.
- Separate Supabase Alpha Test project exists according to prior reports, but missing Community/Channel schema, functional email callback approval, private media, messaging and teen-safety end-to-end verification remain blockers. Do not change shared live Supabase or create billable resources.
- No production deployment/aliases, Kinfolksworld, shared live Supabase schema/data/auth/security, paid infrastructure or app stores changed.
