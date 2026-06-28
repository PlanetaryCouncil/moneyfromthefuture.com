# Money From The Future Changelog + Prompt Log

Purpose: keep a lightweight running history of what we changed, why we changed it, what counts as done, and what was verified. Update this file after each feature slice so the repo carries the project memory with it.

## How To Update This File

For every feature, add:

- Date
- User prompt or request summary
- Decision made
- Files changed
- Acceptance criteria
- Verification performed
- Known limits or next work

## Current Project Direction

- Source of truth is `/Users/m/Code/moneyfromthefuture.com`.
- The root `index.html` is the main catalog page.
- Individual product pages live in `investment-art/`.
- The site is a Jekyll-powered static site for GitHub Pages.
- GitHub Pages deployment uses `.github/workflows/pages.yml`.
- Artwork/product data lives in `_artworks/*.md`.
- Jekyll generates individual product pages into `/investment-art/*.html`.
- Current public target URL is `https://planetarycouncil.github.io/moneyfromthefuture.com/`.
- One artwork family equals one buyer-facing product page.
- Buyer-facing catalog avoids variants to reduce decision fatigue.
- Canvas prints use a `USD 100` baseline by default, with hardcoded `EUR 90` and `GBP 80` display/checkout conversions.
- Basket state uses `localStorage`, not cookies, `sessionStorage`, or backend sessions.
- Catalog tiles use `preview_image` (`WEB`) while product pages use `image` (`THIS`).

## Global Acceptance Criteria

- Root catalog at `/index.html` shows all artwork families and links to product pages.
- Each individual artwork page lives under `/investment-art/`.
- Each artwork page shows one selected image for that family.
- Each artwork page can add its canvas print to the basket.
- Basket supports multiple different designs.
- Basket supports multiple quantities of the same design.
- Basket persists while navigating between pages and after refresh.
- Basket checkout calculates the selected-currency total from the USD baseline.
- PayPal checkout reflects the selected currency and full basket total.
- Forward-order email includes artwork titles, quantities, subtotals, total, buyer email, and address.
- Product pages include previous / catalog / next navigation for browsing.
- Generated product pages remain maintainable through Jekyll layouts and `_artworks/*.md`.
- No rounded corners in the shop UI unless explicitly reintroduced.

## Changelog

### 2026-06-28 - USD Baseline + Currency Selector

Request summary:
User asked whether the shop should replace EUR with USD for a more international default, plus a simple dropdown to switch between USD, EUR, and GBP using hardcoded rates. User also asked for a subtle red basket indicator when items are present.

Decision:
Use `USD 100` as the baseline print price. Keep item prices stored as baseline numbers, then convert client-side to `USD`, `EUR`, or `GBP` for display, basket totals, PayPal order creation, and Formspree order summaries.

Files changed:
- `shop-state.mjs`
- `shop.js`
- `_layouts/default.html`
- `_layouts/artwork.html`
- `index.html`
- `investment-art/basket.html`
- `test-purchase.html`
- `shop.css`
- `tests/shop-state.test.mjs`
- `tests/checkout-critical-path.test.mjs`
- `tests/site-markup.test.mjs`
- `readme-developer.md`
- `changelog-promptlog.md`

Acceptance criteria:
- Default visible price is `USD 100`.
- Visitor can switch currency between `USD`, `EUR`, and `GBP`.
- Hardcoded conversion is `USD 100`, `EUR 90`, `GBP 80`.
- Basket totals, success summary, Formspree message, and PayPal order use the selected currency.
- Currency preference persists in `localStorage`.
- Header cart shows a subtle red pulsing dot only when the basket has items.

Verification:
- Ran `npm run verify`: 75 Node tests passed, plus the Jekyll production build smoke test passed.

Known limits:
- Exchange rates are intentionally hardcoded, not live market rates.

### 2026-06-05 - Basket Success-State Hardening + Local Regression Suite

Request summary:
User reported that the basket success UI kept appearing by default even after clearing storage, and asked for a more serious hardening pass with automated tests and an explicit fast path for working without tests.

