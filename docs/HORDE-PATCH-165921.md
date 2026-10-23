# Horde patch 165921 integration


- `guide-data/horde.json`: S3 ParamID 103, six difficulties and 150 configured waves. Counts, kill income and multipliers follow each difficulty's linked sequence and stage records.
- All 71 Zobo identities use UnitRes ShowName resolved through the patch English localization. Six new normal-enemy icons are extracted from named Texture2D records in the supplied GeneralRes bundle. The private extraction manifest retains object IDs, offsets and source hashes.
- Four chip numbers changed in linked Skill records; Backend Support clarifies ownership. Shuffle excludes active Contract Employee types from its replacement candidates while retaining employees. Its reward stays 600. Historical-level bookkeeping is a static implementation finding, not a live battle test.
- The existing roster's Horde details resolve current SkillLDDetail source bindings, including helper Skill and SkillBuff values. Historical `OldValue` fields are not combat inputs. The curated audit records 59 displayed changes across 42 skills and 30 families; some shared effects appear on multiple cards.
- Bonobean is integrated into the authoritative shared roster, editable account roster, stats, trial planner, formation pool and tierlists. All four normal and Glitter character images use the supplied files unchanged. Four Glitter head icons are exported from named source textures. The old Horde additions JSON remains a compatibility reference and is no longer merged into the shared roster. Migration 044 adds its save catalog ranges and increases the bounded roster/tierlist limits without rewriting saved user data.
- Normal account-level controls and roster saves support 1–3600. Horde/Goldrush fixed comparison remains 500 and Horde in-run rank selectors retain their independent limits.
- Detailed public audit: `information/patch-165921.html`. Migration 043 registers editable text and refreshes defaults without changing drafts, published overrides or revision history.

Raw configuration and gameplay code, full localization exports, packages, private inventory and rollback copies remain outside the public commit. New parameter meanings and official-override selection remain unresolved.

Validation includes all six wave sets, identity/name correspondence, enemy assets, counts and income, chip values, updated skill records, Bonobean reference bindings, account-level bounds, existing roster/account security tests, desktop/mobile browser review and the full site test suite.
