# Mandatory UID and public player albums

Run supabase/006_required_uid_player_albums.sql BEFORE deploying this version. It audits existing invalid/duplicate IDs and stops for manual review instead of silently changing them. UIDs are numeric strings (up to 20 digits; no leading zeroes) and unique. Existing non-empty IDs become locked. Normal clients cannot update/clear an existing UID or delete their profile to reset it. UID entry after Discord login is mandatory before account mutations. The ID correction/reassignment process is intentionally deferred.

UID ownership is not verified by the site. First-claim uniqueness is not ownership proof. Any future correction tool must handle collisions and identity verification explicitly.

The required native modal has no Close button, blocks Escape/backdrop dismissal, and closes only after a successful server save. Failed verification offers a retry; guest use remains available when not signed in. Apply SQL first to avoid blocking existing signed-in users on missing RPCs.

Public player URL: https://kenzkunz.github.io/tatari-companion/player/<in-game-id>?album=4 . A narrowly scoped 404 fallback redirects only numeric player paths through player.html and restores the pretty URL. Other 404 routes retain the original branded error page.

Read-only player albums expose quantities only when Public player album OR trading visibility is enabled. Discord contact is not included. Trading visibility makes the game UID public through the player link; Discord remains independently editable and gated by its Reveal/Hidden flag. Account IDs and badge settings remain private. Album 4 maps to Autumn Tales.

Local PostgreSQL tests exercised UID uniqueness, immutability, profile delete prevention, missing-ID mutation gates, private/public album projections and Discord omission. Browser signed-in/live registration and direct-link behavior still need verification after applying the migration and publishing.