Decision:
Move basket state rules into a pure shared module, make the success UI render only from an explicit success state via a dormant HTML template, and add a local no-network regression suite using Node's built-in test runner.

Files changed:
- `shop-state.mjs`
- `shop.js`
- `investment-art/basket.html`
- `_layouts/default.html`
- `package.json`
- `tests/shop-state.test.mjs`
- `tests/template-regressions.test.mjs`
- `readme-developer.md`

Acceptance criteria:
- Basket page must not show success UI by default.
- Success UI renders only after real PayPal capture or explicit `ddd` simulation.
- Simulated success is one-shot and not sticky across later normal page loads.
- Real PayPal success clears the live basket and shows a snapshot summary.
- Hidden Formspree fields use the active checkout snapshot, not an empty basket, after payment success.
- Local regression suite runs without browser downloads, external APIs, or token usage.
- Repo documents a fast path that skips tests and a full verification path that runs them.

Verification:
- Ran `node --check shop.js`.
- Added `25` local automated tests across basket math, success gating, and template regressions with `node --test`.

Known limits:
- The automated suite is currently state-logic and template focused rather than full browser E2E.
- Browser-level checkout automation can be added later if we want end-to-end UI coverage on top of the local fast suite.

### 2026-06-03 - One Euro Test Purchase Page

Request summary:
User wanted a super simple `test-purchase` page for 1 euro to test real PayPal purchases.

Decision:
Add a dedicated `/test-purchase.html` page and upgrade basket math so each basket item can carry its own price instead of assuming every item costs `EUR 100`.

Files changed:
- `test-purchase.html`
- `shop.js`
- `_layouts/artwork.html`

Acceptance criteria:
- `/test-purchase.html` exists.
- The page adds a dummy item priced at `EUR 1`.
- Basket totals respect item-level prices.
- PayPal order creation uses the real basket total and per-item unit amounts.

Verification:
- Ran `bundle exec jekyll build`.
- Ran `node --check shop.js`.

Known limits:
- Test item is intentionally plain and should not be linked prominently in the main customer flow.

### 2026-06-03 - PayPal Smart Button Integration

Request summary:
User asked to integrate a PayPal button from the PayPal payment links and buttons flow.

Decision:
Add PayPal JavaScript SDK smart-button support to the basket page, driven by the current basket total. Keep the PayPal.me link as a fallback until the live PayPal client ID is configured.

Files changed:
- `_config.yml`
- `investment-art/basket.html`
- `shop.js`
- `shop.css`
- `readme-developer.md`

Acceptance criteria:
- Basket page has a PayPal SDK button container.
- PayPal SDK loads only when `paypal_client_id` is present.
- PayPal order amount uses `EUR 100 x total print quantity`.
- PayPal order includes basket line items.
- If the SDK is not configured or fails to load, the PayPal.me fallback remains available.
- Developer docs explain where to paste the PayPal client ID.

Verification:
- Ran `bundle exec jekyll build`.
- Ran `node --check shop.js`.

Known limits:
- The static-site integration uses client-side PayPal order creation and capture.
- For full server-side payment verification later, add a backend or serverless function.

### 2026-06-03 - Restore Basket Behavior After Jekyll Cleanup

Request summary:
User reported that adding to basket was broken.

Decision:
Restore the `localStorage` basket behavior in the root `shop.js` used by the Jekyll site.

Files changed:
- `shop.js`
- `shop.css`

Acceptance criteria:
- Product page `Add To Basket` button adds the current artwork.
- Adding the same artwork more than once increments quantity.
- Header basket count updates immediately.
- Basket page renders selected items, quantities, and totals.
- PayPal link reflects the full basket total.
- Forward-order email includes the order lines, buyer email, address, and total.

Verification:
- Ran `bundle exec jekyll build`.
- Ran `node --check shop.js`.
- Started local Jekyll with `_config.local.yml`.
- Added `The Boss` twice from `/investment-art/01-the-boss.html`.
- Confirmed basket shows `2 x EUR 100`, `2 prints in basket`, `EUR 200`, and `Pay EUR 200 With PayPal`.

