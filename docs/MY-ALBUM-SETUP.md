# My Album setup

Run supabase/003_my_album.sql once in the same Supabase project's SQL Editor. Account migrations 001 and 002 should already be present. This migration adds the Autumn Tales catalog, private inventory, set priorities and star preferences. It does not replace profiles or dojo settings.

Inventory saves via a narrow authenticated RPC. It uses the authenticated user ID, transaction locks and server timestamps. Direct client writes to inventory are not granted. Changes update timestamps; no-op quantity clicks, logging in and reading do not. Zero quantities mean LF; one copy is reserved; duplicates mean quantity minus one. Gold FT eligibility is computed on the server.

No Gold Exchange event is seeded. ALL 17 gold cards remain locked until an administrator explicitly creates a published event. To schedule a confirmed event, use SQL Editor or a trusted backend to insert season_id='autumn-tales', starts_at and ends_at as confirmed UTC timestamptz values, published=true into gold_exchange_events. Ordinary users cannot create or edit events. All gold cards are eligible during the window; boundary is start-inclusive, end-exclusive. Do not guess dates.

The page checks the server exchange status every minute and when loading. Never use the device clock for eligibility. Future matching/contact RPCs must use album_tradeable_inventory or equivalent server-side checks.

Album metadata/artwork is curated from the user-supplied Autumn Tales outcome handoff, 15 sets, 135 cards, 17 gold, version 0.49.1. Original card art and supplied plus/minus UI images are copied. No Lua/APK/config dump is published.

Set priority: High=3, Normal=2, Low=1. Trade preferences describe cards the user wants to RECEIVE, relative to cards they GIVE. Any Stars overrides those narrower options when matching is built.

Private quantities/preferences are stored now; public trade listings, contact disclosure and multi-step route finding are separate upcoming work. No trade is executed or quantity auto-adjusted merely by connecting users.

Offline checks do not confirm live SQL, saving, RLS isolation or concurrency. After running SQL and deploying: log in, add a card twice, reload, confirm quantity 2; remove once and confirm Owned; check a gold duplicate stays locked. Repeat with a second account and verify no cross-account inventory access.
