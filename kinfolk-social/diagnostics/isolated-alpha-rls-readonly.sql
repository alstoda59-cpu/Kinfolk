-- Recovery433: READ-ONLY isolated alpha RLS readiness inventory.
-- Run ONLY against project viantpfagtbgyyzavmtv (Kinfolk Social Alpha Test).
-- NEVER run against shared live project zojajuzmfjpvubzibzgg.
-- This checks policy presence, NOT actual two-account enforcement.
WITH expected(tablename) AS (
  VALUES ('profiles'),('user_settings'),('kinfolk_safety_settings'),
         ('posts'),('comments'),('post_likes'),('messages'),
         ('group_conversations'),('group_members'),('group_messages'),
         ('notifications'),('notification_preferences'),('blocks'),
         ('kinfolk_videos'),('kinfolk_video_reactions'),
         ('photo_albums'),('album_photos')
), inventory AS (
  SELECT e.tablename, c.oid IS NOT NULL AS table_exists,
         coalesce(c.relrowsecurity,false) AS rls_enabled,
         count(p.policyname) AS policy_count
  FROM expected e
  LEFT JOIN pg_namespace n ON n.nspname='public'
  LEFT JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=e.tablename AND c.relkind='r'
  LEFT JOIN pg_policies p ON p.schemaname='public' AND p.tablename=e.tablename
  GROUP BY e.tablename,c.oid,c.relrowsecurity
)
SELECT tablename, table_exists, rls_enabled, policy_count,
       (table_exists AND rls_enabled AND policy_count>0) AS metadata_gate_pass
FROM inventory ORDER BY tablename;

-- Read-only aggregate; zero users means email verification and two-user RLS
-- cannot yet be validated end-to-end. Do not print identities or emails.
SELECT (SELECT count(*) FROM auth.users) AS synthetic_auth_users,
       (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity) AS public_tables_without_rls;
