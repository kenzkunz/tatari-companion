# Tatari effect identity catalog

`dist/tatari-data/effect-catalog.json` is a derived v0.49.1 catalog shared with the local drafter. It links SkillDetail/SkillLDDetail effect groups to their explicit SkillBuff SourceKey records. It does not infer effect identity from broad descriptions or Tatari ownership. Effect IDs remain distinct even when display names match.

Validated regression cases: CatIce 1104 and Aplysia 2104 both reference BuffID 1; Oil Onsen 6293 references 6292; Dolphin regular 6604 references 6602, distinct from Wavesong skill 6693's BuffID 6693. Stackable/MaxStacks are configuration metadata, not proof of cross-source accumulation or final arithmetic.

Coverage: 248 forms, 110 directly linked BuffIDs and 130 unresolved effect identities (132 source groups). Unresolved groups retain skill/group-specific IDs, null buff links and a visible (?) marker. Heals/buffs/debuffs use a documented reviewed taxonomy plus configured attribute signs; unclassified effects stay separate. Every effect's composition remains unverified. Aura restrictions and mode-specific runtime eligibility need further validation before combat simulation.

Database skill tags inherit existing text color; tooltips show the ID and stacking metadata. Existing descriptions and formulas are unchanged. The local drafter now uses its own catalog/model rather than the third-party effect tagger. Provider counts explicitly count sources, not stacks or combined strength.

Builder: C:/BOTDiscord/Milkroad/build-own-effect-catalog.py. Inputs: reconstructed SkillLDDetail.lua on D:/COC-Dataminer and existing SkillDetail/SkillBuff/localization research copies in the older work folder. The literal parser does not execute Lua. Research gaps/prototype evidence: D:/COC-Drafter-Research/effect-identity-audit. Those private raw sources are not website exports. Rebuild when Bob supplies fully linked, versioned data; validate the source versions/hashes first.

`node scripts/effect-catalog-check.mjs` checks the screenshot regression cases, source links, unlock levels and unresolved composition. Colors for skill text are intentionally deferred.

## Implementation audit
The read-only skill-bytecode audit resolved 34 source groups. Current catalog: 116 verified BuffIDs, one verified displacement mechanic, and 96 unresolved identities (including Aura groups excluded from Horde). Knockback calls SetKnockUpInfo and is grouped as Other, not a stat debuff. Protection/invisibility behaviors are Other. Mushroom's ally ATKHAST modifier is a Buff. Poison BuffID 18 invokes skill 90005, which references negative DmgDn BuffID 19; both are Debuffs, with the secondary component named Poison: Fragile. Cross-effect arithmetic remains unverified.
Rebuild order: build-own-effect-catalog.py, then resolve-reviewed-effects.py. Implementation evidence and reviewed resolution records live in D:/COC-Drafter-Research/effect-identity-audit. Skill text colors are unchanged.

