# Recovery469 | Execute preview isolation regression in GitHub Actions

Date: 2026-11-05. Base: Recovery468, a51770b412a7549baadce26eddeacff620c9d3ce.

Added .github/workflows/kinfolk-preview-isolation.yml to execute the Recovery468 synthetic-DOM runtime test on matching recovery-branch pushes, pull requests affecting the test or isolation script, and manual workflow dispatch. Uses GitHub-hosted Node, no npm installation, credentials, Supabase requests, or test accounts. Checkout has persist-credentials disabled; job has read-only contents permission and five-minute timeout.

Application behavior and visual design unchanged. This addresses the repeated gap where regression source was committed but not run; it does not establish a passing CI run until the GitHub Actions execution is observed.

Code commit: 31bbe7db191ff695a63e2184caf2c9b43561ad21.

Remaining release gates: isolated Supabase org/cost confirmation; real email-confirmed signup and session restoration; two-account RLS and private-media verification; uploads/messaging; Capacitor builds and physical Android/iOS device QA. No production or shared live Supabase changes. Kinfolksworld untouched. Not launch ready.
