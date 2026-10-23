# Game version audit workflow

## How the pieces fit

- Update review: compare new gameplay information and descriptions with the previous website release.
- Reviewed website data: prepare public-safe guide JSON and any calculation changes in a staging folder.
- GitHub repository: stores the registry, comparison tool, reviewed website code and SQL migrations.
- Supabase: stores private audit imports, finding reviews and guide/section verification history.
- Admin dashboard: review evidence, open the guide editor and preserve your existing published wording.
- GitHub Pages: public website distribution. The ChatGPT Sites copy is a separate deployment and is not updated by a GitHub push.

## Current baseline

The initial `.game-audits/snapshots/0.49.1.json` was captured from the existing site. This freezes its current data and source hashes; it does not certify all live game rules. Eight guides are registered. No guide is automatically marked verified.

The registry lists known open questions, including spa pity resets and the observational rally calculation. Unchanged source data does not resolve those questions or detect server-only changes.

## Activate the review dashboard

Apply `supabase/013_version_audits.sql` once, using normal execution; it explicitly enables RLS. Commit/push the new website files. Sign in as your existing administrator and open Version audits. No new account permission grant is required.

## When a new version arrives

Example uses 0.50.1 as a future version label, not a claim that it has released.

1. Prepare an isolated copy of the watched data/code files:

   `node scripts/audit-game-version.mjs --prepare --version 0.50.1`

2. Review the new game update and prepare the corresponding website files under `.game-audits/staging/0.50.1/`. Record confirmed changes and unresolved questions; changing a version label does not validate the contents.

3. Capture the reviewed candidate:

   `node scripts/audit-game-version.mjs --capture --version 0.50.1 --source-root .game-audits/staging/0.50.1`

4. Compare:

   `node scripts/audit-game-version.mjs --before .game-audits/snapshots/0.49.1.json --after .game-audits/snapshots/0.50.1.json`

5. The command produces JSON and Markdown reports in `.game-audits/reports/`. Import the JSON using the dashboard. Filter by guide/status; review Before/After values and source-file changes. Source-code hash changes may be cosmetic: inspect the actual diff before declaring a mechanics change.

6. Resolve each finding as Verified, Needs update, Unknown or Not applicable, with a reason/evidence note. Use Open guide editor to prepare changed wording as a draft. Reward tables and calculator formulas remain reviewed GitHub edits. Reports never overwrite guide text or Supabase content overrides.

7. When the guide/section has actually been checked, explicitly record its reviewed game version and evidence. Finding reviews alone do not automatically verify the entire guide. Keep uncertainties marked Unknown.

8. Publish approved text, use the existing Supabase → GitHub export/sync workflow, apply approved data/code changes to `dist`, run tests/build and commit/push. Publish to ChatGPT Sites separately only when requested. Capture a new accepted baseline after the reviewed website changes have landed, using a distinct `--out` path if a snapshot already exists.

## Preservation and limits

- Snapshot capture refuses to overwrite a file unless `--overwrite` is explicitly supplied. Use distinct paths to retain candidate and accepted snapshots.
- Reports contain up to 1,000 findings and flag truncation. Missing sources are findings, not an implicit pass.
- The capture reads only files named by `dist/version-audit-registry.json`, rejects private-account data keys and refuses source symlinks outside the selected directory. Sources must remain public-safe reviewed data, not full raw exports.
- Snapshots/reports are ignored by Git. Private dashboard review archives include notes/account IDs and should stay out of the public repository.
- The dashboard keeps the latest 50 reports and recent review history in its view; database records are retained. Review revisions reject stale updates. Reimporting a report does not erase reviews.

## Future donor/VIP features

Keep donor entitlements separate from `site_admins`. A donation must never grant editing or moderation rights. Existing free guides remain unchanged until you decide the actual perks.

A later implementation can store capability grants, verification source and optional expiry in a dedicated Supabase entitlement table, enforced by backend policies/functions. Donation verification and any payment secrets belong on the server. Decide perks and expiry/refund rules before adding a billing integration; neither billing nor VIP gates are implemented in this update.
