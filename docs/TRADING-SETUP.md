# Trade Matching setup

Run supabase/005_trade_matching.sql once after migrations 001–004. Default public trading visibility is OFF for every profile. No private profile/inventory RLS policy is weakened.

After deployment: Account > List my album for trading > Save Profile. Reveal UID and/or Discord independently if you want compatible traders to contact you. Avatar comes from the signed-in provider, restricted to Discord/Google image hosts. Listing projections expose only opted-in display name, avatar, available FT card numbers, genuine inventory update time and possible swaps. Contact RPC revalidates inventory, partner opt-in, gold availability and BOTH users' rarity settings, returning only revealed contact fields.

Newest listings first. Set/star filters apply to offered cards. Quantity one is reserved, zero means missing. Default rarity is equal stars; +1 and -1 are considered from EACH participant's perspective. Gold is blocked outside a published server-time window.

Routes are suggestions up to three steps and the viewer's manually recorded remaining-trade count. Intermediate cards must already be owned before receiving another copy, so the route never gives away a last copy. Partners/cards are not repeated. Route expansion is bounded to 20 promising edges per step; results are not an exhaustive or guaranteed search. Only the FIRST leg exposes a Connect action. Update inventory and recheck before later steps. Sorting supports fewest trades, priority and freshness. Nothing is executed in game; no inventory is altered by matching, finding routes or opening contacts.

SQL was validated in a local PostgreSQL-compatible runtime using three synthetic users: migrations, RLS isolation, anonymous permissions, opt-outs, contact flags, reserved copies, compatible trades, gold windows and two-step routes. This is not proof of live Supabase behavior. After applying and publishing, test with two real accounts and confirm privacy opt-outs and expiration are enforced.