Known limits:
- Basket row quantity controls are not yet inline editable; repeated clicks increment quantity.

### 2026-06-02 - Initial Static Canvas Shop

Request summary:
User wanted to turn `moneyfromthefuture.com` into a print-on-demand / merch shop, then simplified the first commercial strategy to canvas prints only at `EUR 100` each.

Decision:
Start with a static canvas shop instead of a full ecommerce backend. Keep the commercial offer simple and direct.

Files changed:
- `index.html`

Acceptance criteria:
- Present the site as a canvas-print shop.
- Show selected artworks.
- Use `EUR 100` pricing.
- Keep the UI visually direct and sharp.

Verification:
- Previewed locally in browser.

Known limits:
- Checkout was initially manual and not backend-verified.

### 2026-06-02 - Existing Repo Becomes Source Of Truth

Request summary:
User asked to move work into `/Users/m/Code/moneyfromthefuture.com` and stop treating the Codex scratch folder as the working source.

Decision:
Work only in the existing GitHub repo. Add a repo-native generator so the generated shop can be maintained from the repo itself.

Files changed:
- `generate-investment-art.mjs`
- `index.html`
- `investment-art/`

Acceptance criteria:
- Root `index.html` remains in the repo root.
- Individual generated artwork pages live in `investment-art/`.
- No duplicate source structure in the Codex folder.
- Future generation happens from repo-local script.

Verification:
- Confirmed repo-local generator exists.
- Confirmed generated files are inside the existing repo.

Known limits:
- The generator currently contains the artwork manifest inline.

### 2026-06-02 - One Product Page Per Artwork Family

Request summary:
User pointed out the `images/` folder contains many more artworks and clarified that there should be one design per family, not variant overload.

Decision:
Create one product page per numbered artwork family and select one representative image for each family.

Files changed:
- `generate-investment-art.mjs`
- `index.html`
- `investment-art/*.html`
- `investment-art/shop.css`
- `investment-art/shop.js`

Acceptance criteria:
- Generate 40 individual artwork pages.
- Avoid showing variants in the buyer flow.
- Keep the homepage as the full catalog.
- Link each catalog card to the relevant artwork page.

Verification:
- Confirmed 40 numbered artwork families.
- Generated 40 product pages.

Known limits:
- Representative image choices may still need human taste review.

### 2026-06-02 - Multi-Design Basket With Local Storage

Request summary:
User wanted people to navigate multiple product pages, add designs to a basket, and checkout multiple designs.

Decision:
Use `localStorage` for a simple static-site basket. This survives page navigation and refreshes without requiring a backend.

Files changed:
- `generate-investment-art.mjs`
- `investment-art/shop.js`
- `investment-art/shop.css`
- `investment-art/basket.html`
- `investment-art/*.html`
- `index.html`

Acceptance criteria:
- Header shows basket count.
- Product pages can add a design to basket.
- Basket persists across navigation.
- Basket page shows selected designs.
- Basket checkout totals `EUR 100 x selected designs`.
- PayPal link updates with total amount.
- Forward-order email includes selected designs, buyer email, address, and total.

Verification:
- Added `The Boss`.
- Added `Peace Planetary Council`.
- Confirmed basket showed `2 designs`.
- Confirmed PayPal URL used `200EUR`.
- Confirmed mailto body included both designs plus typed email and address.
- Cleared test basket after verification.

Known limits:
- Basket is local to one browser/device.
- PayPal payment is not automatically verified by the static site.

### 2026-06-02 - Quantity Support + Product Browsing

Request summary:
User wanted to add multiple canvas prints of the same design, make the main image bigger, and add navigation to the next artwork page for easy browsing.

Decision:
Change the basket from unique-design count to print quantity count. Keep one row per artwork in the basket, with quantity controls.

Files changed:
- `generate-investment-art.mjs`
- `investment-art/shop.js`
- `investment-art/shop.css`
- `investment-art/*.html`

