# Kinfolk Social: full-app Android/iOS installable alpha

This is the **existing full main Kinfolk Social app**, not Kinfolksworld or a guest demo. Capacitor copies the full local web app into `native/www`; it does not load a production site via `server.url`. The dark UI, Home, Reels/Channels, profile customization, messaging and other existing modules remain included.

## Verified build evidence (2026-10-26 UTC)

GitHub Actions run [40278490955](https://github.com/alstoda59-cpu/Kinfolk/actions/runs/40278490955), source commit `624c0945de75cede1beb66b15465d36f52019000`, **completed successfully**:
- Android: `assembleDebug` built an **unsigned-for-release debug APK** and uploaded artifact `kinfolk-social-android-alpha-debug` (artifact ID `12630863109`). Debug APK is installable for authorized development testing; it is **not** an AAB or a Play Store release.
- iOS: `xcodebuild` produced an **unsigned iOS Simulator `App.app`** and uploaded artifact `kinfolk-social-ios-simulator-unsigned` (artifact ID `12630729913`). It cannot be installed on a physical iPhone and is not an IPA.
- The artifact retention is 7 days (currently expires 2026-11-02 UTC). The CI build used temporary ID `social.kinfolk.alpha`; the checked-in `social.kinfolk.app` identifier remains an **unconfirmed placeholder**.

This successful compilation **does not** prove real login, backend RLS, physical device behavior, signed distribution or store readiness. The artifacts above **predate Recovery226** login-button cleanup.

## Recovery233 native backend isolation (2026-10-26)

Native packaging now **refuses to embed the shared live Supabase project**. Before `npm run prepare:web`, configure the URL and **publishable** key for a separately authorized nonproduction Supabase project:

```sh
export KINFOLK_ALPHA_SUPABASE_URL="https://<nonproduction-project-ref>.supabase.co"
export KINFOLK_ALPHA_SUPABASE_PUBLISHABLE_KEY="<nonproduction-sb_publishable_key>"
npm run prepare:web
npm run alpha:verify
```

The packager rewrites the existing HTML, legacy Phase76 auth token URL/storage key, and Phase95 login URL/key **only inside generated `native/www`**, preserving original web source and UI. It rejects the known live project and live key, malformed endpoints, and missing values. Never put secrets, service-role keys or actual users in a mobile app.

Automated source and native compilation use an **unreachable CI-only Supabase placeholder** with `KINFOLK_ALPHA_PACKAGING_ONLY=1`. These Android/iOS artifacts can establish compilation and local navigation only. **Login, signup, uploads, messaging, RLS and real-device functionality are not validated and cannot work against that placeholder.** They are not a functional release. The native entry also disables registration of the website's service worker to avoid stale packaged assets.

After the user approves a specific nonproduction project and any cost, repackage with its real publishable URL/key, rerun CI and conduct authorized synthetic-account tests. The live project, production and Kinfolksworld remain untouched.

## Local development

1. Install Node.js 22+, Android Studio/Android SDK, and (for iOS) macOS + Xcode.
2. In `kinfolk-social/native`, run `npm ci` (the lockfile pins Capacitor 7.6.9, Supabase JS 2.118.0 and esbuild 0.25.12).
3. Set the isolated nonproduction environment variables above. Run `npm run prepare:web` and `npm run alpha:verify`. This copies all referenced main-app modules and builds `/kinfolk-supabase-sdk.js` **locally**, replacing the web preview's remote CDN script in the native entry HTML. Never commit generated `native/www` or `node_modules`.
4. Run `npm run android:init` or `npm run ios:init` once, then `npm run sync` and `npm run android:open` or `npm run ios:open`. Use development/debug builds only.

## Open launch gates

- **Network is still required** for Supabase authentication, feeds, messages and uploads. The locally bundled SDK removes the native cold-start CDN dependency, **not** the backend requirement. Recovery225's startup retry UI remains a fallback, not offline social functionality.
- A verified HTTPS auth email callback/universal link, password recovery, session restoration and app-link ownership still need owner-authorized isolated-backend and device testing. Never redirect email confirmation to Capacitor's nonpublic `https://localhost` origin.
- Teen safety must be enforced server-side; review age, privacy, content filters, moderation, reporting, account deletion, media permissions, RLS and store content rules. No shared live Supabase schema/data/auth changes are authorized.
- Test real Android devices and iPhones, including cold start, background/foreground, keyboard, safe areas, Reels playback, profile music, uploads and network loss/reconnect.
- Confirm final app identifier and ownership, privacy declarations, accessibility, signed Android AAB, signed iOS IPA/TestFlight and explicit owner approval before any production/store submission.

**Do not use real users or production credentials for alpha tests.** The build has not passed end-to-end security or device acceptance tests. Production, shared Supabase and Kinfolksworld are unchanged.
