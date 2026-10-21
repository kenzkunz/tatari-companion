-- Patch 165921: reconstructed UnitLevel data supports account levels 1–3600.
-- Preserve all existing records; only widen the existing allowed range.
begin;
alter table public.tatari_rosters drop constraint if exists tatari_rosters_account_level_cap;
alter table public.tatari_rosters add constraint tatari_rosters_account_level_cap check ((roster->>'accountLevel')::integer between 1 and 3600) not valid;
commit;
