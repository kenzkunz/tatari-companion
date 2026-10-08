-- Apply after 001_accounts.sql. Existing profile and dojo data are preserved.
begin;
alter table public.profiles add column if not exists discord_username text not null default '' check (char_length(discord_username)<=64);
alter table public.profiles add column if not exists share_game_id boolean not null default false;
alter table public.profiles add column if not exists share_discord boolean not null default false;
-- Profiles remain private under the existing owner-only RLS policies.
-- These flags are opt-in preferences for the future trade-contact endpoint;
-- do not grant anonymous access to the profile table.
commit;
