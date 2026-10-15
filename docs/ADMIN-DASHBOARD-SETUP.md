# Admin dashboard setup

Built for the existing GitHub Pages frontend and Supabase backend. Public page: `/admin.html`; Cozy Farm directory: `/farm-support.html`. Content edits cover registered guide headings and paragraphs, not executable HTML, calculator formulas, reward tables or images.

## Activate once

1. Back up the Supabase database. Apply `supabase/009_admin_content_farm.sql` in the Supabase SQL Editor. It seeds administrator user `f95bfea9-d7d3-49f5-827a-646c11f32ffb`; that account must already exist in Authentication. Migration 009 is part of the deployed baseline. For a new project, apply it once; do not rerun it on the existing project.
2. Commit/push the website files and migration through your usual GitHub workflow.
3. Sign in with that account and open Account → Open admin dashboard. No service-role secret is required in the browser.

## Workflows

- Content: choose a page/block → edit text → save draft → preview → publish. Published text is loaded from Supabase on the next page load. Restore original text removes the override; Version history can restore earlier published values. Revision conflicts reject stale edits.
- Farm: signed-in users explicitly confirm UID-sharing permission, submit UID/crop/bonus, then wait for review. Only an administrator can approve, reject, hide or restore listings. UID is excluded from directory results and returned only by an authenticated reveal request. Reports require a prior reveal; unique reveals/reports reset by the UTC 12-hour bucket. Three exhaustion reports hide a row; 50 reveals are a warning, not a guarantee of exhaustion.
- Existing farm-support local prototype is preserved and not imported. No demo/player records are seeded.

## Security / limits

All underlying new tables have RLS enabled and no direct anon/authenticated grants. RPCs perform authorization and validation; admin membership is not writable from the client. Public content API exposes only published text. Admin history and UID submissions are private. Rendering uses validated formatting nodes; arbitrary HTML and unsafe links are rejected. See ADMIN-EDITOR-SYNC.md for visual editing, media controls and synchronization.

Initial implementation intentionally manages guide text and Cozy Farm approvals. GitHub remains the source of layouts, banners, reward data, formulas and deployment. The catalog must be updated when new editable blocks/pages are added; preserve `data-site-content` keys during future page regeneration.

Before live use, test non-admin denial, administrator editing, draft invisibility, publish/restore, stale revision rejection, submission/approval, UID reveal privacy and report thresholds against the real Supabase project. Offline checks do not establish live database behavior.

## Disable / rollback

Remove the assigned user from `public.site_admins` in SQL to revoke dashboard access. Public content can be reset per block via Restore original text. Keep audit/history data when disabling the feature. File backups are under the Milkroad workspace `design-rollbacks/admin-dashboard`.

## Current structured-data workspaces

Migrations 020–022 add UID identity/revision/history consistency and bounded Schedule, Footer & Links, and Guide Data editors. See [ADMIN-SITE-DATA.md](ADMIN-SITE-DATA.md) for deployment, source/derived ownership and test boundaries. Guide data does not make calculator formulas or coupled game-mechanic records freely editable. Banner upload support already exists through migration 012.
