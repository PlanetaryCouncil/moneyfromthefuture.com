import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTWORKS_DIR = path.join(ROOT, "_artworks");
const IMAGES_DIR = path.join(ROOT, "images");

const files = fs.readdirSync(ARTWORKS_DIR).filter((f) => f.endsWith(".md")).sort();

function frontMatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : "";
}

// Read a simple `key: value` scalar (handles optional quotes). Block scalars return "|".
function scalar(fm, key) {
  const match = fm.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"));
  if (!match) return null;
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function blockScalar(fm, key) {
  const lines = fm.split("\n");
  const start = lines.findIndex((line) => line.match(new RegExp(`^${key}:[ \\t]*\\|[ \\t]*$`)));
  if (start === -1) return "";

  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line && !line.startsWith(" ")) break;
    body.push(line.replace(/^  /, ""));
  }
  return body.join("\n").trim();
}

test("there are artwork files to validate", () => {
  assert.ok(files.length >= 1, "no _artworks/*.md files found");
});

test("every artwork has the required front matter", () => {
  for (const file of files) {
    const fm = frontMatter(fs.readFileSync(path.join(ARTWORKS_DIR, file), "utf8"));
    for (const key of ["art_id", "order", "slug", "title", "image", "description_author", "description_ai", "description_ai_v2"]) {
      assert.ok(new RegExp(`^${key}:`, "m").test(fm), `${file} is missing "${key}"`);
    }
  }
});

test("every artwork slug matches its filename", () => {
  for (const file of files) {
    const fm = frontMatter(fs.readFileSync(path.join(ARTWORKS_DIR, file), "utf8"));
    assert.equal(scalar(fm, "slug"), file.replace(/\.md$/, ""), `${file} slug mismatch`);
  }
});

test("artwork orders are unique and contiguous from 1", () => {
  const orders = files.map((file) => {
    const fm = frontMatter(fs.readFileSync(path.join(ARTWORKS_DIR, file), "utf8"));
    return Number(scalar(fm, "order"));
  });
  assert.equal(new Set(orders).size, orders.length, "duplicate order values");
  assert.deepEqual([...orders].sort((a, b) => a - b), Array.from({ length: orders.length }, (_, i) => i + 1));
});

test("art_id matches the order number", () => {
  for (const file of files) {
    const fm = frontMatter(fs.readFileSync(path.join(ARTWORKS_DIR, file), "utf8"));
    assert.equal(Number(scalar(fm, "art_id")), Number(scalar(fm, "order")), `${file} art_id/order mismatch`);
  }
});

test("every referenced image and preview_image exists on disk", () => {
  for (const file of files) {
    const fm = frontMatter(fs.readFileSync(path.join(ARTWORKS_DIR, file), "utf8"));
    for (const key of ["image", "preview_image"]) {
      const value = scalar(fm, key);
      if (!value) continue; // preview_image is optional
      assert.ok(fs.existsSync(path.join(IMAGES_DIR, value)), `${file}: ${key} "${value}" not found in images/`);
    }
  }
});

test("description_ai has real content (not the empty placeholder)", () => {
  for (const file of files) {
    const fm = frontMatter(fs.readFileSync(path.join(ARTWORKS_DIR, file), "utf8"));
    assert.ok(blockScalar(fm, "description_ai").length > 40, `${file} has empty/short description_ai`);
  }
});

test("description_ai_v2 has three paragraphs of image-based copy", () => {
  for (const file of files) {
    const fm = frontMatter(fs.readFileSync(path.join(ARTWORKS_DIR, file), "utf8"));
    const paragraphs = blockScalar(fm, "description_ai_v2").split(/\n\s*\n/).filter(Boolean);
    assert.equal(paragraphs.length, 3, `${file} description_ai_v2 should have 3 paragraphs`);
    assert.ok(paragraphs.join(" ").includes("investment art"), `${file} description_ai_v2 should mention investment art`);
  }
});
