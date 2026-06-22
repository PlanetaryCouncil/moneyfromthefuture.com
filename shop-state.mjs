export const DEFAULT_ITEM_PRICE = 100;

function toPositiveInteger(value, fallback = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  const integer = Math.floor(number);
  return integer > 0 ? integer : fallback;
}

export function getItemPrice(item) {
  const price = Number(item?.price);
  return Number.isFinite(price) ? price : DEFAULT_ITEM_PRICE;
}

export function normalizeItem(item, quantityOverride) {
  if (!item || typeof item !== "object") return null;
  const slug = String(item.slug || item.id || "").trim();
  const title = String(item.title || "Canvas print").trim();

  if (!slug) return null;

  return {
    id: String(item.id || slug),
    slug,
    title,
    image: String(item.image || "").trim(),
    price: getItemPrice(item),
    quantity: toPositiveInteger(
      quantityOverride === undefined ? item.quantity : quantityOverride,
      1
    )
  };
}

export function normalizeBasket(basket) {
  if (!Array.isArray(basket)) return [];
  return basket
    .map((item) => normalizeItem(item))
    .filter(Boolean);
}

export function getBasketCount(basket) {
  return normalizeBasket(basket).reduce((total, item) => total + item.quantity, 0);
}

export function getBasketTotal(basket) {
  return normalizeBasket(basket).reduce((total, item) => total + (item.quantity * item.price), 0);
}

export function getBasketSummaryText(basket) {
  const normalizedBasket = normalizeBasket(basket);
  const count = getBasketCount(normalizedBasket);
  const total = getBasketTotal(normalizedBasket);
  return `${count} ${count === 1 ? "print" : "prints"} - EUR ${total}`;
}

export function getOrderLines(basket) {
  return normalizeBasket(basket).map((item) => {
    const subtotal = item.quantity * item.price;
    return `${item.quantity} x ${item.title} (${item.slug}) - EUR ${item.price} each - EUR ${subtotal} total`;
  });
}

export function addItemToBasket(basket, item, quantity = 1) {
  const normalizedBasket = normalizeBasket(basket);
  const normalizedItem = normalizeItem(item, quantity);

  if (!normalizedItem) return normalizedBasket;

  const nextBasket = normalizedBasket.map((entry) => ({ ...entry }));
  const existing = nextBasket.find((entry) => entry.slug === normalizedItem.slug);

  if (existing) {
    existing.quantity += normalizedItem.quantity;
    return nextBasket;
  }

  nextBasket.push(normalizedItem);
  return nextBasket;
}

export function setItemQuantity(basket, slug, quantity) {
  const normalizedBasket = normalizeBasket(basket);
  const target = String(slug || "").trim();
  const qty = Math.floor(Number(quantity));

  // Quantity at or below zero removes the line entirely.
  if (!Number.isFinite(qty) || qty <= 0) {
    return normalizedBasket.filter((entry) => entry.slug !== target);
  }

  return normalizedBasket.map((entry) =>
    entry.slug === target ? { ...entry, quantity: qty } : entry
  );
}

export function removeItemFromBasket(basket, slug) {
  const target = String(slug || "").trim();
  return normalizeBasket(basket).filter((entry) => entry.slug !== target);
}

// Map a PayPal Orders v2 capture into our delivery-detail shape, so the buyer
// never re-types what PayPal already collected. Pure + unit-testable.
export function extractDeliveryFromPayPal(details) {
  const payer = (details && details.payer) || {};
  const unit = (details && Array.isArray(details.purchase_units) && details.purchase_units[0]) || {};
  const shipping = unit.shipping || {};
  const address = shipping.address || {};
  const payerName = payer.name || {};
  const fullName = (shipping.name && shipping.name.full_name)
    || [payerName.given_name, payerName.surname].filter(Boolean).join(" ");

  return {
    name: fullName || "",
    email: payer.email_address || "",
    streetAddress: [address.address_line_1, address.address_line_2].filter(Boolean).join(", "),
    city: address.admin_area_2 || "",
    postcode: address.postal_code || "",
    country: address.country_code || ""
  };
}

export function isValidSuccessSnapshot(snapshot) {
  return normalizeBasket(snapshot).length > 0;
}

export function buildCheckoutMessage(basket, details, paymentStatus = "Paid via PayPal") {
  const normalizedBasket = normalizeBasket(basket);
  const lines = getOrderLines(normalizedBasket);
  const summary = getBasketSummaryText(normalizedBasket);
  const total = getBasketTotal(normalizedBasket);

  return (
    "Basket summary:\n" +
    (lines.length ? lines.join("\n") : "[empty basket]") +
    "\n\nBasket situation: " + summary +
    "\n\nBuyer details:\n" +
    "Name: " + (details?.name || "[buyer name]") +
    "\nEmail: " + (details?.email || "[buyer email]") +
    "\nStreet address: " + (details?.streetAddress || "[street address]") +
    "\nCity: " + (details?.city || "[city]") +
    "\nPostcode: " + (details?.postcode || "[postcode]") +
    "\nCountry: " + (details?.country || "[country]") +
    "\n\nTotal: EUR " + total +
    "\nPayment status: " + paymentStatus
  );
}
