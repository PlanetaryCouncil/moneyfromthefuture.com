import fs from "node:fs/promises";
import path from "node:path";

const repoDir = "/Users/m/Code/moneyfromthefuture.com";
const imageDir = path.join(repoDir, "images");
const outputDir = path.join(repoDir, "investment-art");

const artworks = [
  { id: "01", slug: "01-the-boss", title: "The Boss", image: "01 The Boss.jpg" },
  { id: "02", slug: "02-peace-planetary-council", title: "Peace Planetary Council", image: "02 Peace Planetary Council 21.png" },
  { id: "03", slug: "03-infinity", title: "Infinity", image: "03 Infinity 21 signed.png" },
  { id: "04", slug: "04-poseidon", title: "Poseidon", image: "04 Poseidon 21.png" },
  { id: "05", slug: "05-pyramid", title: "Pyramid", image: "05 Pyramid.jpg" },
  { id: "06", slug: "06-berry-pounds", title: "Berry Pounds", image: "06 Berry pounds 21.png" },
  { id: "07", slug: "07-2140", title: "2140", image: "07 2140 21.png" },
  { id: "08", slug: "08-super-cyber-genius", title: "Super Cyber Genius", image: "08 Super cyber genius 21.png" },
  { id: "09", slug: "09-astral-pirate", title: "Astral Pirate", image: "09 Astral Pirate 21.png" },
  { id: "10", slug: "10-amanita", title: "Amanita", image: "10 Amanita 21.png" },
  { id: "11", slug: "11-buddha-infinite-love", title: "Buddha Infinite Love", image: "11 Buddha Infinite Love 2026 21.png" },
  { id: "12", slug: "12-flotilla", title: "Flotilla", image: "12 Flotilla 21.png" },
  { id: "13", slug: "13-immigration-climate", title: "Immigration Climate", image: "13 Immigration Climate 21.png" },
  { id: "14", slug: "14-cannabis", title: "Cannabis", image: "14 Cannabis 21 signed symmetrical v2 (slightly better).png" },
  { id: "15", slug: "15-palestine", title: "Palestine", image: "15 Palestine 21.png" },
  { id: "16", slug: "16-duality", title: "Duality", image: "16 Duality 21.png" },
  { id: "17", slug: "17-one-life", title: "One Life", image: "17 One life 21 signed.png" },
  { id: "18", slug: "18-kali", title: "Kali", image: "18 Kali.jpg" },
  { id: "19", slug: "19-love-police", title: "Love Police", image: "19 Love police.jpg" },
  { id: "20", slug: "20-white-rabbit", title: "White Rabbit", image: "20 White Rabbit.jpg" },
  { id: "21", slug: "21-pizza", title: "Pizza", image: "21 Pizza.jpg" },
  { id: "22", slug: "22-halving", title: "Halving", image: "22 Halving.jpg" },
  { id: "23", slug: "23-burn-banks", title: "Burn Banks", image: "23 Burn banks.jpg" },
  { id: "24", slug: "24-ultra-magic-hands-massage", title: "Ultra Magic Hands Massage", image: "24 Ultra magic hands massage 21.png" },
  { id: "25", slug: "25-gathering", title: "Gathering", image: "25-Gathering.jpg" },
  { id: "26", slug: "26-stonehenge", title: "Stonehenge", image: "26-Stonehenge.jpg" },
  { id: "27", slug: "27-ladies", title: "Ladies", image: "27-ladies-21.jpg" },
  { id: "28", slug: "28-breaking-free", title: "Breaking Free", image: "28-breaking-free.png" },
  { id: "29", slug: "29-hyperweavers", title: "Hyperweavers", image: "29-hyperweavers.png" },
  { id: "30", slug: "30-polska-better", title: "Polska Better", image: "30-polska-better.png" },
  { id: "31", slug: "31-cyber-shepherd", title: "Cyber Shepherd", image: "31-cyber-shepherd.png" },
  { id: "32", slug: "32-extra-life", title: "Extra Life", image: "32-extra-life-better-nooro-COOL.png" },
  { id: "33", slug: "33-bitcoin-film-fest", title: "Bitcoin Film Fest", image: "33-bitcoin-film-fest.png" },
  { id: "34", slug: "34-gaia-aura", title: "Gaia Aura", image: "34-gaia-aura.jpg" },
  { id: "35", slug: "35-2140-westminster", title: "2140 Westminster", image: "35-2140-westminster.png" },
  { id: "36", slug: "36-future-is-ours", title: "Future Is Ours", image: "36-future-is-ours.png" },
  { id: "37", slug: "37-pizza-new", title: "Pizza New", image: "37-pizza-new.png" },
  { id: "38", slug: "38-metacrisis", title: "Metacrisis", image: "38-metacrisis.png" },
  { id: "39", slug: "39-krakow", title: "Krakow", image: "39-krakow.png" },
  { id: "40", slug: "40-narrative-control", title: "Narrative Control", image: "40-narrative-control-FRESH-v4.png" }
];

