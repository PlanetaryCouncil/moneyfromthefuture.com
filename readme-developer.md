# Money From The Future Developer Notes

This repo is now a Jekyll site designed for GitHub Pages. The important idea: we maintain small source files, and Jekyll generates the final static HTML.

The repo uses modern Jekyll through `Gemfile` and deploys to GitHub Pages through `.github/workflows/pages.yml`. This avoids the older `github-pages` gem, which currently clashes with modern Ruby on local machines.

Known-good local stack:

```text
Ruby 3.3.11
Jekyll 4.4.1
Liquid 4.0.4
```

## Daily Local Preview

Use this after Ruby/Jekyll is installed:

```sh
cd /Users/m/Code/moneyfromthefuture.com
bundle exec jekyll serve --baseurl "" --livereload --incremental --host 127.0.0.1 --port 4000
```

If you prefer the repo script and already have the right Ruby in your shell:

```sh
cd /Users/m/Code/moneyfromthefuture.com
npm run dev
```

If livereload says its port is already in use, either change the livereload port:

```sh
bundle exec jekyll serve --baseurl "" --livereload --livereload-port 35730 --incremental --host 127.0.0.1 --port 4000
```

Or run without livereload:

```sh
bundle exec jekyll serve --baseurl "" --incremental --host 127.0.0.1 --port 4000
```

Open:

```text
http://127.0.0.1:4000/
http://127.0.0.1:4000/investment-art/01-the-boss.html
http://127.0.0.1:4000/investment-art/basket.html
```

## First-Time Setup

The macOS system Ruby on this machine was detected as `2.6.10`, and `jekyll` was not installed. Do not fight system Ruby. Use Homebrew Ruby 3.3 for this repo.

This repo has a `.ruby-version` file set to:

```text
3.3.11
```

RVM, rbenv, asdf, and mise can all use that as the project-level Ruby version signal.

Recommended simple Homebrew path:

```sh
brew install ruby@3.3
```

Then make sure the Homebrew Ruby is first in your shell path. On Apple Silicon this is usually:

```sh
echo 'export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"' >> ~/.zshrc
exec zsh
```

Install dependencies:

```sh
cd /Users/m/Code/moneyfromthefuture.com
gem install bundler
bundle install
```

Then run the daily preview command above.

RVM path if you prefer RVM:

```sh
rvm install 3.3.11
cd /Users/m/Code/moneyfromthefuture.com
rvm use 3.3.11
bundle install
bundle exec jekyll serve --config _config.yml,_config.local.yml --baseurl "" --livereload --incremental --host 127.0.0.1 --port 4000
bundle exec jekyll serve --baseurl "" --livereload --incremental --host 127.0.0.1 --port 4000
```

Commit `Gemfile.lock` when dependencies change. That keeps local builds and GitHub Actions builds boringly consistent.

## Build Check

Before committing a structural change:

```sh
cd /Users/m/Code/moneyfromthefuture.com
bundle exec jekyll build
git status --short
```

## Fast Path Vs Full Verification

When you want to move fast and just inspect the UI:

```sh
cd /Users/m/Code/moneyfromthefuture.com
npm run dev
```

That starts Jekyll only. No tests.

When you want the hardening pass:

```sh
cd /Users/m/Code/moneyfromthefuture.com
npm test
```

That runs the lightweight local regression suite with Node's built-in test runner. It does not call external APIs or consume model tokens. It is just local CPU work.

When you want the release gate — fast tests plus a real Jekyll build smoke:

```sh
cd /Users/m/Code/moneyfromthefuture.com
npm run verify
```

`verify` runs `npm test` then `npm run test:build`. Use it before publishing.

Test layout:

- `npm test` → `node --test tests/*.test.mjs` (fast, no Ruby, no network):
  - `tests/shop-state.test.mjs` — basket math, normalization, quantity steppers / remove, success-state gating, checkout message, PayPal→delivery extraction.
  - `tests/content-artworks.test.mjs` — every artwork's front matter is valid, slugs match filenames, orders are unique and contiguous from 1, and **referenced image files exist on disk**.
  - `tests/site-markup.test.mjs` — header/footer/artwork/basket markup is locked in (cart-only header, 5 footer socials, 3D viewer + side arrows, hidden delivery fields, real Formspree form id).
  - `tests/template-regressions.test.mjs` — the "success screen visible by default" class of bug.
- `npm run test:build` → `node --test tests/smoke/*.test.mjs`: runs a real `jekyll build` to a temp dir and asserts no Liquid errors and that all 40 artwork pages + core assets emit. Skips cleanly if Ruby/Jekyll isn't on the machine.

The smoke build writes to a temp dir, not `_site`, so it won't disturb a running `npm run dev` server.

Jekyll writes generated output to `_site/`. That folder is ignored and should not be committed.

## Project Structure

