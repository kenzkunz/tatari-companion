-- Retain published site history while anonymizing deleted authors.
alter table public.site_content_versions alter column actor drop not null;
alter table public.site_content_versions drop constraint site_content_versions_actor_fkey;
alter table public.site_content_versions add constraint site_content_versions_actor_fkey foreign key(actor) references auth.users(id) on delete set null;
alter table public.site_admin_audit alter column actor drop not null;
alter table public.site_admin_audit drop constraint site_admin_audit_actor_fkey;
alter table public.site_admin_audit add constraint site_admin_audit_actor_fkey foreign key(actor) references auth.users(id) on delete set null;
alter table public.site_banner_versions alter column actor drop not null;
alter table public.site_banner_versions drop constraint site_banner_versions_actor_fkey;
alter table public.site_banner_versions add constraint site_banner_versions_actor_fkey foreign key(actor) references auth.users(id) on delete set null;
alter table public.site_version_audits alter column actor drop not null;
alter table public.site_version_audits drop constraint site_version_audits_actor_fkey;
alter table public.site_version_audits add constraint site_version_audits_actor_fkey foreign key(actor) references auth.users(id) on delete set null;
alter table public.site_version_findings alter column actor drop not null;
alter table public.site_version_findings drop constraint site_version_findings_actor_fkey;
alter table public.site_version_findings add constraint site_version_findings_actor_fkey foreign key(actor) references auth.users(id) on delete set null;
alter table public.site_guide_reviews alter column actor drop not null;
alter table public.site_guide_reviews drop constraint site_guide_reviews_actor_fkey;
alter table public.site_guide_reviews add constraint site_guide_reviews_actor_fkey foreign key(actor) references auth.users(id) on delete set null;
alter table public.site_data_versions alter column actor drop not null;
alter table public.site_data_versions drop constraint site_data_versions_actor_fkey;
alter table public.site_data_versions add constraint site_data_versions_actor_fkey foreign key(actor) references auth.users(id) on delete set null;
alter table public.farm_support_requests drop constraint farm_support_requests_submitted_by_fkey;
alter table public.farm_support_requests add constraint farm_support_requests_submitted_by_fkey foreign key(submitted_by) references auth.users(id) on delete cascade;
alter table public.farm_support_requests drop constraint farm_support_requests_reviewed_by_fkey;
alter table public.farm_support_requests add constraint farm_support_requests_reviewed_by_fkey foreign key(reviewed_by) references auth.users(id) on delete set null;
create or replace function public.delete_own_account(p_expected_actor uuid,p_confirmation text) returns void language plpgsql security definer set search_path=pg_catalog as $$
declare actor uuid:=auth.uid();uid text;
begin
 if actor is null or actor is distinct from p_expected_actor or p_confirmation is distinct from 'DELETE' then raise exception 'Account deletion requires your current account and DELETE confirmation.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if not exists(select 1 from auth.users where id=actor) then raise exception 'This account no longer exists.';end if;
 if exists(select 1 from storage.objects where owner_id=actor::text or owner=actor) then raise exception 'Your account owns uploaded site media. Contact the site owner to transfer those files before deleting your account.';end if;
 select game_id into uid from public.profiles where user_id=actor;
 delete from public.farm_support_listings where game_uid=uid;
 delete from auth.users where id=actor;
end $$;
revoke all on function public.delete_own_account(uuid,text) from public,anon;
grant execute on function public.delete_own_account(uuid,text) to authenticated;
