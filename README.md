# Clash of Critters Companion

A community-maintained companion website with guides, calculators, databases, and planning tools for Clash of Critters.

## Run locally

Requires Node.js 22 or newer.

    npm run build
    npm run preview

Open the local preview at http://127.0.0.1:4180/.

## Project structure

- dist/ contains the site pages, styles, scripts, images, and data.
- scripts/ contains build tools and local preview support.
- components/ contains shared website components.
- .github/workflows/pages.yml builds and deploys the site with GitHub Pages.

Edit files in dist/; the build writes the deployable site to _site/. The Pages workflow builds the site and publishes only the build output. See docs/ for feature-specific instructions. Database migrations are kept in the owner backup and are not needed to build or serve the Pages site.

Contributions and corrections are welcome. Please include the page or tool affected and steps to reproduce any issue.
