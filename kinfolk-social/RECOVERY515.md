# Recovery515: password-bearing URL userinfo APK audit regression (2026-11-08)

Base: Recovery514 e20585ba345cc7a465b616ece8f98789f62e1573.

## Defect and change
Recovery514 rejects `https://aaaaaaaaaaaaaaaaaaaa.supabase.co@attacker.example`, but the authority matcher missed `https://aaaaaaaaaaaaaaaaaaaa.supabase.co:password@attacker.example/auth`. The network hostname in the second URL is attacker.example. Extended the existing compiled-APK endpoint matcher to detect a colon-delimited userinfo password followed by an @ host. The same matching rule applies to HTTP and WebSocket URLs. A normal explicit numeric port without @ remains outside this rejection branch.

## Verification limits
A focused local reproduction against the original Recovery514 expression showed the password-bearing redirect was accepted (second capture group None), while the simple @ redirect was detected. This commit changes the source matcher; full Recovery515 unittest, native APK audit, CI and physical-device QA remain unverified. No live backend was contacted.

## Safety and remaining work
Changes are limited to the isolated main-app branch and this continuation report. No shared Supabase, production aliases, Kinfolksworld, paid infrastructure, real accounts or store submissions were modified. Connected signup/email confirmation, session restoration, two-user RLS, private media, messaging and physical Android/iPhone QA remain release blockers. Separate nonproduction Supabase organization selection and any nonzero cost still require owner confirmation.
