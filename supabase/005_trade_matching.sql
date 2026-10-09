begin;
alter table public.profiles add column if not exists trade_enabled boolean not null default false;
alter table public.profiles add column if not exists avatar_url text not null default '' check(char_length(avatar_url)<=2048 and (avatar_url='' or avatar_url ~ '^https://(cdn[.]discordapp[.]com|lh[0-9][.]googleusercontent[.]com)/'));
-- Profiles/inventory remain owner-only. Only opt-in trade data is projected by these RPCs.
create function public.trade_card_available(p_season text,p_card smallint) returns boolean language sql stable security definer set search_path=pg_catalog as $$select exists(select 1 from public.album_cards c where c.season_id=p_season and c.card_number=p_card and (not c.gold or public.album_exchange_status(p_season)))$$;
create function public.trade_accepts(p_user uuid,p_season text,give_star smallint,receive_star smallint) returns boolean language sql stable security definer set search_path=pg_catalog as $$select coalesce((select p.accept_any or (receive_star=give_star and p.accept_equal) or (receive_star=give_star+1 and p.accept_up) or (receive_star=give_star-1 and p.accept_down) from public.album_trade_preferences p where p.user_id=p_user and p.season_id=p_season),receive_star=give_star)$$;
revoke all on function public.trade_card_available(text,smallint),public.trade_accepts(uuid,text,smallint,smallint) from public,anon,authenticated;
create function public.trade_listings(p_season text,p_set integer default null,p_star integer default null,p_limit integer default 30,p_offset integer default 0) returns jsonb language sql stable security definer set search_path=pg_catalog as $$
with listings as (
 select p.user_id,p.display_name,p.avatar_url,
 (select max(i.updated_at) from public.card_inventory i where i.user_id=p.user_id and i.season_id=p_season and i.quantity>=2 and public.trade_card_available(p_season,i.card_number)) freshness,
 (select jsonb_agg(i.card_number order by i.card_number) from public.card_inventory i join public.album_cards c using(season_id,card_number) where i.user_id=p.user_id and i.season_id=p_season and i.quantity>=2 and public.trade_card_available(p_season,i.card_number) and (p_set is null or c.set_number=p_set) and (p_star is null or c.stars=p_star)) ft,
 (select coalesce(jsonb_agg(jsonb_build_object('give',a.card_number,'receive',b.card_number) order by a.card_number,b.card_number),'[]'::jsonb) from public.card_inventory yours join public.album_cards a on a.season_id=yours.season_id and a.card_number=yours.card_number cross join public.card_inventory theirs join public.album_cards b on b.season_id=theirs.season_id and b.card_number=theirs.card_number where yours.user_id=auth.uid() and yours.season_id=p_season and yours.quantity>=2 and theirs.user_id=p.user_id and theirs.season_id=p_season and theirs.quantity>=2 and public.trade_card_available(p_season,a.card_number) and public.trade_card_available(p_season,b.card_number) and (p_set is null or b.set_number=p_set) and (p_star is null or b.stars=p_star) and not exists(select 1 from public.card_inventory k where k.user_id=p.user_id and k.season_id=p_season and k.card_number=a.card_number and k.quantity>0) and not exists(select 1 from public.card_inventory k where k.user_id=auth.uid() and k.season_id=p_season and k.card_number=b.card_number and k.quantity>0) and public.trade_accepts(auth.uid(),p_season,a.stars,b.stars) and public.trade_accepts(p.user_id,p_season,b.stars,a.stars)) swaps
 from public.profiles p where p.trade_enabled and p.user_id is distinct from auth.uid()
),page as (select * from listings where ft is not null order by freshness desc,user_id limit least(50,greatest(1,p_limit)) offset greatest(0,p_offset))
select coalesce(jsonb_agg(jsonb_build_object('id',user_id,'name',display_name,'avatar',avatar_url,'updated_at',freshness,'ft',ft,'swaps',swaps) order by freshness desc,user_id),'[]'::jsonb) from page
$$;
revoke all on function public.trade_listings(text,integer,integer,integer,integer) from public;grant execute on function public.trade_listings(text,integer,integer,integer,integer) to anon,authenticated;
create function public.trade_contacts(p_season text,p_partner uuid,p_give smallint,p_receive smallint) returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare result jsonb;uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Login required';end if;
 if p_partner=uid then raise exception 'Choose another trader';end if;
 if not exists(select 1 from public.card_inventory yours join public.album_cards a using(season_id,card_number) cross join public.card_inventory theirs join public.album_cards b on b.season_id=theirs.season_id and b.card_number=theirs.card_number join public.profiles p on p.user_id=theirs.user_id where yours.user_id=uid and yours.season_id=p_season and yours.card_number=p_give and yours.quantity>=2 and theirs.user_id=p_partner and theirs.season_id=p_season and theirs.card_number=p_receive and theirs.quantity>=2 and p.trade_enabled and public.trade_card_available(p_season,p_give) and public.trade_card_available(p_season,p_receive) and not exists(select 1 from public.card_inventory k where k.user_id=p_partner and k.season_id=p_season and k.card_number=p_give and k.quantity>0) and public.trade_accepts(uid,p_season,a.stars,b.stars) and public.trade_accepts(p_partner,p_season,b.stars,a.stars)) then raise exception 'This swap is no longer available';end if;
 select jsonb_build_object('name',p.display_name,'game_id',case when p.share_game_id then nullif(p.game_id,'') else null end,'discord_username',case when p.share_discord then nullif(p.discord_username,'') else null end) into result from public.profiles p where p.user_id=p_partner and p.trade_enabled;
 return result;
