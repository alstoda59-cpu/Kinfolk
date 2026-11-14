-- Isolated Kinfolk Social alpha only. Never apply to shared LIVE.
-- The browser preflights and removes the signed-in user's three media prefixes
-- before calling DELETE. Postgres FK cascades clean dependent relational rows.
CREATE OR REPLACE FUNCTION public.kinfolk_delete_my_account(p_confirm text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR auth.role() <> 'authenticated' THEN
    RAISE EXCEPTION 'Authentication required' USING errcode = '28000';
  END IF;
  IF p_confirm = 'CHECK' THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid) THEN
      RAISE EXCEPTION 'Account not found';
    END IF;
    RETURN jsonb_build_object('ready', true);
  ELSIF p_confirm = 'DELETE' THEN
    DELETE FROM auth.users WHERE id = v_uid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Account not found';
    END IF;
    RETURN jsonb_build_object('deleted', true);
  ELSE
    RAISE EXCEPTION 'Invalid confirmation';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.kinfolk_delete_my_account(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.kinfolk_delete_my_account(text) TO authenticated;
