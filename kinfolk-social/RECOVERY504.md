# Recovery504: preview isolation constructor and DOM fixture repair (2026-11-06)

Base: Recovery503 branch, final commit 6dc8524338ca6838bf488d2ee7363b1371f819a1. Main Kinfolk Social only.

## Evidence
Recovery502 source CI run 42304549440, job 128190482512, failed 9 of 1,273 tests. The downloaded job log identifies a preview overlay fixture failure in recovery444-preview-isolation.test.cjs: pane.appendChild is not a function, and a preview worker constructor assertion failure in recovery468-preview-isolation-runtime.test.cjs: workerPreview.window[api] is not a constructor. Additional failures remain to be diagnosed. Recovery503 fixed a separate stale-auth assertion.

## Changes
1. kinfolk-preview-isolation.js: change the shared blocked constructor from an arrow to a constructible function that throws the intended network-disabled Error under `new`. This restores the precise fail-closed contract for Worker, SharedWorker, RTCPeerConnection, WebTransport, and WebSocketStream in embedded WebViews. Preview CSP and native-host exemptions are unchanged.
2. recovery444-preview-isolation.test.cjs: add appendChild to the synthetic DOM element, matching the existing overlay's use of appendChild.

Commits: ecc670116e2e486b35f3c64225037218b0fcbea8, faa2e88fd3882f5abe01c1e863204c86ee057e8a.

## Verification boundaries
GitHub accepted source commits. A new successful source CI, native Gradle build, APK artifact, iOS Simulator build, READY preview, real isolated Supabase Auth/RLS tests, and physical-device installation are not established by these commits. The remaining CI failures must be investigated from the newest logs. No live Supabase, production alias, Kinfolksworld, store or paid infrastructure changed.
