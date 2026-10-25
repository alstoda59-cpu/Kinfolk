# Kinfolk Social native packaging review

Scope: full main Kinfolk Social. Inspected latest Recovery153 branch, Vercel READY preview dpl_7LpbhHRyHepFXh65fwmPtdFnSPRQ, native/package.json, native/scripts/prepare-web.mjs, and native/capacitor.config.json. The native scaffold uses appId social.kinfolk.app and Capacitor 7. The app ID ownership, Android signing and iOS bundle identity have not been verified.

Change commit 5a28b2e178676ac16086d8e12045b4e9c29e1a52: native preparation script logs a warning when index.html contains an external script reference, so developers can inspect network-dependent startup behavior. It does not block packaging and is not an offline functionality test. Prior CI now checks that phase95 login module matches native/www after preparation.

No native Android/iOS build or real device test performed. No production, Kinfolksworld or Supabase changes. Next: verify CI run, native prepare:web execution, app deep-link and email callback on isolated environment, actual signed Android/iOS packages and devices. No app-store submission approval.
