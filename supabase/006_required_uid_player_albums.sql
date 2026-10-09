begin;
-- Stop for manual review rather than silently changing existing account identifiers.
do $$begin
 if exists(select 1 from public.profiles where game_id<>'' and game_id !~ '^(0|[1-9][0-9]{0,19})$') then raise exception 'Existing UIDs require review before applying this migration';end if;
 if exists(select game_id from public.profiles where game_id<>'' group by game_id having count(*)>1) then raise exception 'Duplicate UIDs require review before applying this migration';end if;
end $$;
create unique index profiles_game_uid_unique on public.profiles(game_id) where game_id<>'';
alter table public.profiles add constraint profiles_uid_format check(game_id='' or game_id ~ '^(0|[1-9][0-9]{0,19})$');
alter table public.profiles add column album_public boolean not null default false;
alter table public.profiles add constraint profiles_public_requires_uid check(not album_public or game_id<>'');
revoke delete on public.profiles from authenticated;
create function public.lock_profile_uid() returns trigger language plpgsql set search_path=pg_catalog as $$begin if old.game_id<>'' and new.game_id is distinct from old.game_id then raise exception 'Your in-game UID cannot be changed';end if;return new;end $$;
create trigger immutable_profile_uid before update of game_id on public.profiles for each row execute function public.lock_profile_uid();
create function public.claim_game_uid(p_uid text,p_display_name text default 'Player') returns text language plpgsql security definer set search_path=pg_catalog as $$
declare uid uuid:=auth.uid();existing text;
begin
 if uid is null then raise exception 'Login required';end if;
 p_uid:=btrim(p_uid);if p_uid is null or p_uid !~ '^(0|[1-9][0-9]{0,19})$' then raise exception 'Enter a numeric in-game UID without leading zeroes';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select p.game_id into existing from public.profiles p where p.user_id=uid for update;
 if coalesce(existing,'')<>'' then if existing=p_uid then return existing;else raise exception 'Your in-game UID cannot be changed';end if;end if;
 insert into public.profiles(user_id,display_name,game_id,share_game_id) values(uid,left(coalesce(nullif(btrim(p_display_name),''),'Player'),40),p_uid,true) on conflict(user_id) do update set game_id=excluded.game_id,share_game_id=true;
 return p_uid;
