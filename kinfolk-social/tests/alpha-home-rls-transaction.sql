-- Run ONLY against isolated alpha Supabase project viantpfagtbgyyzavmtv.
-- All synthetic auth users and rows are rolled back. Never run on production.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('44444444-4444-4444-8444-444444444444','alpha-forgery-a@invalid.example','{"username":"forgery_a","signup_birthdate":"2000-01-01"}'::jsonb),
 ('55555555-5555-4555-8555-555555555555','alpha-forgery-b@invalid.example','{"username":"forgery_b","signup_birthdate":"2000-01-01"}'::jsonb);
insert into public.posts(id,author_id,body) values
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','55555555-5555-4555-8555-555555555555','Private post');
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
set local role authenticated;
do $test$ declare denied boolean; affected integer; begin
  if (select count(*) from public.posts)<>0 then raise exception 'Private post leaked';end if;
  denied:=false;
  begin
    insert into public.posts(author_id,body) values('55555555-5555-4555-8555-555555555555','Forged');
  exception when insufficient_privilege then denied:=true;
  end;
  if not denied then raise exception 'Forged post was allowed';end if;
  denied:=false;
  begin
    insert into public.comments(post_id,author_id,body)
    values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','44444444-4444-4444-8444-444444444444','Private comment');
  exception when insufficient_privilege then denied:=true;
  end;
  if not denied then raise exception 'Comment on private post was allowed';end if;
  denied:=false;
  begin
    insert into public.post_likes(post_id,user_id)
    values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','44444444-4444-4444-8444-444444444444');
  exception when insufficient_privilege then denied:=true;
  end;
  if not denied then raise exception 'Like on private post was allowed';end if;
  delete from public.posts where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'Other user deleted private post';end if;
end $test$;
reset role;
rollback;