Acceptance criteria:
- Clicking `Add To Basket` repeatedly increments quantity for the same artwork.
- Header basket count shows total print quantity.
- Basket row shows unit price and quantity.
- Basket has `-` and `+` quantity controls.
- Decreasing quantity from `1` removes the row.
- Checkout total reflects total print quantity.
- PayPal link reflects total print amount.
- Order email includes quantities and subtotals.
- Product artwork image is larger on individual pages.
- Each product page has Previous / Catalog / Next navigation.

Verification:
- Added `The Boss` three times.
- Confirmed basket count showed `3`.
- Confirmed basket showed `EUR 100 x 3`.
- Confirmed total was `EUR 300`.
- Confirmed PayPal URL used `300EUR`.
- Used `+` to reach `4 / EUR 400`.
- Used `-` to return to `3 / EUR 300`.
- Confirmed next navigation from `01 The Boss` to `02 Peace Planetary Council`.
- Cleared test basket after verification.
- Switched the artwork manifests to `WEB` preview files where available, including `38-metacrisis` now that `38-metacrisis-UPSCALED-WEB.jpg` exists on disk.

Known limits:
- Quantity controls are currently button-based only; no direct numeric input yet.

### 2026-06-02 - Jekyll Migration For GitHub Pages

Request summary:
User decided the site will live on GitHub Pages and asked whether Jekyll is the right move to avoid maintaining 40 HTML files. User then asked to implement Jekyll and create developer instructions.

Decision:
Move from a custom Node generator to Jekyll. Keep root `index.html`, keep public product URLs under `/investment-art/*.html`, but move product source data into `_artworks/*.md`. Use a GitHub Actions Pages workflow with modern Jekyll because the older `github-pages` gem breaks against current Homebrew Ruby versions.

Files changed:
- `_config.yml`
- `Gemfile`
- `.ruby-version`
- `.gitignore`
- `.github/workflows/pages.yml`
- `Gemfile.lock`
- `_layouts/default.html`
- `_layouts/artwork.html`
- `_artworks/*.md`
- `index.html`
- `investment-art/basket.html`
- `readme-developer.md`
- `changelog-promptlog.md`
- Removed `generate-investment-art.mjs`
- Removed generated `investment-art/*.html` product source files

Acceptance criteria:
- GitHub Pages can deploy the Jekyll build through GitHub Actions.
- Root `/index.html` remains the main catalog source.
- Product pages are generated from `_artworks/*.md`.
- Public product URLs remain under `/investment-art/*.html`.
- Basket page remains under `/investment-art/basket.html`.
- No generated product HTML files need to be hand-maintained.
- Shared header/footer/head live in `_layouts/default.html`.
- Product page markup lives in `_layouts/artwork.html`.
- Developer setup and daily serve commands live in `readme-developer.md`.
- Ruby version managers can use `.ruby-version` for project-local Ruby switching.

Verification:
- Confirmed local machine has Ruby `2.6.10`.
- Confirmed `jekyll` is not installed locally yet.
- Confirmed no existing `Gemfile`, `_config.yml`, or `CNAME` existed before migration.
- Installed Homebrew Ruby `4.0.5`, then found the old `github-pages` gem stack is incompatible with Ruby 4.
- Installed Homebrew Ruby `3.3.11`, then found the old `github-pages` gem stack still fails on Liquid's removed `tainted?` call.
- Switched from `github-pages` gem to modern `jekyll` gem and GitHub Actions deployment.
- Added `.ruby-version` set to `3.3.11` so RVM/rbenv/asdf/mise can switch Ruby versions project-locally.
- Updated Liquid from `4.0.3` to `4.0.4`, which fixes the Ruby 3.3 `tainted?` crash.
- Confirmed `bundle exec jekyll build` passes with Ruby `3.3.11`.
- Started local Jekyll server at `http://127.0.0.1:4000/`.
- Verified homepage renders `40 Artwork Families`.
- Verified generated product page `/investment-art/01-the-boss.html`.
- Added `The Boss` twice and confirmed basket shows `2 prints`, `EUR 200`, and `Pay EUR 200 With PayPal`.
- Cleared test basket after verification.

