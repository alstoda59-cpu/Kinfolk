# Recovery447 | Security CI coverage for all Recovery branch pushes
Date: 2026-11-04. Scope: main kinfolk-social only.

## Verified baseline
Recovery446 branch kinfolk-social/recovery446-auth-preview-ci-20261104 contains workflow commit 94f30fcf3cf021fef5fd1f41783e7fb947212e84. Vercel deployment dpl_CTt6VpWUB5mM4oLVivetJiTab9Rj for that SHA was READY when inspected. The existing workflow limited push execution to five exact file paths, so security-affecting edits elsewhere in the app could silently skip both regressions.

## Change
Recovery447 changes only .github/workflows/kinfolk-alpha-security-regressions.yml. Every push to a kinfolk-social/recovery* branch now requests both offline synthetic regressions; pull requests touching kinfolk-social/** or this workflow also request them. Workflow retains read-only contents permission, Node 22, five-minute timeout, and no credentials or production access. No app UI, Supabase, production aliases, Kinfolksworld, or native projects changed.

## Evidence boundaries
The GitHub API accepted the workflow edit. GitHub Actions execution and a passing result have NOT been verified. Vercel READY proves deployment, not authentication or native-device correctness. The previously committed test files were inspected, not independently executed in this run. No real backend or physical-device tests were performed.

## Blockers and next actions
Confirm workflow run on Recovery447, execute both Node regressions, then add isolated Supabase synthetic signup/email verification, two-account RLS and private media tests after organization/cost approval. Verify Capacitor Android/iOS packaging and physical devices separately. Do not claim alpha readiness before end-to-end evidence.
