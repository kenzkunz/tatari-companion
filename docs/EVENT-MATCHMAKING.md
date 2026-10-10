# Event Matchmaking

Production source: `dist/events/matchmaking.html`, `dist/event-matchmaking.mjs`, `dist/event-matchmaking.css`. The earlier local preview remains separate and contains sample players.

## Supabase setup

1. Apply existing migrations 001–007 first to the same Supabase project configured in `dist/supabase-config.mjs`.
2. In Supabase SQL Editor, run `supabase/008_event_matchmaking.sql` as the project administrator. The migration creates plans, locked-down RPC functions and a pg_cron job. It is transactional and intended to run once.
3. Check `cron.job` for `expire-event-match-plans`. Verify its runs in `cron.job_run_details`.
4. Run `supabase/tests/008_event_matchmaking.sql` in SQL Editor. It rolls back test fixtures.
5. Deploy through the existing GitHub Pages workflow. Verify with two separate signed-in accounts with saved game UIDs.

This migration has not been applied to the live database by the local file update. Never put a service-role key or database password in site files.

## Behavior and privacy

Each listing belongs to one account and one dated event occurrence. The server validates that the start date matches the configured next occurrence. No currently running event can be listed. Slots are 1–3 for normal events and 1–4 for Treasure Hunt; keys measure shared partnership progress.

Applying explicitly consents to matchmaking UID sharing. This consent does not change album/trading sharing settings. Only authenticated users can find matches; only an account with an active compatible listing can obtain a partner UID through Connect. Match lists do not expose UIDs. Connect reveals details to arrange play; it sends no message and does not reserve a slot or create an in-game team.

Matches use overlapping pinball budgets and the checked playing styles. Treasure Hunt also requires the other plan to meet the searching player's minimum key target. Results exclude yourself, group by dated event, and sort nearest event first. Results paginate in batches of 100.

Started listings are immediately excluded by every read/contact query. RPC activity also removes expired rows; cron physically deletes them every minute even when no visitors are present. A browser checks event rollover every 30 seconds and on focus.

The schedule is the site's estimated 3-day event / 15-day repeat rotation, anchored to 24 September 2026. If game timing changes, update both `dist/data.json` and the database definitions before accepting new plans. Server rejection prevents client-invented event dates.

## Verification

Run `npm test` and the repository-base build. Run the SQL regression file after installation, then verify two-account listing, delisting, filters, Connect, UID copying, auth changes and expiry. Offline checks do not establish live Supabase operation.

Supabase references: https://supabase.com/docs/guides/database/functions and https://supabase.com/docs/guides/cron/install.
