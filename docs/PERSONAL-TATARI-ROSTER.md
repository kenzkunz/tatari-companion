# Personal Tatari roster

Account links to My Tatari. Signed-in users read and save only their own Supabase roster. Guests can use browser-only previews on localhost; production requires login. The roster page is noindex and excluded from public sitemap/AI discovery.

Migration 038 creates private roster storage and a non-client-readable validation catalog from the selected v0.49.1 export. RLS permits only own-row reads. Writes use save_tatari_roster with expected actor and optimistic revision checks, validated unit IDs, evolution tiers, food stages, stars, copy progress and ownership flags. Copy progress is below the current-star cost; 84 stars stores zero progress. Auth user deletion cascades to the roster and clears that account's browser cache.

Cloud loads do not silently import browser data. Import browser roster offers an explicit replacement confirmation. Browser copies remain available if importing fails. A save conflict keeps edits open; Refresh roster reloads the latest account version. Other devices see changes on load or Refresh roster. No roster publication or realtime subscription is enabled.

Checks: scripts/my-tatari-check.mjs and scripts/my-tatari-db-check.mjs run through account-check in npm test. No raw Lua or private research exports are shipped. Stat-based recommendations and battle solving are not implemented.
