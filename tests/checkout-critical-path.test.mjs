// Critical path of the shop: the chain that actually takes money and produces
// an order email. If any link here breaks, the business breaks — so this test
// walks the whole pipeline using the same pure functions shop.js uses at runtime.
import test from "node:test";
import assert from "node:assert/strict";

import {
  addItemToBasket,
  getBasketTotal,
  getBasketCount,
  isValidSuccessSnapshot,
  extractDeliveryFromPayPal,
  buildCheckoutMessage
} from "../shop-state.mjs";

// A representative PayPal Orders v2 capture (payer + shipping), as onApprove receives.
const PAYPAL_CAPTURE = {
  id: "5O190127TN364715T",
  status: "COMPLETED",
  payer: {
    name: { given_name: "Ada", surname: "Lovelace" },
    email_address: "ada@example.com"
  },
  purchase_units: [{
    shipping: {
      name: { full_name: "Ada Lovelace" },
      address: {
        address_line_1: "12 Marylebone Road",
        admin_area_2: "London",
        postal_code: "NW1 5JD",
        country_code: "GB"
      }
    }
  }]
};

test("critical path: catalog add → basket → PayPal amount → capture → order email", () => {
  // 1. Buyer adds two designs (one twice) to an empty basket.
  let basket = addItemToBasket([], { slug: "01-the-boss", title: "The Boss", image: "/images/01 The Boss WEB.jpg", price: 100 }, 2);
  basket = addItemToBasket(basket, { slug: "04-poseidon", title: "Poseidon", image: "/images/04-Poseidon-21-WEB.jpg", price: 100 }, 1);

  assert.equal(getBasketCount(basket), 3, "three prints in basket");

  // 2. PayPal is charged the basket total (the exact value createOrder sends).
  const total = getBasketTotal(basket);
  assert.equal(total, 300);
  assert.equal(total.toFixed(2), "300.00");

  // 3. A non-empty basket is a valid success snapshot (gates the success screen).
  assert.equal(isValidSuccessSnapshot(basket), true);

  // 4. On capture, delivery details come from PayPal — buyer never re-typed them.
  const delivery = extractDeliveryFromPayPal(PAYPAL_CAPTURE);
  assert.equal(delivery.name, "Ada Lovelace");
  assert.equal(delivery.email, "ada@example.com");
  assert.equal(delivery.city, "London");

  // 5. The exact text forwarded to Formspree carries items, buyer, address, total, status.
  const message = buildCheckoutMessage(basket, delivery, "Paid via PayPal");
  assert.match(message, /2 x The Boss \(01-the-boss\)/);
  assert.match(message, /1 x Poseidon \(04-poseidon\)/);
  assert.match(message, /Name: Ada Lovelace/);
  assert.match(message, /Email: ada@example\.com/);
  assert.match(message, /Street address: 12 Marylebone Road/);
  assert.match(message, /Postcode: NW1 5JD/);
  assert.match(message, /Total: EUR 300/);
  assert.match(message, /Payment status: Paid via PayPal/);
});

test("critical path: an empty basket cannot reach a chargeable order", () => {
  // PayPal button stays disabled at a zero total, and the success screen is gated.
  assert.equal(getBasketTotal([]), 0);
  assert.equal(isValidSuccessSnapshot([]), false);
});

test("critical path: quantities multiply the charged total correctly", () => {
  const basket = addItemToBasket([], { slug: "07-2140", title: "2140", price: 100 }, 4);
  assert.equal(getBasketTotal(basket), 400);
  assert.equal(getBasketTotal(basket).toFixed(2), "400.00");
});