const overview = "One design per family. No variants in the customer flow. Less decision fatigue, cleaner selling.";

function layout({ title, content, pageTitle, description, assetPrefix = "", homeHref = "index.html", basketHref = "investment-art/basket.html" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Bebas+Neue&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${assetPrefix}shop.css">
</head>
<body>
  <header class="shell">
    <div class="topbar">
      <a class="brand" href="${homeHref}">
        <span class="brand-mark">MF</span>
        <span>Money From The Future</span>
      </a>
      <nav>
        <a href="${homeHref}">All Works</a>
        <a href="${basketHref}">Basket <span data-basket-count>0</span></a>
      </nav>
    </div>
  </header>
  ${content}
  <footer class="shell">
    <div class="footer-bar">
      <span>${title}</span>
      <span>Canvas only. EUR 100. One design per family.</span>
    </div>
  </footer>
  <script src="${assetPrefix}shop.js"></script>
</body>
</html>`;
}

const shopCss = `:root {
  --bg: #f4ecde;
  --paper: rgba(255, 250, 242, 0.92);
  --ink: #111111;
  --muted: #635b50;
  --line: rgba(17, 17, 17, 0.14);
  --shadow: 0 22px 72px rgba(49, 33, 18, 0.12);
  --max: 1200px;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: "Space Grotesk", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(204, 91, 55, 0.12), transparent 28%),
    radial-gradient(circle at 85% 12%, rgba(12, 123, 103, 0.14), transparent 22%),
    linear-gradient(180deg, #fbf6ef 0%, var(--bg) 45%, #ede0cb 100%);
  min-height: 100vh;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.18;
  background-image:
    linear-gradient(rgba(17, 17, 17, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(17, 17, 17, 0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.9), transparent 88%);
}
a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; }
.shell { width: min(calc(100% - 2rem), var(--max)); margin: 0 auto; }
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.brand-mark, .button, .catalog-card, .hero-panel, .info-card, .product-image-stage, .product-panel, .product-note, .checkout-card, input, textarea { border-radius: 0; }
.brand-mark {
  width: 2.5rem;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  background: var(--ink);
  color: #fff7ea;
  font-family: "Bebas Neue", sans-serif;
  font-size: 1.3rem;
  box-shadow: var(--shadow);
}
nav { display: flex; align-items: center; gap: 1.3rem; color: var(--muted); font-size: 0.95rem; }
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0 1.15rem;
  border: 1px solid transparent;
  font: inherit;
  font-weight: 700;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
  cursor: pointer;
}
.button:hover { transform: translateY(-2px); }
.button-primary { background: var(--ink); color: #fff7ea; box-shadow: 0 16px 40px rgba(17, 17, 17, 0.18); }
.button-secondary { background: rgba(255, 255, 255, 0.54); border-color: var(--line); }
.eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.8rem;
  border: 1px solid var(--line);
  background: rgba(255, 251, 245, 0.72);
  color: var(--muted);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h1, h2, h3, p { margin: 0; }
h1, h2 { font-family: "Bebas Neue", sans-serif; line-height: 0.94; letter-spacing: 0.03em; }
h1 { font-size: clamp(4rem, 10vw, 8rem); }
h2 { font-size: clamp(2.6rem, 6vw, 4.8rem); }
.lead, .section-copy, .info-card p, .product-note p, .product-panel p, .checkout-card p, .checkout-note, label {
  color: var(--muted);
  line-height: 1.65;
}
.lead { font-size: 1.08rem; max-width: 42rem; margin: 1rem 0 1.6rem; }
.hero, .product-hero {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 2rem;
  align-items: center;
  padding: 3rem 0 4rem;
}
.hero-actions, .product-actions, .checkout-actions { display: flex; flex-wrap: wrap; gap: 0.85rem; }
.hero-panel, .info-card, .product-image-stage, .product-panel, .product-note, .checkout-card {
  background: var(--paper);
  border: 1px solid var(--line);
  box-shadow: 0 14px 44px rgba(42, 24, 8, 0.08);
}
.hero-panel, .product-image-stage { padding: 1rem; box-shadow: var(--shadow); }
.hero-panel-art, .catalog-image { aspect-ratio: 2 / 1; background-size: cover; background-position: center; }
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 2rem;
  margin-bottom: 1.5rem;
}
.section-copy { max-width: 38rem; }
.catalog-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.catalog-card { overflow: hidden; background: var(--paper); border: 1px solid var(--line); box-shadow: var(--shadow); }
.catalog-copy { padding: 1rem; display: grid; gap: 0.7rem; }
.catalog-row, .checkout-summary, .product-meta { display: flex; justify-content: space-between; align-items: end; gap: 1rem; }
.catalog-row h3 { font-size: 1.05rem; line-height: 1.2; }
.catalog-id, .meta-label { font-size: 0.82rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.price-tag, .checkout-price {
  font-family: "Bebas Neue", sans-serif;
  line-height: 0.9;
  letter-spacing: 0.03em;
  white-space: nowrap;
}
.price-tag { font-size: 2rem; }
.info-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.info-card { padding: 1.2rem; }
.info-card h3 { font-size: 1.08rem; margin-bottom: 0.5rem; }
.product-image-stage { display: grid; align-items: center; }
.product-image { width: 100%; height: auto; }
.product-panel { padding: 1.2rem; display: grid; gap: 1rem; }
.meta-block { display: grid; gap: 0.25rem; }
.meta-block strong, .summary-title { color: var(--ink); }
.product-note { padding: 1rem 1.2rem; }
.checkout-section { padding-bottom: 4rem; }
.checkout-card {
  background: linear-gradient(135deg, rgba(17, 17, 17, 0.96), rgba(12, 123, 103, 0.88));
  color: #fff7ea;
  box-shadow: var(--shadow);
  padding: 1.2rem;
}
.checkout-card p, .checkout-card label, .checkout-note { color: rgba(255, 247, 234, 0.78); }
.checkout-eyebrow {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 247, 234, 0.82);
  border-color: rgba(255, 255, 255, 0.16);
}
.checkout-grid { display: grid; gap: 1rem; margin-top: 1.2rem; }
.field { display: grid; gap: 0.45rem; }
input, textarea {
  width: 100%;
  border: 1px solid rgba(255, 247, 234, 0.28);
  background: rgba(255, 255, 255, 0.08);
  color: #fff7ea;
  padding: 0.85rem 0.95rem;
  font: inherit;
}
textarea { min-height: 8rem; resize: vertical; }
input::placeholder, textarea::placeholder { color: rgba(255, 247, 234, 0.52); }
.checkout-summary {
  padding: 0.9rem 0;
  border-top: 1px solid rgba(255, 247, 234, 0.16);
  border-bottom: 1px solid rgba(255, 247, 234, 0.16);
}
.checkout-price { font-size: 3rem; }
.paypal-button { background: #ffc439; color: #111111; border-color: #ffc439; }
.basket-section { padding-bottom: 4rem; }
.basket-layout {
  display: grid;
  grid-template-columns: 1fr 0.85fr;
  gap: 1rem;
  align-items: start;
}
.basket-panel {
  background: var(--paper);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  padding: 1.2rem;
}
.basket-items { display: grid; gap: 0.8rem; margin-top: 1rem; }
.basket-item {
  display: grid;
  grid-template-columns: minmax(7rem, 12rem) 1fr auto;
  gap: 1rem;
  align-items: center;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.42);
  padding: 0.75rem;
}
.basket-thumb {
  aspect-ratio: 2 / 1;
  background-size: cover;
  background-position: center;
  border: 1px solid var(--line);
}
.basket-copy { display: grid; gap: 0.35rem; }
.basket-copy h3 { font-size: 1rem; line-height: 1.2; }
.basket-copy span { color: var(--muted); }
.basket-remove {
  min-height: 2.5rem;
  padding: 0 0.8rem;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  font: inherit;
  cursor: pointer;
}
.basket-empty {
  border: 1px solid var(--line);
  color: var(--muted);
  padding: 1rem;
  line-height: 1.6;
}
.basket-total {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}
.basket-total strong {
  font-family: "Bebas Neue", sans-serif;
  font-size: 3rem;
  line-height: 0.9;
  letter-spacing: 0.03em;
}
.basket-status { color: var(--muted); line-height: 1.6; }
.button-quiet {
  background: transparent;
  border-color: var(--line);
  color: var(--ink);
}
.footer-bar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.3rem 0 3rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
  flex-wrap: wrap;
}
.reveal { opacity: 0; transform: translateY(18px); animation: rise 700ms ease forwards; }
.delay-0 { animation-delay: 0ms; }
.delay-1 { animation-delay: 100ms; }
.delay-2 { animation-delay: 200ms; }
.delay-3 { animation-delay: 300ms; }
.delay-4 { animation-delay: 400ms; }
.delay-5 { animation-delay: 500ms; }
@keyframes rise { to { opacity: 1; transform: translateY(0); } }
@media (max-width: 980px) {
  .hero, .product-hero, .info-grid, .basket-layout { grid-template-columns: 1fr; }
  .section-head { flex-direction: column; align-items: start; }
}
@media (max-width: 760px) {
  .topbar { flex-wrap: wrap; }
  nav { width: 100%; justify-content: space-between; overflow-x: auto; }
  .catalog-grid, .info-grid { grid-template-columns: 1fr; }
  h1 { font-size: clamp(3.6rem, 18vw, 5.8rem); }
  .checkout-summary, .catalog-row, .product-meta, .basket-total { flex-direction: column; align-items: start; }
  .basket-item { grid-template-columns: 1fr; }
  .footer-bar { flex-direction: column; }
}`;

const shopJs = `const BASKET_KEY = "mftf:investment-art:basket:v1";
const UNIT_PRICE = 100;
const CURRENCY = "EUR";

