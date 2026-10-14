-- Known Normal, Glitter and Sparkle artwork keys. Requires 016.
begin;
create or replace function public.tierlist_key_valid_v1(k text) returns boolean language sql stable set search_path=public,pg_temp as $$
 select case when k ~ '^[0-9]{1,2}-[1-4](-(flash|color_(rare_)?[0-9]{1,2}))?$' then
 exists(select 1 from public.formation_tatari_catalog where unit_id=split_part(k,'-',1)::integer and tier=split_part(k,'-',2)::integer)
 and (array_length(string_to_array(k,'-'),1)=2
 or (split_part(k,'-',3)='flash' and split_part(k,'-',1)::integer>=11)
 or (split_part(k,'-',2)='4' and split_part(k,'-',1)::integer in (11,13,14,15,17,18,20,21,22,24) and split_part(k,'-',3) in ('color_2','color_3','color_4','color_5','color_6','color_rare_1','color_rare_2')))
 else false end;
$$;
revoke all on function public.tierlist_key_valid_v1(text) from public,anon,authenticated;
create or replace function public.tierlist_validate_v1(p jsonb) returns void language plpgsql set search_path=public,pg_temp as $$
declare r jsonb; u jsonb; seen text[]='{}'; uid integer; tid integer; marker text; pt jsonb; key text;
begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>60000 or coalesce(p->>'schema','')<>'1' then raise exception 'Invalid tierlist payload';end if;
 if coalesce(p->>'gameMode','') not in ('Horde','Arena','Boss','Custom') or coalesce(p->>'tier','')!~'^[0-4]$' then raise exception 'Invalid tierlist mode';end if;
 if jsonb_typeof(p->'title') is distinct from 'string' or char_length(p->>'title') not between 1 and 80 or char_length(coalesce(p->>'notes',''))>500 then raise exception 'Invalid tierlist text';end if;
 if jsonb_typeof(p->'rows') is distinct from 'array' then raise exception 'Invalid tierlist rows';end if;
 if jsonb_array_length(p->'rows') not between 1 and 20 then raise exception 'Tierlist requires 1–20 rows';end if;
 for r in select value from jsonb_array_elements(p->'rows') loop
  if jsonb_typeof(r) is distinct from 'object' or jsonb_typeof(r->'label') is distinct from 'string' or char_length(r->>'label') not between 1 and 16 or coalesce(r->>'color','')!~'^#[0-9a-fA-F]{6}$' or jsonb_typeof(r->'units') is distinct from 'array' then raise exception 'Invalid ranking row';end if;
  if jsonb_array_length(r->'units')>546 then raise exception 'Too many Tatari';end if;
  for u in select value from jsonb_array_elements(r->'units') loop
   if jsonb_typeof(u)='number' and u::text~'^[0-9]{1,2}$' then
    uid=(u::text)::integer;tid=greatest(1,(p->>'tier')::integer);marker=uid::text||'-'||tid::text;
   elsif jsonb_typeof(u)='string' and (u#>>'{}')~'^[0-9]{1,2}-[1-4](-(flash|color_(rare_)?[0-9]{1,2}))?$' then
    marker=u#>>'{}';uid=split_part(marker,'-',1)::integer;tid=split_part(marker,'-',2)::integer;
   else raise exception 'Invalid Tatari';end if;
   if not public.tierlist_key_valid_v1(marker) or marker=any(seen) then raise exception 'Unknown or duplicate Tatari';end if;
   seen=array_append(seen,marker);
  end loop;
 end loop;
 if p ? 'background' and coalesce(p->>'background','')!~'^#[0-9a-fA-F]{6}$' then raise exception 'Invalid background color';end if;
 if p ? 'view' and coalesce(p->>'view','') not in ('list','chart') then raise exception 'Invalid tierlist view';end if;
 if p ? 'chart' then
  if jsonb_typeof(p->'chart') is distinct from 'object' or jsonb_typeof(p->'chart'->'positions') is distinct from 'object' then raise exception 'Invalid chart';end if;
  foreach key in array array['left','right','top','bottom'] loop
   if jsonb_typeof(p->'chart'->key) is distinct from 'string' or char_length(p->'chart'->>key)>40 then raise exception 'Invalid axis label';end if;
  end loop;
  for key,pt in select * from jsonb_each(p->'chart'->'positions') loop
   if key!~'^[0-9]{1,2}-[1-4](-(flash|color_(rare_)?[0-9]{1,2}))?$' then raise exception 'Invalid chart Tatari';end if;
   if not public.tierlist_key_valid_v1(key) then raise exception 'Unknown chart Tatari';end if;
   if jsonb_typeof(pt) is distinct from 'object' or jsonb_typeof(pt->'x') is distinct from 'number' or jsonb_typeof(pt->'y') is distinct from 'number' then raise exception 'Invalid coordinates';end if;
   if (pt->>'x')::numeric not between 0 and 100 or (pt->>'y')::numeric not between 0 and 100 then raise exception 'Invalid chart position';end if;
  end loop;
 end if;
end;$$;
notify pgrst,'reload schema';
commit;
