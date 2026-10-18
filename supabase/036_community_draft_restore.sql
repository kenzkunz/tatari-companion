begin;
-- Preserve an original version for launch entries created before version history existed.
insert into public.site_community_versions(entry_id,action,snapshot,actor)
select e.id,'baseline',to_jsonb(e),e.updated_by from public.site_community_entries e
where not exists(select 1 from public.site_community_versions v where v.entry_id=e.id);
-- Restore is an explicit admin action. Published content is never changed here.
create function public.community_restore_draft(p_id uuid,p_version bigint,p_revision integer,p_expected_actor uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare actor uuid:=auth.uid();entry public.site_community_entries;previous jsonb;
begin
 if actor is null or actor is distinct from p_expected_actor or not public.is_site_admin() or not exists(select 1 from auth.users where id=actor) then raise exception 'Administrator access required.' using errcode='42501';end if;
 select * into entry from public.site_community_entries where id=p_id for update;
 if not found then raise exception 'This entry no longer exists.';end if;
 if entry.revision is distinct from p_revision then raise exception 'This entry changed. Reload it before restoring.';end if;
 select snapshot->'draft' into previous from public.site_community_versions where id=p_version and entry_id=p_id;
 if previous is null then raise exception 'This version does not belong to this entry.';end if;
 perform public.validate_community_entry(entry.kind,previous);
 update public.site_community_entries set draft=previous,revision=revision+1,updated_at=clock_timestamp(),updated_by=actor where id=p_id returning * into entry;
 insert into public.site_community_versions(entry_id,action,snapshot,actor) values(p_id,'restore',to_jsonb(entry),actor);
 insert into public.site_admin_audit(actor,action,target,details) values(actor,'community.restore',p_id::text,jsonb_build_object('kind',entry.kind,'revision',entry.revision,'version',p_version));
 return to_jsonb(entry);
end $$;
revoke all on function public.community_restore_draft(uuid,bigint,integer,uuid) from public,anon;
grant execute on function public.community_restore_draft(uuid,bigint,integer,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
