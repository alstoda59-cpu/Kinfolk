# Recovery467 | Channel subscription account isolation
Date: 2026-11-05 (America/Los_Angeles)
Base: Recovery466, commit 4e2ac3f3fe5ca218964ea277fd357efd0101e63b.
Branch: kinfolk-social/recovery467-channel-subscribe-isolation-20261105

Application commit: 73846a5ea0a45b037f03c14401e6f0c53b2adc5a
Synthetic test commit: ce1d60b66dc3335d2f89e1a24be57415e9e3d9a9

The existing channel Subscribe/Unsubscribe handler now captures initiating account and authentication epoch, prevents concurrent duplicate requests, scopes deletes and inserts to the initiating account, requires exactly one returned row with matching user/channel, and prevents stale network results from refreshing another account's UI. Uncertain writes and exceptions lock retries until reload. No feature redesign or live backend changes.

Offline source-contract test: node kinfolk-social/tests/recovery467-channel-subscribe-isolation.test.cjs (13 assertions). Test committed, not independently executed. Static assertions do not prove runtime behavior or Supabase RLS.

Verification pending: GitHub CI, latest nonproduction Vercel READY, real two-account RLS and private-media access, confirmed email signup/session restoration, connected messaging/uploads, native Capacitor builds and physical devices. Prior Recovery466 nonproduction deployment dpl_6dnZ2SPNqavB9DT9PKMK9in91kiM was READY on inspection.

Library prelaunch audit flags public kinfolk-media storage, leaked-password protection and unverified RLS. Do not modify shared live Supabase. Isolated Supabase organization selection and nonzero costs still require owner approval. No Kinfolksworld, production aliases, store submission or paid resource changes. Not launch-ready.
