# Recovery448 | Preview flag bypass hardening
Date: 2026-11-04. Scope: main kinfolk-social only.

## Baseline and defect
Based on Recovery447, the Vercel preview guard previously returned early when window.__kinfolkPreviewBackendBlocked was already truthy. This global is mutable; a pre-populated flag could suppress the network Content Security Policy, submit interception, and isolation overlay. The flag should describe isolation state, not authorize skipping isolation.

## Changes
- Removed the mutable-global early-return condition from kinfolk-social/kinfolk-preview-isolation.js. The guard still applies only to canonicalized vercel.app hostnames and runs before the Supabase SDK.
- Expanded the existing executable synthetic preview regression with a pre-seeded flag scenario requiring the CSP, submit interception and overlay to be installed.

## Evidence and boundaries
GitHub accepted the application fix and regression commits. Source inspection confirms the modified branch files. No local Node test execution or successful GitHub Actions run was established in this run: direct container GitHub DNS resolution failed. No Recovery448 Vercel READY status, connected Supabase backend test, Android/iOS build or physical-device result is claimed. Existing Vercel previews remain isolated from the shared live backend.

## Next steps
Run node kinfolk-social/tests/recovery444-preview-isolation.test.cjs and node kinfolk-social/tests/recovery442-confirmed-session.test.cjs in CI, inspect workflow logs and preview deployment. Then prioritize isolated Supabase synthetic-account end-to-end auth and two-account RLS after organization and cost confirmation, followed by Capacitor native builds and physical-device QA. Do not change shared live Supabase, production deployment or aliases, Kinfolksworld or store resources.
