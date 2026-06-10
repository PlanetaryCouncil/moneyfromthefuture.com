import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_ITEM_PRICE,
  addItemToBasket,
  buildCheckoutMessage,
  getBasketCount,
  getBasketSummaryText,
  getBasketTotal,
  getItemPrice,
  getOrderLines,
  isValidSuccessSnapshot,
  normalizeBasket,
  normalizeItem
} from "../shop-state.mjs";

test("default item price falls back to default", () => {
  assert.equal(getItemPrice({}), DEFAULT_ITEM_PRICE);
});

test("explicit item price is preserved", () => {
  assert.equal(getItemPrice({ price: 1 }), 1);
});

test("normalize item uses slug", () => {
  const item = normalizeItem({ slug: "alpha", title: "Alpha" });
  assert.equal(item.slug, "alpha");
});

test("normalize item falls back to id when slug missing", () => {
  const item = normalizeItem({ id: "alpha", title: "Alpha" });
  assert.equal(item.slug, "alpha");
});

test("normalize item rejects missing slug and id", () => {
  assert.equal(normalizeItem({ title: "Alpha" }), null);
});

test("normalize item enforces minimum quantity of one", () => {
  const item = normalizeItem({ slug: "alpha", quantity: 0 });
  assert.equal(item.quantity, 1);
});

test("normalize item accepts quantity override", () => {
  const item = normalizeItem({ slug: "alpha", quantity: 1 }, 3);
  assert.equal(item.quantity, 3);
});

test("normalize basket returns empty array for non-array input", () => {
  assert.deepEqual(normalizeBasket(null), []);
});

test("normalize basket filters invalid items", () => {
  const basket = normalizeBasket([{ slug: "a" }, { title: "broken" }]);
  assert.equal(basket.length, 1);
});

test("basket count sums quantities", () => {
  const basket = normalizeBasket([
    { slug: "a", quantity: 2 },
    { slug: "b", quantity: 3 }
  ]);
  assert.equal(getBasketCount(basket), 5);
});

test("basket total multiplies quantity and price", () => {
  const basket = normalizeBasket([
    { slug: "a", quantity: 2, price: 100 },
    { slug: "b", quantity: 1, price: 1 }
  ]);
  assert.equal(getBasketTotal(basket), 201);
});

test("basket summary uses singular print", () => {
  const basket = normalizeBasket([{ slug: "a", quantity: 1, price: 100 }]);
  assert.equal(getBasketSummaryText(basket), "1 print - EUR 100");
});

test("basket summary uses plural prints", () => {
  const basket = normalizeBasket([{ slug: "a", quantity: 2, price: 100 }]);
  assert.equal(getBasketSummaryText(basket), "2 prints - EUR 200");
});

test("order lines include title slug unit price and subtotal", () => {
  const basket = normalizeBasket([{ slug: "alpha", title: "Alpha", quantity: 2, price: 100 }]);
  assert.deepEqual(getOrderLines(basket), [
    "2 x Alpha (alpha) - EUR 100 each - EUR 200 total"
  ]);
});

test("adding first item creates new basket entry", () => {
  const basket = addItemToBasket([], { slug: "alpha", title: "Alpha", price: 100 }, 1);
  assert.equal(basket.length, 1);
  assert.equal(basket[0].quantity, 1);
});

test("adding same item increments quantity", () => {
  const start = normalizeBasket([{ slug: "alpha", title: "Alpha", quantity: 1, price: 100 }]);
  const basket = addItemToBasket(start, { slug: "alpha", title: "Alpha", price: 100 }, 2);
  assert.equal(basket.length, 1);
  assert.equal(basket[0].quantity, 3);
});

test("adding different item preserves separate entries", () => {
  const start = normalizeBasket([{ slug: "alpha", title: "Alpha", quantity: 1, price: 100 }]);
  const basket = addItemToBasket(start, { slug: "beta", title: "Beta", price: 100 }, 1);
  assert.equal(basket.length, 2);
});

test("adding invalid item leaves basket unchanged", () => {
  const start = normalizeBasket([{ slug: "alpha", title: "Alpha", quantity: 1, price: 100 }]);
  const basket = addItemToBasket(start, { title: "Broken" }, 1);
  assert.deepEqual(basket, start);
});

test("success snapshot is valid for non-empty basket", () => {
  assert.equal(isValidSuccessSnapshot([{ slug: "alpha", quantity: 1 }]), true);
});

test("success snapshot is invalid for empty basket", () => {
  assert.equal(isValidSuccessSnapshot([]), false);
});

test("success snapshot is invalid for malformed basket", () => {
  assert.equal(isValidSuccessSnapshot([{ title: "Broken" }]), false);
});

test("checkout message includes summary and buyer details", () => {
  const basket = normalizeBasket([{ slug: "alpha", title: "Alpha", quantity: 1, price: 100 }]);
  const message = buildCheckoutMessage(basket, {
    name: "Ada",
    email: "ada@example.com",
    streetAddress: "1 Market Street",
    city: "London",
    postcode: "E1",
    country: "UK"
  });

  assert.match(message, /Basket summary:/);
  assert.match(message, /1 x Alpha \(alpha\)/);
  assert.match(message, /Name: Ada/);
  assert.match(message, /Email: ada@example.com/);
  assert.match(message, /Street address: 1 Market Street/);
  assert.match(message, /Total: EUR 100/);
});

test("checkout message handles empty basket explicitly", () => {
  const message = buildCheckoutMessage([], {});
  assert.match(message, /\[empty basket\]/);
});

test("normalize basket preserves explicit image", () => {
  const basket = normalizeBasket([{ slug: "alpha", image: "/images/a.jpg" }]);
  assert.equal(basket[0].image, "/images/a.jpg");
});

test("normalize item trims slug and title", () => {
  const item = normalizeItem({ slug: " alpha ", title: " Alpha " });
  assert.equal(item.slug, "alpha");
  assert.equal(item.title, "Alpha");
});

test("basket total supports mixed prices", () => {
  const basket = normalizeBasket([
    { slug: "alpha", quantity: 2, price: 100 },
    { slug: "beta", quantity: 3, price: 1 }
  ]);
  assert.equal(getBasketTotal(basket), 203);
});
