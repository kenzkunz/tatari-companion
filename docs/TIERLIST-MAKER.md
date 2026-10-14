# Tierlist maker

Routes: `/drafter/tierlist.html` and `/tierlists.html`. Both appear under Drafter in shared navigation.

First version uses 67 Tatari families, playerhead assets, 1–20 editable ranking rows with settings, add/delete/clear and move up/down controls, title/notes, Tier I–IV and all-tier filtering, desktop dragging, tap/keyboard placement, local autosave, encoded share links, JSON import/export in More, and a Share modal for PNG export, link copying and publishing. Each evolution form can be ranked independently. Older family-ID lists migrate to form keys. Tier filters only change the pool; placed forms remain. Alignment chart switches to two axes with editable endpoint labels, normalized coordinates, pointer dragging, keyboard nudging and tap placement. List rows and chart placements are saved independently. Selecting an item in a row lets users move it to another row or return it to the pool. Drops append within a row.

Account drafts and publishing require applying `supabase/016_tierlists.sql` after migration 014. This is an additive schema; formation tables and RPCs stay separate. The migration creates private owner-bound drafts, explicit published snapshots, revision checks, 100-draft account limits, payload validation against the existing catalog, profile-derived creator names, authenticated likes, and owner-only deletion/unpublishing. Table access is revoked and RLS enabled. Public list/read RPCs expose published snapshots only.

Database migration was prepared, not applied in this workspace. Account/community flows must be checked against the live database after installation. No admin credentials or SQL connection were available here. UI exposes a setup message if RPCs are unavailable. Anonymous users can create, save locally, export and share links; account mutations require login.

Local saving holds one working list. Account drafts support multiple lists once the migration is installed. No live records were created or changed during development.
