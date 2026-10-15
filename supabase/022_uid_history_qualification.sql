begin;
do $patch$ declare body text;begin
 body:=pg_get_functiondef('public.admin_farm_listings(text,jsonb)'::regprocedure);
 body:=replace(body,'and (target=p_payload','and (site_admin_audit.target=p_payload');execute body;
end $patch$;
notify pgrst,'reload schema';commit;
