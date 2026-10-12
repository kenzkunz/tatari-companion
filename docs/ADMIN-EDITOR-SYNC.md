# Visual editor, banners and GitHub sync

Apply migrations 010 and 011 if not already applied, then apply 012 once. Choose normal execution: the migration explicitly enables RLS and Storage upload policies. Only the assigned administrator can upload or publish banners or change box styles. No new admin grant is needed.

## Editing

Select an existing text block. The editor displays bold, italic, underline, strikethrough and links visually. Paste inserts plain text; format it with the toolbar. Save draft and Preview text do not change public text. Publish text uses the existing revision guard and version history. Arbitrary HTML is not accepted.

For an existing info/disclaimer block, use Box style to switch its presentation while keeping its contents. Section creation is intentionally excluded.

## Banners

Choose a page, expand Page banner, upload PNG/JPG/WebP (maximum 5 MB), preview the draft and publish. A public image bucket is needed for visitors to display banners; writing to it is admin-only. Published text remains separate from banner publishing. Restore original banner uses the version stored in GitHub. Uploaded images are retained, not deleted by the browser.

## Supabase → GitHub

1. Dashboard → Sync published changes to GitHub → Download published export.
2. In the repository terminal: `node scripts/sync-admin-content.mjs --file "C:/Users/PC/Downloads/milkroad-published-YYYY-MM-DD.json"`.
3. Inspect the proposed pages, then rerun with `--apply`. A backup of original files and the export is saved under ignored `design-rollbacks/admin-sync-*`.
4. Review `git diff`, run `npm test` and `npm run build -- --base /tatari-companion/`, then commit/push normally.
5. After deploying those files, apply the generated `supabase/sync/admin-baseline-*.sql` in SQL Editor. It updates default text only when the exported revision still matches and never clears or replaces newer published/draft edits.

The sync command downloads only published banners from this repository's configured Supabase project. It validates page/block keys and uses escaped HTML from the supported rich-text format. Drafts, Cozy Farm UIDs and audit records are never included in this export. Running without `--apply` does not modify files or download images.

## GitHub → Supabase

For future guide rebuilds, keep existing `data-site-content` keys, update the catalog and add new blocks through a migration. Existing Supabase overrides continue to take precedence; review conflicts before publishing a new factual version. Restore original text uses the deployed GitHub baseline. Do not rerun migration 009 to synchronize.

Backend policies and uploads require validation in the live Supabase project after applying 012. Offline tests do not prove live Storage permissions.

## Dashboard layout

The admin page has its own `admin-dashboard.css` and does not import the public website styles or navigation. Desktop uses sidebar/editor/preview panes. Mobile uses a navigation drawer and Edit/Preview tabs. Public website styling remains inside the sandboxed page preview. Farm support retains its existing public layout.
