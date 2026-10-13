begin;
create table if not exists public.formation_likes(formation_id uuid not null references public.user_formations(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null default now(),primary key(formation_id,user_id));
alter table public.formation_likes enable row level security;
revoke all on public.formation_likes from public,anon,authenticated;
create or replace function public.formation_like_v1(p_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid=auth.uid(); liked boolean;
begin
 if u is null then raise exception 'Sign in to like formations';end if;
 perform 1 from public.user_formations where id=p_id and published_payload is not null for update;
 if not found then raise exception 'Published formation unavailable';end if;
 delete from public.formation_likes where formation_id=p_id and user_id=u;
 liked=not found;
 if liked then insert into public.formation_likes(formation_id,user_id) values(p_id,u);end if;
 return jsonb_build_object('liked',liked,'likes',(select count(*) from public.formation_likes where formation_id=p_id));
end;$$;
revoke all on function public.formation_like_v1(uuid) from public,anon;
grant execute on function public.formation_like_v1(uuid) to authenticated;
create or replace function public.formation_list_public_v1() returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.published_name,'payload',f.published_payload,'published_at',f.published_at,'likes',(select count(*) from public.formation_likes l where l.formation_id=f.id),'liked',exists(select 1 from public.formation_likes l where l.formation_id=f.id and l.user_id=auth.uid())) order by f.published_at desc),'[]'::jsonb)
 from (select id,published_name,published_payload,published_at from public.user_formations where published_payload is not null order by published_at desc limit 100) f;
$$;
revoke all on function public.formation_list_public_v1() from public;
grant execute on function public.formation_list_public_v1() to anon,authenticated;
notify pgrst,'reload schema';
commit;
