begin;
create table public.site_community_votes(entry_id uuid not null references public.site_community_entries(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,vote smallint not null check(vote in(-1,1)),updated_at timestamptz not null default now(),primary key(entry_id,user_id));
alter table public.site_community_votes enable row level security;
revoke all on public.site_community_votes from public,anon,authenticated;
create function public.community_code_votes() returns jsonb language sql stable security definer set search_path=pg_catalog as $$
select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from (select e.id,count(*) filter(where v.vote=1)::int likes,count(*) filter(where v.vote=-1)::int dislikes,coalesce(max(v.vote) filter(where v.user_id=auth.uid()),0)::int mine from public.site_community_entries e left join public.site_community_votes v on v.entry_id=e.id where e.kind='code' and e.published is not null group by e.id)t
$$;
revoke all on function public.community_code_votes() from public;
grant execute on function public.community_code_votes() to anon,authenticated;
create function public.vote_community_code(p_id uuid,p_vote integer,p_actor uuid) returns void language plpgsql security definer set search_path=pg_catalog as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or actor is distinct from p_actor or not exists(select 1 from auth.users where id=actor) then raise exception 'Sign in again to vote.' using errcode='42501';end if;
 if p_vote is null or p_vote not in(-1,0,1) then raise exception 'Invalid vote.';end if;
 perform 1 from public.site_community_entries where id=p_id and kind='code' and published is not null for share;
 if not found then raise exception 'This code is no longer published.';end if;
 if p_vote=0 then delete from public.site_community_votes where entry_id=p_id and user_id=actor;
 else insert into public.site_community_votes(entry_id,user_id,vote) values(p_id,actor,p_vote) on conflict(entry_id,user_id) do update set vote=excluded.vote,updated_at=clock_timestamp();end if;
end $$;
revoke all on function public.vote_community_code(uuid,integer,uuid) from public,anon;
grant execute on function public.vote_community_code(uuid,integer,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
