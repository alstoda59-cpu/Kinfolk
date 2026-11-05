# Recovery460 | Post-like server acknowledgment and duplicate prevention

2026-11-04. Continued main Kinfolk Social from Recovery459 final commit 5c0467bdc9e551c0caee36ad29294c757bfcfce6. Isolated branch `kinfolk-social/recovery460-like-write-ack-20261104`. Kinfolksworld and production untouched.

The post-like handler now requests exact affected-row counts for INSERT and DELETE. Only one acknowledged row permits the success refresh. Zero/unknown counts show an uncertainty warning and lock that account/post against blind repeat writes until reload. Backend errors use a generic message, preventing backend detail leakage. Existing account-epoch isolation and duplicate in-flight protection remain.

Application commits: 9c260bf851aaee269e8d5ca708a148364becfef3 and 58610ce681578c79271477b36895a8268b8f6d5b. Regression commits: 6a52a0500cd1439deb2cde9d89b697e8be99647f, 37c57cafe0d51711451a3082cdf07b66386f8d23, d9f8f21c19053609e145955f204b5257e854ff65. Test command: `node kinfolk-social/tests/recovery459-post-like-account-isolation.test.cjs`. Six synthetic cases. Tests have not been independently executed; no pass claimed.

Recovery459 exact-head nonproduction Vercel deployment dpl_GviHWkuWuTHkmYLeuyZoTnj7Gypo is READY. Recovery460 CI and preview status require separate verification. No real isolated Supabase signup/email/RLS tests, signed native packages or physical device QA completed. Shared live Supabase, production deployment/aliases, Kinfolksworld, paid infrastructure and stores unchanged. Not launch-ready.
