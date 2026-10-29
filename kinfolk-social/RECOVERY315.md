# Recovery315 | Account-safe moderation reporting with confirmed writes

Date: 2026-10-29 (America/Los_Angeles). Scope: FULL MAIN Kinfolk Social in `kinfolk-social/` only, excluding Kinfolksworld. Continued directly from Recovery314, preserving the dark mobile design, account creation, Reels, Channels, Communities, profiles, uploads and native packaging.

## Baseline inspection
- Verified Recovery314 branch/report, README, native package/verification scripts, report controls and Recovery244 report-peer regression; checked Recovery315 was not already implemented.
- Library prelaunch and Recovery142/232 notes reinforce private media, auth, teen/RLS and physical-device launch gates.
- Read-only isolated Supabase project `viantpfagtbgyyzavmtv`: 14 public tables with RLS, all zero rows. `kinfolk_reports` has an authenticated INSERT policy checking `auth.uid() = reporter_id`, but no member SELECT policy. No database writes were made.
- Latest Recovery314 Vercel application/test preview was READY at `abaeaa3a`. Production and shared live backend untouched.

## Source changes
- `54c326c7b5fdfa2f846ee4c685f784e36dcfaf1a`: report submit requires `count:'exact'` and exactly one affected row before success. No `.select()` is required, preserving the reports table's insert-only member access. Pending reports pin reporter, target and modal token; account switches, fast modal replacements and duplicate taps cannot display stale success or bind an old target to a new form.
- `890f2701b0f6b25049dd338e229fa4df8f5dd686`: ten source-backed synthetic Node tests cover success, missing/zero/multiple count, denied insert, double taps, account switching, replaced modals, stale timers and self-report guards.
- `1fc3097e8d0af24901e8dd8cc831685063264811`: require new tests in native `alpha:verify`.
- `33f76931ff8df1dae912108ace53624978473e51`: require report safety module in packaged Android/iOS assets.
- `41f8f5b87bfae0bde71294258ac4830aa77eae7b`: add startup logger to source-backed VM fixture after first CI failure.
- `d46263c3a3643a019b921a079284465d4f2f4a42`: adapt existing Recovery244 source-backed fixture to new modal-token API and affected-row count after second CI failure.
- Draft PR #15 targets Recovery314, not main or production: https://github.com/alstoda59-cpu/Kinfolk/pull/15 .

## Evidence and boundaries
- Initial CI run 40865270645 failed ten new synthetic cases because the VM fixture omitted console.log. Fixture repaired.
- CI run 40865345672 passed 550/551 Node cases; its single failure was the old Recovery244 fixture expecting the removed two-argument signature. Fixture repaired without reverting production safeguards.
- CI run 40865424210 completed its **Complete Node regression suite (synthetic only)** step SUCCESS after those repairs. Full workflow status should be checked separately; a passed Node stage is not proof of browser/native/real backend QA.
- Nonproduction Vercel deployment for code/test commit `33f76931` is READY: https://kinfolk-social-demo-e8h37vvzp-alstoda59-9779.vercel.app/ . Later fixture commit `d46263c3` hit Vercel build-rate limits. Preview source still references shared live Supabase: DO NOT submit real or synthetic user data to that web preview.
- No actual report insert, signup/email verification, two-account RLS test, current APK/iOS build, physical-device test, production promotion or app-store submission was performed.

## Remaining launch gates
- Isolated Supabase still lacks Communities, membership, channel/video and other feature tables; real auth/RLS and upload/messaging/teen privacy end-to-end tests remain blocked pending approved isolated environment organization and any nonzero cost.
- Produce current Android and iPhone installable alpha builds and test on physical devices with isolated synthetic accounts and approved email redirect allowlist.
- No shared live Supabase schema/data/auth/security, production deployment/aliases, Kinfolksworld, paid infrastructure or app stores changed.
