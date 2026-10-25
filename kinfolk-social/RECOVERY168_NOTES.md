# Recovery168: stale Reels render cancellation

Continued from Recovery167 on isolated branch kinfolk-social/recovery168-reels-render-cancel. The immersive Reels module now increments a generation token on teardown, checks render currency after reaction loading and after each awaited signed video URL, and checks again before replacing main.innerHTML. Prevents a stale in-flight Reels render from overwriting another view after navigation or a newer render. Code commit c130e8afb0ab82f2923aa138f83987eeeab90ae6. Isolated V8 syntax check passed. Source regression test 9d6b312 and CI hook 015edc10 committed. Full CI, browser, Android and iOS tests not verified.

Vercel preview attempt on 015edc10 rejected 402 api-deployments-free-per-day (retry in 24 hours); no Recovery168 preview URL. Production, Kinfolksworld and shared Supabase unchanged. Reactions backend migration remains review-only.
