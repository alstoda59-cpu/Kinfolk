# Recovery459 | Post-like account isolation

2026-11-04. Continued main Kinfolk Social from Recovery458 final commit 6107c46b83851fa021c163a1edb17cccfeb7ce36 on isolated branch `kinfolk-social/recovery459-post-like-account-isolation-20261104`. Kinfolksworld untouched.

The Home post-like handler previously read the mutable active user and then refreshed the feed after awaiting a mutation, even when a different account had signed in. Recovery459 captures account ID and auth epoch before the write, uses that ID for the mutation, suppresses duplicate in-flight taps for the same account/post, checks ownership before refresh/render, and reports current-account failures without leaking stale account errors.

Application commit 485e0049cee02c448dfc24926936e6884623203c. Synthetic test commits df96f84da10513ba2ce1ccd23c2921aba23e5e44 and f41e4f1b3af5a926a93185232ab85c74cbc31986. Test command: `node kinfolk-social/tests/recovery459-post-like-account-isolation.test.cjs`. Four scenarios added: success, duplicate taps, account switch, and write failure. Tests were committed but not independently executed; no CI pass is claimed.

Recovery458 final nonproduction Vercel deployment dpl_QWX6k9xStvztLxpC7YDnoRixRxkg was READY before this change. Recovery459 deployment/CI, real isolated Supabase tests, Android/iOS native builds and device QA are not verified. Separate Supabase organization and nonzero cost approval remain outstanding. No live backend, production aliases, paid resources, store submission or Kinfolksworld changes.
