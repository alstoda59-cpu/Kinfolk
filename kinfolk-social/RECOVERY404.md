# Recovery404 | Restore mobile messaging Send after form rerenders

Date: 2026-11-01 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social only, under `kinfolk-social/`. Kinfolksworld excluded.

## Verified starting point
- Continued from Recovery403 exact branch head `bd48e0585f541db28fa88b3d4b353f4691c85e90`, draft PR #100, without merging or restarting.
- Inspected Recovery403/402 notes, Phase107 messaging source, existing Recovery240/400 synthetic tests, native package source gates, Library Recovery232/226 notes and Vercel preview history.
- Recovery403 final-head GitHub Actions run [41362309456](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41362309456) is now verified SUCCESS, with the completed syntax-and-package job and all 47 steps successful. This is synthetic/browser/offline native source proof only.
- Latest Recovery403 inspected Vercel READY preview was at `828cc571`, earlier than its final documentation head.

## Actual application fix
- `b15d34aed4f33c1a821de16567ae77446f876426`: `kinfolk-phase107.js` no longer exits permanently on a form-level `kf107` dataset flag. If a DM, group-message or group-creation form remains mounted while its Send/Create Group button is replaced, cloned or has its onclick removed, Phase107 reattaches the single click handler. The existing form handler can also be updated when `onsubmit` is replaced. A cleared `onsubmit` does not discard the last known handler.
- The same change restores Enter-to-send for cloned input/textarea elements. Cloned dataset attributes no longer suppress listener installation; Shift+Enter in textareas remains a newline. The existing in-flight async submit lock and one native click activation path are preserved.
- `f95d692349e1e7e87c30d6bd37fcb4aedde76dcc`: eight source-executed synthetic regression cases covering replacement buttons, stripped handlers, changing `onsubmit`, cloned input and textarea, async duplicate prevention, and cleared `onsubmit`.
- `aca6571f63bd8829b3b396fef270b3eea099526a`: added Recovery404 test to the existing `alpha:messages:source:test` gate for offline Android/iOS verification.
- `3a9d3b75086255eadf48953769fed714d31c899c`: updated the Recovery240 static assertion to recognize the stable form-owned click handler. The initial application-only and test-integration CI attempts failed solely on the outdated `btn.onclick=run` source-text expectation; the assertion now checks the new actual binding rather than removing coverage.

## Verification boundaries
- Recovery404 source/test-head GitHub Actions [41367396918](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/41367396918) was running at report creation; verify final result before claiming complete CI.
- Nonproduction Vercel preview [READY at `3a9d3b75`](https://kinfolk-social-demo-ik4tp02jt-alstoda59-9779.vercel.app/). This is deployment status, not backend/device proof.
- Read-only isolated Supabase Alpha Test `viantpfagtbgyyzavmtv` was ACTIVE_HEALTHY, with 16/16 public tables RLS enabled and zero security-advisor findings. No schema, data, Auth, policy or storage writes were made.
- Real synthetic-account signup, confirmation-email delivery, login/logout/session restoration, two-account RLS enforcement, backend media/messaging, signed Android/iPhone packages and physical-device QA remain unverified. This change does not claim launch readiness.

## Safety and next work
- Only the isolated Recovery404 branch was edited; no merge, Kinfolksworld modification, production deployment/alias, shared live Supabase mutation, paid resource or store submission.
- Verify final-head CI and preview, then run real isolated synthetic-account authentication/privacy testing and fresh Android/iOS native installation acceptance when credentials and devices are available.