exception when unique_violation then raise exception 'This UID is already registered';
end $$;
revoke all on function public.claim_game_uid(text,text) from public,anon;grant execute on function public.claim_game_uid(text,text) to authenticated;
create function public.self_game_uid() returns text language sql stable security invoker set search_path=pg_catalog as $$select nullif(p.game_id,'') from public.profiles p where p.user_id=auth.uid()$$;
revoke all on function public.self_game_uid() from public,anon;grant execute on function public.self_game_uid() to authenticated;
create function public.require_account_uid() returns trigger language plpgsql security definer set search_path=pg_catalog as $$begin if not exists(select 1 from public.profiles p where p.user_id=new.user_id and p.game_id<>'') then raise exception 'Save your in-game UID before using account features';end if;return new;end $$;
create trigger settings_require_uid before insert or update on public.user_settings for each row execute function public.require_account_uid();
create trigger inventory_require_uid before insert or update on public.card_inventory for each row execute function public.require_account_uid();
create trigger priorities_require_uid before insert or update on public.album_priorities for each row execute function public.require_account_uid();
create trigger trade_preferences_require_uid before insert or update on public.album_trade_preferences for each row execute function public.require_account_uid();
alter table public.album_seasons add column game_album_id smallint unique;
update public.album_seasons set game_album_id=4 where id='autumn-tales';
create function public.get_player_album(p_uid text,p_album smallint default 4) returns jsonb language sql stable security definer set search_path=pg_catalog as $$
select jsonb_build_object('uid',p.game_id,'name',p.display_name,'avatar',p.avatar_url,'season',s.id,'inventory',(select coalesce(jsonb_agg(jsonb_build_object('card_number',i.card_number,'quantity',i.quantity) order by i.card_number),'[]'::jsonb) from public.card_inventory i where i.user_id=p.user_id and i.season_id=s.id)) from public.profiles p cross join public.album_seasons s where p.game_id<>'' and p.game_id=p_uid and (p.album_public or p.trade_enabled) and s.game_album_id=p_album
$$;
revoke all on function public.get_player_album(text,smallint) from public;grant execute on function public.get_player_album(text,smallint) to anon,authenticated;
-- Add the public game UID to opted-in listing projections; internal user IDs are still used by Connect.
create or replace function public.trade_listings(p_season text,p_set integer default null,p_star integer default null,p_limit integer default 30,p_offset integer default 0) returns jsonb language sql stable security definer set search_path=pg_catalog as $$
with listings as (
 select p.user_id,p.game_id,p.display_name,p.avatar_url,
 (select max(i.updated_at) from public.card_inventory i where i.user_id=p.user_id and i.season_id=p_season and i.quantity>=2 and public.trade_card_available(p_season,i.card_number)) freshness,
 (select jsonb_agg(i.card_number order by i.card_number) from public.card_inventory i join public.album_cards c using(season_id,card_number) where i.user_id=p.user_id and i.season_id=p_season and i.quantity>=2 and public.trade_card_available(p_season,i.card_number) and (p_set is null or c.set_number=p_set) and (p_star is null or c.stars=p_star)) ft,
 (select coalesce(jsonb_agg(jsonb_build_object('give',a.card_number,'receive',b.card_number) order by a.card_number,b.card_number),'[]'::jsonb) from public.card_inventory yours join public.album_cards a on a.season_id=yours.season_id and a.card_number=yours.card_number cross join public.card_inventory theirs join public.album_cards b on b.season_id=theirs.season_id and b.card_number=theirs.card_number where yours.user_id=auth.uid() and exists(select 1 from public.profiles own where own.user_id=auth.uid() and own.game_id<>'') and yours.season_id=p_season and yours.quantity>=2 and theirs.user_id=p.user_id and theirs.season_id=p_season and theirs.quantity>=2 and public.trade_card_available(p_season,a.card_number) and public.trade_card_available(p_season,b.card_number) and (p_set is null or b.set_number=p_set) and (p_star is null or b.stars=p_star) and not exists(select 1 from public.card_inventory k where k.user_id=p.user_id and k.season_id=p_season and k.card_number=a.card_number and k.quantity>0) and not exists(select 1 from public.card_inventory k where k.user_id=auth.uid() and k.season_id=p_season and k.card_number=b.card_number and k.quantity>0) and public.trade_accepts(auth.uid(),p_season,a.stars,b.stars) and public.trade_accepts(p.user_id,p_season,b.stars,a.stars)) swaps
 from public.profiles p where p.trade_enabled and p.game_id<>'' and p.user_id is distinct from auth.uid()
),page as (select * from listings where ft is not null order by freshness desc,user_id limit least(50,greatest(1,p_limit)) offset greatest(0,p_offset))
select coalesce(jsonb_agg(jsonb_build_object('id',user_id,'uid',game_id,'name',display_name,'avatar',avatar_url,'updated_at',freshness,'ft',ft,'swaps',swaps) order by freshness desc,user_id),'[]'::jsonb) from page
$$;
create or replace function public.trade_contacts(p_season text,p_partner uuid,p_give smallint,p_receive smallint) returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare result jsonb;uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Login required';end if;
 if not exists(select 1 from public.profiles own where own.user_id=uid and own.game_id<>'') then raise exception 'Save your in-game UID first';end if;
 if p_partner=uid then raise exception 'Choose another trader';end if;
 if not exists(select 1 from public.card_inventory yours join public.album_cards a using(season_id,card_number) cross join public.card_inventory theirs join public.album_cards b on b.season_id=theirs.season_id and b.card_number=theirs.card_number join public.profiles p on p.user_id=theirs.user_id where yours.user_id=uid and yours.season_id=p_season and yours.card_number=p_give and yours.quantity>=2 and theirs.user_id=p_partner and theirs.season_id=p_season and theirs.card_number=p_receive and theirs.quantity>=2 and p.trade_enabled and p.game_id<>'' and public.trade_card_available(p_season,p_give) and public.trade_card_available(p_season,p_receive) and not exists(select 1 from public.card_inventory k where k.user_id=p_partner and k.season_id=p_season and k.card_number=p_give and k.quantity>0) and public.trade_accepts(uid,p_season,a.stars,b.stars) and public.trade_accepts(p_partner,p_season,b.stars,a.stars)) then raise exception 'This swap is no longer available';end if;
 select jsonb_build_object('name',p.display_name,'game_id',nullif(p.game_id,''),'discord_username',case when p.share_discord then nullif(p.discord_username,'') else null end) into result from public.profiles p where p.user_id=p_partner and p.trade_enabled;
 return result;
