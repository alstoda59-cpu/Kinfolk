# Kinfolk Social Recovery184 | login activation regression coverage

Date: 2026-10-25. Scope: full main Kinfolk Social, not Kinfolksworld.

Continued from Recovery183 branch, preserving the entire app. Read Recovery183 login source, regression test, notes and inspected Vercel deployment listing. Most recent reported READY preview is still Recovery182 (dpl_HrpVZgiFix1RFJZWVSpAiNU5nycP, target null). No Recovery183/184 preview has been verified.

Updated existing tests/recovery183-login-activation-feedback.test.cjs with three assertions: activation failure restores Stay Logged In preference; account identity is rechecked after activation; success feedback is only shown on a still-connected form. Commit b17590656ccd27857d01d14fd3aa2a17c35a0eac.

These are source-order assertions, not runtime behavioral tests. Test execution, CI results, real browser login, isolated Supabase backend and physical Android/iPhone testing are still unverified. Do not infer deployment readiness from commits. No production, shared Supabase or Kinfolksworld changes.
