import fs from "node:fs/promises";
import path from "node:path";

const repoDir = "/Users/m/Code/moneyfromthefuture.com";
const imageDir = path.join(repoDir, "images");
const artworksDir = path.join(repoDir, "_artworks");
const dataFile = path.join(repoDir, "_data", "artworks.json");

function yamlString(value) {
  return JSON.stringify(value ?? "");
}

function renderArtworkMarkdown(artwork) {
  return `---
art_id: ${yamlString(artwork.art_id ?? artwork.id)}
order: ${artwork.order}
slug: ${artwork.slug}
title: ${yamlString(artwork.title)}
image: ${yamlString(artwork.image)}
preview_image: ${yamlString(artwork.preview_image)}
description: ${yamlString(artwork.description)}
---
`;
}

async function loadArtworks() {
  const raw = await fs.readFile(dataFile, "utf8");
  const artworks = JSON.parse(raw);

  artworks.sort((a, b) => {
    const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.art_id ?? a.id).localeCompare(String(b.art_id ?? b.id));
  });

  return artworks;
}

const artworks = await loadArtworks();

await fs.mkdir(artworksDir, { recursive: true });
for (const artwork of artworks) {
  await fs.writeFile(path.join(artworksDir, `${artwork.slug}.md`), renderArtworkMarkdown(artwork));
}

for (const artwork of artworks) {
  if (artwork.image) {
    await fs.access(path.join(imageDir, artwork.image));
  }
  if (artwork.preview_image) {
    await fs.access(path.join(imageDir, artwork.preview_image));
  }
}
