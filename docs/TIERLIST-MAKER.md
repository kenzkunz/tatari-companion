# Tierlist maker

Routes: `/drafter/tierlist.html` and `/tierlists.html`. Both appear under Drafter in shared navigation.

First version uses 67 Tatari families, playerhead assets, 1–20 editable ranking rows with settings, add/delete/clear and move up/down controls, title/notes, Tier I–IV and all-tier filtering, desktop dragging, tap/keyboard placement, local autosave, encoded share links, JSON import/export in More, and a Share modal for PNG export, link copying and publishing. Each evolution form can be ranked independently. Older family-ID lists migrate to form keys. Tier filters only change the pool; placed forms remain. Alignment chart switches to two axes with editable endpoint labels, normalized coordinates, pointer dragging, keyboard nudging and tap placement. List rows and chart placements are saved independently. Selecting an item in a row lets users move it to another row or return it to the pool. Drops append within a row.

Account drafts and publishing require applying `supabase/016_tierlists.sql` after migration 014. This is an additive schema; formation tables and RPCs stay separate. The migration creates private owner-bound drafts, explicit published snapshots, revision checks, 100-draft account limits, payload validation against the existing catalog, profile-derived creator names, authenticated likes, and owner-only deletion/unpublishing. Table access is revoked and RLS enabled. Public list/read RPCs expose published snapshots only.

Database migration was prepared, not applied in this workspace. Account/community flows must be checked against the live database after installation. No admin credentials or SQL connection were available here. UI exposes a setup message if RPCs are unavailable. Anonymous users can create, save locally, export and share links; account mutations require login.

Local saving holds one working list. Account drafts support multiple lists once the migration is installed. No live records were created or changed during development.

## Appearance artwork

Normal, Glitter and Sparkle now filter the available playerheads. Normal has 248 forms, Glitter has 228 forms (57 families), and Sparkle has 70 skins (10 Tier IV families, seven skins each). Missing artwork is omitted rather than substituted. Each appearance is an independent ranking key, for example `11-4`, `11-4-flash`, `11-4-color_2`. Existing normal lists remain compatible. Selection is saved in local/account drafts and JSON; the same artwork is used in chart and PNG/community previews.

Imported only the supplied Glitter/Sparkle PNG playerheads from PFPTatari. Duplicate extracted copies were grouped by unit/tier/variant, preferring the full square canvas and then greatest pixel area. The generated WebPs preserve dimensions, alpha and pixel appearance losslessly. All 298 outputs were independently decoded and compared against their chosen sources. Total generated asset size: 4,181,946 bytes. No source Lua, APKs or unrelated exports are included.

Migration 017 restricts saved appearance keys to the known supplied artwork combinations. Its helper and equivalent validator upgrade were applied through the signed-in Supabase SQL editor on 15 October 2026; known Glitter/Sparkle keys accepted and unknown keys rejected.
