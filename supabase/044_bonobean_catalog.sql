-- Add Bonobean's reviewed ranges without rewriting any saved roster or formation.
begin;
insert into public.tatari_roster_catalog(unit_id,tiers,food_levels)
values(68,'[1,2,3,4]'::jsonb,'[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]'::jsonb)
on conflict(unit_id) do update set tiers=excluded.tiers,food_levels=excluded.food_levels;
insert into public.formation_tatari_catalog(unit_id,tier) values(68,1),(68,2),(68,3),(68,4) on conflict do nothing;
do $migration$
declare body text;
begin
 body:=pg_get_functiondef('public.save_tatari_roster(jsonb,integer,uuid)'::regprocedure);
 if position('jsonb_each(p_roster->''units''))>67' in body)>0 then
  body:=replace(body,'jsonb_each(p_roster->''units''))>67','jsonb_each(p_roster->''units''))>68');execute body;
 elsif position('jsonb_each(p_roster->''units''))>68' in body)=0 then raise exception 'Review changed roster limit';end if;
 body:=pg_get_functiondef('public.tierlist_validate_v1(jsonb)'::regprocedure);
 if position('jsonb_array_length(r->''units'')>546' in body)>0 then
  body:=replace(body,'jsonb_array_length(r->''units'')>546','jsonb_array_length(r->''units'')>554');execute body;
 elsif position('jsonb_array_length(r->''units'')>554' in body)=0 then raise exception 'Review changed tierlist limit';end if;
end $migration$;
update public.site_content_blocks set default_text='Bonobean (UnitID 68), Titanape, Grangutan and Primakong are now integrated across My Tatari, the database, stats calculator, evolution planner, Horde guide/drafter and tierlist tools. Normal and Glitter portraits use the supplied images. Food levels 0–16, evolution trials and source-resolved regular/Horde skills are included.' where page_key='information/patch-165921.html' and block_key='text-tatari-bonobean';
notify pgrst,'reload schema';
commit;
