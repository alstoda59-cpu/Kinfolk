# Recovery473 | Preview worker and WebRTC isolation

Date: 2026-11-05. Base: Recovery472 commit 3bd4512946d08c8bbaa399bf6b61787dbc6cf3aa.

Added fail-closed preview guards for Worker, SharedWorker, RTCPeerConnection, webkitRTCPeerConnection and serviceWorker.register, complementing existing CSP/fetch/XHR/WebSocket/EventSource/beacon restrictions. The changes apply only to vercel.app preview hosts; native localhost and custom domains remain exempt. The existing UI, live backend, production aliases and Kinfolksworld are unchanged.

Application commit: 37f7d3eb60247015cd997195d7744d918c173f35.
Synthetic executable test commit: 862c3ba05c708581b154cbe6208d432e0bbe2440. The existing CI workflow watches the test and guard paths.

Verification limits: GitHub commit acceptance does not prove CI success. Vercel READY is deployment status, not app functional verification. No real backend, synthetic account E2E, Capacitor binary, or physical-device test is claimed. Isolated Supabase organization and any nonzero cost still require owner confirmation. Public media storage remains an unresolved launch blocker.
