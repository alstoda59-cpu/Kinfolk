# Recovery522: explicit Gradle task exception retry guard (2026-11-08)

Base: Recovery521 `2dcc8f990b2016143dadf1c3952f9156978d55dd`.
Branch: `kinfolk-social/recovery522-gradle-task-failure-guard-20261108`.

## Change
The Recovery521 retry classifier stopped on `> Task ... FAILED` and `Compilation failed`, but a Gradle failure may instead report `Execution failed for task ':app:...'`. If a prior HTTP 504 appears in the same build log, that genuine task failure could be retried incorrectly.

Both Android workflows now recognize `^Execution failed for task` as terminal. The synthetic Python regression fixture covers a mixed HTTP 504 plus task-exception log and retains the generic-header transport retry case.

Commits: `7a49753e` (security workflow), `7593fe81` (native workflow), `9d548555` and `4ef178e6` (test fixture and escape correction).

## Verification limits
Source edits committed; GitHub Actions execution and real Android compilation/APK audit are not confirmed in this report. This is a synthetic log-classification regression, not an end-to-end build or device test. Recovery520 is the latest previously confirmed READY preview, not proof of connected functionality.

No live Supabase, production aliases, Kinfolksworld, paid services, or app-store submissions were touched. Real auth/RLS and device QA require an approved isolated backend and subsequent connected testing.
