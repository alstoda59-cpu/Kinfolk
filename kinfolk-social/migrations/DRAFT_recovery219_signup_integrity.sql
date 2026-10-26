-- DRAFT ONLY: Recovery219 Kinfolk Social signup integrity.
-- DO NOT APPLY to the shared Supabase project without owner approval.
-- Test on an isolated database, including existing account migrations and
-- concurrent signups, before any production review.
--
-- Findings from read-only schema inspection on 2026-10-25:
-- public.profiles.username is UNIQUE but case-sensitive;
-- kinfolk_private.handle_new_user() silently substitutes a generated username
-- after a unique_violation. kinfolk_user_preferences.locale is not initialized
-- by the current signup trigger. apply_signup_profile_style() already reads
-- raw_user_meta_data.profile_bio and profile_display_name.
--
-- Preflight: report collisions, then stop instead of rewriting existing users.
BEGIN;

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
    GROUP BY lower(username)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Case-insensitive username collisions exist; resolve in isolated staging before this migration';
  END IF;
END
$preflight$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_casefold_unique_idx
  ON public.profiles (lower(username));

CREATE OR REPLACE FUNCTION kinfolk_private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  requested_username text;
  requested_display text;
  claimed_birthdate date;
  claimed_gender text;
  claimed_locale text;
  age_years int;
  raw_birth text;
BEGIN
  requested_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    'user_' || left(replace(new.id::text, '-', ''), 12)
  );
  requested_display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    requested_username
  );
  IF requested_username !~ '^[A-Za-z0-9_]{3,24}$' THEN
    requested_username := 'user_' || left(replace(new.id::text, '-', ''), 12);
  END IF;

  raw_birth := nullif(trim(new.raw_user_meta_data->>'signup_birthdate'), '');
  IF raw_birth IS NULL THEN
    RAISE EXCEPTION 'Birthday is required to create a Kinfolk account';
  END IF;
  IF raw_birth !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
    RAISE EXCEPTION 'Invalid signup birthday';
  END IF;
  BEGIN
    claimed_birthdate := raw_birth::date;
  EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
    RAISE EXCEPTION 'Invalid signup birthday';
  END;
  age_years := date_part('year', age(current_date, claimed_birthdate))::int;
  IF age_years < 13 OR age_years > 99 THEN
    RAISE EXCEPTION 'Kinfolk registration requires ages 13 through 99';
  END IF;

  -- The index is the authoritative concurrent uniqueness check. Never
  -- silently substitute a different handle when the requested one is taken.
  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(requested_username)
  ) THEN
    RAISE EXCEPTION 'Username is already taken' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (new.id, requested_username, left(requested_display, 80))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.kinfolk_safety_settings
    (user_id, birth_date, mature_content_preference, direct_messages, discoverable, daily_limit_minutes)
  VALUES (
    new.id, claimed_birthdate, 'hide', 'friends', false,
    CASE WHEN age_years < 18 THEN 480 ELSE NULL END
  )
  ON CONFLICT (user_id) DO UPDATE
    SET birth_date = excluded.birth_date
    WHERE public.kinfolk_safety_settings.birth_date IS NULL;

  -- Locale is a preference, not a claim of age or identity.
  claimed_locale := lower(coalesce(nullif(trim(new.raw_user_meta_data->>'preferred_language'), ''), 'en'));
  IF claimed_locale NOT IN ('en', 'es', 'fr', 'pt', 'de') THEN
    claimed_locale := 'en';
  END IF;
  INSERT INTO public.kinfolk_user_preferences (user_id, locale)
  VALUES (new.id, claimed_locale)
  ON CONFLICT (user_id) DO UPDATE SET locale = excluded.locale;

  claimed_gender := new.raw_user_meta_data->>'signup_gender';
  IF claimed_gender IN ('Female', 'Male', 'Nonbinary', 'Prefer not to say') THEN
    INSERT INTO public.kinfolk_profile_extras (user_id, gender)
    VALUES (new.id, claimed_gender)
    ON CONFLICT (user_id) DO UPDATE SET gender = excluded.gender;
  END IF;

  RETURN new;
END
$function$;

COMMIT;

-- Isolated staging verification (do not run against real user accounts):
-- 1. Valid 13 and 18 boundary signups and rejected under-13/over-99.
-- 2. Existing username exact/case-variant duplicate fails, never auto-renamed.
-- 3. Two simultaneous requests for same username: at most one succeeds.
-- 4. profile_bio and profile_display_name persist through existing style trigger.
-- 5. Preferred locale is stored in kinfolk_user_preferences for new account.
-- 6. Email-confirmation pending, no-session, session restore and rollback.
-- 7. No existing profiles, preferences, or teen safety rows are modified.
-- 8. Verify how Supabase Auth surfaces a unique_violation; GoTrue may
--    return a generic database error rather than the trigger message.
-- Interests remain auth metadata only; a separately reviewed persistence
-- design is needed before promising profile-level interest display.
