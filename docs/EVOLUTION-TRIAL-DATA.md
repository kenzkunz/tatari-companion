# Evolution Trial data

Source: recovered v0.49.1 UnitEvolutionTrial.lua, Quest.lua, Counter.lua and ActivitySkinReplaceText.lua tables under D:/COC-Dataminer/library/versions/0.49.1/config/reconstructed/Config. These are reconstructed configuration tables, not original source. Existing English descriptions came from the roster export; multi-task labels are now derived from the conditions and event replacement text.

Audit on 14 October 2026: all 67 exported Tatari families / 248 forms checked. Every exported trial matches the source quest list and star threshold. All 342 requirements carry source quest IDs and conditions; 67 requirements preserve alternate event tasks and mixed-progress ratios. The source's Marathon event skin uses skateboards by default and rafts for Raft Race. This is a v0.49.1 audit, not confirmation of later game changes.

Specific food icons: D:/COC-Project/CC Art Assets/Food. Other trial icons: Readable-images/Assets/Trial from the 8 October extraction. Dedicated boss/monster trial icons are absent in the supplied Trial folder; 15 rows use its battle icon as a fallback. No requirement text is omitted because of a missing icon.

Reimport with scripts/import-evolution-trials.py. It fails on quest count mismatches and unknown multi-counter patterns. docs/evolution-trial-audit.json records every linked requirement and icon fallback. Do not publish extracted Lua or bytecode.
