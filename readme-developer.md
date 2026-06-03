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
bundle exec jekyll serve --livereload --incremental --host 127.0.0.1 --port 4000 --baseurl ""
```

If livereload says its port is already in use, either change the livereload port:

```sh
bundle exec jekyll serve --livereload --livereload-port 35730 --incremental --host 127.0.0.1 --port 4000 --baseurl ""
```

Or run without livereload:

```sh
bundle exec jekyll serve --incremental --host 127.0.0.1 --port 4000 --baseurl ""
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
bundle exec jekyll serve --livereload --incremental --host 127.0.0.1 --port 4000 --baseurl ""
```

Commit `Gemfile.lock` when dependencies change. That keeps local builds and GitHub Actions builds boringly consistent.

## Build Check

Before committing a structural change:

```sh
cd /Users/m/Code/moneyfromthefuture.com
bundle exec jekyll build
git status --short
```

Jekyll writes generated output to `_site/`. That folder is ignored and should not be committed.

## Project Structure

```text
_config.yml                 Jekyll and GitHub Pages config
_artworks/*.md              One source file per artwork/product
_layouts/default.html       Shared HTML head, header, footer, script/css includes
_layouts/artwork.html       Product page template
index.html                  Catalog page that loops over _artworks
investment-art/basket.html  Basket/checkout source page
investment-art/shop.css     Shared shop styling
investment-art/shop.js      localStorage basket and checkout behavior
images/                     Artwork files
changelog-promptlog.md      Project memory, decisions, acceptance criteria
```

## Add A New Artwork

1. Add the image file to `images/`.
2. Create a new file in `_artworks/`, for example `_artworks/41-new-work.md`.
3. Use this front matter:

```yaml
---
id: "41"
order: 41
slug: 41-new-work
title: "New Work"
image: "41 New Work.png"
description: "New Work canvas print from Money From The Future. 100 euro per piece."
---
```

4. Restart Jekyll if the new file does not appear immediately.
5. Check the catalog, product page, add-to-basket flow, and basket total.
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

## Acceptance Criteria For Shop Work

- Root `/` shows the artwork catalog.
- Product pages are generated under `/investment-art/*.html`.
- Only `_artworks/*.md` should be edited for artwork data.
- Do not hand-maintain generated product HTML.
- Basket persists through `localStorage`.
- Basket supports multiple artworks and multiple quantities.
- Checkout total is `EUR 100 x total print quantity`.
- PayPal and forward-order email links reflect the basket total.
- UI remains square-edged with no rounded corners.
