# MilkRoad · Clash of Critters companion

Static Clash of Critters companion website with event guides, resource calculators, album and trading pages, a schedule and Treasure Hunt solver. Editable site files live in `dist/`; generated deployment files live in `_site/`. Private Lua research, APKs, bot files, player exports and credentials are not included.

## Deploy

1. Create a GitHub repository and upload **the contents of this folder**, including `.github`, to its `main` branch.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. Run the “Deploy MilkRoad to GitHub Pages” workflow, or push a change to `main`.
4. The completed deployment reports your Pages URL.

The workflow detects the actual Pages base path automatically, supporting both `https://owner.github.io/repository/` and root/custom-domain deployments. Use the repository's existing default branch in the workflow if it is not `main`. No GitHub repository or deployment has been created by this preparation.

## Local use

Requires Node.js 22 or newer; no dependencies or installation needed.

```sh
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:4180/`. To preview a project URL:

```sh
npm run build -- --base /milkroad-test/
```

Then set `PAGES_BASE_PATH=/milkroad-test/` in your shell and run `npm run preview`. On PowerShell use `$env:PAGES_BASE_PATH='/milkroad-test/'`.

## Structure and routing

- `dist/` is the editable static source, retained from the current website.
- `scripts/build.mjs` creates `_site/` with deployment-base-aware links, CSS assets, module URLs, workers and data requests. Never edit `_site/` directly.
- Both `/schedule.html` and `/schedule/` work; `/schedule` redirects to the directory on the static host. Every existing HTML page gets an equivalent directory index, except the home page and 404. Nested event/drafter/database pages behave the same way.
- Fragment routes such as `tools.html#cards` and `tools.html#exchange` retain the existing album behavior. No SPA fallback replaces missing URLs with the home page.
- `_site/404.html` preserves the real branded missing-page experience, including working assets and home navigation even at unknown nested paths. GitHub Pages serves it with HTTP 404.
- `.nojekyll` prevents unwanted processing. Only `_site/` is published.

Timers use UTC and recalculate in the browser. The game export in `dist/data.json` is curated public game data; there is no live connection to the bot database. Keep filenames case-correct for GitHub's Linux host.

## Validation

`npm test` checks root and repository-subpath builds, local links/assets, route aliases, all JavaScript module syntax and the branded 404. It also runs the existing numerical calculator checks. The preview server uses directory redirects and a real HTTP 404 for missing pages. These are local checks, not a live GitHub deployment.

## Account and database work

See [the integration plan](docs/SUPABASE.md) for project background. Account and trading modules are separate from the static guide calculators; the guides do not require login.

## Hosting references

- [GitHub Pages Actions workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages custom 404](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)

The original Sites website and checkout are unchanged by this export.

## Event guides

The Events menu links to six completed guides:

- `events/fishing.html`: luck, bait, fish value/silver calculator and personal reward milestones.
- `events/cozy-farm.html`: crop-specific support, growth stages, watering, support bonus calculator and milestones.
- `events/treasure-hunt.html`: four partnership stage totals, keys, chest progression, digging costs and rewards.
- `events/raft-race.html`: wheel probabilities, estimated raft budget and selectable milestone chest rewards.
- `events/zobo-shooter.html`: boss attack comparison, power-ups, arena unlock/balance requirements and team milestones.
- `events/horde.html`: S2 wave rosters, Energizer income estimates, rank costs/refunds, 49 chips and visible Tatari skill cards.

All milestone lists provide cumulative totals through the selected row. Raft Race options A/B/C replace the corresponding chest in the total; unselected chests are combined into one count. Fishing rod upgrades show the highest unlocked rod level, rather than adding levels together. Treasure Hunt chest totals are separate from single-partnership stage totals; the four-slot planner combines earned stage and unlocked chest rewards.

Shared presentation and behavior are in `dist/guides.css` and `dist/guides.mjs`. Curated browser data is in `dist/guide-data/` and artwork in `dist/guide-assets/`. See [guide data maintenance](dist/guide-data/README.md).

The guides reference recovered v0.49.1 data and user in-game observations. Unverified server mechanics are not promises of guaranteed outcomes. Raft distance is a model average. Shooter welfare parameters do not establish a verified pity counter. Corrections and footer issue reports link to [kenzkunz on Discord](https://discord.com/users/191274229482782720).

After editing, run `npm test` and `npm run build -- --base /tatari-companion/`. Commit source files, not `_site/`. Copying files and passing local checks does not confirm deployment; publish through the existing GitHub Actions workflow.

## Event matchmaking

[Event Matchmaking](dist/events/matchmaking.html) supports per-event plans, budget/style matching, partner slots, Treasure Hunt key targets and consented UID contacts. Apply [migration 008](supabase/008_event_matchmaking.sql) to activate the Supabase backend. See [setup and verification](docs/EVENT-MATCHMAKING.md). The migration and production client are supplied; live activation requires applying the SQL to your project.

Horde skill cards show the current form’s visible Regular skill followed by the three `LDSkill` entries, labeled Regular / Lv 3 / Lv 5 / Lv 7, matching the v0.49.1 recovered rank table. Effect names and explanations use the same two-line format on all four cards. Hidden helper skills are excluded.

## Pinball calculator layout and accounting

`dist/resources.html` uses the two-column controls/rewards layout with mobile stacking, flat reward rows and the reusable `disclaimer-box.css` style. `pinball-layout.css` overrides the earlier styles; all five events and both calculator modes remain supported.

Pinballs earned is gross rewards, re-fired is reward pinballs reinvested after exhausting the starting budget, and remaining is the final unspent balance (including any original remainder below the selected shot cost). Each output range is calculated separately; subtracting displayed quantile endpoints is not a balance calculation. Existing `refired` engine metadata is retained; `reinvested` provides the earned-funds accounting used by the UI.

## Horde guide

`dist/events/horde.html` is linked from Events → Horde Invasion. It shares the event guide presentation, but has no regular-event tab strip. Horde will belong with Dojo and Boss Challenge; Gold Rush and Dune Rush are a separate future guide group.

`horde-guide.mjs` provides chip search/filtering, difficulty selection, expandable waves, the Energizer income and upgrade worksheets, and an accessible Tatari picker. Curated data is in `guide-data/horde.json`; selected supplied artwork is in `guide-assets/horde/`. Only visible Tatari cards are loaded through the existing roster and Horde card model.

The S2 roster is identical across four difficulties; wave stat multipliers differ. Estimated Energizers obtained include starting balance, configured kill income and passive income using a 30-second window per completed wave. The estimate excludes chip income, death refunds and spending. Actual battle duration can differ. Rank costs use the normalized CSV header, avoiding the earlier undefined-level/zero-cost issue.

Eligible chip waves describe offer pools. A unique chip is assigned to one player for the run; all offered exact chip IDs are excluded from that player's later offers, even if skipped. Daily and seasonal rewards should be checked on the in-game Horde Invasion screen. Raw Lua, private SQLite databases, bytecode research and source-path manifests are not included.
