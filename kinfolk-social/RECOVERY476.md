# Recovery476 | Preview isolation takes priority over SDK recovery

Date: 2026-11-05. Continued from Recovery475 final commit `28218aa9df3a4b05e1de0360316045786677c48a` on isolated branch `kinfolk-social/recovery476-preview-auth-recovery-priority-20261105`.

## Code changes
- `8d085444827e628a4e52f245b076fb0d427347a1`: the shipped SDK-failure recovery overlay now yields to the existing blocked-preview warning. A preview without the external Supabase SDK no longer offers a misleading "Try again" button; native/off-preview startup retains the recovery overlay.
- `b35229b252003e9dfeb865e81f53eb25e4ee2b38`: source-executed synthetic DOM test for blocked preview and native/off-preview behavior.
- `64fbd98a931521dab132d86d3e9e0fb0751a7d65`: run the new test in the existing preview-isolation workflow and trigger on its changes.

This is a narrow mobile-startup correctness fix, not completed auth or native packaging. The dark design and all existing features are preserved.

## Evidence and limitations
GitHub accepted the commits. The new test was committed but not independently executed in this run; CI success and final Vercel READY must be verified separately. No real backend, email delivery, RLS, storage, installable Android/iOS binaries or physical-device tests were performed.

## Release blockers
Isolated Supabase organization and any nonzero cost require owner confirmation. Two synthetic accounts and isolated backend RLS/private media checks, signup/email confirmation/session restore, uploads/messaging and native QA remain outstanding. No shared live Supabase, production aliases, Kinfolksworld or store submissions changed.
