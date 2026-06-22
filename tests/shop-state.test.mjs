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
  normalizeItem,
  removeItemFromBasket,
  setItemQuantity,
  extractDeliveryFromPayPal
} from "../shop-state.mjs";

const PAYPAL_CAPTURE = {
  id: "ORDER123",
  payer: {
    name: { given_name: "Ada", surname: "Lovelace" },
    email_address: "ada@example.com"
  },
  purchase_units: [{
    shipping: {
      name: { full_name: "Ada Lovelace" },
      address: {
        address_line_1: "1 Market Street",
        address_line_2: "Flat 2",
        admin_area_2: "London",
        admin_area_1: "Greater London",
        postal_code: "E1 6AN",
        country_code: "GB"
      }
    }
  }]
};

test("extract delivery maps PayPal name, email and address", () => {
  const d = extractDeliveryFromPayPal(PAYPAL_CAPTURE);
  assert.equal(d.name, "Ada Lovelace");
  assert.equal(d.email, "ada@example.com");
  assert.equal(d.streetAddress, "1 Market Street, Flat 2");
  assert.equal(d.city, "London");
  assert.equal(d.postcode, "E1 6AN");
  assert.equal(d.country, "GB");
});

test("extract delivery falls back to payer name when shipping name absent", () => {
  const d = extractDeliveryFromPayPal({
    payer: { name: { given_name: "Grace", surname: "Hopper" } },
    purchase_units: [{ shipping: { address: { address_line_1: "5 Navy Yard" } } }]
  });
  assert.equal(d.name, "Grace Hopper");
  assert.equal(d.streetAddress, "5 Navy Yard");
});

test("extract delivery is safe on empty or malformed input", () => {
  for (const input of [undefined, null, {}, { purchase_units: [] }]) {
    const d = extractDeliveryFromPayPal(input);
    assert.deepEqual(d, { name: "", email: "", streetAddress: "", city: "", postcode: "", country: "" });
  }
});

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

test("set item quantity updates a single line", () => {
  const basket = setItemQuantity([{ slug: "alpha", price: 100, quantity: 1 }], "alpha", 3);
  assert.equal(basket[0].quantity, 3);
});

test("set item quantity to zero removes the line", () => {
  const basket = setItemQuantity([{ slug: "alpha", price: 100, quantity: 2 }], "alpha", 0);
  assert.equal(basket.length, 0);
});

test("set item quantity ignores an unknown slug", () => {
  const basket = setItemQuantity([{ slug: "alpha", price: 100, quantity: 2 }], "beta", 5);
  assert.equal(basket[0].quantity, 2);
});

test("remove item from basket drops the matching slug", () => {
  const basket = removeItemFromBasket(
    [{ slug: "alpha", price: 100, quantity: 1 }, { slug: "beta", price: 100, quantity: 1 }],
    "alpha"
  );
  assert.equal(basket.length, 1);
  assert.equal(basket[0].slug, "beta");
});
