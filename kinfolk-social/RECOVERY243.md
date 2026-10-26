# Kinfolk Social Recovery243 | DM peer identity for privacy controls

Date: 2026-10-26. Scope: full main Kinfolk Social app in `kinfolk-social/` only, excluding Kinfolksworld. Development branch and preview only.

## Starting point and investigation
- Continued from latest branch `kinfolk-social/recovery242-message-test-fixture-fix`, commit `68724a335d0ee1aba7c59ca01c33ed9316a561f1`. Reviewed newest Recovery240–242 branches, Recovery238 notes, Library continuation notes, actual DM rendering code, and Vercel history.
- Verified earlier Recovery238 GitHub Actions run `40377981203`: `syntax-and-package` job completed **success**, including synthetic Node and simulated browser regression steps. This does not verify Recovery239–243 or real backend/device behavior.
- Found that the actual DM form HTML did **not** provide `data-peer`, although Phase107 Block Account and Phase108 Report Account controls require `form.dataset.peer`. Consequently those controls could fail to appear in real DM modals. Phase108 also marked a form initialized before peer identity was present, preventing later retry.

## Code changes
- `3e3d14fce326a26f59168aff6ba98664052d27c5`: add escaped `data-peer="${esc(peer)}"` to active Phase76 DM template.
- `68ac283e84617d20c9a8aaf93c5e124ea2f02b9e`: add escaped peer identity to both legacy DM templates in `index.html`.
- `ed8434308e919fe993229bcecaa941337ee6b6ca`: defer Phase108 report-control initialized flag until a peer is available.
- `3cfe565356712cbb5cd12912bf0913b3d6ec3578`: add Node regression tests for active and legacy DM peer wiring, delayed report binding, and correct report recipient.
- `e026dc8995a2d3743cde47fed98ef32c795bafef`: repair synthetic DOM test fixtures to include element.style.

## Verification
- Inspected committed sources and executed **5/5 focused V8 synthetic checks**: legacy DM peer attribute, active DM peer attribute, block/report consumption, delayed report binding + correct synthetic peer, and regression fixture coverage.
- Parsed committed Phase76, Phase108, and new regression test JavaScript in V8: all passed syntax checks.
- Full GitHub Actions CI on Recovery243 **not yet verified**; no real Supabase, live account, Android or iPhone testing.
- Vercel deployment `dpl_HzRrAwFNhwVCuo88Rr62CvqzAXRM`, URL `https://kinfolk-social-demo-4xmi7nk1h-alstoda59-9779.vercel.app/`, is **READY**, target null, but represents **first commit only** `3e3d14f`, not the complete Recovery243 fixes. Do not claim it includes Phase108 or tests.

## Blockers and next action
- A separate nonproduction Supabase project is authorized in principle but requires owner organization selection and explicit approval for any nonzero project cost. Do not touch shared live Supabase.
- Need full CI verification, final-commit preview, synthetic adult/teen signup/email/login/session tests against isolated backend, RLS/privacy cross-account verification, upload/post/notification end-to-end, physical Android/iPhone QA and signed packaging.
- Do not change production deployment/aliases, shared live Supabase, Kinfolksworld, or submit to stores without approval.