Known limits:
- GitHub Pages settings must be configured to publish from GitHub Actions.
- If switching back to the custom domain later, restore `CNAME` and set `_config.yml` `baseurl` to `""`.

## Session: 2026-06-21 / 2026-06-22 — Product page, checkout rework, footer, test harness

Large slice toward public release. Worked one feature at a time with live browser verification.

### Individual artwork page rebuild
- **Decision:** Lead with the artwork. Replaced the cramped side-by-side hero with a full-width **3D canvas viewer** (Three.js r128) that hangs each piece on a wall — drag to rotate, scroll to zoom, pan up close, auto-drift when idle. Adapted from `DEMO-test-gallery.html` into a reusable `art-viewer.js` (reads texture URLs from `data-` attributes; aspect ratio auto-detected per image).
- **Progressive loading:** show the light `WEB` texture first (usually already cached from the catalog), then silently swap in the full-res `THIS` file in the background. Spinner shows until the first texture lands; graceful fallback if WebGL/THREE absent or load fails.
- Restructured the page: breadcrumb, full-width viewer, product panel (badge, specs, sticky buy box), long-form story section, prev/next.
- **Prev/next** moved from a bottom block to `‹ ›` arrows flanking the viewer (carousel style, `pointer-events` lets drag pass through the middle).
- Files: `_layouts/artwork.html`, `art-viewer.js`, `shop.css`, `.claude/launch.json`.

