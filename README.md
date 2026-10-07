# MilkRoad · Clash of Critters companion

GitHub-ready static website, copied from the current site including its latest Gold Rush countdown fix. Existing UI, calendar, mobile icons, calculator, album, navigation, Ko-fi support links and branded 404 are preserved. No Discord bot files, player records, credentials, or Sites repository history are included.

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

External links and all calculation rules remain unchanged. Timers use UTC and recalculate in the browser. The game export in `dist/data.json` is curated public game data; there is no live connection to the bot database. Keep filenames case-correct for GitHub's Linux host.

## Validation

`npm test` checks root and repository-subpath builds, local links/assets, route aliases, all JavaScript module syntax and the branded 404. It also runs the existing numerical calculator checks. The preview server uses directory redirects and a real HTTP 404 for missing pages. These are local checks, not a live GitHub deployment.

## Supabase later

See [the integration plan](docs/SUPABASE.md). Authentication and database features are not implemented; Login remains disabled. Keep future backend work separate from the current pure game calculations and static UI.

## Hosting references

- [GitHub Pages Actions workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages custom 404](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)

The original Sites website and checkout are unchanged by this export.
