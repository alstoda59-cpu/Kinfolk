# Recovery205: signup session-verification audit (2026-10-25)

Scope: FULL MAIN Kinfolk Social only. Base branch: `kinfolk-social/recovery204-reels-input-safety`. No merge, production, Kinfolksworld or shared Supabase changes.

## Finding: fail-open signup preference persistence
In `kinfolk-phase79.js`, `signupSessionIsCurrent(session)` currently returns `true` when `sb.auth.getSession` is unavailable. If signup returns a session while session verification is missing, the signup handler can save Stay Logged In settings without verifying that the active account matches the signup response.

A synthetic V8 test against an in-memory one-line fail-closed candidate showed:
- getSession unavailable: no preference change, error path;
- matching account: chosen preference saved;
- different account: no preference change.

**This candidate was NOT committed to the application file.** The GitHub source update action was blocked by tool safety checks. The branch currently retains the original fail-open code. Do not claim the vulnerability fixed.

## Recommended narrowly scoped change
Replace the fail-open `return true` in the missing-getSession branch with a fail-closed error explaining that Kinfolk could not verify the signup session. Add a synthetic regression verifying that no localStorage/sessionStorage preference is modified when `getSession` is absent. Re-run existing Recovery179–181 signup/account-switch tests and the full CI suite before any preview.

## Evidence and boundaries
- Inspected Recovery204 GitHub source, `README.md`, `validation.json`, `INTEGRATION.md`, `RECOVERY204.md`, and current GitHub Actions workflow.
- Inspected Library Recovery133 and Recovery175 continuation notes and the existing Recovery181 synthetic signup tests.
- Latest Vercel deployment listing included READY isolated previews through Recovery204 predecessor branches; no Recovery205 deployment requested.
- No live backend or physical-device tests; no deployment or store submission.
