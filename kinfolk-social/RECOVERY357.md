# Recovery357 | One-shot login preference rollback and source-CI repair

Date: 2026-10-30 America/Los_Angeles. Scope: **FULL MAIN Kinfolk Social** in `kinfolk-social/`, excluding Kinfolksworld.

## Verified starting point
- Continued from isolated Recovery356 draft PR #54, head `18c6c5734a2e20c271c6610701fa290716a494a7`; Recovery356 remains unmerged.
- Inspected recent commits and PR metadata, Recovery356 and prior README reports, Library notes, Vercel preview deployments, native alpha packaging gates, and exact-head Recovery356 source CI.
- Recovery356 exact-head source workflow `41160087705` **FAILED**, despite its complete Node test stage passing. Browser mocks passed; the later legacy Recovery152 VM threw `ReferenceError: preferenceWriteVersion is not defined` because it extracted `saveStay` without its production write-version binding. This was not a verified application-runtime failure.

## Actual application fix
- `kinfolk-phase95.js`: a failed-login preference rollback is now **one-shot**. Once it restores the original preference, calling the same stale callback again cannot undo a later same-value choice made by another tab. Existing checks for in-tab version changes and changed storage values remain.
- New `tests/recovery357-preference-rollback-idempotence.test.mjs` executes the real Phase95 preference closure with synthetic storage, covering one-shot replay protection, first rollback, and changed-value preservation.
- Wired the new source test into the offline Android/iOS native auth gate.

## Verification repair
- Updated historical Recovery152, Recovery153 and Recovery154 VM harnesses to extract the complete versioned production closure, rather than only `function saveStay`.
- The native build workflow now includes this isolated Recovery357 branch, still using unreachable CI-only Supabase markers and **never** a shared live backend.
- GitHub source and native CI must be checked on the final commit before claiming success. A compiled debug APK with the CI marker cannot authenticate, and an unsigned iOS Simulator app is not a physical-iPhone IPA.

## Nonproduction and backend evidence
- Isolated Supabase project `viantpfagtbgyyzavmtv` (Kinfolk Social Alpha Test) inspected read-only: `ACTIVE_HEALTHY`, 14 empty public tables with RLS enabled; security advisor reported no notices. These observations do **not** prove two-account policy enforcement.
- Nonproduction Vercel previews observed READY on intermediate Recovery357 commits. READY is deployment state, not browser/backend/device E2E proof.
- No live Supabase schema/data/auth/security, production deployment or aliases, Kinfolksworld, billable infrastructure or store submissions were changed.

## Open release gates
Real signup and email delivery/confirmation, two-account RLS enforcement, private uploads and messaging, teen privacy, missing Community/Channel/group-chat backend support, backend-connected Android/iPhone packaging, signed iPhone IPA and physical-device QA remain unverified. **Not launch-ready.**
