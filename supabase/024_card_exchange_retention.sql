-- Run as the project database owner after 023. Idempotent named hourly job.
begin;
create extension if not exists pg_cron;
select cron.schedule('card-exchange-retention','17 * * * *','select public.exchange_cleanup()');
commit;
