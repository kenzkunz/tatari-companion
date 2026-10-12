-- Apply in Supabase SQL Editor. No service-role key belongs in the website.
begin;
create table public.site_admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.site_admins enable row level security;
revoke all on public.site_admins from public,anon,authenticated;
create function public.is_site_admin() returns boolean language sql stable security definer set search_path=pg_catalog as $$select auth.uid() is not null and exists(select 1 from public.site_admins where user_id=auth.uid())$$;
revoke all on function public.is_site_admin() from public;grant execute on function public.is_site_admin() to anon,authenticated;

create table public.site_content_blocks(page_key text not null,block_key text not null,label text not null,default_text text not null,draft_text text,published_text text,revision integer not null default 0,updated_at timestamptz not null default now(),primary key(page_key,block_key),check(char_length(coalesce(draft_text,''))<=20000));
create table public.site_content_versions(id bigint generated always as identity primary key,page_key text not null,block_key text not null,body text,actor uuid not null references auth.users(id),created_at timestamptz not null default now());
create table public.site_admin_audit(id bigint generated always as identity primary key,actor uuid not null references auth.users(id),action text not null,target text not null,details jsonb not null default '{}',created_at timestamptz not null default now());
create table public.farm_support_requests(id uuid primary key default gen_random_uuid(),submitted_by uuid not null references auth.users(id),game_uid text not null check(game_uid~'^[1-9][0-9]{0,19}$'),crop_id integer not null check(crop_id between 2 and 7),bonus integer not null check(bonus between 0 and 263),permission boolean not null check(permission),note text not null default '' check(char_length(note)<=1000),status text not null default 'pending' check(status in ('pending','approved','rejected')),revision integer not null default 0,review_note text not null default '',reviewed_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create unique index farm_pending_unique on public.farm_support_requests(game_uid,crop_id) where status='pending';
create table public.farm_support_listings(id uuid primary key default gen_random_uuid(),game_uid text not null,crop_id integer not null,bonus integer not null check(bonus between 0 and 263),enabled boolean not null default true,verified_at timestamptz not null default now(),unique(game_uid,crop_id));
create table public.farm_support_activity(listing_id uuid not null references public.farm_support_listings(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,cycle bigint not null,revealed boolean not null default false,report text check(report in ('worked','exhausted')),primary key(listing_id,user_id,cycle));
alter table public.site_content_blocks enable row level security;
revoke all on public.site_content_blocks from public,anon,authenticated;
alter table public.site_content_versions enable row level security;
revoke all on public.site_content_versions from public,anon,authenticated;
alter table public.site_admin_audit enable row level security;
revoke all on public.site_admin_audit from public,anon,authenticated;
alter table public.farm_support_requests enable row level security;
revoke all on public.farm_support_requests from public,anon,authenticated;
alter table public.farm_support_listings enable row level security;
revoke all on public.farm_support_listings from public,anon,authenticated;
alter table public.farm_support_activity enable row level security;
revoke all on public.farm_support_activity from public,anon,authenticated;

create function public.published_site_content(p_page text) returns jsonb language sql stable security definer set search_path=pg_catalog as $$select coalesce(jsonb_object_agg(block_key,published_text),'{}') from public.site_content_blocks where page_key=p_page and published_text is not null$$;
revoke all on function public.published_site_content(text) from public;grant execute on function public.published_site_content(text) to anon,authenticated;

create function public.admin_workspace(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare result jsonb;b public.site_content_blocks;r public.farm_support_requests;v public.site_content_versions;reason text;begin
 if not public.is_site_admin() then raise exception 'Administrator access required' using errcode='42501';end if;
 if p_action='load' then
  return jsonb_build_object('blocks',(select coalesce(jsonb_agg(to_jsonb(x) order by page_key,block_key),'[]') from public.site_content_blocks x),'requests',(select coalesce(jsonb_agg(to_jsonb(x) order by created_at desc),'[]') from (select * from public.farm_support_requests order by created_at desc limit 200) x),'listings',(select coalesce(jsonb_agg(to_jsonb(x) order by verified_at desc),'[]') from public.farm_support_listings x),'audit',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select * from public.site_admin_audit order by id desc limit 100) x));
 elsif p_action='history' then
  return (select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select * from public.site_content_versions where page_key=p_payload->>'page' and block_key=p_payload->>'block' order by id desc limit 30) x);
 elsif p_action in ('save','publish','unpublish','restore') then
  select * into b from public.site_content_blocks where page_key=p_payload->>'page' and block_key=p_payload->>'block' for update;
  if not found then raise exception 'Unknown content block';end if;
  if b.revision is distinct from (p_payload->>'revision')::integer then raise exception 'This block changed. Refresh before editing again.' using errcode='40001';end if;
  if p_action='save' then
   if p_payload->>'text' is null or char_length(p_payload->>'text')>20000 then raise exception 'Invalid content length';end if;
   update public.site_content_blocks set draft_text=p_payload->>'text',revision=revision+1,updated_at=now() where page_key=b.page_key and block_key=b.block_key;
  else
   if p_action='restore' then
    select * into v from public.site_content_versions where id=(p_payload->>'version')::bigint and page_key=b.page_key and block_key=b.block_key;
    if not found then raise exception 'Unknown version';end if;
    b.draft_text:=v.body;
   elsif p_action='unpublish' then b.draft_text:=null;
   elsif b.draft_text is null then raise exception 'Save a draft before publishing';end if;
   insert into public.site_content_versions(page_key,block_key,body,actor) values(b.page_key,b.block_key,b.published_text,auth.uid());
   update public.site_content_blocks set published_text=b.draft_text,draft_text=b.draft_text,revision=revision+1,updated_at=now() where page_key=b.page_key and block_key=b.block_key;
  end if;
  insert into public.site_admin_audit(actor,action,target,details) values(auth.uid(),p_action,b.page_key||'#'||b.block_key,jsonb_build_object('previous_revision',b.revision));
 elsif p_action='review' then
  select * into r from public.farm_support_requests where id=(p_payload->>'id')::uuid for update;
  if not found or r.status<>'pending' or r.revision is distinct from (p_payload->>'revision')::integer then raise exception 'Submission already reviewed or changed';end if;
  if p_payload->>'decision' not in ('approved','rejected') or p_payload->>'decision' is null then raise exception 'Invalid decision';end if;
  reason:=left(coalesce(p_payload->>'note',''),1000);
  if p_payload->>'decision'='rejected' and length(trim(reason))=0 then raise exception 'Enter a rejection reason';end if;
  if p_payload->>'decision'='approved' then
   if not r.permission then raise exception 'Sharing permission required';end if;
   insert into public.farm_support_listings(game_uid,crop_id,bonus) values(r.game_uid,r.crop_id,r.bonus) on conflict(game_uid,crop_id) do update set bonus=excluded.bonus,enabled=true,verified_at=now();
  end if;
  update public.farm_support_requests set status=p_payload->>'decision',review_note=reason,reviewed_by=auth.uid(),revision=revision+1,updated_at=now() where id=r.id;
  insert into public.site_admin_audit(actor,action,target,details) values(auth.uid(),p_payload->>'decision',r.id::text,jsonb_build_object('note',reason,'crop',r.crop_id));
 elsif p_action='listing' then
  update public.farm_support_listings set enabled=(p_payload->>'enabled')::boolean where id=(p_payload->>'id')::uuid;
  if not found then raise exception 'Listing not found';end if;
  insert into public.site_admin_audit(actor,action,target,details) values(auth.uid(),'listing_visibility',p_payload->>'id',jsonb_build_object('enabled',p_payload->'enabled'));
 else raise exception 'Unknown admin action';end if;
 return jsonb_build_object('ok',true);
