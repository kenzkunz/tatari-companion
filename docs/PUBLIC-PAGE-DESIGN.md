# Public page design standard

The approved default applies to guides, general in-game information and public pages that do not require a custom interface. The reference is the current guide design, not a new visual direction.

## Fixed parts

- Shared public navbar and footer on every generated page.
- Yellow patterned background, cream paper panels, dark borders and restrained gold/yellow accents.
- Critters headings; Poppins body copy. Body 14px with 1.8 line height; section headings 22px; tables 12px; info/disclaimer text 13px; inputs/dropdowns 14px.
- Compact spacing with breathing room: section top 24px, content padding 26px, table cells 9px, field gaps 12px, notes 16px apart.
- Desktop section index with responsive mobile layout.
- Yellow info box; the same box with a warning icon for disclaimers.
- Connected expandable rows: thin dividers, dark readable text, yellow open-state highlight.

Normally only the content, banners, icons and related game artwork vary. Do not add a new palette, typography system or page shell merely to make a page look different.

Custom tools, databases and account features can use their specialized layouts with shared public navigation/footer. The private admin dashboard keeps its separately approved clean layout and chrome.

## Reusable files

- `templates/public-information/starter.json`: copy for a new page.
- `templates/public-information/design-tokens.json`: agreed measurements and colors.
- `dist/guides.css`: existing guide components.
- `dist/information-template.css`: scoped default refinements and reusable accordion/asset components. It does not restyle existing guides.
- `dist/information/design-reference.html`: unlisted component reference, not a game guide. It uses shared navigation/footer and stays out of the admin content catalog.
- `scripts/create-information-page.mjs`: generates the shared shell, page content, stable editor IDs and new-block SQL.

## Starting a page

1. Copy starter.json into a page specification file in this templates directory or another reviewed source directory.
2. Set the title, unique slug, introduction and sections. `type: "guide"` creates an `events/` page; other values create an `information/` page.
3. Use actual site-local assets. Add `banner`, `bannerWidth` and `bannerHeight` when available. Without a banner, the page starts with a text heading and a hidden registered banner slot, so a banner can be uploaded later.
4. Supported blocks: text, info, disclaimer, list, table, accordion and assets. Text supports the existing inline bold/italic/underline markers. Arbitrary HTML is rejected.
5. Give sections and blocks stable IDs, especially on pages that will be edited through Supabase.
6. Run:

   `node scripts/create-information-page.mjs --spec templates/public-information/your-page.json`

7. Review the result. The tool adds new editable blocks to the local catalog and creates `supabase/generated/<slug>-content.sql`. Apply that SQL once to activate those blocks in the dashboard. Existing published/draft edits are not overwritten.
8. Review navigation placement explicitly; generation does not add a new menu link automatically. For game-backed information, register the reviewed data source in the version-audit workflow before claiming verification.
9. Check desktop/mobile, expanded rows, keyboard focus, assets and factual evidence. Run `npm test` and the GitHub Pages build, then commit/push when authorized.

An existing page is not overwritten by default. `--overwrite` is an explicit regeneration action and creates an ignored rollback backup. Review the source diff and Supabase overrides first. Do not use regeneration as a substitute for the published-content sync workflow.

## Component rules

- Info boxes explain useful context; disclaimers identify specific uncertainty or limitations. Avoid unrelated warnings.
- Tables compare parallel values. Put the corresponding game icon alongside its value, with consistent sizing.
- Use expandable rows for repeated topics and detailed variants, not for every paragraph.
- Keep banner images responsive; preserve artwork proportions.
- Preserve formulas, rewards and calculators as reviewed data/code rather than embedding invented values into a style example.
- Extend a component only when the approved set cannot support the requested task. Explain the reason and reuse the design tokens.

## Shared chrome maintenance

The generator reads `components/public-navbar.html` and `components/public-footer.html`. Edit these shared sources, then run `npm run chrome:sync` to update all public pages. Run `npm test` to catch missing or inconsistent chrome. The admin dashboard retains its standalone layout. Shared navbar styling lives in `dist/public-navbar.css`; page-specific layouts stay in their existing stylesheets. Original pages are backed up under ignored `design-rollbacks/public-chrome/` on first sync.

## Source of truth

This document, the tokens and reusable components are the agreement for future generated information pages. Repository AGENTS.md instructs future Codex work to use this starting point. No personal skill or plugin installation is required.
