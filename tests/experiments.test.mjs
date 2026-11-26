import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// _data/experiments.yml is a flat list of "- key: value" records; parse just enough to check it.
function experiments() {
  const out = [];
  for (const line of read("_data/experiments.yml").split("\n")) {
    const m = line.match(/^(-\s+|\s+)(\w+):\s*(.*)$/);
    if (!m) continue;
    if (m[1].startsWith("-")) out.push({});
    out[out.length - 1][m[2]] = m[3].trim();
  }
  return out;
}

test("every experiment has a page and a preview image on disk", () => {
  const list = experiments();
  assert.ok(list.length > 0, "no experiments listed");
  for (const e of list) {
    for (const key of ["title", "url", "image", "blurb"]) assert.ok(e[key], `${e.title || "?"} missing ${key}`);
    assert.match(e.url, /^\/experiments\/[a-z0-9-]+\/$/);
    assert.ok(fs.existsSync(path.join(ROOT, e.url, "index.html")), `no page for ${e.url}`);
    assert.ok(fs.existsSync(path.join(ROOT, "images", e.image)), `missing image ${e.image}`);
  }
});

test("footer links the experiments strip and nav entry", () => {
  const footer = read("_layouts/default.html").match(/<footer[\s\S]*?<\/footer>/)[0];
  assert.match(footer, /class="footer-experiments"/);
  assert.match(footer, /site\.data\.experiments/);
  assert.match(footer.match(/<nav class="footer-nav"[\s\S]*?<\/nav>/)[0], />Experiments</);
});

test("self-signed artwork still hashes to its painted signature", () => {
  const file = path.join(ROOT, "experiments/self-signed-artwork/singularity-studio.fdbf223d.png");
  const data = fs.readFileSync(file);
  const digest = crypto.createHash("sha256").update(data).digest("hex");
  const m = data.toString("latin1").match(/tEXtSignature\0([0-9a-f]+)/);
  assert.ok(m, "PNG has no Signature text chunk");
  assert.equal(m[1], "fdbf223d");
  assert.ok(digest.startsWith(m[1]), `sha256 ${digest} no longer starts with ${m[1]} — the file was modified`);
});

test("every local image an experiment page references exists", () => {
  for (const e of experiments()) {
    const html = read(path.join(e.url, "index.html"));
    for (const [, file] of html.matchAll(/\{\{ base \}\}([\w.-]+)/g)) {
      assert.ok(fs.existsSync(path.join(ROOT, e.url, file)), `${e.url} references missing ${file}`);
    }
  }
});