function readBasket() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BASKET_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(function(item) {
      return item && item.slug && item.title;
    }) : [];
  } catch (error) {
    return [];
  }
}

function writeBasket(items) {
  localStorage.setItem(BASKET_KEY, JSON.stringify(items));
  updateBasketCount();
}

function totalFor(items) {
  return items.length * UNIT_PRICE;
}

function updateBasketCount() {
  const count = readBasket().length;
  document.querySelectorAll("[data-basket-count]").forEach(function(node) {
    node.textContent = String(count);
  });
}

function addToBasket(item) {
  const items = readBasket();
  const exists = items.some(function(existing) {
    return existing.slug === item.slug;
  });
  if (!exists) {
    items.push(item);
    writeBasket(items);
  }
  return !exists;
}

function removeFromBasket(slug) {
  writeBasket(readBasket().filter(function(item) {
    return item.slug !== slug;
  }));
  renderBasketPage();
}

function buildOrderBody(items) {
  const email = document.getElementById("email");
  const address = document.getElementById("address");
  const itemLines = items.map(function(item, index) {
    return String(index + 1) + ". " + item.title + " - " + CURRENCY + " " + UNIT_PRICE;
  }).join("\\n");

  return "Artworks:\\n" + itemLines + "\\n\\n" +
    "Total: " + CURRENCY + " " + totalFor(items) + "\\n" +
    "Buyer email: " + ((email && email.value.trim()) || "[buyer email]") + "\\n" +
    "Shipping address:\\n" + ((address && address.value.trim()) || "[shipping address]") + "\\n\\n" +
    "Payment status: Paid via PayPal";
}

