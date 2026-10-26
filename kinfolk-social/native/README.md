# Kinfolk Social native packaging scaffold (Recovery131)

This packages the **existing main app** and does not introduce a guest demo or point to a production website. Source HTML/JS is copied locally into `www/`; there is no `server.url` setting. The current app still requires network access for the Supabase CDN, authentication and data. Offline fallback is not offline social functionality.

## Android / iOS development

1. Install Node.js and prerequisites (Android Studio + Android SDK; for iOS, macOS + Xcode and Apple developer signing).
2. From this `native` directory run `npm install`, `npm run prepare:web`, then `npm run android:init` and/or `npm run ios:init` (run the init commands only once).
3. Run `npm run sync`, then `npm run android:open` or `npm run ios:open`. Build debug/dev variants first.
4. **Before signing or any release** configure an owned final app ID, universal/app links as needed, privacy manifests/disclosures, native icons/splash and store metadata; inspect and approve any permission requests.

## Known blockers

- Recovery225 adds an accessible **Try again** startup screen when the external Supabase JavaScript CDN is unavailable. It does **not** bundle Supabase locally, enable offline authentication, or make the app store-ready. Before native release, pin and locally bundle the reviewed SDK with a dependency lockfile, then verify cold launches without CDN access and offline/reconnection behavior on real Android/iPhone devices.
- App ID `social.kinfolk.app` is a proposed placeholder **not proof of ownership**; confirm identifier before store submission.
- Capacitor packages and actual native Android/iOS projects are not installed/generated here. No APK/AAB/IPA was built, signed, uploaded or run on real devices.
- Recovery133 avoids sending the nonpublic `https://localhost` Capacitor origin as a signup email callback. A verified HTTPS universal/app link or configured Supabase site URL must still be tested in an isolated environment; password recovery, email confirmation and callback handling are NOT validated. No auth configuration was modified.
- Review age protection, adult-content policy, moderation/report/block workflows, media permissions, account deletion, privacy policy and backend RLS before app-store review. Store policies may constrain adult content in ways web filters alone cannot solve.
- No changes to production, shared backend or existing deployment.
