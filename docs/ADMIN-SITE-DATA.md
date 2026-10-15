# Admin schedules, footer, guide data and UID consistency

Implemented 15 October 2026. Canonical pages remain in dist; generated output remains in _site. Apply migrations 020, 021 and 022 in order. New admin panels are independent: a failed UID/settings/media request does not block the guide editor. No service-role or GitHub credential is shipped to the browser.

## Editor workflow

Events & Schedule, Footer & Links, and Guide Data use Save draft -> Preview -> Publish. Publishing requires a short reason/evidence note. Drafts are private to administrators. Expected revisions reject stale writes. History restores a selected version as a draft; publishing is a separate step. Restore original publishes the original source values after confirmation. Module errors stay in their own panels.

The generated admin-data-catalog.json registers ten bounded datasets and 1,567 editable source fields. Six guide datasets have editable values; Horde and Sparkly Spa are intentionally read-only. Fields can be searched, filtered by section and paged in groups of 50. This release edits existing source rows, not structural additions/deletions of items, event types or milestone rows.

On the first successful admin load, the catalog initializes missing database records with their original values. It does not publish them, overwrite existing drafts, or change live content. A baseline mismatch is rejected instead of overwriting a newer dataset. Changing canonical data/schema in a future release requires regenerating the catalog with node scripts/generate-admin-data-catalog.mjs and deliberately migrating the baseline; simply regenerating a published catalog is not a data migration.

## Source data versus calculated data

JSON is a storage format. It does not make a field inherently editable or calculated. These editors expose reviewed input fields; calculated outputs and coupled mechanics are protected. The public loader applies only approved, same-type scalar paths to its static JSON source, rejects prototype paths, checks baseline identity, and recalculates derived display values. IDs, image paths, array structure and formulas cannot be edited here.

| Feature | Base sources | Calculation / display code | Admin scope |
| --- | --- | --- | --- |
| Regular/PvP calendar and event windows | data.json events.* | schedule-model.mjs regularAt/pvpAt, schedule.mjs | Event order, UTC anchor date/event, duration and PvP registration period. Countdown and dates are calculated, not edited independently. Supported event set and UTC reset are fixed. |
| Horde event countdown | data.json horde | schedule-model.mjs hordeAt | Cycle and rest seconds; rest must be shorter than cycle. Current phase/end time remain calculated. |
| Matchmaking dates | Same published schedule plus event_match_definitions | event-matchmaking.mjs; save_event_match_plan server RPC | Publishing regular schedule updates server anchors and cycle_days atomically. A change that would orphan future plans is rejected. Plans/consent are not rewritten. |
| Pinball calculation and reverse estimate | data.json party.tables and party.direct_candy_per_x1; PAYOUTS/UNLOCKS/probability constants in engine.mjs | engine.mjs, worker.mjs, resources.mjs | The schedule selection uses the shared admin schedule. Machine payouts, probabilities, unlock rules, reinvestment and party thresholds remain a reviewed code/data release. Editing guide milestone quantities does not change the Pinball engine. |
| Fishing guide | guide-data/fishing.json | guides.mjs: gold=floor(kg*fish.price/10); silver=gold*selected multiplier | Milestone thresholds, reward quantities and fish base price. Formula, max_raw weight limits, multipliers, IDs and artwork are locked. Preview includes a 10 kg / x1 example. |
| Cozy Farm guide | guide-data/cozy-farm.json | guides.mjs cumulative milestone rewards and static guide explanations | Milestone thresholds and reward quantities. Crop IDs/support-family links, watering mechanic, geometry and growth-stage assets are locked. The standalone watering six-crop total is derived/redundant and is not exposed as an independent setting. |
| Raft Race guide | guide-data/raft-race.json | guides.mjs cumulative totals and one-choice selection-box handling | Milestone thresholds and reward counts. Selection-box alternatives/base_amount/amount relationships, multipliers and IDs are locked; totals do not sum all alternative contents. |
| Treasure Hunt guide | guide-data/treasure-hunt.json | guides.mjs partner keys, eligible chests and cumulative rewards | Milestone/chest thresholds and item quantities. Key formula, stage boundaries, IDs and artwork stay fixed. |
| Treasure Hunt solver | treasure-data/stages.json | treasure-solver-model.mjs, treasure-solver-dp-model.mjs, treasure-solver-worker.mjs | Read-only mechanics release. Stage shapes, placements, rotations, enumeration and probability estimates are separate from guide rewards. |
| Zobo Shooter guide | guide-data/zobo-shooter.json | guides.mjs score/boss display | Milestone thresholds, reward quantities and boss base scores. Probability weights, pools, multipliers and IDs are locked. |
| Island Goldrush guide | guide-data/goldrush.json | goldrush-guide.mjs totals and per-hour output | Existing reward quantities, team milestone points, defenders and base points/minute. Per-hour points are recalculated as perMinute*60. Geometry, IDs, buff/exhaustion rules and ranking ranges are locked. |
| Horde guide / formation planner | guide-data/horde.json, drafter-roster.json, drafter-energizer-costs.json, aura-values.json, zobo-art.json | horde-guide.mjs, drafter-energizer.mjs, drafter-aura.mjs, drafter-chips.mjs | Read-only mechanics. Cumulative rank/formation cost, wave income, chip targeting, stats and aura effects must remain consistent across sources. |
| Tatari database / stats comparison | tatari-data/roster.json, effect-catalog.json | tatari-model.mjs, tatari-stats-model.mjs and shared stat/effect helpers | Read-only mechanics release. Level/evolution/food/dojo/Spa stat results are calculated. No independent manual result overrides. |
| Sparkly Spa mechanics | guide-data/spa-audit.json plus reviewed text / stat configuration | Spa guide and Tatari stat helpers | Read-only because the source includes reviewed mechanics and unresolved duplicate reward questions. Guide prose still uses the existing text editor; uncertain mechanics were not silently changed. |
| Tierlist / alignment chart | Tatari roster, appearance catalog and player payload | tierlist model/chart/render modules | Player-created rankings and chart positions remain user-owned. No game-calculation editor here. |
| Album / trading | album-data/autumn-tales.json and user collection rows | album-model.mjs, trade-model.mjs | Catalog IDs, duplicate/missing counts and one-copy reserve rules are not part of guide editing. User quantities are not modified. |
| Shared footer | components/public-footer.html fallback plus published footer values | site-footer.mjs | Plain title/disclaimer/credits/thanks, three existing HTTPS links, optional extra link and update date. No executable HTML. Layout/logo remain fixed. |

