# Recovery511: Whole-APK Supabase endpoint isolation (2026-11-07)

Base: Recovery510 branch `kinfolk-social/recovery510-apk-backend-allowlist-20261107`.
Branch: `kinfolk-social/recovery511-whole-apk-endpoint-audit-20261107`.

## Defect and fix
Recovery510 rejected unexpected Supabase project URLs only when they appeared in `assets/public/index.html`. A second endpoint embedded in another bundled JavaScript/JSON asset or native metadata could bypass that endpoint check. The compiled APK auditor now scans every ZIP entry in streamed chunks for Supabase project hostnames, including chunk boundaries, while continuing to reject the known shared-live project reference anywhere in the archive. The expected synthetic endpoint remains mandatory in index.html and is the only allowed project endpoint across the package.

## Regression coverage
Three new Python unittest cases cover an unexpected project endpoint in a secondary web asset, native metadata, and a URL split across a 1 MiB read boundary. The existing non-Supabase external URL allowance remains intact.

## Verification boundaries
Changes committed in this isolated branch. No local test execution, successful branch CI, new READY preview, connected isolated-Supabase Auth/RLS, signed iOS build, or physical-device installation has been established in this pass. Run `python3 -m unittest discover -s kinfolk-social/native/scripts -p 'test_audit_compiled_apk.py' -v` and the Recovery security workflow, then inspect its job logs before treating this repair as passing. The CI packages remain explicitly offline and nonfunctional for authentication.

No production aliases/deployments, shared Supabase data/schema/auth/security, Kinfolksworld, paid projects, or store submissions were changed.
