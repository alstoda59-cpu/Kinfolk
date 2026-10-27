# Recovery254 | Verify anonymous RLS isolation for both synthetic owners

Base: Recovery253 `kinfolk-social/alpha-two-user-rls-probe-20261027`.

- Commit `20687e374cb1c63795ac7657903bc0082760a7e7`: read-only probe now checks anonymous visibility for both synthetic owners in each of five private tables, rather than only the first owner.
- Commit `e55c7e75898cc40d82adc1b74862cbedc631dbda`: update expected GET count to six per table and add a regression where only the second owner's row leaks to anonymous requests.
- Scope limited to `kinfolk-social/native/`; no live backend writes or account creation.
- Tests are committed but execution of exact committed files, full CI, live two-user JWT requests, email confirmation and physical Android/iPhone QA have **not** been verified in this round.
- This probe is read-only and opt-in; fixture rows and two synthetic confirmed users are still prerequisites for meaningful real RLS evidence.
- No production deployment, shared live Supabase changes, Kinfolksworld edits, paid resources or app-store submissions.
