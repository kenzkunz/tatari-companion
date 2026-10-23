# Tatari effect catalog

`dist/tatari-data/effect-catalog.json` is shared by the Tatari database and formation planner. It contains effect identities, descriptions, categories, stacking flags and skill unlock levels.

Effects remain distinct even when display names match. Provider counts identify skills that grant an effect; they do not calculate combined strength or prove that effects stack. Unconfirmed interactions remain explicitly unconfirmed.

Keep existing effect IDs and unlock levels stable when editing descriptions. Numerical values, mode eligibility and effect relationships are used by the planner and must be checked before publishing.

Run `node scripts/effect-catalog-check.mjs`, `node scripts/backend-support-check.mjs`, `node scripts/exile-chip-check.mjs` and `npm test` after changes.
