# Kinfolk Social alpha: cross-account direct-message guard (2026-10-26)

## Scope and lineage

This isolated branch is based on `kinfolk-social/alpha-integrated-auth-dm-20261026` (integration checkpoint `b25e6b445f85fd95afc478dd87b3bc74518acab2`), not on Kinfolksworld or the older Recovery branches. It preserves the existing dark mobile layout, authentication fixes, friend-only messaging, posts, Reels, Channels, settings, and native packaging.

## Implemented

- `index.html`: the active `window.openDm` override now captures the authenticated viewer and a monotonically increasing conversation-open generation.
- Incoming peer IDs are restricted to UUID syntax before interpolation into the PostgREST `.or(...)` filter.
- The app rechecks viewer identity, accepted friendship, and the active conversation generation after each asynchronous message fetch, read-receipt RPC batch, and preferences fetch, before opening the modal.
- Sending a message rechecks identity and friendship, requires the same still-mounted form and peer, and uses the captured sender ID rather than a mutable global account ID. Late responses cannot refresh the wrong account's conversation.
- A later conversation open supersedes a previously pending open, preventing a stale response from replacing the newer modal.
- `tests/alpha-dm-account-guard.test.cjs`: seven mocked runtime regressions covering invalid peers, account switching during and after reads, revoked friendship, stale forms, valid sends, and superseded conversation opens.

## Verified evidence

- Application commit: `13964f0b3fd0d09385d17cb4c04f9dd205af93f6`.
- Test commit: `6b10d94425af2243d0ef8fdff29a889b68e71dbd`.
- The updated active DM function passed V8 JavaScript compilation.
- **7/7 equivalent synthetic V8 runtime scenarios passed** in the connector execution environment using the fetched GitHub source.
- The committed Node test file and existing `alpha-dm-friends.test.cjs` passed V8 syntax compilation.
- GitHub combined commit status returned no status entries and commit-associated workflow lookup returned no runs for the test commit. **A Node test-run pass, full CI pass, browser E2E, and native-device test are not claimed.**
- Most recently inspected Vercel READY preview belonged to integration commit `432ab96850b1681426f16936e14768195d71207b`, not this branch. No preview deployment was requested.

## Security limitations and remaining release gates

This is a client-side account-switch guard, not a replacement for Supabase RLS. The isolated backend's friendship/message policies still require signed-in role-separated synthetic account testing. Existing server-side disappearing-message deletion and full Reels/Channels backend support remain unverified or incomplete. Signup and email verification, session restoration, posts/media, mobile navigation, Capacitor Android/iOS packaging with isolated backend credentials, and physical-device QA are still release blockers.

No shared live Supabase changes, production Vercel promotion or aliases, Kinfolksworld changes, app-store submission, or nonzero charges were made. Do not call the app launch-ready without end-to-end proof.
