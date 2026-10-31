# Recovery364 | Signup response email identity and real Auth error handling

Date: 2026-10-31 America/Los_Angeles. FULL MAIN Kinfolk Social only, `kinfolk-social/`. Excludes Kinfolksworld.

## Verified starting point
- Continued from isolated Recovery363 draft PR #60 and exact head `a0f8f259e39d31c10fe8f63abdc423bb97890368`, not the repository default branch.
- Recovery363 final source checks `41180754496` were reported **SUCCESS**; its native functional gate now actually awaits the read-only two-account RLS probe, and refuses missing synthetic credentials. This is NOT real RLS proof without populated fixtures.
- Earlier Recovery362 final source checks `41180238856` failed in native alpha verify due an older source suite path checker rejecting the newly added native test path. Recovery363 corrected that check. Do not misreport Recovery362 as green.
- Recovery362 isolated live Auth logs verified `GET /auth/v1/settings` HTTP 200 and rejected signup attempts: HTTP 500 with missing mandatory birthday metadata; HTTP 400 email_address_invalid for reserved test domains. Aggregate `auth.users` count was zero. This does **not** establish any successful real registration or email delivery.
- Reviewed actual Phase79 signup, email verification, in-flight signup race checks, Recovery277/278/359/360 regressions, Recovery363 report and native source scripts. Current Vercel automated check for Recovery364 is build-rate limited; no READY preview for this exact source.

## Implemented app change
- Effective runtime file `kinfolk-phase79.js` now rejects missing, non-string or mismatched email identities in Supabase's returned signup user/session instead of treating missing email as a match. An email-confirmed signup must not be advertised for an unverified response identity. Case-insensitive matching with harmless surrounding whitespace remains supported.
- Maps observed `email_address_invalid` Auth rejection to actionable email verification guidance. Also maps email/request rate limits to a cooldown instruction without encouraging repeated network requests.
- Preserves existing birthday validation (ages 13–99), 12–128 character password requirement, name/username metadata, private teen defaults, account preflight, verification panel/resend, token-identity protection, persistent session handling, dark mobile layout and all existing features.

## Tests and CI boundary
- Added `tests/recovery364-signup-response-identity.test.mjs` executing the exact production inline signup identity predicate and error handler with synthetic values. Covers missing/wrong/case-insensitive response emails, order of user/session/confirmation guards, real observed Auth code, throttling and preserved birthday/username messages.
- Wired the new test into `native/package.json` `alpha:auth:source:test`. Draft PR #61 targets Recovery363. Unmerged.
- Initial Recovery364 exact-head CI `41181083684` reported **FAILURE**: 855/866 tests passed; 11 older synthetic browser/signup fixtures omitted the returned signup user email. The new Phase79 identity check correctly rejected those incomplete responses; new Recovery364 source regressions passed. This was a fixture compatibility failure, not proof of a broken real signup.
- Updated `tests/recovery178-signup-stay.test.cjs` and `tests/recovery258-phase79-title.test.cjs` with explicit matching signup response emails where success was intended; preserved adversarial session-mismatch fixtures and added a full synthetic submit test proving a missing returned email cannot display verification.
- Exact final-head CI must be verified separately before claiming green. No real browser/isolated Supabase signup was attempted by Recovery364, because owner-controlled test inbox has not been approved/provided.
- No shared live Supabase schema, data, auth or policies modified; no nonproduction backend writes; no production Vercel deployment or alias modifications; no Kinfolksworld, paid services, store submission or device QA.

## Remaining alpha blockers
- Owner-approved deliverable test mailbox and explicit native callback/allowlist needed to verify real email confirmation and later login/logout/session restoration.
- Two isolated confirmed synthetic accounts with private-row fixtures and read-only JWTs needed to execute actual RLS cross-account tests.
- Functional uploads/posts/comments, messaging, notifications, teen safety, signed Android/iOS packages, physical Android/iPhone QA and app store acceptance remain unverified.

**NOT launch-ready.**