function updateCheckoutLinks(items) {
  const paypalLink = document.getElementById("paypal-link");
  const emailLink = document.getElementById("email-link");
  const total = totalFor(items);

  if (paypalLink) {
    paypalLink.href = items.length > 0
      ? "https://www.paypal.com/paypalme/moneyfromthefuture/" + total + CURRENCY
      : "#";
    paypalLink.textContent = items.length > 0
      ? "Pay " + CURRENCY + " " + total + " With PayPal"
      : "Basket Is Empty";
  }

  if (emailLink) {
    if (items.length === 0) {
      emailLink.href = "#";
      emailLink.textContent = "Add Designs First";
    } else {
      const subject = encodeURIComponent("Canvas order - " + items.length + " design" + (items.length === 1 ? "" : "s"));
      const body = encodeURIComponent(buildOrderBody(items));
      emailLink.href = "mailto:hello@moneyfromthefuture.com?subject=" + subject + "&body=" + body;
      emailLink.textContent = "Forward Order Details";
    }
  }
}

function renderBasketPage() {
  const basketItems = document.getElementById("basket-items");
  if (!basketItems) return;

  const items = readBasket();
  const totalNode = document.getElementById("basket-total");
  const summaryNode = document.getElementById("basket-summary");

  basketItems.textContent = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "basket-empty";
    empty.textContent = "Your basket is empty. Add a design from any artwork page.";
    basketItems.append(empty);
  } else {
    items.forEach(function(item) {
      const row = document.createElement("article");
      row.className = "basket-item";

      const thumb = document.createElement("div");
      thumb.className = "basket-thumb";
      thumb.style.backgroundImage = "url('" + item.image + "')";

      const copy = document.createElement("div");
      copy.className = "basket-copy";

      const title = document.createElement("h3");
      title.textContent = item.title;

      const price = document.createElement("span");
      price.textContent = CURRENCY + " " + UNIT_PRICE;

      const remove = document.createElement("button");
      remove.className = "basket-remove";
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", function() {
        removeFromBasket(item.slug);
      });

      copy.append(title, price);
      row.append(thumb, copy, remove);
      basketItems.append(row);
    });
  }

  if (totalNode) totalNode.textContent = CURRENCY + " " + totalFor(items);
  if (summaryNode) {
    summaryNode.textContent = items.length + " design" + (items.length === 1 ? "" : "s") + " in basket";
  }
  updateCheckoutLinks(items);
}

