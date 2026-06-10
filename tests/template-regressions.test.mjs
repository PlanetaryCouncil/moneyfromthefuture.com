import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const basketHtml = fs.readFileSync("/Users/m/Code/moneyfromthefuture.com/investment-art/basket.html", "utf8");
const defaultLayout = fs.readFileSync("/Users/m/Code/moneyfromthefuture.com/_layouts/default.html", "utf8");
const indexHtml = fs.readFileSync("/Users/m/Code/moneyfromthefuture.com/index.html", "utf8");
const shopJs = fs.readFileSync("/Users/m/Code/moneyfromthefuture.com/shop.js", "utf8");

test("basket success UI is stored in a template, not rendered directly", () => {
  assert.match(basketHtml, /<template id="payment-success-template">/);
});

test("basket page has a dormant success host", () => {
  assert.match(basketHtml, /<div id="payment-success-host" hidden><\/div>/);
});

test("basket page no longer contains a direct payment-success-screen section", () => {
  assert.doesNotMatch(basketHtml, /<section id="payment-success-screen"/);
});

test("default layout loads shop script as a module", () => {
  assert.match(defaultLayout, /<script type="module" src="{{ '\/shop\.js' \| relative_url }}"><\/script>/);
});

test("homepage tiles use real image tags", () => {
  assert.match(indexHtml, /<img class="catalog-image" src="{{ '\/images\/' \| append: preview_image \| relative_url }}"/);
});

test("homepage no longer contains a view button", () => {
  assert.doesNotMatch(indexHtml, />View</);
});

test("homepage still contains plus add-to-basket button", () => {
  assert.match(indexHtml, /class="button catalog-add-button"/);
});

test("shop script imports pure shop state module", () => {
  assert.match(shopJs, /from "\.\/shop-state\.mjs"/);
});

test("shop script defines one-shot success payload storage key", () => {
  assert.match(shopJs, /SUCCESS_PAYLOAD_KEY/);
});

test("shop script contains simulated success shortcut", () => {
  assert.match(shopJs, /shortcutBuffer === "ddd"/);
});
