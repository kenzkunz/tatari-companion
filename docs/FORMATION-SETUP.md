# Formation planner and community

Canonical planner: `dist/drafter/horde.html`. Community and private library: `dist/formations.html` (`?view=mine` for private drafts).

Apply `supabase/014_formations.sql`, then `supabase/015_formation_likes.sql` in the configured Supabase SQL editor. Both use RLS, revoke direct table access, and expose bounded authenticated RPCs. Existing account and profile migrations remain prerequisites. These migrations have been prepared but not applied by this task.

Connection check (14 October 2026): authentication health and `formation_list_public_v1` returned HTTP 200; the public list was empty. Anonymous private-draft and like writes were denied. Then sign in and verify Save private, Publish snapshot, private edit preserving the published snapshot, Like/unlike, Open template, Unpublish, Delete and access from a second account. Live authenticated persistence is not yet verified.

Community card PNGs are generated with the same grid-only renderer and snapshot title, author and notes as Share, always with the light theme. This avoids arbitrary external image URLs and storage-bucket permissions. Changing a draft does not alter its public image until Publish. Open loads a new local draft; Save draft stores it in the signed-in account. The original published record is never updated by opening a template.

Likes: one toggle per authenticated account per published formation. Public responses include aggregate counts and only the current viewer's liked state, never voter account IDs. Newest and Most liked ordering are supported over the bounded 100-record public list.

Full-field Zobo annotations and selected chips remain JSON draft data; the grid-only share image currently depicts deployed Tatari, as approved in the share redesign. Conditional chip targeting is not a battle simulator. Backend Support uses the verified same-column, exactly-one-owned-Tatari-ahead rule; gaps are allowed.

Validation completed offline in an isolated PostgreSQL-compatible PGlite instance: both migrations executed; private save/publication/private edit snapshot isolation, cross-account private-read rejection, like/unlike, anonymous write rejection and the three-chip cap passed. Browser RPC fixtures verified card image preview, like state, template cloning and share rendering. These do not prove live Supabase persistence.


## Backend Support validation (game 0.49.1)
Chip 32 links skill 1100032, implemented as HorseCannon. Skill configuration sets front count to 1 and boost to 45; buff 1100032 sets DmgUp 0.45 and is non-stackable. The implementation collects living units filtered to the chip owner's UID, excludes the candidate itself, compares equal grid X and greater grid Y, and adds the buff only when the count equals one. Rear Guard's deployment-area comparison confirms lower grid Y is the rear. The evaluator checks periodically at a four-second interval; the planner shows static eligibility, not timing or deaths. Source review is based on extracted game configuration and bytecode control flow, not a live battle test.
