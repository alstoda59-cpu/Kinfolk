# Recovery164 Reels observer selection

Continuation of Recovery163 on isolated branch kinfolk-social/recovery164-observer-fix. The IntersectionObserver callback now computes slide overlap with the feed viewport, selects the most visible slide once per callback, pauses other videos and only plays the winner when >=65% visible, page is visible and user has not manually paused it. Final implementation commit ef12a9dadede754c00cb057f0ba2d691a1e2ccd2. Intermediate commits 6460f30 and 089dfb4 were superseded by final implementation. Isolated V8 JavaScript syntax check passed. Static regression test b6d168e and CI integration 2997aa4 committed; real browser/device tests and full CI run not verified.

Preview creation on Vercel was attempted at 2997aa4 and rejected with 402 api-deployments-free-per-day (retry 24 hours). No Recovery164 preview URL. Production, Kinfolksworld and shared Supabase were not modified. Reactions migration not applied; Remix publishing still incomplete.
