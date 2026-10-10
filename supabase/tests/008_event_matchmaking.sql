-- Run as project administrator AFTER migration 008. Fixtures roll back.
begin;
do $$
declare a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();start_at timestamptz;contact jsonb;rows jsonb;denied boolean;
begin
 insert into auth.users(id) values(a),(b);
 insert into public.profiles(user_id,display_name,game_id) values(a,'Match test A','99999999999999999991'),(b,'Match test B','99999999999999999992');
 select anchor_start+(floor(extract(epoch from(now()-anchor_start))/1296000)+1)*interval '15 days' into start_at from public.event_match_definitions where event_name='Raft Race';
 assert not has_table_privilege('authenticated','public.event_match_plans','SELECT'),'Direct cross-account access granted';
 assert not has_function_privilege('anon','public.find_event_matches(text,text[],integer)','EXECUTE'),'Anonymous matching allowed';
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform public.save_event_match_plan('Raft Race',start_at,10000,30000,'casual',2,1,true);
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform public.save_event_match_plan('Raft Race',start_at,20000,40000,'competitive',1,1,true);
 perform set_config('request.jwt.claim.sub',a::text,true);
 rows:=public.find_event_matches('Raft Race',array['competitive'],0);assert jsonb_array_length(rows)=1,'Compatible partner not found';
 assert not ((rows->0)?'uid'),'UID leaked in match list';
 assert jsonb_array_length(public.find_event_matches('Raft Race',array['casual'],0))=0,'Style filter ignored';
 contact:=public.event_match_contact(b,'Raft Race',start_at);assert contact->>'uid'='99999999999999999992','Connect UID incorrect';
 denied:=false;begin perform public.save_event_match_plan('Raft Race',start_at,0,10,'casual',4,1,true);exception when others then denied:=true;end;assert denied,'Invalid slot capacity accepted';
 denied:=false;begin perform public.save_event_match_plan('Raft Race',start_at,0,10,'casual',1,1,false);exception when others then denied:=true;end;assert denied,'Missing consent accepted';
 denied:=false;begin perform public.save_event_match_plan('Raft Race',start_at+interval '1 day',0,10,'casual',1,1,true);exception when others then denied:=true;end;assert denied,'Invented event date accepted';
 perform set_config('request.jwt.claim.sub',b::text,true);perform public.delist_event_match_plan('Raft Race',start_at);
 perform set_config('request.jwt.claim.sub',a::text,true);
 denied:=false;begin perform public.event_match_contact(b,'Raft Race',start_at);exception when others then denied:=true;end;assert denied,'Delisted contact disclosed';
 update public.event_match_plans set event_start=now()-interval '1 minute' where user_id=a;
 assert jsonb_array_length(public.my_event_match_plans())=0,'Expired plan returned';assert not exists(select 1 from public.event_match_plans where user_id=a),'Expired plan not deleted';
 raise notice 'Matchmaking ownership, consent, filtering, dates, contacts and expiry checks passed';
end $$;
rollback;
