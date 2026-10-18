begin;
-- Community requests are coordination reminders, not in-game trades.
alter table public.exchange_requests alter column expires_at set default (clock_timestamp()+interval '3 days');
-- Shorten currently pending requests without extending any existing deadline.
update public.exchange_requests set expires_at=least(expires_at,created_at+interval '3 days') where status='pending' and expires_at>created_at+interval '3 days';
notify pgrst,'reload schema';
commit;
