-- Run once in Supabase SQL Editor. No game source/configuration tables are imported.
begin;
create or replace function public.valid_dojo_levels(levels jsonb)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
begin
 if jsonb_typeof(levels) is distinct from 'object' then return false; end if;
 if not (levels ?& array['2','3','4','6','5']) then return false; end if;
 return not exists(select 1 from jsonb_each(levels) e where e.key not in ('2','3','4','6','5') or e.value::text !~ '^[0-7]$');
end $$;
revoke all on function public.valid_dojo_levels(jsonb) from public;
grant execute on function public.valid_dojo_levels(jsonb) to authenticated;
create table if not exists public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 1 and 40),
 game_id text not null default '' check(char_length(game_id)<=64),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.user_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 dojo_levels jsonb not null default '{"2":0,"3":0,"4":0,"6":0,"5":0}'::jsonb check(public.valid_dojo_levels(dojo_levels)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
revoke all on public.profiles,public.user_settings from anon,public;
grant select,insert,update,delete on public.profiles,public.user_settings to authenticated;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid())=user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy profiles_delete_own on public.profiles for delete to authenticated using ((select auth.uid())=user_id);
create policy settings_select_own on public.user_settings for select to authenticated using ((select auth.uid())=user_id);
create policy settings_insert_own on public.user_settings for insert to authenticated with check ((select auth.uid())=user_id);
create policy settings_update_own on public.user_settings for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy settings_delete_own on public.user_settings for delete to authenticated using ((select auth.uid())=user_id);
create or replace function public.touch_account_updated_at() returns trigger language plpgsql set search_path=pg_catalog as $$begin new.updated_at=now();return new;end $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.touch_account_updated_at();
create trigger settings_updated_at before update on public.user_settings for each row execute function public.touch_account_updated_at();
commit;
