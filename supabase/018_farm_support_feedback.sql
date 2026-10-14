begin;
alter table public.farm_support_activity drop constraint if exists farm_support_activity_report_check;
alter table public.farm_support_activity add constraint farm_support_activity_report_check check(report in ('worked','not_working','exhausted'));
create or replace function public.farm_support_directory() returns jsonb language plpgsql security definer set search_path=pg_catalog as $$declare result jsonb;c bigint:=floor(extract(epoch from now())/43200);begin
 if auth.uid() is null then raise exception 'Login required';end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (select l.id,l.crop_id,l.bonus,l.verified_at,count(a.user_id) filter(where a.revealed) as reveals,count(a.user_id) filter(where a.report='exhausted') as exhausted,count(a.user_id) filter(where a.report='worked') as worked,count(a.user_id) filter(where a.report='not_working') as not_working from public.farm_support_listings l left join public.farm_support_activity a on a.listing_id=l.id and a.cycle=c where l.enabled group by l.id order by l.bonus desc) x;return result;
end$$;
create or replace function public.report_farm_support(p_id uuid,p_report text) returns void language plpgsql security definer set search_path=pg_catalog as $$declare c bigint:=floor(extract(epoch from now())/43200);begin
 if auth.uid() is null then raise exception 'Login required';end if;
 if p_report is null or p_report not in ('worked','not_working','exhausted') then raise exception 'Invalid report';end if;
 perform 1 from public.farm_support_listings where id=p_id and enabled for update;if not found then raise exception 'Listing unavailable';end if;
 update public.farm_support_activity set report=p_report where listing_id=p_id and user_id=auth.uid() and cycle=c and revealed;
 if not found then raise exception 'Reveal the UID before reporting';end if;
end$$;
notify pgrst,'reload schema';
commit;
