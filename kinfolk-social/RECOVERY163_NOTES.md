# Recovery163 Reels foreground playback

Built from Recovery162. On visibilitychange to visible, resume only the currently visible native video if not explicitly paused by user. Preserve manual pause and stop playback when switching tabs. Teardown clears paused-state set. Code commit 130ae7684171570296c5d18a1b27055d0d1204ec. Isolated JS syntax check passed. Synthetic source regression file e292028f99e74460b2f5ca58cc2128a8699b8258 and CI wiring 21217546d3420e67a9ed8f6cea9fdc998dfdb9e4. No full CI, browser or device tests verified.

Vercel isolated preview creation blocked by 402 api-deployments-free-per-day, retry in 24 hours. No Recovery163 preview URL. Existing READY Recovery158 preview lacks the Recovery159-163 immersive Reels changes. Video reactions backend migration not applied; Remix editing/publishing not implemented; Save device-only; Download unverified on device. Production, Kinfolksworld and shared Supabase unchanged.
