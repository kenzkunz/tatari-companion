-- Bind UID claims to the account that opened the form, including during sign-in races.
create or replace function public.claim_game_uid_checked(p_uid text,p_display_name text,p_expected_actor uuid) returns text language plpgsql security invoker set search_path=pg_catalog as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Your account changed. Please retry.' using errcode='42501';end if;
 return public.claim_game_uid(p_uid,p_display_name);
end $$;
revoke all on function public.claim_game_uid_checked(text,text,uuid) from public,anon;
grant execute on function public.claim_game_uid_checked(text,text,uuid) to authenticated;
