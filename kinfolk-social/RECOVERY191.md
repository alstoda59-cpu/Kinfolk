# Recovery191 | Login activation screen-race regressions

Date: 2026-10-25. Full main Kinfolk Social only. Based on Recovery190.

Inspected Phase95, Recovery189 notes, Recovery188 regression fixture, and recent Vercel deployment history before changing source. Added `tests/recovery191-activation-screen-race.test.cjs`, commit `adb7b2feb38c1933a227cdbf70d3cad79bd80144`.

Two synthetic Node scenarios exercise the existing Recovery189 guard: login switches to signup while Supabase `setSession` is pending, and login form detaches while `setSession` is pending. Both assert account activation is skipped and Stay Logged In preference rollback is invoked.

No app source change in this checkpoint. The new tests are committed but not yet executed. GitHub Actions workflow not modified. No Recovery191 preview verified. Most recent confirmed READY isolated preview at inspection is Recovery188 `dpl_E4MvTqTKxkLS59DEuf9tGWFeGtPR`, target null, which does not include later commits. Real backend/browser and physical Android/iPhone tests remain pending. No production, shared Supabase or Kinfolksworld changes.