end $$;
revoke all on function public.trade_contacts(text,uuid,smallint,smallint) from public,anon;grant execute on function public.trade_contacts(text,uuid,smallint,smallint) to authenticated;
create function public.find_trade_routes(p_season text,p_target smallint) returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare uid uuid:=auth.uid();result jsonb;budget integer;
begin
 if uid is null then raise exception 'Login required';end if;
 select coalesce(p.trades_left_today,3) into budget from public.album_trade_preferences p where p.user_id=uid and p.season_id=p_season;budget:=coalesce(budget,3);
 if not public.trade_card_available(p_season,p_target) then raise exception 'Card unavailable or Gold Exchange locked';end if;
 with recursive route(held,path,visited,trail,depth,priority,freshness) as (
 select i.card_number,'[]'::jsonb,array[]::uuid[],array[i.card_number]::smallint[],0,0::numeric,now() from public.card_inventory i where i.user_id=uid and i.season_id=p_season and i.quantity>=2 and public.trade_card_available(p_season,i.card_number)
 union all
 select edge.card_number,r.path||jsonb_build_array(jsonb_build_object('id',edge.user_id,'name',edge.display_name,'give',r.held,'receive',edge.card_number)),r.visited||edge.user_id,r.trail||edge.card_number,r.depth+1,r.priority+edge.priority,least(r.freshness,edge.updated_at)
 from route r join public.album_cards held on held.season_id=p_season and held.card_number=r.held join lateral (
 select p.user_id,p.display_name,offered.card_number,offered.updated_at,coalesce(pr.priority,2) priority from public.profiles p join public.card_inventory offered on offered.user_id=p.user_id and offered.season_id=p_season and offered.quantity>=2 join public.album_cards received on received.season_id=p_season and received.card_number=offered.card_number left join public.album_priorities pr on pr.user_id=p.user_id and pr.season_id=p_season and pr.set_number=held.set_number
 where r.depth<least(3,budget) and r.held<>p_target and p.trade_enabled and p.user_id<>uid and not(p.user_id=any(r.visited)) and not(offered.card_number=any(r.trail)) and public.trade_card_available(p_season,offered.card_number) and not exists(select 1 from public.card_inventory wanted where wanted.user_id=p.user_id and wanted.season_id=p_season and wanted.card_number=r.held and wanted.quantity>0) and public.trade_accepts(uid,p_season,held.stars,received.stars) and public.trade_accepts(p.user_id,p_season,received.stars,held.stars) and (offered.card_number=p_target or exists(select 1 from public.card_inventory owned where owned.user_id=uid and owned.season_id=p_season and owned.card_number=offered.card_number and owned.quantity>=1))
 order by (offered.card_number=p_target) desc,coalesce(pr.priority,2) desc,offered.updated_at desc,p.user_id,offered.card_number limit 20
 ) edge on true
 ),best as (select path,depth,priority/depth score,freshness from route where held=p_target and depth>0 order by depth,priority/depth desc,freshness desc limit 20)
 select coalesce(jsonb_agg(jsonb_build_object('steps',path,'length',depth,'priority',score,'updated_at',freshness) order by depth,score desc,freshness desc),'[]'::jsonb) into result from best;
 return result;
end $$;
revoke all on function public.find_trade_routes(text,smallint) from public,anon;grant execute on function public.find_trade_routes(text,smallint) to authenticated;
commit;
