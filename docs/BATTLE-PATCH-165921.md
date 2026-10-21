# Battle setup release — patch 165921

Compared reconstructed patch data to the recovered 0.49.1 baseline on 21 October 2026. Live-build identity remains unverified. Raw code and full recovered tables stay offline.

- 2,671 current encounter setups are translated into a curated, data-only schema: deployment constraints, configured grid-Y values and every spawn marker, enemy, count, lane list, interval and unique identifier. Sixteen encounter shards load on demand.
- 6,400 stages in chapters 1–80 map to those encounters with recorded level steps, stars and ATK/DEF/HP multipliers.
- File comparison: 429 new, 404 changed, 1,838 unchanged. Every new or changed file is included.
- Resolved gameplay comparison (ignoring internal name/ID changes): 404 stage setups changed, all in chapters 24–29. The 404 new legacy references preserve earlier gameplay setups for later chapters. The remaining 25 new files are Horde S3 waves, matching the already released Horde guide roster. Stage stat records have no changes.
- Shared enemy catalog resolves all configured enemies and uses the source-selected icon when variants share artwork. Only standard IDs 1100–2999 appear in the manual picker; internal/tutorial and Boss Challenge variants remain available for encounter display. All 31 standard bosses are selectable. Two-Headed Zobo was absent from the previous Horde-wave-only picker.
- The curated dataset retains raw spawn markers and intervals without inventing runtime time units or converting enemy lanes to deployment depth positions. The stage preview is currently hidden.
- No online simulator is present in this repository. These files update encounter inputs and the planner, not verified combat parity or recommendations.

Private rollback, source hashes/caches and complete filename-to-stage crosswalk are in the local battle-update-20261021 output folder. Public data contains no Lua code, prefab logic, raw packages or full source-table exports.

Horde boss portraits are restored to their configured wave rows. The separate candidate-pool presentation was reverted at the user’s request. The stage setup preview is removed for now; the curated encounter dataset remains available for future integration. Buff/debuff tags still describe selected Tatari skills, not enemy encounter effects. All 74 selectable Zobo names were checked against the patch English localization. Six new normal Zobos use full-body card artwork.
