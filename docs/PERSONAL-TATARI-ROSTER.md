# Personal Tatari roster

Account links to My Tatari. Signed-in users read and save only their own Supabase roster. Login is required to edit rosters on both localhost and production. The roster page is noindex and excluded from public sitemap/AI discovery.

Migration 038 creates private roster storage and a non-client-readable validation catalog from the selected v0.49.1 export. RLS permits only own-row reads. Writes use save_tatari_roster with expected actor and optimistic revision checks, validated unit IDs, evolution tiers, food stages, stars, copy progress and ownership flags. Copy progress is below the current-star cost; 84 stars stores zero progress. Auth user deletion cascades to the roster and clears that account's browser cache.

Rosters are managed online while logged in. Import/export and browser migration controls are removed. A save conflict keeps edits open; Refresh roster reloads the latest account version. Other devices see changes on load or Refresh roster.

My Account, My Badges and My Tatari share account section navigation. Badge settings use the existing user_settings.dojo_levels data and are edited only on My Badges. Profile and account actions remain on My Account.



Account level is capped at 3600 in the editor, model validation and database (migration 042), using recorded patch-165921 level tables, matching recorded normal-stat coverage. Existing rows are not rewritten.
