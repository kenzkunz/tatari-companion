# Public image cache

The shared public navigation registers image-cache-worker.js under the site's own directory. On GitHub Pages this is /tatari-companion/, not the entire github.io origin. Unsupported browsers, insecure origins, blocked storage and registration errors retain ordinary loading.

The build generates a SHA-256 and byte-size catalog of public PNG, WebP, JPEG, GIF, SVG and AVIF files. Images are saved when requested, including animations fetched for canvas decoding. No bulk installation download occurs. First requests still download the image; later requests can use Cache Storage across visits, independently of ordinary HTTP-cache expiry.

Only catalogued same-origin GET requests are intercepted. HTML, scripts, JSON, authentication, Supabase traffic, third-party resources, range requests and unknown paths pass through. This is an image cache, not whole-site offline support.

Limits: 128 MiB total, 1,000 files, 8 MiB per file. Oldest saved files are evicted first. The browser may also evict storage. Cached content is verified against the build hash before persistence. Each image uses a content fingerprint, so an artwork change creates a new key. Worker updates activate immediately because they change only artwork handling, claim public pages, and remove obsolete keys and versions belonging to this site's cache namespace. Unchanged artwork survives deployments. Build changes to HTML or data never become stuck behind this worker.

Cache writes and eviction run in the background and are serialized; a quota error does not block the network response. The cache inventory is loaded once per worker lifetime instead of scanning all keys on every image download. Clear this site's image-cache namespace via browser storage tools for troubleshooting; do not clear account storage or unrelated caches.

Verification: scripts/image-cache-check.mjs covers cached offline hits, body-hash rejection, scope/privacy bypass, range and POST bypass, eviction, old-key cleanup and storage-denied fallback. Browser testing covers actual worker activation, a cached WebP fetched while offline, homepage/drafter/tierlist navigation and GitHub Pages subdirectory scope. The full website remains dependent on the network for uncached resources and live data.
