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

  // Every artwork should produce a detail page.
  const artworkCount = fs.readdirSync(path.join(ROOT, "_artworks")).filter((f) => f.endsWith(".md")).length;
  const builtPages = fs
    .readdirSync(path.join(DEST, "investment-art"))
    .filter((f) => /^\d.*\.html$/.test(f)).length;
  assert.equal(builtPages, artworkCount, `expected ${artworkCount} artwork pages, built ${builtPages}`);
});
