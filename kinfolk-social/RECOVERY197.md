# Recovery197 | Mobile-only Shorts viewport regression

Date: 2026-10-25. Full main Kinfolk Social; Kinfolksworld excluded.

Inspected Recovery196 source, continuation notes and Vercel deployment list. The last confirmed READY isolated preview remains Recovery195 `dpl_HUrJfobmt4d4rnvAG5AL6rRSZYuA`, https://kinfolk-social-demo-5si9seupl-alstoda59-9779.vercel.app/, target null. No Recovery196/197 READY preview was confirmed.

Corrected a mobile Shorts layout conflict: Recovery196's dynamic viewport could compute less than 380px, but `.kf159-slide` retained a 380px minimum height and `.kf159-feed` a 240px minimum, causing overflow beneath bottom navigation on compact Android/iPhone viewports. The mobile slide now has `min-height:0`; the feed and JS clamp use 120px as a last-resort minimum. App commit `f0c80fc4aee17d20afb3a8f563616f2e298cafd3`.

QA scope per owner: Android and iPhone/iOS only. Source inspection confirms change, but no mobile browser/device runtime test or signed native build executed. This change does not touch the shared Supabase backend, production deployment, app-store releases, or Kinfolksworld. Follow-up: verify Android Chrome/iOS Safari portrait, landscape, keyboard, fixed nav and short viewport, and validate actual video playback/actions.
