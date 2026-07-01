import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const defaultLayout = read("_layouts/default.html");
const artworkLayout = read("_layouts/artwork.html");
const basket = read("investment-art/basket.html");
const artViewer = read("art-viewer.js");
const shopScript = read("shop.js");

// ---- header ----
const header = defaultLayout.match(/<header[\s\S]*?<\/header>/)[0];

test("header keeps the basket link with a live count", () => {
  assert.match(header, /basket-nav-link/);
  assert.match(header, /data-basket-count/);
  assert.match(header, /basket-nav-dot/);
});

test("header exposes the currency selector", () => {
  assert.match(header, /data-currency-select/);
  for (const code of ["USD", "EUR", "GBP"]) {
    assert.match(header, new RegExp(`<option value="${code}">${code}</option>`));
  }
});

test("header no longer carries the About/Policies/Social/Blog nav links", () => {
  for (const label of ["About Us", "Policies", "Social", "Blog"]) {
    assert.doesNotMatch(header, new RegExp(`>${label}<`), `header still links to ${label}`);
  }
});

// ---- footer social (first-class) ----
test("footer lists all five social channels with icons", () => {
  const footer = defaultLayout.match(/<footer[\s\S]*?<\/footer>/)[0];
  for (const href of [
    "twitter.com/moneyFromThe",
    "t.me/moneyFTF",
    "instagram.com/moneyfromthefuture",
    "tiktok.com/@marsrobertson",
    "primal.net/p/nprofile"
  ]) {
    assert.ok(footer.includes(href), `footer missing social link ${href}`);
  }
  const icons = footer.match(/class="social-icon"/g) || [];
  assert.equal(icons.length, 5, "expected 5 inline social icons");
});

test("footer nav has About/Policies/Blog but not Social", () => {
  const footerNav = defaultLayout.match(/<nav class="footer-nav"[\s\S]*?<\/nav>/)[0];
  assert.match(footerNav, />About Us</);
  assert.match(footerNav, />Policies</);
  assert.match(footerNav, />Blog</);
  assert.doesNotMatch(footerNav, />Social</);
});

test("default layout loads the shop script as a module", () => {
  assert.match(defaultLayout, /<script type="module"[^>]*shop\.js/);
});

// ---- artwork page ----
test("artwork page wires the 3D viewer with progressive textures", () => {
  assert.match(artworkLayout, /id="ppc-wrap"/);
  assert.match(artworkLayout, /data-art-texture=/);
  assert.match(artworkLayout, /data-art-preview=/);
  assert.match(artworkLayout, /three\.min\.js/);
  assert.match(artworkLayout, /art-viewer\.js/);
});

test("artwork page has side prev/next pager arrows", () => {
  assert.match(artworkLayout, /class="artwork-pager"/);
  assert.match(artworkLayout, /pager-prev/);
  assert.match(artworkLayout, /pager-next/);
});

test("artwork page add-to-basket button carries all dataset fields", () => {
  for (const attr of ["data-add-to-basket", "data-id=", "data-slug=", "data-title=", "data-image=", "data-price="]) {
    assert.ok(artworkLayout.includes(attr), `artwork layout missing ${attr}`);
  }
});

test("artwork page prefers description_ai_v2 and renders it through markdownify", () => {
  assert.match(artworkLayout, /assign artwork_description = page\.description_ai_v2 \| default: page\.description_ai/);
  assert.match(artworkLayout, /artwork_description \| markdownify/);
  assert.match(defaultLayout, /page\.description_ai_v2 \| default: page\.description_ai/);
});

// ---- basket / checkout ----
test("basket posts to the real Formspree form, not the placeholder", () => {
  assert.match(basket, /formspree\.io\/f\/mzdqwgby/);
  assert.doesNotMatch(basket, /formspree\.io\/f\/email@/);
});

test("basket delivery fields are hidden carriers (captured from PayPal)", () => {
  for (const id of ["name", "email", "street-address", "city", "postcode", "country"]) {
    assert.match(basket, new RegExp(`id="${id}"[^>]*type="hidden"`), `${id} should be a hidden field`);
  }
});

test("basket has the PayPal container and order status hooks", () => {
  assert.match(basket, /id="paypal-button-container"/);
  assert.match(basket, /data-paypal-client-id=/);
  assert.match(basket, /data-order-status/);
});

test("success state explains why the visible basket is empty", () => {
  assert.match(shopScript, /Basket cleared after payment\./);
});

// ---- art viewer behaviour ----
test("art-viewer loads preview first then upgrades to full-res", () => {
  assert.match(artViewer, /data-art-texture/);
  assert.match(artViewer, /data-art-preview/);
  assert.match(artViewer, /PREVIEW/);
  assert.match(artViewer, /FULL/);
});

test("art-viewer guards on WebGL and THREE availability", () => {
  assert.match(artViewer, /WebGL/i);
  assert.match(artViewer, /typeof THREE/);
});

test("shop script forwards the order to Formspree over fetch", () => {
  assert.match(shopScript, /function sendOrderEmail/);
  assert.match(shopScript, /fetch\(orderForm\.action/);
  assert.match(shopScript, /extractDeliveryFromPayPal/);
});

test("footer has the newsletter / contact form wired to Formspree", () => {
  assert.match(defaultLayout, /id="newsletter-form"/);
  assert.match(defaultLayout, /action="\{\{ site\.newsletter_form_url \}\}"/);
  assert.match(defaultLayout, /name="email"[^>]*type="email"|type="email"[^>]*name="email"/);
  assert.match(defaultLayout, /name="message"/); // optional contact message
  assert.match(defaultLayout, /name="_gotcha"/); // spam honeypot
});

test("shop script wires the newsletter submit handler", () => {
  assert.match(shopScript, /function initNewsletter/);
  assert.match(shopScript, /initNewsletter\(\)/);
});
