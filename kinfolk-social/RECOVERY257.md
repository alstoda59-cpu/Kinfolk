# Recovery257 | Alternate signup title compatibility across legacy auth guards

Date: 2026-10-27. Scope: full main Kinfolk Social, `kinfolk-social/` only.

## Starting point
- Branched from latest inspected `kinfolk-social/recovery256-legacy-password-policy` after comparing it with Recovery255, reviewing Library Recovery226/232 notes and Vercel previews.
- Recovery256 aligned password bounds to 12–128, but Phase98 and Phase88 core still recognized only the heading "Create your Kinfolk". The existing Phase88 wrapper already supported "Create Account". When the alternate heading was used, a delayed Phase88-core repair could clear signup minimum/maximum and mark the field as a login password.

## Changes
- `320a7300a2c5e09352987f76cb5d8d1b11ee02ea`: Phase98 now recognizes both signup headings, keeping the signup field in 12–128/new-password mode.
- `063739e699487ec788ea4147ceb87045667cbb94`: add alternate-title load-order and polling regressions to the existing Recovery256 Node test file.
- `4e530387b0c92ef634078be1ab70f4ed05f27085`: Phase88 core now recognizes both signup headings, avoiding delayed login-mode repair on signup.
- `d6754af00495e2bc96009af13683cfeb6774cce1`: add Phase88-core alternate-title regression and correct signup hint check.

## Verification and limits
- Exact fetched GitHub source for Phase88 core, Phase88 wrapper, Phase98 and the updated test file passed four V8 JavaScript syntax compilations.
- Three exact-source synthetic Phase88-core DOM checks passed: "Create your Kinfolk" and "Create Account" both produce 12–128/new-password and matching hint; "Welcome back" retains unrestricted login semantics.
- Five synthetic wrapper/load-order scenarios passed against exact fetched Phase88/Phase98 source for signup title behavior (including interval fallback).
- These are synthetic V8 checks, **not** a passing GitHub Actions Node/browser workflow, real Supabase signup, actual email confirmation or physical-device QA.
- No real accounts, backend mutations, production alias, Kinfolksworld changes, paid resources or store submissions.

## Next critical gates
Run complete Node/browser CI, verify signup/email callback and session restoration with synthetic users in designated isolated Supabase, then complete functional Capacitor packaging and Android/iPhone device QA. Keep production and shared live Supabase unchanged.