Static JSON/code remains the fallback when the public settings endpoint is unavailable. Footer loading is asynchronous; guide/schedule requests have a bounded timeout. Public APIs return only published values and their baseline/revision, never drafts or private notes. Legacy clients may temporarily show static data until refreshed; server matchmaking validation still prevents invalid plan dates.

## UID consistency

- Deleted rows must be disabled (database constraint); public directory/reveal/report paths explicitly exclude them.
- Re-approval through the older submission route clears deleted_at and re-enables the row consistently; it cannot become public while still classified Deleted.
- UID/fruit identity edits create a fresh listing ID and retire the previous identity into Deleted. Reports/reveal counts do not transfer. Duplicate UID/fruit pairs are rejected with guidance to edit/restore the existing row.
- Bonus/note edits retain identity and feedback. Every update increments revision; stale forms are rejected.
- Before/after state and replacement relationships are saved in admin-only audit details. History is available inside the edit/notes dialog.
- The public client discards cached revealed UIDs when their listing disappears from the refreshed directory. Activity history refreshes after admin mutations.

## Validation and tests

npm test includes admin-site-data-check.mjs: all catalog defaults, protected-path checks, anchored schedule rotation, duplicate-event/range/date/URL rejection, prototype safety and derived hourly values. Root/subpath and existing model tests remain required. SQL string checks are structural, not a substitute for database tests.

supabase/tests/021_admin_site_data.sql is a rollback-only database check: non-admin/underlying-table denial, UID identity replacement and fresh reports, stale UID writes, history, settings draft privacy/publish, stale revisions and locked source keys. Test fixtures and published test values are rolled back. Run it after migrations; do not remove the final rollback.

Browser fixture tests cover schedule draft/preview/publish, footer rendering, guide edits/preview/history restore, read-only Horde state and mobile width. Production verification should inspect new panel loading and existing data without publishing invented game changes.

Deployment verification: migrations 020–022 were applied to the existing Supabase project. The rollback SQL checks passed against that database on 15 October 2026; their fixtures and temporary published values were rolled back. Public content values remain unchanged until an administrator publishes an edit.
