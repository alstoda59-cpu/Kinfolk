# Recovery493 | Compiled APK archive integrity

Date: 2026-11-06. Based on Recovery492 branch, main Kinfolk Social only.

## Implementation
- The compiled Android APK audit now rejects duplicate ZIP entry names, absolute paths, backslash separators, and parent-directory traversal segments before evaluating required web assets.
- Added synthetic regression cases for duplicate index.html entries and parent-directory traversal entries.
- Existing CI APK audit invocation remains unchanged; no new workflow was duplicated.

## Evidence and limits
GitHub accepted code and test commits a241f4b91ded6aa0e5103775896f458ec08cc6f4 and f111dacd71a1b23bce0427374393401e66212b75. These regression tests have not been independently executed. No passing GitHub Actions run, APK compilation, downloadable artifact, real isolated Supabase authentication/RLS test, or physical-device installation has been verified in this continuation. No Vercel READY assertion is made for this branch.

## Next
Run the committed APK audit regressions and verify Android CI/Gradle artifacts, then pursue isolated Supabase functional testing after organization and any nonzero cost are approved. Preserve production and Kinfolksworld isolation.
