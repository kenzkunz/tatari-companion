# Horde patch 165921 integration

Reviewed 2026-10-21 against the immutable recovered 0.49.1 baseline and the reconstructed safe-v3 patch tables in the local dataminer. Exact correspondence to the live-server payload is unverified.

- `guide-data/horde.json`: S3 ParamID 103, six difficulties and 150 configured waves. Counts, kill income and multipliers follow each difficulty's linked sequence and stage records.
- All 71 Zobo identities use UnitRes ShowName resolved through the patch English localization. Six new normal-enemy icons are extracted from named Texture2D records in the supplied GeneralRes bundle. The private extraction manifest retains object IDs, offsets and source hashes.
- Four chip numbers changed in linked Skill records; Backend Support clarifies ownership. Shuffle excludes active Contract Employee types from its replacement candidates while retaining employees. Its reward stays 600. Historical-level bookkeeping is a static implementation finding, not a live battle test.
- The existing roster's Horde details resolve current SkillLDDetail source bindings, including helper Skill and SkillBuff values. Historical `OldValue` fields are not combat inputs. The curated audit records 59 displayed changes across 42 skills and 30 families; some shared effects appear on multiple cards.
- Bonobean's four-form regular/Horde skill reference lives in `guide-data/horde-tatari-additions.json`. It uses verified playerhead artwork and is only merged into the Horde guide's reference browser. It does not silently extend the editable account roster, trial planner or formation pool.
- Normal account-level controls and roster saves support 1–3600. Horde/Goldrush fixed comparison remains 500 and Horde in-run rank selectors retain their independent limits.
- Detailed public audit: `information/patch-165921.html`. Migration 043 registers editable text and refreshes defaults without changing drafts, published overrides or revision history.

Raw configuration and gameplay code, full localization exports, packages, private inventory and rollback copies remain outside the public commit. New parameter meanings and official-override selection remain unresolved.

Validation includes all six wave sets, identity/name correspondence, enemy assets, counts and income, chip values, updated skill records, Bonobean reference bindings, account-level bounds, existing roster/account security tests, desktop/mobile browser review and the full site test suite.
