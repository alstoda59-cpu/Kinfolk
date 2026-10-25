# Recovery155 profile diagnostic

User-provided Android screenshots show a profile with repeated Gold Star badges, duplicate Edit profile action, music player showing Replay / resume rather than Pause, and music restarting after page taps.

Inspected current branch source phase76 and phase81. phase76 setupMusic previously mounted an additional audio/YouTube player with a pointerdown replay handler, while phase81 independently created a player. phase81 also had a global pointerdown handler that restarted paused direct audio and a YouTube button that reloaded the iframe instead of pausing.

Isolated branch kinfolk-social/recovery155-profile-music-controls from Recovery153. Commit 65c55a5b0cb1b8aed0a1716b92b96c24bb78f1cc disables competing phase76 playback. Commit d37655aff7a5caad8a6ad819fd77820c03d12d6c removes global direct-audio restart and adds YouTube pause/play commands. Commit 24ab4dcab04c0ecbf5e9bb40f5e0339888282c64 enables YouTube iframe JS API. Commit 076350d17dff842643cd83645c80f7f8a683b40b adds synthetic source checks; commit f7e6e26df91cc8df394294f85f6196cfc745ed3a wires them into CI. Six source assertions evaluated in isolated JavaScript and passed. Real Android/YouTube playback not yet verified; autoplay restrictions and iframe command behavior require device testing.

Preview deployment dpl_Gwuq2nhUburEmFniLyjhnFLeKR81 URL https://kinfolk-social-demo-nig7e4t5c-alstoda59-9779.vercel.app/ initially INITIALIZING. Do not claim READY until checked. Other visual issues remain: multiple Gold Star badges, duplicate Edit profile action, cramped profile layout, and possible count inconsistencies across screenshots. Need investigate multiple profile renderers and badge injection. No production or shared Supabase changes.