end $$;

create or replace function public.find_trade_routes(p_season text,p_target smallint) returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare uid uuid:=auth.uid();result jsonb;budget integer;
begin
 if uid is null then raise exception 'Login required';end if;if not exists(select 1 from public.profiles own where own.user_id=uid and own.game_id<>'') then raise exception 'Save your in-game UID first';end if;
 select coalesce(p.trades_left_today,3) into budget from public.album_trade_preferences p where p.user_id=uid and p.season_id=p_season;budget:=coalesce(budget,3);
 if not public.trade_card_available(p_season,p_target) then raise exception 'Card unavailable or Gold Exchange locked';end if;
 with recursive route(held,path,visited,trail,depth,priority,freshness) as (
 select i.card_number,'[]'::jsonb,array[]::uuid[],array[i.card_number]::smallint[],0,0::numeric,now() from public.card_inventory i where i.user_id=uid and i.season_id=p_season and i.quantity>=2 and public.trade_card_available(p_season,i.card_number)
 union all
 select edge.card_number,r.path||jsonb_build_array(jsonb_build_object('id',edge.user_id,'name',edge.display_name,'give',r.held,'receive',edge.card_number)),r.visited||edge.user_id,r.trail||edge.card_number,r.depth+1,r.priority+edge.priority,least(r.freshness,edge.updated_at)
 from route r join public.album_cards held on held.season_id=p_season and held.card_number=r.held join lateral (
 select p.user_id,p.display_name,offered.card_number,offered.updated_at,coalesce(pr.priority,2) priority from public.profiles p join public.card_inventory offered on offered.user_id=p.user_id and offered.season_id=p_season and offered.quantity>=2 join public.album_cards received on received.season_id=p_season and received.card_number=offered.card_number left join public.album_priorities pr on pr.user_id=p.user_id and pr.season_id=p_season and pr.set_number=held.set_number
 where r.depth<least(3,budget) and r.held<>p_target and p.trade_enabled and p.game_id<>'' and p.user_id<>uid and not(p.user_id=any(r.visited)) and not(offered.card_number=any(r.trail)) and public.trade_card_available(p_season,offered.card_number) and not exists(select 1 from public.card_inventory wanted where wanted.user_id=p.user_id and wanted.season_id=p_season and wanted.card_number=r.held and wanted.quantity>0) and public.trade_accepts(uid,p_season,held.stars,received.stars) and public.trade_accepts(p.user_id,p_season,received.stars,held.stars) and (offered.card_number=p_target or exists(select 1 from public.card_inventory owned where owned.user_id=uid and owned.season_id=p_season and owned.card_number=offered.card_number and owned.quantity>=1))
 order by (offered.card_number=p_target) desc,coalesce(pr.priority,2) desc,offered.updated_at desc,p.user_id,offered.card_number limit 20
 ) edge on true
 ),best as (select path,depth,priority/depth score,freshness from route where held=p_target and depth>0 order by depth,priority/depth desc,freshness desc limit 20)
 select coalesce(jsonb_agg(jsonb_build_object('steps',path,'length',depth,'priority',score,'updated_at',freshness) order by depth,score desc,freshness desc),'[]'::jsonb) into result from best;
 return result;
end $$;

revoke all on function public.lock_profile_uid(),public.require_account_uid() from public,anon,authenticated;
commit;