document.querySelectorAll("[data-add-to-basket]").forEach(function(button) {
  button.addEventListener("click", function() {
    const item = {
      id: button.dataset.id,
      slug: button.dataset.slug,
      title: button.dataset.title,
      image: button.dataset.image,
      price: UNIT_PRICE
    };
    const added = addToBasket(item);
    const status = document.querySelector("[data-basket-status]");
    if (status) {
      status.textContent = added
        ? item.title + " added to basket."
        : item.title + " is already in the basket.";
    }
  });
});

const clearBasketButton = document.getElementById("clear-basket");
if (clearBasketButton) {
  clearBasketButton.addEventListener("click", function() {
    writeBasket([]);
    renderBasketPage();
  });
}

["email", "address"].forEach(function(id) {
  const field = document.getElementById(id);
  if (field) {
    field.addEventListener("input", function() {
      updateCheckoutLinks(readBasket());
    });
  }
});

updateBasketCount();
renderBasketPage();`;

for (const artwork of artworks) {
  await fs.access(path.join(imageDir, artwork.image));
}

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "shop.css"), shopCss);
await fs.writeFile(path.join(outputDir, "shop.js"), shopJs);

const indexCards = artworks.map((artwork, index) => `
      <a class="catalog-card reveal delay-${Math.min(index % 6, 5)}" href="investment-art/${artwork.slug}.html">
        <div class="catalog-image" style="background-image: url('images/${artwork.image.replace(/'/g, "\\'")}');"></div>
        <div class="catalog-copy">
          <span class="catalog-id">${artwork.id}</span>
          <div class="catalog-row">
            <h3>${artwork.title}</h3>
            <span class="price-tag">EUR 100</span>
          </div>
        </div>
      </a>`).join("");

const indexHtml = layout({
  title: "Money From The Future Canvas Shop",
  pageTitle: "Money From The Future Canvas Shop",
  description: "Money From The Future canvas catalog. One artwork page per family, 100 euro per piece.",
  assetPrefix: "investment-art/",
  content: `
  <main id="top">
    <section class="shell hero hero-home">
      <div>
        <span class="eyebrow reveal">40 Artwork Families</span>
        <h1 class="reveal delay-1">One Design Per Family. Less Decision Fatigue.</h1>
        <p class="lead reveal delay-2">
          ${overview} Browse the catalog, open an artwork page, and buy the piece you want for <strong>EUR 100</strong>.
        </p>
        <div class="hero-actions reveal delay-3">
          <a class="button button-primary" href="#catalog">Browse Catalog</a>
        </div>
      </div>
      <div class="hero-panel reveal delay-2">
        <div class="hero-panel-art" style="background-image: url('images/36-future-is-ours.png');"></div>
      </div>
    </section>
    <section class="shell" id="catalog">
      <div class="section-head">
        <div>
          <span class="eyebrow">Catalog</span>
          <h2>Pick The Work, Then Open The Product Page.</h2>
        </div>
        <div class="section-copy">
          Every card leads to a dedicated page for that artwork family. No variants, no branching choices, no clutter.
        </div>
      </div>
      <div class="catalog-grid">
