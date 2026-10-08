# Tatari data and calculation

Public data is a curated JSON export. No Lua files, APK files, source dumps or private paths are published.

Stats use the user-supplied formula: Growth * (Standard * StarCoef + StarAdd) * (1 + (FeedPR + BadgePR + AuroraPct + SpaPR) / 100). Values are full selected-tier/star/stage records, not cumulative. Stage zero food is included.

Level/progress are fixed at 500/0. Resolve the element attribute level first; Water resolves to 868, the other supplied elements to 867. Missing elements are not guessed.

Stars require explicit selection pending agreed comparison defaults. Acquisition and next-evolution star markers are reference data, not calculator defaults. No badge is preselected. Owned badges are deduplicated and element matched. Aurora is explicit, defaults zero. Spa defaults zero on the page; the calculation model supports selected owner/guest effects and tier-four or 6001 eligibility. Horde rank is excluded. Display uses two decimals, without claiming exact game rounding.

The supplied pet 11 tier 4 / 27 stars / food 8 / Water badges 1001-1006 sample is checked by npm test. Badge ownership in that sample is inferred, not universal.

Database display defaults: acquisition stars from the preceding evolution requirement (tier 1 zero); food stage 0 for tiers 1-2, stage 3 for tier 3, first stage with all PR fields at least 25 for tier 4. Badges, Aurora and Spa are zero. The calculation model retains explicit modifier support for future account/comparison features. Display order ATK, HP, DEF; values truncate to two digits in K/M notation, or floor integers below 1000. No game-rounding claim.

Database display defaults: acquisition stars from the preceding evolution requirement (tier 1 zero); food stage 0 for tiers 1-2, stage 3 for tier 3, first stage with all PR fields at least 25 for tier 4. Badges, Aurora and Spa are zero. The calculation model retains explicit modifier support for future account/comparison features. Display order ATK, HP, DEF; values truncate to two digits in K/M notation, or floor integers below 1000. No game-rounding claim.
