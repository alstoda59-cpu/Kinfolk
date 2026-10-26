# Kinfolk Social Recovery244 | Account report controls follow current conversation

Date: 2026-10-26. Full main Kinfolk Social in `kinfolk-social/` only; Kinfolksworld excluded. Isolated preview branch only.

## Source review
- Base: Recovery243 `kinfolk-social/recovery243-dm-peer-privacy-controls`, latest code/test commit `1e63f8c3605641e0b0ac5df0950d2b4aaf9e1353`.
- Inspected newest Recovery240–243 branches, Recovery243 report, actual Phase108/Phase76/Phase107 sources, regression tests, Library Recovery232/226/133 notes and Vercel deployment history.
- Confirmed earlier Recovery238 GitHub Actions run `40377981203`: `syntax-and-package` success, including synthetic Node and mocked browser checks. It does not validate Recovery243–244.
- Recovery243 Vercel preview `dpl_HzRrAwFNhwVCuo88Rr62CvqzAXRM` READY with target null, but built only first Recovery243 commit.

## Bug fixes
- `42bc52c6b39e9553f7c058a62227d72d46e9591e`: `kinfolk-phase108.js` Report Account click reads the DM form's **current** `data-peer`, not the recipient captured when the control was created. This prevents a reused DM form from reporting the previous recipient. Empty peer does not submit.
- Same commit: per-message Report button is not marked initialized until the message bubble and message ID exist. Delayed DOM insertion can retry correctly.
- `6106fd73c8684c6b6a0d1bc478c00f77c2c2b3b1`: four Node regression cases committed in `tests/recovery244-report-peer-lifecycle.test.cjs`.

## Verified evidence and limitations
- Fetched the committed Phase108 source and regression test; both parsed in V8.
- Executed **4/4 focused synthetic V8 checks** against the committed Phase108 source: active peer after switch, empty peer suppression, delayed bubble binding, delayed message ID binding. These are not browser, backend, or physical-device tests.
- Explicit Vercel deployment `dpl_7LvGEWqCqKKdgn6bTjNPQES2C5u2` for test commit `6106fd73` is **READY**, `target=null`, preview URL `https://kinfolk-social-demo-b7mc2lp3g-alstoda59-9779.vercel.app/`. READY does not prove rendered UI, auth, RLS or mobile operation.
- Full GitHub Actions CI for Recovery244 is **not confirmed**. No real Supabase test project, real email/login, multi-account privacy test or physical Android/iPhone QA was performed.

## Remaining release gates
- Dedicated nonproduction Supabase environment is approved in principle but organization and any nonzero cost still require owner confirmation. Do not modify shared live Supabase.
- Verify full branch CI and real synthetic-account auth, report/block RLS, uploads, notifications, teen privacy, native callback and device QA once the separate backend is authorized.
- No production deploy/alias, store submission, live data, or Kinfolksworld changes.
