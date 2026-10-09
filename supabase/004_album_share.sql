begin;
alter table public.album_trade_preferences add column if not exists rarity_mode text not null default 'Same Rarity' check(rarity_mode in ('Same Rarity','Flexible Rarity','Any Rarity'));
alter table public.album_trade_preferences add column if not exists trades_left_today smallint not null default 3 check(trades_left_today between 0 and 3);
commit;
