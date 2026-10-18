-- Private account rosters. Reference ranges are a selected v0.49.1 export.
begin;
create table public.tatari_roster_catalog(unit_id integer primary key,tiers jsonb not null,food_levels jsonb not null);
alter table public.tatari_roster_catalog enable row level security;
revoke all on public.tatari_roster_catalog from public,anon,authenticated;
insert into public.tatari_roster_catalog values
(1,'[1, 2]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'::jsonb),
(2,'[1, 2]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'::jsonb),
(3,'[1, 2]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'::jsonb),
(4,'[1, 2]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'::jsonb),
(5,'[1, 2]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'::jsonb),
(6,'[1, 2]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'::jsonb),
(7,'[1, 2]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'::jsonb),
(8,'[1, 2]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'::jsonb),
(9,'[1, 2]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'::jsonb),
(10,'[1, 2]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'::jsonb),
(11,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(12,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(13,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(14,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(15,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(16,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(17,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(18,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(19,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(20,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(21,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(22,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(23,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(24,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(25,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(26,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(27,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(28,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(29,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(30,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(31,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(32,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(33,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(34,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(35,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(36,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(37,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(38,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(39,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(40,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(41,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(42,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(43,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(44,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(45,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(46,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(47,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(48,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(49,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(50,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(51,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(52,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(53,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(54,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(55,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(56,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(57,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(58,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(59,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(60,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(61,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(62,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(63,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(64,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(65,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(66,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb),
(69,'[1, 2, 3, 4]'::jsonb,'[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]'::jsonb);
create table public.tatari_rosters(user_id uuid primary key references auth.users(id) on delete cascade,roster jsonb not null,revision integer not null default 1,updated_at timestamptz not null default now());
alter table public.tatari_rosters enable row level security;
revoke all on public.tatari_rosters from public,anon,authenticated;
grant select on public.tatari_rosters to authenticated;
create policy read_own_tatari_roster on public.tatari_rosters for select to authenticated using(user_id=(select auth.uid()));
create function public.save_tatari_roster(p_roster jsonb,p_revision integer,p_expected_actor uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare actor uuid:=auth.uid();existing public.tatari_rosters;entry record;allowed public.tatari_roster_catalog;v jsonb;star integer;cost integer;clean_units jsonb:='{}';clean jsonb;
begin
 if actor is null or actor is distinct from p_expected_actor or not exists(select 1 from auth.users where id=actor) then raise exception 'Your account changed. Please log in again.';end if;
 if p_revision is null or p_revision<0 then raise exception 'Invalid revision';end if;
 if jsonb_typeof(p_roster) is distinct from 'object' or octet_length(p_roster::text)>64000 or (p_roster->>'version') is distinct from '1' or jsonb_typeof(p_roster->'units') is distinct from 'object' or jsonb_typeof(p_roster->'accountLevel') is distinct from 'number' or coalesce(p_roster->>'accountLevel','')!~'^[0-9]{1,5}$' then raise exception 'Invalid roster';end if;
 if (p_roster->>'accountLevel')::integer not between 1 and 99999 then raise exception 'Invalid account level';end if;
 if (select count(*) from jsonb_each(p_roster->'units'))>67 then raise exception 'Too many Tatari';end if;
 for entry in select * from jsonb_each(p_roster->'units') loop
  if entry.key!~'^[0-9]{1,3}$' then raise exception 'Invalid Tatari';end if;
  select * into allowed from public.tatari_roster_catalog where unit_id=entry.key::integer;
  if not found then raise exception 'Unknown Tatari';end if;
  v:=entry.value;
  if jsonb_typeof(v) is distinct from 'object' or jsonb_typeof(v->'owned') is distinct from 'boolean' or jsonb_typeof(v->'glitter') is distinct from 'boolean' then raise exception 'Invalid ownership';end if;
  if jsonb_typeof(v->'tier') is distinct from 'number' or not allowed.tiers @> jsonb_build_array(v->'tier') or jsonb_typeof(v->'food') is distinct from 'number' or not allowed.food_levels @> jsonb_build_array(v->'food') then raise exception 'Invalid tier or food level';end if;
  if jsonb_typeof(v->'stars') is distinct from 'number' or coalesce(v->>'stars','')!~'^[0-9]{1,2}$' or jsonb_typeof(v->'copies') is distinct from 'number' or coalesce(v->>'copies','')!~'^[0-9]{1,2}$' then raise exception 'Invalid star progress';end if;
  star:=(v->>'stars')::integer;if star not between 1 and 84 then raise exception 'Invalid star level';end if;
  cost:=case when star=84 then 1 else (('{"0":1,"1":1,"2":3,"3":3,"4":5,"5":5,"6":5,"7":5,"8":5,"9":5,"10":5,"11":5,"12":7,"13":7,"14":7,"15":7,"16":7,"17":7,"18":7,"19":7,"20":7,"21":7,"22":7,"23":7,"24":7,"25":7,"26":7,"27":7,"28":7,"29":7,"30":9,"31":9,"32":9,"33":9,"34":9,"35":9,"36":9,"37":9,"38":9,"39":9,"40":9,"41":9,"42":11,"43":11,"44":11,"45":11,"46":11,"47":11,"48":11,"49":11,"50":11,"51":11,"52":11,"53":11,"54":13,"55":13,"56":13,"57":13,"58":13,"59":13,"60":13,"61":13,"62":13,"63":13,"64":13,"65":13,"66":13,"67":13,"68":13,"69":13,"70":13,"71":13,"72":13,"73":13,"74":13,"75":13,"76":13,"77":13,"78":13,"79":18,"80":20,"81":22,"82":24,"83":26,"84":28}'::jsonb)->>star::text)::integer end;
  if (v->>'copies')::integer>=cost then raise exception 'Copy progress must be below the next-star cost';end if;
  clean_units:=clean_units||jsonb_build_object(entry.key,jsonb_build_object('owned',v->'owned','tier',v->'tier','stars',star,'food',v->'food','copies',(v->>'copies')::integer,'glitter',v->'glitter'));
 end loop;
 clean:=jsonb_build_object('version',1,'accountLevel',(p_roster->>'accountLevel')::integer,'units',clean_units);
 perform pg_advisory_xact_lock(hashtextextended('tatari-roster:'||actor::text,0));
 select * into existing from public.tatari_rosters where user_id=actor for update;
 if coalesce(existing.revision,0)<>p_revision then raise exception 'Your roster changed on another device. Reload before saving.';end if;
 insert into public.tatari_rosters(user_id,roster,revision) values(actor,clean,1) on conflict(user_id) do update set roster=excluded.roster,revision=public.tatari_rosters.revision+1,updated_at=now() returning * into existing;
 return jsonb_build_object('roster',existing.roster,'revision',existing.revision,'updated_at',existing.updated_at);
end $$;
revoke all on function public.save_tatari_roster(jsonb,integer,uuid) from public,anon;
grant execute on function public.save_tatari_roster(jsonb,integer,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
