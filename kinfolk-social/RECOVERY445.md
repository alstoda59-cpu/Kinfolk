# Recovery445 | Vercel preview trailing-dot isolation bypass
Date: 2026-11-04. Scope: kinfolk-social only; no Kinfolksworld changes.

## Baseline and finding
Started from Recovery444 at fb2d64081d404854ff48ae4d28d54ef79a2e631b after inspecting its isolation test, guard and Vercel READY deployment dpl_8CwFQysskxTNATaoY9Acu1qyxBZx. The guard's hostname regex did not match valid DNS hostnames with trailing dots (for example x.vercel.app.), allowing preview isolation to be skipped. A trailing-dot Vercel preview could then reach the configured shared backend, depending on browser and network behavior.

## Changes
- kinfolk-preview-isolation.js canonicalizes trailing dots before matching the preview domain. Existing production/custom-domain and Capacitor localhost behavior remains unchanged.
- tests/recovery444-preview-isolation.test.cjs now checks trailing-dot and uppercase preview hosts and rejects trailing-dot lookalikes.

## Evidence boundaries
GitHub commits record source and test updates. An independent Node inline smoke check of the canonicalized hostname expression passed 3/3 cases. The full committed Node VM regression, GitHub CI, new Vercel deployment, real backend and native device tests have NOT been verified here. No shared backend access was attempted.

## Next steps
Run node kinfolk-social/tests/recovery444-preview-isolation.test.cjs and existing auth regression in CI; verify exact-head nonproduction preview READY. Isolated Supabase organization and nonzero cost require owner confirmation before provisioning. Then synthetic two-account auth/RLS, media privacy, messaging and fresh Android/iOS QA.
