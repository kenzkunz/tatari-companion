-- Enforce the current recorded normal-stat level range on new saves.
-- NOT VALID preserves older records without silently changing player data.
begin;
alter table public.tatari_rosters add constraint tatari_rosters_account_level_cap check ((roster->>'accountLevel')::integer between 1 and 2400) not valid;
commit;
