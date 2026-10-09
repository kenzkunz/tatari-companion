# Album views and revised trading modes

Apply supabase/007_album_views_trade_modes.sql after migrations 001–006, before deploying this UI. It supersedes the earlier Gold Exchange hard lock: gold cards may appear in matches and routes at any time. The website does not execute trades; users must confirm in-game Gold Exchange availability. Gold event records remain intact but no longer gate trade eligibility.

No Trading removes the player from FT listings, prevents matching/contact/route actions, and makes Share produce a collection showcase rather than LF/FT advertising. Public album visibility remains controlled by the existing Account settings.

Grid/list toggles exist on My Album and public player albums. Grid is the default; the visitor preference is stored locally under milkroad-album-view. Only grid artwork is resized to 80%; text, stars and controls keep their existing sizes. List rows show thumbnail, name/number, stars, owned quantity and editing controls only on My Album. Public albums never expose mutation controls. No leaderboard is added.

Local PostgreSQL tests passed gold matching without an event, No Trading listing/contact/route exclusion and continued public showcase access. Browser checks confirmed mobile width, read-only public list and preference persistence. Live Supabase still needs the migration applied.
