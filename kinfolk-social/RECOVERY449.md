# Recovery449 | Preview overlay delayed-body safety
Date: 2026-11-04. Scope: main kinfolk-social only, excluding Kinfolksworld.

## Starting checkpoint
Recovery448 at ba115459a515f948481cdaa954f2a5cc1dc7ebb5. Vercel reports its exact-head nonproduction deployment dpl_4t5Wowr5mL3P8RJdrCpfjdeMusDk READY. Recovery448 code and synthetic regression were inspected; Library prelaunch audit still flags public media privacy, auth protections, and missing real two-account tests.

## Actual changes
- kinfolk-social/kinfolk-preview-isolation.js now registers a DOMContentLoaded retry and pageshow fallback if document.body is unavailable even though document.readyState is complete. CSP and form interception still install immediately.
- Expanded the existing source-executed Node regression with a synthetic missing-body environment, verifying immediate CSP, deferred overlay, and idempotence across both callbacks.
- Existing dark mobile UI and native localhost behavior remain unchanged.

## Evidence and limits
GitHub accepted the source and test commits. No successful CI execution, new exact-head READY preview, connected isolated Supabase test, Android/iOS compilation, or physical-device test is established by this report. Preview READY does not imply signup works; preview isolation intentionally blocks shared live Supabase.

## Next release gates
Run both security Node regressions in GitHub Actions, confirm exact-head preview, then use an owner-confirmed separate nonproduction Supabase organization and zero/nonzero cost approval for synthetic signup/email, session restoration, two-account RLS and private media. Continue Android/iOS Capacitor packaging and real-device QA. Never modify shared live Supabase, production aliases, Kinfolksworld, paid resources or stores without approval.
