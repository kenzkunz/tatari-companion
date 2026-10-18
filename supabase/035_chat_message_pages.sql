begin;
-- Cursor pagination remains private and within the existing seven-day window.
create function public.exchange_thread_page(p_peer uuid,p_expected_actor uuid,p_before_at timestamptz default null,p_before_id uuid default null) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare actor uuid:=auth.uid();since_at timestamptz;seen timestamptz;candidates jsonb;messages jsonb;more boolean;
begin
 if actor is null or actor is distinct from p_expected_actor or not exists(select 1 from auth.users where id=actor) then raise exception 'Your account changed. Sign in again.' using errcode='42501';end if;
 if p_peer is null or p_peer=actor or not exists(select 1 from public.profiles where user_id=p_peer) then raise exception 'Player is unavailable.';end if;
 if (p_before_at is null)<>(p_before_id is null) then raise exception 'Invalid message cursor.';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 perform pg_advisory_xact_lock(hashtextextended(least(actor,p_peer)::text||greatest(actor,p_peer)::text,1));
 select coalesce(deleted_at,'-infinity') into since_at from public.exchange_chat_state where owner_id=actor and peer_id=p_peer;
 since_at:=greatest(coalesce(since_at,'-infinity'),now()-interval '7 days');
 select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'text',m.body,'at',extract(epoch from m.created_at)*1000,'cursor_at',m.created_at,'mine',m.sender_id=actor,'read',m.created_at<=coalesce(other.read_at,'-infinity')) order by m.created_at desc,m.id desc),'[]'::jsonb) into candidates
 from(select * from public.exchange_messages where ((sender_id=actor and recipient_id=p_peer) or(sender_id=p_peer and recipient_id=actor)) and created_at>since_at and (p_before_at is null or (created_at,id)<(p_before_at,p_before_id)) order by created_at desc,id desc limit 201)m
 left join public.exchange_chat_state other on other.owner_id=p_peer and other.peer_id=actor;
 more:=jsonb_array_length(candidates)>200;
 select coalesce(jsonb_agg(value order by ordinal desc),'[]'::jsonb) into messages from jsonb_array_elements(candidates) with ordinality t(value,ordinal) where ordinal<=200;
 if p_before_at is null then
  select max(created_at) into seen from public.exchange_messages where sender_id=p_peer and recipient_id=actor and created_at>since_at;
  if seen is not null then insert into public.exchange_chat_state(owner_id,peer_id,read_at) values(actor,p_peer,seen) on conflict(owner_id,peer_id) do update set read_at=excluded.read_at where exchange_chat_state.read_at<excluded.read_at;end if;
 end if;
 return jsonb_build_object('messages',messages,'has_more',more,'visible_since',case when since_at>now()-interval '7 days' then extract(epoch from since_at)*1000 else 0 end,'blocked',public.exchange_blocked(actor,p_peer),'blocked_by_me',exists(select 1 from public.exchange_blocks where owner_id=actor and peer_id=p_peer));
end $$;
revoke all on function public.exchange_thread_page(uuid,uuid,timestamptz,uuid) from public,anon;
grant execute on function public.exchange_thread_page(uuid,uuid,timestamptz,uuid) to authenticated;

notify pgrst,'reload schema';
commit;
