# Recovery173: account-isolated content lanes (2026-10-25)

## Source and scope
- Based on `kinfolk-social/recovery172-reels-manual-pause`; isolated branch `kinfolk-social/recovery173-content-lane-account-isolation`.
- Full main Kinfolk Social only. No Kinfolksworld, production, or shared Supabase changes.
- `kinfolk-social/kinfolk-phase82.js` now tolerates blocked Web Storage at startup, binds the cached adult-content entitlement to the current user ID, resets to General on account changes, and rejects stale asynchronous safety lookups. A stale adult account's preference cannot unlock another account's XXX lane.
- Home and Reels wrappers avoid restoring the prior account's cached feed/video arrays after an in-flight render completes. They preserve newly loaded account data and suppress stale fallback renderers.
- XXX enable and lane selection re-check account identity after asynchronous work.
- This is client-side defense-in-depth only; it does **not** replace backend RLS, age verification, or store-policy compliance.

## Validation
- JavaScript source syntax: PASS (isolated V8 check).
- Seven synthetic execution checks: PASS in an isolated JavaScript harness (adult explicit opt-in; adult-to-teen switch; teen lane rejection; late adult response ignored; Web Storage denied; stale Reels render cannot restore old videos; fresh account videos not overwritten). The committed Node regression also covers stale Home feed restoration. Node CI execution is not yet verified.
- `test_recovery173_content_isolation.js` added to GitHub CI. CI execution status must be checked independently; no claim of full CI pass.
- No real Supabase test accounts, physical Android/iPhone testing, signed native binaries, or store submission.
- Preview deployment: attempted on 2026-10-25; Vercel returned HTTP 402 `api-deployments-free-per-day` with retry-after 86400 seconds. No Recovery173 preview ID/URL was created. Latest inspected READY preview remains Recovery171 `dpl_768ZffEDn1n7a22qSmBsfkLVZTJZ` (`https://kinfolk-social-demo-fcvq7z9cz-alstoda59-9779.vercel.app/`), which does **not** contain Recovery173. Production `dpl_Fp3nErjCoMqXs8Pqsh7LQAipWFUT` remains READY, target production, untouched.
- Production untouched; shared Supabase schema, auth, RLS and data unchanged.

## Next work
1. Check CI and preview deployment. Validate on real browser and authorized nonproduction Supabase test accounts.
2. Exercise teen/adult account transitions, signout/login, RLS and adult-content policy on isolated backend.
3. Continue launch blockers: auth, uploads, messaging, native callbacks and device builds.