```text
_config.yml                 Jekyll and GitHub Pages config (+ shared artwork defaults)
_artworks/*.md              One source file per artwork/product
_layouts/default.html       Shared HTML head, cart-only header, social footer, script/css includes
_layouts/artwork.html       Product page template (3D viewer, specs, buy box, story, side arrows)
index.html                  Catalog page that loops over _artworks
investment-art/basket.html  Basket/checkout source page (lean, PayPal-first)
shop.css                    Shared shop styling
shop.js                     localStorage basket, per-line controls, PayPal + Formspree checkout
shop-state.mjs              Pure cart/checkout logic (imported by shop.js, unit-tested)
art-viewer.js               Three.js 3D canvas viewer with progressive WEB→THIS loading
tests/*.test.mjs            Fast unit + content + markup tests (npm test)
tests/smoke/*.test.mjs      Jekyll build smoke test (npm run test:build)
images/                     Artwork files (THIS = full-res, WEB = light preview)
changelog-promptlog.md      Project memory, decisions, acceptance criteria
```

## Add A New Artwork

1. Add the image file to `images/`.
2. Create a new file in `_artworks/`, for example `_artworks/41-new-work.md`.
3. Use this front matter:

```yaml
---
art_id: "41"
order: 41
slug: 41-new-work
title: "New Work"
image: "41 New Work THIS.png"          # full-res file, used by the 3D viewer
preview_image: "41 New Work WEB.jpg"   # light file, used by catalog + as the fast 3D texture
description_author: "Lorem Ipsum"      # the artist's short voice (placeholder until written)
description_ai: |
  Longer SEO body. **Markdown** works; blank lines start new paragraphs.
---
```

Notes:
- `description` (the old generic field) was removed. Pages use `description_author` for the intro and `description_ai` for the long-form story + the `<meta name="description">`.
- Specs (dimensions, material, finish, shipping) come from shared defaults in `_layouts/artwork.html`; override per-artwork by adding `dimensions:` / `finish:` / etc. to the front matter.
- `tests/content-artworks.test.mjs` will fail if `image`/`preview_image` don't exist on disk, orders aren't contiguous, or `description_ai` is empty — run `npm test` after adding.

4. Restart Jekyll if the new file does not appear immediately (front matter / `_config.yml` changes need a server restart).
5. Check the catalog, product page, 3D viewer, add-to-basket flow, and basket total.
6. Update `changelog-promptlog.md` with the feature/request, acceptance criteria, and verification.

## Edit Existing Artwork

Change the matching file in `_artworks/`. Common edits:

```yaml
title: "Better Title"
image: "Better Image.png"
order: 12
```

The product page URL comes from the filename because `_config.yml` uses:

```yaml
permalink: /investment-art/:name.html
```

If you rename `_artworks/01-the-boss.md`, the public URL changes too.

## GitHub Pages

This is meant to publish through GitHub Actions to GitHub Pages. In GitHub repository settings, set:

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

The repo includes:

```text
_config.yml
Gemfile
Gemfile.lock
.github/workflows/pages.yml
```

If GitHub Pages is configured as a project site, the live site should resolve as:

```text
https://planetarycouncil.github.io/moneyfromthefuture.com/
```

If you later switch to the custom domain, change `_config.yml` `url` to `https://moneyfromthefuture.com`, set `baseurl` back to `""`, and restore `CNAME`.

## Checkout: PayPal Smart Button + Formspree

The basket renders PayPal's JS SDK smart button (PayPal + guest card). Paste the live PayPal client ID into `_config.yml`:

```yaml
paypal_client_id: "YOUR_LIVE_PAYPAL_CLIENT_ID"
```

The client ID is public configuration for the PayPal browser SDK. Do not add PayPal secret keys to this static GitHub Pages repo. If `paypal_client_id` is blank, the PayPal area shows a setup hint instead of a button.

Flow (capture-first, no duplicate address entry):

1. Buyer reviews the basket and clicks PayPal/card. They enter name + address **once, in PayPal**.
2. On capture, `shop.js` pulls name/email/shipping from the PayPal response (`extractDeliveryFromPayPal`) into hidden form fields.
3. The order auto-forwards to **Formspree** over `fetch` (the 6 delivery fields are hidden carriers — there is no separate delivery form to fill).
4. The success screen confirms the order and shows "Ships to …".

Formspree form id lives in `investment-art/basket.html` as the form `action` (`https://formspree.io/f/<id>`). A brand-new form holds its first submission until you click Formspree's one-time confirmation email — do that before relying on order emails. The hidden `ddd` keyboard shortcut on the basket page fires the full extract→forward path with sample data, so you can test the email pipeline without a real payment.

`tests/site-markup.test.mjs` guards against the form action regressing to a placeholder.

## Acceptance Criteria For Shop Work

- Root `/` shows the artwork catalog.
- Product pages are generated under `/investment-art/*.html`.
- Only `_artworks/*.md` should be edited for artwork data.
- Do not hand-maintain generated product HTML.
- Basket persists through `localStorage`.
- Basket supports multiple artworks and multiple quantities, with per-line −/+ and remove controls.
- Checkout total is based on a `USD 100` print baseline. The header currency selector converts that baseline to hardcoded `USD`, `EUR`, or `GBP` totals for display and PayPal checkout.
- PayPal smart button captures payment; name/email/shipping come from the PayPal capture and auto-forward to Formspree.
- Buyer never types their delivery address twice.
- UI remains square-edged with no rounded corners.
- `npm run verify` is green (fast tests + Jekyll build smoke).
