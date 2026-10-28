# Recovery274 | Reject hidden malformed native module references

Baseline: Recovery273. Inspected Recovery273 report, native packaging verification, native startup parser, module parity validator, and its existing eight regression tests.

Commits: `982f1d180ba79ba689c522e00e2cfd4b30c661b7` validates Kinfolk module script paths **before** filtering the source/package inventory, so malformed `/kinfolk-*.mjs` or query-string `/kinfolk-*.js?v=1` entries cannot be silently omitted from parity comparison. `4974834206ac8e71bfa898608e9cc6a4252c97ba` adds two regression tests.

Verification: committed code and test source only; the new tests have not been executed in this turn. No current CI, Vercel READY, real Supabase signup/email/session, native APK/iOS build or device QA verified. No shared live backend, production, Kinfolksworld, paid resource or app-store change.
