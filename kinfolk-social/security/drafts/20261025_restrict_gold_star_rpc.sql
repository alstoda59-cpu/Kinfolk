-- Kinfolk Social security review draft, 2026-10-25.
-- NOT APPLIED. Do not run on shared/live Supabase without explicit owner approval.
-- No Supabase development branch existed at review time. Validate first on an
-- isolated nonproduction database with test accounts and an owner/admin role.
--
-- Read-only inspection found public.grant_gold_star(uuid,text) is a
-- SECURITY DEFINER function with EXECUTE available to anon and authenticated.
-- The function already checks auth.uid() and trusted JWT app_metadata
-- (kinfolk_role='owner' or can_grant_gold=true), so this is defense in depth,
-- not proof that an anonymous caller can grant a star.
--
-- Expected behavior:
--   anon: cannot invoke the privileged RPC at all.
--   authenticated non-admin: can invoke, but existing internal check denies it.
--   authenticated owner/delegated grantor: can invoke as before.
--   service_role / database owner: unaffected.
-- Before rollout, test all four cases in isolated nonproduction and check
-- that Gold Star grants and existing subscriptions still work.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.grant_gold_star(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_gold_star(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.grant_gold_star(uuid, text) TO authenticated;
COMMIT;

-- Read-only post-apply verification (run separately after isolated rollout):
-- SELECT
--   has_function_privilege('anon',
--     'public.grant_gold_star(uuid,text)', 'EXECUTE') AS anon_can_execute,
--   has_function_privilege('authenticated',
--     'public.grant_gold_star(uuid,text)', 'EXECUTE') AS authenticated_can_execute;
-- Expected: false, true.
