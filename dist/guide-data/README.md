# Event guide data

These five JSON files are curated browser exports for the event guides. They are not full recovered Lua or server implementations.

- `rewards`: ordered milestone thresholds with reward type, ID, amount, name and local icon URL.
- Fishing: fish IDs, prices, weight bounds and allowed multipliers. Silver follows the user-confirmed fish value × multiplier rule.
- Cozy Farm: six crop/support mappings, stage artwork and geometry used to scale visible tree artwork consistently. Support inputs use raw food level up to 16.
- Treasure Hunt: single-partnership stages and cumulative chest key thresholds (4, 8, …, 32). Four-slot totals sum each partnership's stage rewards plus unlocked chests once.
- Raft Race: selection chest options are alternatives, never simultaneous rewards. Selecting an option multiplies its amount by the awarded chest count; unselected chest variants aggregate by count.
- Zobo Shooter: boss scores/rates, Tatari quality modifiers, arena multipliers and available boss pools. Welfare triggers are not implemented because the recovered client does not establish them.

Edit the matching event HTML, shared guide code and curated JSON together. Keep icon URLs case-correct. Run the root `npm test` and repository-base build after changes. Do not copy private APKs, raw decoded Lua, research SQLite databases or account information into this directory.