end$$;
revoke all on function public.admin_workspace(text,jsonb) from public,anon;grant execute on function public.admin_workspace(text,jsonb) to authenticated;

create function public.submit_farm_support(p_uid text,p_crop integer,p_bonus integer,p_permission boolean,p_note text default '') returns uuid language plpgsql security definer set search_path=pg_catalog as $$declare result uuid;begin
 if auth.uid() is null then raise exception 'Login required';end if;
 if p_permission is distinct from true then raise exception 'Sharing permission required';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,9));
 if (select count(*) from public.farm_support_requests where submitted_by=auth.uid() and created_at>now()-interval '1 day')>=10 then raise exception 'Daily submission limit reached';end if;
 insert into public.farm_support_requests(submitted_by,game_uid,crop_id,bonus,permission,note) values(auth.uid(),trim(p_uid),p_crop,p_bonus,true,trim(p_note)) returning id into result;return result;
exception when unique_violation then raise exception 'This UID and crop already have a pending review';end$$;
create function public.my_farm_support_requests() returns jsonb language sql stable security definer set search_path=pg_catalog as $$select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select id,game_uid,crop_id,bonus,status,review_note,created_at from public.farm_support_requests where submitted_by=auth.uid() order by created_at desc limit 50) x$$;
create function public.farm_support_directory() returns jsonb language plpgsql security definer set search_path=pg_catalog as $$declare result jsonb;c bigint:=floor(extract(epoch from now())/43200);begin
 if auth.uid() is null then raise exception 'Login required';end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (select l.id,l.crop_id,l.bonus,l.verified_at,count(a.user_id) filter(where a.revealed) as reveals,count(a.user_id) filter(where a.report='exhausted') as exhausted,count(a.user_id) filter(where a.report='worked') as worked from public.farm_support_listings l left join public.farm_support_activity a on a.listing_id=l.id and a.cycle=c where l.enabled group by l.id order by l.bonus desc) x;return result;
end$$;
create function public.reveal_farm_support(p_id uuid) returns text language plpgsql security definer set search_path=pg_catalog as $$declare uid text;c bigint:=floor(extract(epoch from now())/43200);begin
 if auth.uid() is null then raise exception 'Login required';end if;
 select game_uid into uid from public.farm_support_listings where id=p_id and enabled for update;
 if not found then raise exception 'Listing unavailable';end if;
 if (select count(*) from public.farm_support_activity where listing_id=p_id and cycle=c and report='exhausted')>=3 then raise exception 'Listing hidden for this round';end if;
 insert into public.farm_support_activity(listing_id,user_id,cycle,revealed) values(p_id,auth.uid(),c,true) on conflict(listing_id,user_id,cycle) do update set revealed=true;return uid;
