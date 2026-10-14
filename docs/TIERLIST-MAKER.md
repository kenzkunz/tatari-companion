# Tierlist maker

Routes: `/drafter/tierlist.html` and `/tierlists.html`. Both appear under Drafter in shared navigation.

First version uses 67 Tatari families, playerhead assets, five editable ranking rows, mode/title/notes, four evolution choices, desktop dragging, tap/keyboard placement, local autosave, encoded share links, and PNG export. Families without a selected tier use their highest form. Ranking assignments are family IDs and persist across tier changes. Selecting an item in a row lets users move it to another row or return it to the pool. Drops append within a row.

Account drafts and publishing require applying `supabase/016_tierlists.sql` after migration 014. This is an additive schema; formation tables and RPCs stay separate. The migration creates private owner-bound drafts, explicit published snapshots, revision checks, 100-draft account limits, payload validation against the existing catalog, profile-derived creator names, authenticated likes, and owner-only deletion/unpublishing. Table access is revoked and RLS enabled. Public list/read RPCs expose published snapshots only.

Database migration was prepared, not applied in this workspace. Account/community flows must be checked against the live database after installation. No admin credentials or SQL connection were available here. UI exposes a setup message if RPCs are unavailable. Anonymous users can create, save locally, export and share links; account mutations require login.

Local saving holds one working list. Account drafts support multiple lists once the migration is installed. No live records were created or changed during development.
