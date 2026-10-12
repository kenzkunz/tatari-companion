# Website asset optimization

344 selected PNG/GIF files have lossless WebP derivatives. Their combined file sizes decrease from 71,966,547 to 49,803,134 bytes (30.8%). This is the selected library total, not the transfer size of one page; individual visitors download only requested files.

All selected derivatives were reopened and compared for identical RGBA pixels and dimensions. Selected animations were checked for matching frame counts and durations. Files with insufficient savings or failed exact checks remain unchanged. Existing WebP assets were not re-encoded. No game statistics, formulas or content-block IDs were changed.

Static HTML/CSS/JSON/module references and the dynamically generated home walking animation paths use the selected derivatives. Originals remain in dist for rollback, external/published banner URLs and any unmapped dynamic references. Consequently this reduces visitor transfers, not repository size. Do not delete originals without separately auditing dynamic references and Supabase banner overrides.

scripts/asset-optimization-manifest.json records original/derivative paths, sizes and hashes. Shared navigation and new-page templates reference optimized assets too. npm test and the GitHub Pages build pass; representative Home, Spa, Tatari database, stats calculator and Album pages passed local image-loading checks.

Private conversion candidates, text backups, source backups and WebM comparison files live in D:/COC-Website-Optimization. Those are not public exports. WebM candidates are not wired into the site: they need video-element and browser-alpha validation, while animated WebP preserves the existing image-element behavior. This pass does not replace Bob's newly extracted animation library.
