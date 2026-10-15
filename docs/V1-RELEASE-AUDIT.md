# Companion v1 pre-release audit — 15 October 2026

Public UI audit completed against the deployed GitHub Pages site, followed by local verification of the fixes below. This is a release-candidate review, not an announcement or a v1 release tag.

## Coverage

- 23 public screens plus the signed-out admin gate, each at 1440 x 900 and 375 x 812: 48 initial screen checks. Core tools were checked again after data loading completed.
- Screens: homepage, schedule, Pinball Calculator, Tatari Stats, Tatari Database, Treasure Hunt Solver, formation drafter, tierlist maker, community formations/tierlists, Farm Support UID, account, My Album, trading, event matchmaking, and eight event guides. Admin remains intentionally separate from public chrome.
- Additional targeted widths: 320 and 768 px; schedule/navigation breakpoints at 900, 901 and 1100 px; landscape at 812 x 375.
- Reviewed loaded screenshots, visible image failures, browser exceptions, HTTP failures, page overflow, footer placement, button names and small targets. Guides were rechecked with expandable sections open and after scrolling to load lower content.
- Desktop and mobile functional checks: Tatari tap placement, tier placement and label edits, alignment switch, share-image generation, modal sizing, X/Escape closing, database search, mobile navigation, calendar month changes, Pinball input/target modes, solver stage/tile dialog, farm submission sign-in gate, community mode options.
- Draft edits were confined to an isolated browser's local storage. No public posts, reports, UID submissions, account changes or admin mutations were made.

## Fixed

| Issue | Result |
| --- | --- |
| Album phone toolbar required more width than its grid allowed | Search gets a full row; share/view actions move together; page overflow is zero at 320/375/768/1440 px. |
| Horde Solo/Duo control extended outside its field | Removed its inherited minimum width inside context fields; buttons stay inside the panel. |
| Horde header actions extended beyond a 320 px screen | Header can wrap and keep its actions inside the panel. |
| Tierlist share preview collapsed into a narrow phone column | Added a responsive rule with matching specificity; preview occupies a full row and retains the complete generated image. |
| Treasure combination arrows had 20 px hit areas | Hit areas are 44 x 44 px while the artwork stays compact. |
| Stats account-settings action was 19–22 px tall with faint, tiny text | 44 px minimum height, readable body type and pointer feedback. |

Changed stylesheet URLs ensure browsers request these fixes rather than keeping the previous CSS.

## Results

- No broken visible images, browser exceptions or failing HTTP responses were observed in the sampled public screen checks.
- No page-wide overflow remains in the corrected screens at the tested widths. Intentional scrollable card strips remain scrollable.
- Expanded event guides have no observed image failures or page-wide overflow at desktop and phone widths.
- Share previews render and modal close controls work at 1440, 375 and 320 px. The corrected mobile tierlist preview is explicitly checked for useful visible width and height.
- Full npm test regression suite passed, including build/base paths, 4,449 local references, formulas, Tatari data checks, drafter/tierlist models, album/trading/account models, solver, shared chrome, admin data validation and image-cache behavior. Database checks in that suite are structural/offline; they do not replace authenticated live write tests.

## Remaining release checks and limitations

- Signed-in account saving, public publishing, real UID submission/moderation and admin editors were not exercised in this audit. Automatic approval review denied reading the authenticated admin tab because it contains private content outside the public-site audit scope. A separately authorized signed-in check is needed before claiming end-to-end account/admin release readiness.
- Desktop and phone checks used Chromium with emulated viewport sizes. Physical iPhone/Android touch, Safari/WebKit and Firefox are not certified by this run. Native animated-WebP fallback lacks precise frame-rate control where ImageDecoder is unavailable, as documented in HOMEPAGE-ANIMATIONS.md.
- The homepage still has a substantial cold download. The image cache improves repeat visits after activation; it does not eliminate first-download cost or make account/live-data features work offline.
- Homepage automatic motion remains enabled without a pause control according to the user's explicit design decision. This is a known reduced-motion/accessibility exception, not an accessibility certification.
- Disabled/under-construction routes and coming-later languages remain outside the implemented v1 feature set. No placeholder feature was represented as complete.
- The footer's static Last Update date is still 7 October 2026. Choose the final public release date/version as part of the release, rather than changing it during this audit.

Public UI recommendation: suitable for a v1 release candidate after these fixes deploy. Complete the separately authorized signed-in checks and a physical-phone/Safari smoke test before declaring the complete app fully verified.
