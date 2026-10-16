# Card Exchange deployment

GitHub Pages serves the interface. Supabase stores live messages and requests. No service-role key is included in the browser.

## Apply backend

1. Take a project database backup before applying schema changes. Preserve existing account, inventory and preferences tables.
2. Run `supabase/023_card_exchange.sql` in the Supabase SQL editor after migrations 001–022. This only adds exchange tables/functions; it does not import game data or alter inventory quantities.
3. Run `supabase/024_card_exchange_retention.sql` as the database owner. It enables pg_cron and schedules the named hourly retention job. Verify `select jobname, schedule, active from cron.job where jobname='card-exchange-retention';` returns one active row. Expired messages are excluded from all RPC reads immediately at seven days; physical deletion runs hourly. The same job expires pending requests after seven days.
4. Reload the PostgREST schema if the new RPC is not available: `notify pgrst, 'reload schema';`.
5. Use two opt-in test accounts with game UIDs and known duplicate/missing cards. Test sent/received request orientation, Recall by sender only, Gift text, read/unread, block in both directions, and deletion hiding only the current user's history. Do not test by altering real inventory.

## Behavior and mapping

- All Rarity = `Any Rarity`; Equal Rarity = `Same Rarity`. Both pages use `album_trade_preferences` with field-specific updates. Attempts are manually maintained, shared settings; requests do not consume attempts or transfer cards. The selected initiator must have at least one attempt left.
- Same Star = distinct receivable cards in compatible swaps with equal star values. Possible Match = distinct receivable cards in all compatible swaps. Both parties' missing cards, duplicates (one reserved copy), rarity preferences and visibility are checked. Existing `trade_card_available` rules govern gold-card arrangements.
- Star/type filters apply to the card you receive. Trade Setting filters the other player's mode. All filtering runs before pagination. I initiate checks your attempts; They initiate checks theirs. Either leaves both possibilities visible.
- Presence heartbeats while a visible Card Exchange page is open. Green means a heartbeat within 90 seconds; red means otherwise. Last seen is website activity, not in-game status. Hidden/closed tabs age offline automatically.
- Messages poll while the page is visible. The open chat marks displayed messages read. Sending is limited to 20 messages/minute per account. A new conversation requires the recipient to opt into trading; existing correspondents may reply after trading visibility is disabled. Either-direction blocks prevent sending and new requests.
- Delete chat hides earlier messages for the current user. It does not delete the other person's copy or unblock them. Full records expire after seven days.
- Requests are a shared record visible only to the two participants. No acceptance/completion flow is claimed. Recall is sender-only. Blocking recalls pending requests for that pair. Requests are revalidated when submitted; cards may still change afterward because requests do not reserve inventory.
- Browser-only sample data is loaded only on localhost with `?preview=1`; it never reaches Supabase. Production never reads sample browser storage.

## Verification and rollout

`npm ci` then `npm test` includes an isolated real Postgres runtime (PGlite) test of the migration and authorization rules. Tests do not contact live Supabase. The pg_cron extension itself must be verified in the hosted project with the query above.

Until 023 is applied, the live page reports that the database update is required and does not simulate successful messages or requests. Backend application and a two-account hosted smoke test are separate from a successful GitHub Pages deployment.

Rollback: revert the frontend commit first. Keep the exchange tables/data until a backup is verified; do not drop messages or requests during routine rollback.

The two-option Trade Setting filter uses All Rarity as the unrestricted listing view and Equal Rarity to show equal-rarity partners. The personal setting and listing labels map Any Rarity to All Rarity and Same Rarity to Equal Rarity; stored preference values remain unchanged.
