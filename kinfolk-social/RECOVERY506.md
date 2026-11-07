# Recovery506: synthetic DM insert confirmation fixture (2026-11-07)

Base: Recovery505 main Kinfolk Social branch. Scope: `kinfolk-social/tests/recovery300-dm-account-isolation.test.mjs` only, plus this note. No runtime, Kinfolksworld, live backend or production changes.

## Evidence
Source workflow 42304549440, job 128190482512, failed test `in-flight DM send uses captured sender and cannot reopen after switch` at line 106 (`1 !== 0`). The existing DM implementation now requires `.insert(...).select(...).single()` and a positive `count===1` with matching returned row before reopening a conversation. The old synthetic insert stub returned a bare promise, causing a TypeError and leaving the test unable to exercise the intended in-flight account-switch case.

## Correction
The synthetic insert stub now models the query builder `.select().single()` chain. The pending response resolves with one acknowledged synthetic row, a matching sender/recipient/body and count 1. After the simulated account switch, the test still requires no new conversation request and no toast. No runtime security checks were loosened.

## Verification boundary
Fixture commit `ae35633a681fbe668936196bbdaf41a5fc15256a`. This change was accepted by GitHub but no passing Recovery506 CI or local execution was established. Prior source logs also identified stale signup form regression and other failures; they are not claimed fixed here. Recovery505 final commit had a Vercel success status, not proof of backend functionality. Android APK, iOS archive, isolated Supabase Auth/RLS and physical-device tests remain unverified. Next: run the updated DM regression and full source/native workflows, diagnose remaining failures, then package Android and iOS on isolated infrastructure.
