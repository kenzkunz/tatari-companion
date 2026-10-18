# Community pages and dashboard

Community pages are prepared for GitHub Pages publication. Hosted database migrations are separately approved; do not claim they are applied without verification. If the publishing RPC is missing, public pages show the reviewed static launch content. Live votes and admin publishing require migrations 031–033.

## Local review

- `/information/redeem-codes.html?preview=1`
- `/information/patch-notes.html?preview=1`
- `/information/creators.html?preview=1`
- `/admin.html?preview=1&community=1`

Local mode is allowed only on localhost, 127.0.0.1 or [::1]. Entries use the separate `tatari-community-preview-v1` browser storage key. Published local entries are visible only on this local origin. The reviewed static launch content contains Artiar and the nine user-supplied codes. Official patch summaries are drafts until verified dates are entered.

## Admin workflow

Use Redeem Codes, Official Patch Notes or Creators in the sidebar. Add creates an editable form. Save draft retains edits without changing the public entry. Preview saves the draft and shows the actual public page in an iframe; the full-page link opens the same draft. Publish validates required fields and replaces the public entry. Unpublish removes the public entry while keeping its draft. A new entry can be added at any time. Conflicting revisions are rejected.

Codes support Active, Unverified and Expired states, optional UTC expiry, last-checked date, reward description, source and requirements. Known past expiry dates display as Expired automatically; an absent date is not a promise that a code never expires. Working is the default; a last-checked date is optional and shown only when supplied.

Patch notes require a release date, original announcement link and an administrator confirmation that the source is an official developer announcement. Summaries are companion-site summaries, not quotations presented as official text. Creator videos are kept on YouTube and opened only when clicked; no autoplay embeds or channel scraping runs in visitors' browsers.

Creator profiles support name, description, YouTube channel, profile image, featured flag and up to 12 curated video cards. Video thumbnail fields accept the existing local creator assets or HTTPS YouTube image hosts. Asset origins and hashes are recorded in COMMUNITY-ASSET-SOURCES.json.

## Future deployment, only when approved

1. Review and apply `supabase/031_community_publishing.sql` to the existing project. It creates entries, version history, an admin-only mutation/preview RPC and a published-only public RPC. Artiar is seeded as a draft, never automatically published in production.
2. Apply the three `supabase/generated/{redeem-codes,patch-notes,creators}-content.sql` files if the page headings/introduction should also appear in the existing guide-text editor. They insert new blocks without replacing existing edits.
3. Deploy the reviewed website changes. Admins can then add/edit/publish entries through Supabase without another GitHub deployment per entry. Images stored as local repository files still require a deployment; externally hosted YouTube image links do not.
4. Publish Artiar's reviewed profile from the dashboard. Add verified codes and official announcements as they become available.

Tables are inaccessible to ordinary clients. Public reads return only published content, never drafts or author IDs. Draft preview requires administrator authentication. Mutation requests bind the expected actor and revision. Entry history and site audit events are retained; author foreign keys anonymize on account deletion. No service-role key is used in the browser.

## Code votes and patch timing
Codes default to Working in Auto mode. The editable per-code dislike threshold defaults to 10: only a count greater than the threshold marks Not working. An explicit admin Working/Not working override wins over reports and expiry. Likes do not subtract dislikes. A voter can switch or clear their vote. Production uses authenticated accounts, one vote per code/account; counts are public but voter IDs are private. Local preview stores only this browser's votes, and does not simulate other voters. Prepared migration 032 follows 031; neither has been applied to the hosted database.

Patch dates use UTC. Dates after today show Upcoming patch; today and earlier show Patch notes. Open pages refresh labels every minute. The administrator controls date, summary and official source; publishing requires a date and official-source confirmation. Three verified official CoC Club summaries are local drafts. The official page does not display release dates for these entries, so dates have not been invented. Enter verified dates in admin before publishing. The official page currently shows 0.47.1 first; do not represent this as proof that it is the newest game build.

Migration application was blocked by automatic approval review on 2026-10-18 pending explicit user approval for hosted database changes. The GitHub push alone does not activate live voting or admin publishing.
