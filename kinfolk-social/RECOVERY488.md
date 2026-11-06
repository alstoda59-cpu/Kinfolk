# Recovery488 | Reject future-issued RLS verification credentials

Date: 2026-11-06. Based on Recovery487 final head `b313115895290f6733664b83f3666aa69b0d49cf`.

## Implementation
- Reject malformed or future `iat` timestamps on synthetic account JWTs before any RLS backend request. Optional `iat` remains supported for offline fixture compatibility. This closes another false-proof path where not-yet-issued credentials could be interpreted as authenticated privacy evidence.
- Added synthetic regression tests for future, string, fractional and null `iat` with zero network calls, plus valid past issuance.
- The existing recovery-branch native `alpha:verify` and two-user RLS CI job include this test; no duplicate workflow added.

## Evidence
- Source commit `670c1bfebddb69d5346f9f89963abe5f90473288` and regression commit `c2864ba5279186e251f244a66a9b9071a9aa8c52` were accepted by GitHub.
- Recovery487 final-head preview was READY before changes.
- GitHub commits and Vercel READY do not prove executed CI, real backend RLS, signup/email delivery, native binary compilation or device QA. Verify each separately.

## Next
Inspect actual push CI results. Then test real synthetic signup, email confirmation, session restoration, private media and two-account RLS on the owner-approved isolated Supabase project, followed by Android/iPhone installation QA. Never touch live Supabase or production deployments without approval.
