begin;
-- Extend the existing bounded editor; preserve its authorization, revision locks and history.
do $migration$ declare body text;begin
 body:=pg_get_functiondef('public.site_value_path_allowed(text,text)'::regprocedure);
 if position('else false end' in body)=0 then raise exception 'Review changed field validator';end if;
 body:=replace(body,'else false end', 'when k=''announcement'' then p=any(array[''visibility'',''label'',''headline'',''message'',''extraLabel'',''extraUrl'',''dismissible'']) else false end');execute body;
 body:=pg_get_functiondef('public.admin_site_data(text,jsonb)'::regprocedure);
 if position('''schedule'',''footer'',''guide:cozy-farm''' in body)=0 then raise exception 'Review changed dataset registration';end if;
 body:=replace(body,'''schedule'',''footer'',''guide:cozy-farm''','''announcement'',''schedule'',''footer'',''guide:cozy-farm''');execute body;
 body:=pg_get_functiondef('public.validate_site_values(text,jsonb,jsonb)'::regprocedure);
 if position('k in (''footer'',''announcement'') and' in body)>0 then null;elsif position('k=''footer'' and' in body)=0 then raise exception 'Review changed link validation';end if;
 body:=replace(body,'k=''footer'' and','k in (''footer'',''announcement'') and');execute body;
end $migration$;
insert into public.site_data_records(key,title,source,baseline,schema,default_values,published_values)
values('announcement','Announcements','announcement-defaults.json','11780ba9bae9c3f52d904d4a897831a089b6ad8dd55150f2d0baae2d0700ebb3','{"visibility":{"label":"Visibility","group":"Announcement","type":"string","maxLength":500,"options":["Hidden","Visible"]},"label":{"label":"Small label","group":"Announcement","type":"string","maxLength":500},"headline":{"label":"Headline","group":"Announcement","type":"string","maxLength":500},"message":{"label":"Message","group":"Announcement","type":"string","maxLength":500},"extraLabel":{"label":"Button text (optional)","group":"Announcement","type":"string","maxLength":500},"extraUrl":{"label":"Button HTTPS URL (optional)","group":"Announcement","type":"string","maxLength":500,"format":"url"},"dismissible":{"label":"Allow dismissal","group":"Announcement","type":"string","maxLength":500,"options":["Yes","No"]}}'::jsonb,'{"visibility":"Hidden","label":"NEW UPDATE","headline":"Foil cards are here.","message":"Track your foil collection and find the variant you need.","extraLabel":"View My Album","extraUrl":"https://kenzkunz.github.io/tatari-companion/my-album.html","dismissible":"Yes"}'::jsonb,'{"visibility":"Visible","label":"NEW UPDATE","headline":"Foil cards are here.","message":"Track your foil collection and find the variant you need.","extraLabel":"View My Album","extraUrl":"https://kenzkunz.github.io/tatari-companion/my-album.html","dismissible":"Yes"}'::jsonb)
on conflict(key) do nothing;
notify pgrst,'reload schema';
commit;
