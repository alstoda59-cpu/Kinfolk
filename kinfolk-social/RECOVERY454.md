# Recovery454 | SIGNED_OUT account identity isolation
Date: 2026-11-04. Scope: main Kinfolk Social only. Baseline Recovery453 0d5b81e5453d26ab2cbbfb5f7638bac0d5f6e1bd.

Issue: kf286HandleSignedOutEvent previously retained private UI whenever getSession returned *any* user ID. If a different account was now present, the old account's rendered private state could remain visible. The handler now retains the UI only for a confirmed session whose user ID matches kf129ReadyUid; mismatches, unconfirmed sessions and absent sessions clear private UI.

Code commit: ea331078bb2c47150018bd6dede6199b60b13fe7.
Synthetic regression commit: d22ebef4b84e2ed0391e0a62816f6af406d9fcf6. Run: node kinfolk-social/recovery454-signout-identity.test.cjs. Four cases: matching confirmed account, different confirmed account, unconfirmed account, no session.

Evidence: GitHub accepted both commits. Regression source was committed but not independently executed; no CI pass or READY deployment claimed. No real backend, physical device or native packaging testing performed.

Remaining gates: isolated Supabase organization/cost approval, email-confirmed signup, session and two-account RLS/media tests, connected posting/messaging, Android/iOS builds and device QA. No production, shared live Supabase, Kinfolksworld or store changes.
