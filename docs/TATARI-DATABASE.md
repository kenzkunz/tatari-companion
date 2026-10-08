# Tatari database

The public database is at `database/tatari.html` and its generated clean URL. It uses the supplied 0.49.1 snapshot, extracted 8 October 2026. This is packaged game data, not a live server feed.

`dist/tatari-data/roster.json` is a curated subset of the supplied handoff: 67 families, 248 forms, localized names, lore, image paths, evolution-star requirements and skill descriptions/detail rows. Only 574 images used by this UI are included. Raw configuration, executable condition strings, Lua, APK files, player data and extraction utilities are excluded.

Search accepts English/Chinese evolution names, internal names, existing descriptive aliases from the reviewed local roster and tier-root aliases such as Frostnip2. Results always show tier-1 cards. Element filters combine with search. Desktop scrolling and mobile horizontal swipe preserve roster selection.

Each evolution uses playerhead portraits, monochrome when unselected. The selected detail uses pet_head artwork. Links preserve family, evolution and skill mode with query parameters. Normal/Horde tabs display the recorded skills; Horde skills are not claimed simultaneously unlocked at every progression stage.

Stats are verified core stats at element level 500 and dojo progress 0. Tier 1 uses zero stars. Later tiers use the previous stage's recorded evolution-star requirement. The next-evolution panel uses the selected stage's trial requirement; highest available tier shows max tier. Formula: `(Standard * StarCoef + StarAdd) * Growth`. Values are rounded only for display.

Minimum food is shown separately: tier 1 stage 0, tier 2 stage 3, higher tiers B. The handoff does not verify how feeding values combine with base stats or resolve every B-stage index. Food bonuses, badges, Aurora, temporary effects and mode bonuses are excluded from displayed numbers; the page says so explicitly. Do not silently turn these into final battle stats. Supabase and comparison are not implemented by this change.

`scripts/tatari-check.mjs` verifies the supplied formula vector, minimum-star mapping, alias searches, all form stats and used image references. Existing deployment-base checks and calculator checks still run with `npm test`.
