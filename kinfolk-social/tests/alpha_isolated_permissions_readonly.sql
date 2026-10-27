-- Recovery255: read-only ACL/RLS smoke audit for the isolated Kinfolk Social Alpha Test project ONLY.
-- Expected Supabase project ref: viantpfagtbgyyzavmtv. Check the project selector BEFORE running.
-- No authentication accounts, fixtures, schema mutations, production access, or secrets are needed.
-- Treat ANY passed=false row or query error as a failed static gate.
-- This does NOT establish real JWT-based RLS, sign-up, email, upload, or device functionality.
WITH private_tables(name) AS (
  VALUES ('kinfolk_safety_settings'),('user_settings'),('kinfolk_user_preferences'),('notification_preferences'),('kinfolk_profile_extras')
), sensitive_tables(name) AS (
  VALUES ('messages'),('notifications'),('friend_requests')
), expected_columns(tbl,col) AS (
  VALUES ('messages','first_read_at'),('notifications','read_at'),('friend_requests','status')
), forbidden_columns(tbl,col) AS (
  VALUES ('messages','body'),('messages','sender_id'),('messages','receiver_id'),
         ('notifications','actor_id'),('notifications','recipient_id'),('notifications','data'),
         ('friend_requests','sender_id'),('friend_requests','receiver_id')
), checks(name,passed) AS (
  SELECT 'RLS enabled: '||c.relname, c.relrowsecurity
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
  UNION ALL
  SELECT 'RLS table count is 14',
    (SELECT count(*)=14 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p'))
  UNION ALL
  SELECT 'Anonymous private SELECT denied: '||name,
    NOT has_table_privilege('anon',format('public.%I',name),'SELECT') FROM private_tables
  UNION ALL
  SELECT 'Authenticated full-table UPDATE denied: '||name,
    NOT has_table_privilege('authenticated',format('public.%I',name),'UPDATE') FROM sensitive_tables
  UNION ALL
  SELECT 'Allowed update: '||tbl||'.'||col,
    has_column_privilege('authenticated',format('public.%I',tbl),col,'UPDATE') FROM expected_columns
  UNION ALL
  SELECT 'Forbidden update: '||tbl||'.'||col,
    NOT has_column_privilege('authenticated',format('public.%I',tbl),col,'UPDATE') FROM forbidden_columns
)
SELECT name,passed FROM checks ORDER BY name;
