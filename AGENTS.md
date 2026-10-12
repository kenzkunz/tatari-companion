# Website design and template workflow

## Default design

For guides, general in-game information and other non-custom public pages, start from `templates/public-information/starter.json` and `scripts/create-information-page.mjs`. Read `docs/PUBLIC-PAGE-DESIGN.md` first. Reuse the existing guide design instead of inventing new page styling.

Public navbar and footer are fixed shared chrome and must be present. The generator reads the current canonical chrome from `components/public-navbar.html` and `components/public-footer.html`; do not hand-copy an older menu. Run `npm run chrome:sync` after changing shared chrome. Site navigation changes must be reflected consistently across public pages.

Use Critters headings, Poppins body text, the existing yellow background and cream panels. Keep spacing compact with breathing room. Normally only content, banners, icons and related game artwork vary. Use the approved info/disclaimer boxes, tables and connected expandable rows.

Custom calculators, databases, account tools and the clean admin dashboard have their own layouts. Do not restyle those merely to match a guide. The admin dashboard remains separate from public-site chrome, as explicitly requested by the user.

## New pages

- Use the template generator or preserve its structure and component classes.
- Add a component only when the existing set cannot support the requested task; explain the reason and keep the shared design tokens.
- Use real, supplied game assets. Do not invent assets, percentages or mechanics to fill a template.
- Keep factual data separate from presentation. Mark uncertainties honestly.
- Preserve stable `data-site-content` IDs so Supabase overrides, revisions and sync remain valid. Never regenerate an existing page over user edits without reviewing the source diff and published overrides.
- Apply the generated catalog SQL for new editable blocks only; it must not overwrite published/draft text.
- Check desktop/mobile layout, asset links, shared chrome, keyboard interactions and build output before reporting completion.
- Commit/push only when the user authorizes it. Keep research, exports and rollback backups out of the public commit.
