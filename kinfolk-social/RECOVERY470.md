# Recovery470 | Guard preview isolation bootstrap ordering

Date: 2026-11-05. Base: Recovery469 commit c624ac9905c4f804c7a36427b6e98785e16b9b62.

Added regression assertions to the executable synthetic-DOM preview isolation test, checking the actual kinfolk-social/index.html startup order. The preview guard must be the first head script, execute synchronously (not async/defer), precede the Supabase SDK, and appear exactly once. Negative mutation fixtures cover removed, async, defer and duplicated guards. The GitHub Actions workflow now includes kinfolk-social/index.html in its push and pull-request path filters so bootstrap changes cannot bypass this test.

Code commits: 9bb0c3749d880e16dd643cfff5488c94ffa73c41 and bd7231cffe9b73afecf5ac0e2439fccff8759227.

Vercel deployment dpl_6SjUYkZeD4ZAuwmmZQMsWxxdSZB7 for the workflow commit is READY; this verifies a preview build, not test execution. GitHub combined status reports Vercel success; the available workflow-run query is PR-filtered and returned no runs. Node execution / GitHub Actions passing is not independently verified. Preview remains blocked from live Supabase.

No live/shared Supabase, production aliases, Kinfolksworld, paid resources or stores changed. Real signup/email confirmation, two-user RLS, private storage, connected uploads and messaging, native Android/iPhone packaging and physical-device QA remain unverified. Isolated backend organization and any nonzero cost require owner confirmation. Not launch ready.
