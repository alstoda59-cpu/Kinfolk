# Recovery472 | Preview network API fail-closed fallback

Date: 2026-11-05. Base: Recovery471 commit 3618920d2755d124b7b0cba425dd1fe05f5abb08.

The preview-isolation script now denies fetch, XMLHttpRequest, WebSocket, EventSource and navigator.sendBeacon in Vercel-hosted previews as defense in depth where an embedded WebView does not enforce the dynamically inserted Content Security Policy. The existing CSP and blocking overlay remain. Native localhost and non-Vercel custom domains retain their original behavior. No application UI redesign, production resource, or shared Supabase change.

Application commit: d541e9d2051813c6b90f53e9a2970ba8dc90bf97. Regression commit: f63173a32881635c0122d76556a75d1f73b44c78. Synthetic runtime regression added to the existing GitHub Actions watched file. No real accounts, backend requests or physical devices used.

Verification boundaries: commit acceptance does not prove the regression passed, Vercel READY does not prove functional signup, and preview backend access is deliberately blocked. Pending: confirm exact-head CI and preview status, isolated Supabase organization/cost approval, real two-account Auth/RLS/media tests, Android/iOS signed builds and device QA. Not launch-ready.