end$$;
create function public.report_farm_support(p_id uuid,p_report text) returns void language plpgsql security definer set search_path=pg_catalog as $$declare c bigint:=floor(extract(epoch from now())/43200);begin
 if auth.uid() is null then raise exception 'Login required';end if;
 if p_report is null or p_report not in ('worked','exhausted') then raise exception 'Invalid report';end if;
 perform 1 from public.farm_support_listings where id=p_id and enabled for update;if not found then raise exception 'Listing unavailable';end if;
 update public.farm_support_activity set report=p_report where listing_id=p_id and user_id=auth.uid() and cycle=c and revealed;
 if not found then raise exception 'Reveal the UID before reporting';end if;
end$$;
revoke all on function public.submit_farm_support(text,integer,integer,boolean,text),public.my_farm_support_requests(),public.farm_support_directory(),public.reveal_farm_support(uuid),public.report_farm_support(uuid,text) from public,anon;
grant execute on function public.submit_farm_support(text,integer,integer,boolean,text),public.my_farm_support_requests(),public.farm_support_directory(),public.reveal_farm_support(uuid),public.report_farm_support(uuid,text) to authenticated;

-- Requested owner account. Fail rather than silently granting to a nonexistent identity.
insert into public.site_admins(user_id) values('f95bfea9-d7d3-49f5-827a-646c11f32ffb');
-- Content catalog seed is appended by the installation script before COMMIT.