${indexCards}
      </div>
    </section>
    <section class="shell" id="how">
      <div class="section-head">
        <div>
          <span class="eyebrow">How To Buy</span>
          <h2>Open The Work. Add Designs. Checkout Once.</h2>
        </div>
      </div>
      <div class="info-grid">
        <article class="info-card reveal">
          <h3>1. Choose the artwork family</h3>
          <p>Each piece gets one product page and one basket action.</p>
        </article>
        <article class="info-card reveal delay-1">
          <h3>2. Pay EUR 100</h3>
          <p>The basket persists across artwork pages with local storage.</p>
        </article>
        <article class="info-card reveal delay-2">
          <h3>3. Forward your details</h3>
          <p>Pay for all selected designs and forward one order email.</p>
        </article>
      </div>
    </section>
  </main>`
});

await fs.writeFile(path.join(repoDir, "index.html"), indexHtml);

const basketHtml = layout({
  title: "Basket",
  pageTitle: "Basket | Money From The Future",
  description: "Review selected Money From The Future canvas designs and checkout with PayPal.",
  homeHref: "../index.html",
  basketHref: "basket.html",
  content: `
  <main>
    <section class="shell hero">
      <div>
        <span class="eyebrow reveal">Basket</span>
        <h1 class="reveal delay-1">Checkout Multiple Designs Together.</h1>
        <p class="lead reveal delay-2">
          Your selected canvas designs are saved in this browser. Review the basket, pay the total with PayPal, then forward the order details.
        </p>
        <div class="hero-actions reveal delay-3">
          <a class="button button-primary" href="../index.html">Add More Designs</a>
          <button class="button button-secondary" type="button" id="clear-basket">Clear Basket</button>
        </div>
      </div>
      <div class="hero-panel reveal delay-2">
        <div class="hero-panel-art" style="background-image: url('../images/36-future-is-ours.png');"></div>
      </div>
    </section>

    <section class="shell basket-section">
      <div class="basket-layout">
        <div class="basket-panel reveal">
          <span class="eyebrow">Selected Works</span>
          <div id="basket-items" class="basket-items"></div>
          <div class="basket-total">
            <span id="basket-summary">0 designs in basket</span>
            <strong id="basket-total">EUR 0</strong>
          </div>
        </div>

        <div class="checkout-card reveal delay-1">
          <span class="eyebrow checkout-eyebrow">Checkout</span>
          <h2>Pay With PayPal, Then Forward The Order.</h2>
          <p>Use PayPal for the basket total, then send the email and full shipping address in one field.</p>
          <div class="checkout-grid">
            <div class="field">
              <label for="email">Email</label>
              <input id="email" name="email" type="text" inputmode="email" placeholder="you@example.com" required>
            </div>
            <div class="field">
              <label for="address">Address</label>
              <textarea id="address" name="address" placeholder="Full shipping address" required></textarea>
            </div>
            <div class="checkout-actions">
              <a id="paypal-link" class="button paypal-button" href="#">Basket Is Empty</a>
              <a id="email-link" class="button button-secondary" href="mailto:hello@moneyfromthefuture.com">Forward Order Details</a>
            </div>
            <p class="checkout-note">After payment, use the second button to forward the selected designs, buyer email, shipping address, and total.</p>
          </div>
        </div>
      </div>
    </section>
  </main>`
});

await fs.writeFile(path.join(outputDir, "basket.html"), basketHtml);

for (const artwork of artworks) {
  const pageHtml = layout({
    title: artwork.title,
    pageTitle: `${artwork.title} | Money From The Future`,
    description: `${artwork.title} canvas print from Money From The Future. 100 euro per piece.`,
    homeHref: "../index.html",
    basketHref: "basket.html",
    content: `
  <main>
    <section class="shell product-hero">
      <div class="product-image-stage reveal">
        <img class="product-image" src="../images/${artwork.image.replace(/"/g, "&quot;")}" alt="${artwork.title}">
      </div>
      <div class="product-panel reveal delay-1">
        <span class="eyebrow">${artwork.id}</span>
        <h1>${artwork.title}</h1>
        <p class="lead">
          Canvas print from Money From The Future. One selected design for this artwork family, priced at <strong>EUR 100</strong>.
        </p>
        <div class="product-meta">
          <div class="meta-block">
            <span class="meta-label">Format</span>
            <strong>Canvas Print</strong>
          </div>
          <div class="meta-block">
            <span class="meta-label">Price</span>
            <strong>EUR 100</strong>
          </div>
        </div>
        <div class="product-actions">
          <button
            class="button button-primary"
            type="button"
            data-add-to-basket
            data-id="${artwork.id}"
            data-slug="${artwork.slug}"
            data-title="${artwork.title}"
            data-image="../images/${artwork.image.replace(/"/g, "&quot;")}"
          >Add To Basket</button>
          <a class="button button-secondary" href="basket.html">View Basket (<span data-basket-count>0</span>)</a>
          <a class="button button-secondary" href="../images/${artwork.image.replace(/"/g, "&quot;")}">Open Original File</a>
        </div>
      </div>
    </section>
    <section class="shell">
      <div class="product-note reveal">
        <p data-basket-status>${overview}</p>
      </div>
    </section>
  </main>`
  });

  await fs.writeFile(path.join(outputDir, `${artwork.slug}.html`), pageHtml);
}
