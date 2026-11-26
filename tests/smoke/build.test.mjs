import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEST = path.join(os.tmpdir(), "mftf-smoke-site");

// The dev scripts use a pinned Homebrew Ruby; fall back to whatever `bundle` is on PATH.
const BUNDLE_CANDIDATES = ["/opt/homebrew/opt/ruby@3.3/bin/bundle", "bundle"];

function resolveBundle() {
  for (const candidate of BUNDLE_CANDIDATES) {
    try {
      execSync(`${candidate} --version`, { cwd: ROOT, stdio: "ignore" });
      return candidate;
    } catch {
      /* try next */
    }
  }
  return null;
}

test("jekyll production build compiles and emits the key pages", (t) => {
  const bundle = resolveBundle();
  if (!bundle) {
    t.skip("bundler/jekyll not available in this environment");
    return;
  }

  fs.rmSync(DEST, { recursive: true, force: true });
  const output = execSync(
    `${bundle} exec jekyll build --config _config.yml --destination "${DEST}" 2>&1`,
    { cwd: ROOT, encoding: "utf8" }
  );

  // Jekyll exits 0 even on some soft failures — assert no Liquid problems leaked into output.
  assert.doesNotMatch(output, /Liquid (Exception|Warning|Error)/i, output);
  assert.doesNotMatch(output, /^\s*Error:/im, output);

  const required = [
    "index.html",
    "investment-art/basket.html",
    "investment-art/01-the-boss.html",
    "shop.js",
    "shop-state.mjs",
    "art-viewer.js",
    "shop.css"
  ];
  for (const rel of required) {
    assert.ok(fs.existsSync(path.join(DEST, rel)), `build did not emit ${rel}`);
  }

  const indexHtml = fs.readFileSync(path.join(DEST, "index.html"), "utf8");
  const artworkHtml = fs.readFileSync(path.join(DEST, "investment-art/01-the-boss.html"), "utf8");
  assert.match(indexHtml, /<meta property="og:image" content="https:\/\/moneyfromthefuture\.com\/images\/01%20The%20Boss%20WEB\.jpg">/);
  assert.match(indexHtml, /<meta name="twitter:image" content="https:\/\/moneyfromthefuture\.com\/images\/01%20The%20Boss%20WEB\.jpg">/);
  assert.match(indexHtml, /Higherdimensional portals beaming energy from another timelines/);
  assert.match(artworkHtml, /<meta property="og:image" content="https:\/\/moneyfromthefuture\.com\/images\/01%20The%20Boss%20WEB\.jpg">/);
  assert.doesNotMatch(indexHtml, /content="https:\/\/moneyfromthefuture\.com\/images\/"/);

  // Every artwork should produce a detail page.
  const artworkCount = fs.readdirSync(path.join(ROOT, "_artworks")).filter((f) => f.endsWith(".md")).length;
  const builtPages = fs
    .readdirSync(path.join(DEST, "investment-art"))
    .filter((f) => /^\d.*\.html$/.test(f)).length;
  assert.equal(builtPages, artworkCount, `expected ${artworkCount} artwork pages, built ${builtPages}`);

  // Experiments: pages render, and the self-signed PNG is copied byte-for-byte (its hash is the artwork).
  for (const rel of [
    "experiments/index.html",
    "experiments/self-signed-artwork/index.html",
    "experiments/i-could-be-yours-for-1-night/index.html",
    "experiments/i-could-be-yours-for-1-night/auction-listing.jpg"
  ]) {
    assert.ok(fs.existsSync(path.join(DEST, rel)), `build did not emit ${rel}`);
  }
  const png = "experiments/self-signed-artwork/singularity-studio.fdbf223d.png";
  assert.ok(fs.readFileSync(path.join(DEST, png)).equals(fs.readFileSync(path.join(ROOT, png))), `${png} changed during build`);
  const ssa = fs.readFileSync(path.join(DEST, "experiments/self-signed-artwork/index.html"), "utf8");
  assert.match(ssa, /<meta property="og:image" content="https:\/\/moneyfromthefuture\.com\/images\/self-signed-artwork-WEB\.jpg">/);
  assert.match(ssa, /const K = new Int32Array/, "miner script lost inside raw block");
  assert.match(indexHtml, /class="footer-experiments"/);
  const icb = fs.readFileSync(path.join(DEST, "experiments/i-could-be-yours-for-1-night/index.html"), "utf8");
  assert.match(icb, /<meta property="og:image" content="https:\/\/moneyfromthefuture\.com\/images\/i-could-be-yours-WEB\.jpg">/);
  for (const href of ["scarce.city/auctions/i-could-be-yours-for-1-night-the-price-is-1-btc", "github.com/PlanetaryCouncil/terms-and-conditions", "youtube-nocookie.com/embed/TgF-JVZIEf8"]) {
    assert.ok(icb.includes(href), `1 BTC page is missing ${href}`);
  }
  assert.match(indexHtml, /i-could-be-yours-for-1-night/, "footer should list the 1 BTC experiment");
});