### Artwork descriptions split into two fields
- **Decision:** Drop the generic `description`. Each artwork now carries `description_author` (the artist's short voice; placeholder `"Lorem Ipsum"` until written) and `description_ai` (longer SEO body, rendered via `markdownify`).
- `<meta name="description">` now derives from `description_ai` (stripped + truncated to 160 chars), with fallback for non-artwork pages.
- All 40 `_artworks/*.md` migrated. The `description_ai` drafts are currently title/theme-based; user is replacing them with image-accurate copy via another tool.
- Files: all `_artworks/*.md`, `_layouts/artwork.html`, `_layouts/default.html`, `_config.yml`.

### Product specs + trust
- Spec grid: Dimensions `60 × 30 cm`, Material `Canvas Print`, Finish `Wooden frame, ready to hang`, Shipping `Manufactured locally, in your country` (shared defaults in the layout, per-artwork overridable).
- Buy box: removed internal-strategy banner and the `Pay with Bitcoin/Card` line; added **"Comes with certificate of authenticity"**. Kept the live `data-basket-status` hook (hidden when empty) for add-to-basket feedback.

### Basket page → lean checkout
- Stripped marketing fluff (full-screen hero, "Pay With PayPal" headline). Compact header + basket + checkout.
- **Per-line controls:** quantity steppers (−/+) and Remove on each basket line (delegated handler; `setItemQuantity`/`removeItemFromBasket` added to `shop-state.mjs`). Decrementing to 0 removes the line.
- Empty-basket copy simplified to one friendly line; PayPal explainer hidden until there's something to pay for.

### PayPal-first checkout (removes duplicate address entry)
- **Problem:** buyer filled our delivery form, then PayPal's card form asked for name/address again.
- **Decision:** capture payment first; pull name/email/shipping address from the PayPal capture (`extractDeliveryFromPayPal`, pure + unit-tested) and forward them. The 6 delivery fields are now hidden carriers populated from PayPal. (Also more correct — shipping to PayPal's address is what Seller Protection expects.)
- Order auto-forwards to Formspree over `fetch` on capture (no extra button), buyer stays on-page, success/failure shown inline. Success screen simplified + shows "Ships to …".
- **Formspree:** wired the real form `mzdqwgby` (was a placeholder `email@…`). First real submission needs the one-time Formspree form-confirmation email; confirmed working in prod. The hidden `ddd` UI shortcut now exercises the full extract→forward path for free testing.
- Files: `investment-art/basket.html`, `shop.js`, `shop-state.mjs`, `shop.css`.

### Navigation + footer
- Moved `About / Policies / Blog` from the header to the footer (header keeps only the cart).
- **Social as first-class** in the footer: Twitter `@moneyFromThe`, Telegram `@moneyFTF`, Instagram `@moneyfromthefuture`, TikTok `@marsrobertson`, Nostr (Primal) — each with an inline monochrome brand SVG (Nostr uses the ostrich). Dropped the standalone Social page from navigation (file still exists, unlinked).
- Files: `_layouts/default.html`, `shop.css`.

### Test harness (release-readiness)
- Grew from ~36 to **66 tests** across `npm test` (65 fast) + `npm run test:build` (1 build smoke). `npm run verify` = both, the pre-publish gate.
- New: `tests/content-artworks.test.mjs` (front matter validity, unique/contiguous orders, **referenced image files exist on disk**, non-empty `description_ai`), `tests/site-markup.test.mjs` (header/footer/artwork/basket markup locked in, incl. real Formspree form id), `tests/smoke/build.test.mjs` (real Jekyll build to temp dir, asserts no Liquid errors + all 40 artwork pages emit; skips if Ruby absent).
- Extended `tests/shop-state.test.mjs` with quantity/remove and PayPal-extraction cases.
- Added `package.json` scripts: `test:build`, `build`; `verify` now chains test + build smoke.

### Known limits / next
- `description_ai` copy is title-based until image-accurate copy lands.
- Twitter handle `@moneyFromThe` used verbatim — confirm it resolves.
- Open Graph / social-share images per product still TODO.
- A manual launch-day smoke (real €1 PayPal, Formspree delivery, mobile) is still wise on top of the automated build smoke.

## Prompt Log

### Conversation Summary

- User had `https://moneyfromthefuture.com/` and wanted to make money with print-on-demand merch.
- First implementation was a standalone static storefront in a Codex scratch folder.
- User asked to add git repo; a temporary repo was initialized in the scratch folder.
- User then pointed to the real repo: `/Users/m/Code/moneyfromthefuture.com`.
- Work was moved into the real repo.
- Strategy was simplified to canvas prints only, `EUR 100` each.
- User asked for no rounded corners, `2:1` horizontal tiles, PayPal checkout, email, single address textarea, and deep links.
- User clarified that the `images/` folder contains many artworks.
- We agreed to one product page per artwork family, not one page per variant.
- User asked generated product pages to live in `investment-art/` while root `index.html` remains the main catalog.
- User asked to stop maintaining parallel Codex/repo structures; generator was moved into the real repo.
- User committed the generated work.
- User requested basket persistence for navigating multiple files; `localStorage` was chosen.
- User requested support for multiple prints of the same artwork, larger product images, and previous/next navigation.
- User decided GitHub Pages hosting is the right target and asked for a Jekyll migration.
- User asked for developer instructions in `readme-developer.md`.
- User asked to keep the `THIS` file available in `images/` but make the preview use the `WEB` version for `The Boss`.
- User later renamed the artwork image set so preview assets should use `WEB` versions across the board.
- User then clarified the final rule: use `WEB` images on the index/catalog pages and `THIS` images on individual product pages.

### Current User Working Style

- Work one feature at a time.
- Keep the repo self-contained.
- Prefer simple static-site mechanisms until a backend is truly needed.
- Maintain this file as project memory.

## Open Questions / Future Feature Candidates

Done (2026-06-22 session):
- ~~Replace PayPal.me link with a more formal PayPal checkout flow~~ → PayPal smart button + auto-forward to Formspree, capture-first.
- ~~Add direct quantity input for basket rows~~ → per-line −/+ steppers and Remove.
- ~~Add product metadata per artwork (size, material, shipping)~~ → spec grid + certificate line.
- ~~Add explicit product size/material/shipping terms~~ → 60×30 cm, wooden frame, made locally.

Still open:
- Replace title-based `description_ai` with image-accurate copy (in progress, external tool).
- Write real `description_author` per artwork (currently "Lorem Ipsum").
- Add Open Graph / social-share image per product page (meta description already wired).
- Add sitemap entries for `/investment-art/*.html`.
- Review representative image choices for all 40 artwork families.
- Confirm Twitter handle `@moneyFromThe` resolves; decide whether to delete the unlinked `social.md`.
