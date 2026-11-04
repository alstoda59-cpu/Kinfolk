# Recovery444 | Preview backend isolation executable regression
Date: 2026-11-04. Main Kinfolk Social only, excluding Kinfolksworld.

## Verified baseline
Branch Recovery443 at e74dabcebcaf452a568774ce8edb1bea90cc9219. Branch search found no Recovery444 before this work. Inspected Recovery443 report, Recovery442 auth regression, index.html boot order, kinfolk-preview-isolation.js, Library prelaunch audit and Vercel deployments. Recovery443 preview dpl_6GiriVuXg1X3jDFpwWohY9uWUKVp reports READY at exact head, but its isolation overlay intentionally prevents live backend functional testing.

## New work
Added tests/recovery444-preview-isolation.test.cjs. The offline Node VM harness executes the actual preview isolation script with synthetic hostnames and a minimal document/window. It checks that the guard loads before the Supabase SDK, that *.vercel.app hosts receive the restrictive CSP and submit interception, that an overlay appears, that delayed DOM readiness is handled, and that localhost/non-Vercel hosts remain unaffected. No credentials, accounts, production calls or real data.

## Verification boundaries
GitHub accepted the test commit. This run did not execute Node or establish a CI pass. No Recovery444 Vercel READY deployment, connected Supabase test, Android/iOS compilation or device QA is claimed. This test protects preview isolation behavior; it does not validate application signup or real backend access.

## Remaining blockers
Approved separate Supabase organization and any nonzero cost confirmation; isolated synthetic-account signup/email delivery/login/logout/session restore and adversarial two-account RLS; private media storage and signed URL behavior; connected posts, uploads, messages and notifications; native Capacitor builds and physical-device QA. Shared live Supabase, production aliases, Kinfolksworld and store submissions unchanged.