insert into public.site_content_blocks(page_key,block_key,label,default_text) values
('events/cozy-farm.html','text-1','P · A strong support Tatari helps every future fertilizer dose. Arrange support before spending, th','A strong support Tatari helps every future fertilizer dose. Arrange support before spending, then grow toward the next reward.'),
('events/cozy-farm.html','text-2','H2 · Grow first, collect milestones','Grow first, collect milestones'),
('events/cozy-farm.html','text-3','P · The newer Farm V2 event lasts six 12-hour rounds. Crop weight accumulates through the event. Fe','The newer Farm V2 event lasts six 12-hour rounds. Crop weight accumulates through the event. Fertilizing, watering, natural growth, and support Tatari all contribute to heavier yields.'),
('events/cozy-farm.html','text-4','H2 · Six crops, specific support Tatari','Six crops, specific support Tatari'),
('events/cozy-farm.html','text-5','P · The default crop pool has six crops. Each requires its own support Tatari family; an unrelated ','The default crop pool has six crops. Each requires its own support Tatari family; an unrelated Tatari cannot replace it. Support from your own camp or another trainer is assigned to that crop’s plot, not every crop on the farm.'),
('events/cozy-farm.html','text-6','H2 · Growth stages and upgrade bonuses','Growth stages and upgrade bonuses'),
('events/cozy-farm.html','text-7','P · Each threshold applies to one crop. Claiming an eligible upgrade adds the listed flat bonus wei','Each threshold applies to one crop. Claiming an eligible upgrade adds the listed flat bonus weight toward progression; it is not a percentage boost to fertilizer or watering.'),
('events/cozy-farm.html','text-8','H2 · Watering: how much weight?','Watering: how much weight?'),
('events/cozy-farm.html','text-9','P · Watering adds a flat amount to each crop with positive weight. An empty plot does not count. Th','Watering adds a flat amount to each crop with positive weight. An empty plot does not count. The inspected watering calculation does not apply your support percentage or fertilizer crit multiplier. If only four crops are active, the total is 4 × 5 = 20.'),
('events/cozy-farm.html','text-10','H2 · Arrange support before fertilizing','Arrange support before fertilizing'),
('events/cozy-farm.html','text-11','H2 · Crits and support are separate boosts','Crits and support are separate boosts'),
('events/cozy-farm.html','text-12','H2 · Estimate a support bonus','Estimate a support bonus'),
('events/cozy-farm.html','text-13','P · Use the support Tatari’s client-summary star, evolution, and food values. This checks the recov','Use the support Tatari’s client-summary star, evolution, and food values. This checks the recovered support formula, not a full harvest prediction.'),
('events/cozy-farm.html','text-14','H2 · Support matters most','Support matters most'),
('events/fishing.html','text-1','P · Silver rewards your catches. Gold rewards a better team record. Plan for those two goals separa','Silver rewards your catches. Gold rewards a better team record. Plan for those two goals separately.'),
('events/fishing.html','text-2','H2 · How it works','How it works'),
('events/fishing.html','text-3','P · Choose a rod multiplier, catch a fish, and earn silver based on its type and weight. Silver unl','Choose a rod multiplier, catch a fish, and earn silver based on its type and weight. Silver unlocks your personal milestone rewards and rod upgrades. A better record for a species also earns gold for your team.'),
('events/fishing.html','text-4','H2 · Before you fish','Before you fish'),
('events/fishing.html','text-5','H2 · What the numbers mean','What the numbers mean'),
('events/fishing.html','text-6','P · Luck Level equals rod level plus active bait stacks in the inspected client. Higher luck change','Luck Level equals rod level plus active bait stacks in the inspected client. Higher luck changes both rarity chances and weight-tier chances. It does not identify which fish will appear next.'),
('events/fishing.html','text-7','H2 · Try Fish Calculator','Try Fish Calculator'),
('events/fishing.html','text-8','H2 · Useful habits, without folklore','Useful habits, without folklore'),
('events/horde.html','text-1','P · A shared battlefield, separate energy balances, and meaningful skill unlocks. Build a plan with','A shared battlefield, separate energy balances, and meaningful skill unlocks. Build a plan with your partner, then adapt it to the waves and chips you receive.'),
('events/horde.html','text-2','H2 · How it works','How it works'),
('events/horde.html','text-3','P · Before the battle starts, set up a formation of 15 Tatari to bring into Horde Invasion. During ','Before the battle starts, set up a formation of 15 Tatari to bring into Horde Invasion. During the run, choose from three-card summon offers drawn from that pool to deploy up to 10 active Tatari on the field. Upgrade their in-run levels, move them into useful positions, and choose chips that strengthen your setup. Two players defend the shared battlefield together.'),
('events/horde.html','text-4','H2 · Before you start','Before you start'),
('events/horde.html','text-5','H2 · Energy Candy: income during battle','Energy Candy: income during battle'),
('events/horde.html','text-6','P · Energy Candy is the in-round currency. It is separate from Candy and Pinballs claimed outside t','Energy Candy is the in-round currency. It is separate from Candy and Pinballs claimed outside the battle.'),
('events/horde.html','text-7','H3 · Passive income becomes smaller over time','Passive income becomes smaller over time'),
('events/horde.html','text-8','H3 · Estimated Energizers obtained','Estimated Energizers obtained'),
('events/horde.html','text-9','P · This does not count any extra income from chips or death refunds, and does not subtract Energiz','This does not count any extra income from chips or death refunds, and does not subtract Energizers spent. It assumes all enemies through the selected wave were defeated and uses a 30-second window per completed wave for passive income. Actual passive income depends on battle duration.'),
('events/horde.html','text-10','H2 · Levels, costs and death refunds','Levels, costs and death refunds'),
('events/horde.html','text-11','P · The standard in-run level cap is Lv 7. A chip that explicitly raises the cap can enable Lv 8. N','The standard in-run level cap is Lv 7. A chip that explicitly raises the cap can enable Lv 8. New Horde skills unlock at Lv 3, Lv 5 and Lv 7.'),
('events/horde.html','text-12','P · The Lv 1 row is a new deployment. Total cost includes that deployment and each listed upgrade. ','The Lv 1 row is a new deployment. Total cost includes that deployment and each listed upgrade. Death refunds depend on the Tatari''s level and an eligibility check; do not assume every summoned unit or forced removal qualifies.'),
('events/horde.html','text-13','H2 · Chip catalogue','Chip catalogue'),
('events/horde.html','text-14','P · Browse all 49 chip variants and their in-game effect descriptions. Match a chip to the Tatari y','Browse all 49 chip variants and their in-game effect descriptions. Match a chip to the Tatari you have deployed, your available energy and the current board.'),
('events/horde.html','text-16','H2 · Wave and boss roster','Wave and boss roster'),
('events/horde.html','text-17','P · All four S2 difficulties use the same enemy roster and spawn formation. Choose a difficulty to ','All four S2 difficulties use the same enemy roster and spawn formation. Choose a difficulty to see its stat multipliers inside each expanded wave.'),
('events/horde.html','text-18','P · These are configured enemies. Skill-created summons, escapes and live server changes can affect','These are configured enemies. Skill-created summons, escapes and live server changes can affect a real battle. ATK / DEF / HP values are wave multipliers, not the boss''s final stats.'),
('events/horde.html','text-19','H2 · Horde stats and damage','Horde stats and damage'),
('events/horde.html','text-20','P · These values describe the added component. Full buff stacking and rebuild order still need inte','These values describe the added component. Full buff stacking and rebuild order still need integration validation before using them to predict final battle stats.'),
('events/horde.html','text-21','H2 · Tatari Horde skill cards','Tatari Horde skill cards'),
('events/horde.html','text-22','P · Select a Tatari and evolution to inspect the regular skill and Horde upgrades. Effect descripti','Select a Tatari and evolution to inspect the regular skill and Horde upgrades. Effect descriptions and numeric rows use the same format as the Tatari database.'),
('events/horde.html','text-23','P · On mobile, swipe through all four cards. Only visible game skill cards are included; internal h','On mobile, swipe through all four cards. Only visible game skill cards are included; internal helper skills are excluded. Arena Factor rows are omitted for Horde.'),
('events/horde.html','text-24','H2 · Useful habits','Useful habits'),
('events/island-goldrush.html','text-1','P · Fight for territory, protect your league''s clams, and understand where your battle supply goes.','Fight for territory, protect your league''s clams, and understand where your battle supply goes.'),
('events/island-goldrush.html','text-2','H2 · How Goldrush works','How Goldrush works'),
('events/island-goldrush.html','text-3','P · The main goal is to build your league''s point production by claiming tiles and clams across the','The main goal is to build your league''s point production by claiming tiles and clams across the six configured days. Coordinate a strategy with your league, choose useful routes and high-value targets, and capture or retake tiles effectively. Attacks contain individual opponent fights: your Tatari skills and formation decide those fights, while Energy Drinks cover the battle cost.'),
('events/island-goldrush.html','text-4','P · Energy Drinks / Cans are the battle resource used to boost your Tatari in Goldrush. The amount ','Energy Drinks / Cans are the battle resource used to boost your Tatari in Goldrush. The amount allocated determines your boost level. Energy Drinks expire after the event ends.'),
('events/island-goldrush.html','text-5','P · Super Drinks are condensed cans used for Dunerush Tournament. The verified tournament conversio','Super Drinks are condensed cans used for Dunerush Tournament. The verified tournament conversion prompt uses a 1:1 amount when Energy Drinks are insufficient; check the prompt before confirming.'),
('events/island-goldrush.html','text-6','H2 · Before you attack','Before you attack'),
('events/island-goldrush.html','text-7','P · Taking a tile and earning a reward are separate steps. A near-cleared tile can produce a short ','Taking a tile and earning a reward are separate steps. A near-cleared tile can produce a short attack, but its low defender count is not an explicit percentage refund rule.'),
('events/island-goldrush.html','text-8','H3 · When several players attack the same tile','When several players attack the same tile'),
('events/island-goldrush.html','text-9','H2 · Tile health and point production','Tile health and point production'),
('events/island-goldrush.html','text-10','P · The tile''s health bar represents its remaining defenders, not the combined HP of the Tatari fig','The tile''s health bar represents its remaining defenders, not the combined HP of the Tatari fighting in one battle. The battle record identifies an opposing trainer or NPC; defeating opponent formations contributes to reducing the defender count.'),
('events/island-goldrush.html','text-11','P · These are base values before the daily production rate. Applicable home-territory shields incre','These are base values before the daily production rate. Applicable home-territory shields increase defender capacity by 20%, 40% or 80%; they do not add a fixed 20, 40 or 80 defenders. Clam defense and harvest rewards are listed separately below.'),
('events/island-goldrush.html','text-12','H2 · Daily unlocks and score','Daily unlocks and score'),
('events/island-goldrush.html','text-13','P · The Island schedule has six day entries. Clams are listed on Days 2, 4 and 6; territory score r','The Island schedule has six day entries. Clams are listed on Days 2, 4 and 6; territory score rates also change across the event.'),
('events/island-goldrush.html','text-14','P · Use the event screen for actual start, preparation, battle and settlement countdowns. These are','Use the event screen for actual start, preparation, battle and settlement countdowns. These are day-based rules, not a prediction of the next server calendar date. The configured score percentages apply to base production: 50% means 0.5×, and 120% means 1.2×.'),
('events/island-goldrush.html','text-15','H2 · League roles and daily changes','League roles and daily changes'),
('events/island-goldrush.html','text-16','H2 · Energy Drink boosts','Energy Drink boosts'),
('events/island-goldrush.html','text-17','P · The available Energy Drinks amount determines the highest boost level it reaches. For example, ','The available Energy Drinks amount determines the highest boost level it reaches. For example, 20–29 Energy Drinks gives Lv 2. The ordinary boost cap is Lv 10; rally levels are listed separately below.'),
('events/island-goldrush.html','text-18','H3 · Check the initial Energy Drink cost','Check the initial Energy Drink cost'),
('events/island-goldrush.html','text-19','P · This estimates the initial Energy Drink allocation cost at the selected threshold. It does not ','This estimates the initial Energy Drink allocation cost at the selected threshold. It does not predict final spending or unused Energy Drinks returned after the attack. Enter only the spa discount currently active.'),
('events/island-goldrush.html','text-20','H2 · Exhaustion increases Energy Drink cost','Exhaustion increases Energy Drink cost'),
('events/island-goldrush.html','text-21','P · The game calculates the next attack’s Energy Drink cost using your daily attack count plus one.','The game calculates the next attack’s Energy Drink cost using your daily attack count plus one. After 10 counted daily attacks, the next attack uses the +20% cost modifier.'),
('events/island-goldrush.html','text-22','H2 · There is a real battle behind each result','There is a real battle behind each result'),
('events/island-goldrush.html','text-23','P · Tatari attacks, skills, buffs, debuffs, defense and elemental matchups determine the fight. GvG','Tatari attacks, skills, buffs, debuffs, defense and elemental matchups determine the fight. GvG uses PvP Arena Factor and the 0.8 / 1.2 elemental factors. Selected Energy Drinks boosts ATK and HP; it does not give a DEF bonus in the inspected table.'),
('events/island-goldrush.html','text-24','P · After combat, a separate calculation uses the enemy side''s recorded total damage relative to yo','After combat, a separate calculation uses the enemy side''s recorded total damage relative to your formation''s total battle maximum HP. This is cumulative damage, not damage per second.'),
('events/island-goldrush.html','text-25','P · Tile health is not an input to that formula. Healing can restore your remaining HP while total ','Tile health is not an input to that formula. Healing can restore your remaining HP while total damage already recorded remains. The green bar in Battle Details shows remaining formation HP, not remaining cans.'),
('events/island-goldrush.html','text-26','H3 · Battle Details result labels','Battle Details result labels'),
('events/island-goldrush.html','text-27','P · The result label uses remaining formation HP, not the number of drinks spent.','The result label uses remaining formation HP, not the number of drinks spent.'),
('events/island-goldrush.html','text-28','H2 · Estimate Energy Drink Loss','Estimate Energy Drink Loss'),
('events/island-goldrush.html','text-29','P · This calculator tests a simple model to check the formula using displayed formation HP multipli','This calculator tests a simple model to check the formula using displayed formation HP multiplied by the battle HP buff. It does not predict how many cans you will lose before a battle, because opponent damage is only known after the battle result.'),
('events/island-goldrush.html','text-30','P · Energy Drink loss is capped by the supply available for that fight; exhaustion and discounts ar','Energy Drink loss is capped by the supply available for that fight; exhaustion and discounts are separate. Use damage from all opponent Tatari.'),
('events/island-goldrush.html','text-31','H2 · Clam harvests and defense lines','Clam harvests and defense lines'),
('events/island-goldrush.html','text-32','P · Island clams are assigned to the four leagues on Days 2, 4 and 6. Each has a maximum of 3,000 d','Island clams are assigned to the four leagues on Days 2, 4 and 6. Each has a maximum of 3,000 defenders. Their opening state comes from the server, and the active harvest screen counts down to the next daily boundary.'),
('events/island-goldrush.html','text-33','H2 · Rally attacks','Rally attacks'),
('events/island-goldrush.html','text-34','P · Rallies allow trainers in the same league to attack together. A higher tier adds more participa','Rallies allow trainers in the same league to attack together. A higher tier adds more participant slots and a modestly larger stat contribution; paying three times the base cost does not triple the stat bonus.'),
('events/island-goldrush.html','text-35','P · To host a rally, you must first spend 5,000 Energy Drinks to unlock it. All rallies have a 5-mi','To host a rally, you must first spend 5,000 Energy Drinks to unlock it. All rallies have a 5-minute preparation timer. The host can select who joins; if the host does not choose, the system selects members randomly.'),
('events/island-goldrush.html','text-36','H3 · Rally calculator','Rally calculator'),
('events/island-goldrush.html','text-37','P · Attack completed means your daily attack count before the rally. Tile HP means the remaining de','Attack completed means your daily attack count before the rally. Tile HP means the remaining defenders on that tile. The server calculation is not verified; this calculator is based on user-experience data.'),
('events/island-goldrush.html','text-38','H2 · Goldrush team milestone rewards','Goldrush team milestone rewards'),
('events/island-goldrush.html','text-39','P · Team points unlock these rewards in sequence. Select a milestone to see the combined rewards fr','Team points unlock these rewards in sequence. Select a milestone to see the combined rewards from the first row through that threshold.'),
('events/island-goldrush.html','text-40','H2 · Useful habits','Useful habits'),
('events/island-goldrush.html','text-41','P · The Hot Spring discount means a currently active spa buff that specifically reduces GvG Energy ','The Hot Spring discount means a currently active spa buff that specifically reduces GvG Energy Drink consumption. It does not apply to every spa buff.'),
('events/raft-race.html','text-1','P · Your rafts are personal. Your distance helps the whole team. Reach milestones together and choo','Your rafts are personal. Your distance helps the whole team. Reach milestones together and choose the rewards you actually need.'),
('events/raft-race.html','text-2','H2 · Personal rafts, shared distance','Personal rafts, shared distance'),
('events/raft-race.html','text-3','P · Four teammates contribute to one distance total. Each player spends their own rafts. Everyone c','Four teammates contribute to one distance total. Each player spends their own rafts. Everyone can claim a milestone once the team reaches its distance.'),
('events/raft-race.html','text-4','P · Some milestones give a choice box. Pick one option; a box does not grant every listed item.','Some milestones give a choice box. Pick one option; a box does not grant every listed item.'),
('events/raft-race.html','text-5','H2 · Coordinate progress and reward choices','Coordinate progress and reward choices'),
('events/raft-race.html','text-6','H2 · What the wheel actually promises','What the wheel actually promises'),
('events/raft-race.html','text-7','H2 · Compare your raft budget','Compare your raft budget'),
('events/raft-race.html','text-8','P · Paid-spin mean distance is 5.82m before free spins. If free spins use the same independent dist','Paid-spin mean distance is 5.82m before free spins. If free spins use the same independent distribution and can chain, the expected total becomes about 6.47m per paid raft. This is a model average, not a guaranteed return.'),
('events/raft-race.html','text-9','H2 · Choose a multiplier for control','Choose a multiplier for control'),
('events/raft-race.html','text-10','P · A multiplier scales both cost and distance. Under the same wheel distribution, changing it does','A multiplier scales both cost and distance. Under the same wheel distribution, changing it does not change expected distance per raft; it changes the number of paid attempts and the size of each result.'),
('events/sparkly-spa.html','text-1','P · Choose your buffs, share a soak and collect Sparkle Tatari.','Choose your buffs, share a soak and collect Sparkle Tatari.'),
('events/sparkly-spa.html','text-2','H2 · How Sparkly Spa works','How Sparkly Spa works'),
('events/sparkly-spa.html','text-3','P · Open your own spa or visit a friend’s spa to give eligible Tatari temporary buffs. The active e','Open your own spa or visit a friend’s spa to give eligible Tatari temporary buffs. The active effect set can improve combat, reduce Goldrush costs or provide daily benefits. Dreamy Sparkle effects also let you collect new Tatari appearances.'),
('events/sparkly-spa.html','text-4','H2 · Spa Soap and activation','Spa Soap and activation'),
('events/sparkly-spa.html','text-5','P · Goldrush MVP rewards provide Spa Soap. The configured regular Goldrush reward is 180, 160, 150 ','Goldrush MVP rewards provide Spa Soap. The configured regular Goldrush reward is 180, 160, 150 or 140 soaps for league ranks 1–4. The soap shop also contains packs of 10, 20, 50 and 100; use the in-game shop for prices and availability.'),
('events/sparkly-spa.html','text-6','H2 · Spa Buffs','Spa Buffs'),
('events/sparkly-spa.html','text-7','P · Each set contains two to four effects. Expand an effect to compare its available rarities and o','Each set contains two to four effects. Expand an effect to compare its available rarities and owner/guest values.'),
('events/sparkly-spa.html','text-8','P · Gain 50 Sparkle progress per eligible daily settlement.','Gain 50 Sparkle progress per eligible daily settlement.'),
('events/sparkly-spa.html','text-9','P · This doubles the chance of obtaining Glitter; it does not give a 100% Glitter chance.','This doubles the chance of obtaining Glitter; it does not give a 100% Glitter chance.'),
('events/sparkly-spa.html','text-10','P · A chance to double feeding progress.','A chance to double feeding progress.'),
('events/sparkly-spa.html','text-11','P · Avoid losing candy when challenged.','Avoid losing candy when challenged.'),
('events/sparkly-spa.html','text-12','P · Allow Tatari below T4 to receive active spa combat buffs. This effect grants no stat bonus by i','Allow Tatari below T4 to receive active spa combat buffs. This effect grants no stat bonus by itself.'),
('events/sparkly-spa.html','text-13','P · A chance for the food factory to produce double Bentos.','A chance for the food factory to produce double Bentos.'),
('events/sparkly-spa.html','text-14','P · Increase damage to bosses.','Increase damage to bosses.'),
('events/sparkly-spa.html','text-15','P · Reduce Goldrush Energy Drink costs.','Reduce Goldrush Energy Drink costs.'),
('events/sparkly-spa.html','text-16','P · Increase trainer capacity in the spa.','Increase trainer capacity in the spa.'),
('events/sparkly-spa.html','text-17','P · Add an ATK percentage buff.','Add an ATK percentage buff.'),
('events/sparkly-spa.html','text-18','P · Add an HP percentage buff.','Add an HP percentage buff.'),
('events/sparkly-spa.html','text-19','P · Add a DEF percentage buff.','Add a DEF percentage buff.'),
('events/sparkly-spa.html','text-20','P · Add a damage-dealt buff.','Add a damage-dealt buff.'),
('events/sparkly-spa.html','text-21','P · Add a damage-reduction buff.','Add a damage-reduction buff.'),
('events/sparkly-spa.html','text-22','H2 · Hosts and guests','Hosts and guests'),
('events/sparkly-spa.html','text-23','P · Host your own spa. Win Goldrush MVP and meet the T4 requirement to obtain your spa, then spend ','Host your own spa. Win Goldrush MVP and meet the T4 requirement to obtain your spa, then spend Spa Soap to open it. Only the host generates, rerolls and replaces that spa’s buff set.'),
('events/sparkly-spa.html','text-24','P · Choose a friend’s spa. You do not need your own MVP to visit. Use the Spa Station to compare yo','Choose a friend’s spa. You do not need your own MVP to visit. Use the Spa Station to compare your friends’ open spas and choose the buff set you want, provided there is a free slot and any required approval. Guests receive the host’s active set; they cannot reroll it independently. Your Tatari can benefit from only one spa at a time.'),
('events/sparkly-spa.html','text-25','P · Friends can enter directly when the owner enables free joining. Otherwise, a join request needs','Friends can enter directly when the owner enables free joining. Otherwise, a join request needs approval. Leaving, being removed or spa expiry ends the active benefits. Viewing another spa alone does not activate it.'),
('events/sparkly-spa.html','text-26','H2 · Rerolls and pity','Rerolls and pity'),
('events/sparkly-spa.html','text-27','P · As the host, pay one soap to generate a candidate set, compare it with your current set, then c','As the host, pay one soap to generate a candidate set, compare it with your current set, then choose whether to replace it. Your current set remains active during the preview. Rerolling again replaces the candidate list.'),
('events/sparkly-spa.html','text-28','H2 · Sparkle Tatari and daily progress','Sparkle Tatari and daily progress'),
('events/sparkly-spa.html','text-29','P · Duplicate appearances convert into one Glitter Fruit. Each supported Tatari has five Standard a','Duplicate appearances convert into one Glitter Fruit. Each supported Tatari has five Standard and two Rare appearances. All configured Sparkle appearance ATK, HP and DEF bonus fields are zero; the spa’s temporary buffs are a separate benefit.'),
('events/sparkly-spa.html','text-30','H2 · Sparkle colors','Sparkle colors'),
('events/sparkly-spa.html','text-31','P · Choose a Tatari family to see its five Standard and two Rare T4 appearances. Select an image to','Choose a Tatari family to see its five Standard and two Rare T4 appearances. Select an image to view it at full size.'),
('events/sparkly-spa.html','text-32','H2 · Useful habits','Useful habits'),
('events/sparkly-spa.html','text-33','H2 · What still needs verification','What still needs verification'),
('events/sparkly-spa.html','text-34','P · Golden-card probability and temporary Sparkle effect types exist in the enums but have no confi','Golden-card probability and temporary Sparkle effect types exist in the enums but have no configured effect rows in this version. They are not listed as obtainable buffs.'),
('events/treasure-hunt.html','text-1','P · Four partnerships, four shared boards. Each third completed stage gives a key; every four keys ','Four partnerships, four shared boards. Each third completed stage gives a key; every four keys unlock another chest.'),
('events/treasure-hunt.html','text-2','H2 · Shared boards, separate partnerships','Shared boards, separate partnerships'),
('events/treasure-hunt.html','text-3','P · Pair with four partners. Each partnership advances its own shared board. Clearing a stage grant','Pair with four partners. Each partnership advances its own shared board. Clearing a stage grants its stage rewards; stages 3, 6, 9, and so on also grant one key.'),
('events/treasure-hunt.html','text-4','H2 · Make a plan with your partners','Make a plan with your partners'),
('events/treasure-hunt.html','text-5','H2 · Four-slot reward check','Four-slot reward check'),
('events/treasure-hunt.html','text-6','P · This projects eligible stage and chest rewards for one player. It assumes each eligible reward ','This projects eligible stage and chest rewards for one player. It assumes each eligible reward is claimed and excludes the initial Pickaxe grant.'),
('events/treasure-hunt.html','text-7','H2 · Choose a dig with better odds','Choose a dig with better odds'),
('events/treasure-hunt.html','text-8','P · The solver eliminates arrangements that cross empty tiles or overlap confirmed treasures. Its p','The solver eliminates arrangements that cross empty tiles or overlap confirmed treasures. Its percentages describe the chance of a tile containing an undiscovered treasure under an equal-valid-layout model.'),
('events/treasure-hunt.html','text-9','P · Record every tile revealed in-game, including free reveals from bombs. The solver needs the res','Record every tile revealed in-game, including free reveals from bombs. The solver needs the resulting empty or treasure information, not a separate bomb simulation.'),
('events/treasure-hunt.html','text-10','H2 · Bombs, moles and digging costs','Bombs, moles and digging costs'),
('events/treasure-hunt.html','text-11','H3 · Pickaxe cost per dig','Pickaxe cost per dig'),
('events/treasure-hunt.html','text-12','H2 · Chest progression','Chest progression'),
('events/treasure-hunt.html','text-13','P · Select a chest to total rewards from all chests up to it.','Select a chest to total rewards from all chests up to it.'),
('events/zobo-shooter.html','text-1','P · Use your strongest eligible Tatari quality, pick an arena you can enter, and understand the cha','Use your strongest eligible Tatari quality, pick an arena you can enter, and understand the chance behind each attack.'),
('events/zobo-shooter.html','text-2','H2 · Every attack is a chance','Every attack is a chance'),
('events/zobo-shooter.html','text-3','P · Zobos enter the arena and leave after a time. Each paid attack consumes coins according to the ','Zobos enter the arena and leave after a time. Each paid attack consumes coins according to the arena multiplier. Defeating a Zobo earns points; team score unlocks milestones.'),
('events/zobo-shooter.html','text-4','P · Your team shares points. According to the published rules, item drops from your own kills are n','Your team shares points. According to the published rules, item drops from your own kills are not shared.'),
('events/zobo-shooter.html','text-5','H2 · Choose your Tatari and arena','Choose your Tatari and arena'),
('events/zobo-shooter.html','text-6','H2 · Power-ups','Power-ups'),
('events/zobo-shooter.html','text-7','P · Defeating Zobos can drop Lock On and Enrage. Drops from your own kills belong to you; they are ','Defeating Zobos can drop Lock On and Enrage. Drops from your own kills belong to you; they are not shared with teammates.'),
('events/zobo-shooter.html','text-8','P · Auto-target Zobos through obstacles.','Auto-target Zobos through obstacles.'),
('events/zobo-shooter.html','text-9','P · Increase your attack speed.','Increase your attack speed.'),
('events/zobo-shooter.html','text-10','H2 · Compare a boss attack','Compare a boss attack'),
('events/zobo-shooter.html','text-11','H2 · Points, cost, and risk','Points, cost, and risk'),
('events/zobo-shooter.html','text-12','P · For the same target, a higher arena multiplier increases points and cost together. It does not ','For the same target, a higher arena multiplier increases points and cost together. It does not by itself improve expected points per coin. Later arenas add different bosses, so the target pool still matters.'),
('events/zobo-shooter.html','text-13','H3 · Arena requirements','Arena requirements'),
('events/zobo-shooter.html','text-14','P · Unlock requirements count total Zobo Coins earned. Coins in hand are your current balance, a se','Unlock requirements count total Zobo Coins earned. Coins in hand are your current balance, a separate entry requirement.'),
('events/zobo-shooter.html','text-15','H2 · Set a budget, not an imaginary guarantee','Set a budget, not an imaginary guarantee'),
('events/zobo-shooter.html','text-16','P · Leaving after a spending limit can protect your budget. There is no verified rule that spending','Leaving after a spending limit can protect your budget. There is no verified rule that spending a fixed number of coins resets the next kill chance or makes a boss “due.” Another player can also finish a target while you are attacking.');
commit;
