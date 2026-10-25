# Recovery189 | Login screen guard before activation

Date: 2026-10-25. Main Kinfolk Social only; Kinfolksworld excluded.

Inspected Recovery188 Phase95 source, existing regression tests and notes. Recovery188 checks login form after tokenLogin, before setSession. But setSession/adopt is asynchronous; the screen could be replaced with signup or removed before kf129ActivateSession. Added a second connected-form/login-mode guard immediately before kf129ActivateSession, inside the existing activation error handling which restores Stay Logged In preference.

App commit db02ff050da00451faac0c76f1730d13a478f0d9. Source inspection verifies the guard was committed. No new runtime test execution; no claim of CI pass. Container Node v22.16.0 exists but GitHub network DNS was unavailable. GitHub workflow update from Recovery188 remains blocked. No Recovery189 deployment inspected yet. Previous Recovery188 preview dpl_E4MvTqTKxkLS59DEuf9tGWFeGtPR was READY target null; does NOT include this fix.

Important limitation: this prevents activation when the form has changed before the guard; a screen change during kf129ActivateSession still needs end-to-end testing. Real isolated backend and mobile device QA remain pending. No production, shared live Supabase or Kinfolksworld changes.
