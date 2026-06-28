import {
  DEFAULT_CURRENCY,
  DEFAULT_ITEM_PRICE,
  addItemToBasket,
  buildCheckoutMessage,
  formatMoney,
  formatPrice,
  getBasketCount,
  getBasketDisplayTotal,
  getBasketSummaryText,
  getCurrencyConfig,
  getItemDisplayPrice,
  getItemPrice,
  getOrderLines,
  extractDeliveryFromPayPal,
  isValidSuccessSnapshot,
  normalizeBasket,
  removeItemFromBasket,
  setItemQuantity
} from "./shop-state.mjs";

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const streetAddressInput = document.getElementById("street-address");
const cityInput = document.getElementById("city");
const postcodeInput = document.getElementById("postcode");
const countryInput = document.getElementById("country");
const orderForm = document.getElementById("order-form");
const checkoutCard = document.querySelector(".checkout-card");
const paymentSuccessHost = document.getElementById("payment-success-host");
const paymentSuccessTemplate = document.getElementById("payment-success-template");
const BASKET_KEY = "moneyFromTheFutureBasket";
const CURRENCY_KEY = "moneyFromTheFutureCurrency";
const SUCCESS_PAYLOAD_KEY = "moneyFromTheFutureSuccessPayload";
const SHORTCUT_TIMEOUT_MS = 900;

let paypalSdkPromise = null;
let paypalSdkCurrency = null;
let renderedPayPalKey = null;
let shortcutBuffer = "";
let shortcutTimer = null;
let currentSuccessSnapshot = null;
let currentSuccessCaptureId = "";

function readCurrency() {
  try {
    return getCurrencyConfig(localStorage.getItem(CURRENCY_KEY)).code;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

function writeCurrency(currencyCode) {
  const code = getCurrencyConfig(currencyCode).code;
  try {
    localStorage.setItem(CURRENCY_KEY, code);
  } catch {}
  return code;
}

function readBasket() {
  try {
    return normalizeBasket(JSON.parse(localStorage.getItem(BASKET_KEY) || "[]"));
  } catch {
    return [];
  }
}

function writeBasket(basket) {
  localStorage.setItem(BASKET_KEY, JSON.stringify(normalizeBasket(basket)));
}

function updateBasketCount(count = getBasketCount(readBasket())) {
  document.querySelectorAll("[data-basket-count]").forEach((element) => {
    element.textContent = String(count);
  });

  document.querySelectorAll(".basket-nav-link").forEach((element) => {
    element.classList.toggle("has-items", count > 0);
  });
}

function updateCurrencyPrices(currencyCode = readCurrency()) {
  const currency = getCurrencyConfig(currencyCode).code;

  document.querySelectorAll("[data-currency-select]").forEach((select) => {
    if (select.value !== currency) {
      select.value = currency;
    }
  });

  document.querySelectorAll("[data-currency-price]").forEach((element) => {
    element.textContent = formatPrice(element.dataset.currencyPrice || DEFAULT_ITEM_PRICE, currency);
  });
}

function updateBasketStatusMessage(message) {
  const status = document.querySelector("[data-basket-status]");
  if (status) {
    status.textContent = message;
  }
}

function getCheckoutDetails() {
  return {
    name: nameInput ? nameInput.value.trim() || "[buyer name]" : "[buyer name]",
    email: emailInput ? emailInput.value.trim() || "[buyer email]" : "[buyer email]",
    streetAddress: streetAddressInput ? streetAddressInput.value.trim() || "[street address]" : "[street address]",
    city: cityInput ? cityInput.value.trim() || "[city]" : "[city]",
    postcode: postcodeInput ? postcodeInput.value.trim() || "[postcode]" : "[postcode]",
    country: countryInput ? countryInput.value.trim() || "[country]" : "[country]"
  };
}

function setFieldValue(id, value) {
  const field = document.getElementById(id);
  if (field && value) {
    field.value = value;
  }
}

// Populate the hidden delivery fields from a PayPal capture so the buyer never
// has to re-type what PayPal already collected.
function applyPayPalDetails(details) {
  try {
    const delivery = extractDeliveryFromPayPal(details);
    setFieldValue("name", delivery.name);
    setFieldValue("email", delivery.email);
    setFieldValue("street-address", delivery.streetAddress);
    setFieldValue("city", delivery.city);
    setFieldValue("postcode", delivery.postcode);
    setFieldValue("country", delivery.country);
  } catch {}
}

// Sample capture used by the "ddd" UI-test shortcut to exercise the real
// extract-and-forward path without a live PayPal payment.
const SIMULATED_PAYPAL_DETAILS = {
  id: "SIMULATED-ORDER",
  payer: {
    name: { given_name: "Test", surname: "Buyer" },
    email_address: "test-buyer@example.com"
  },
  purchase_units: [{
    shipping: {
      name: { full_name: "Test Buyer" },
      address: {
        address_line_1: "1 Test Street",
        admin_area_2: "Testville",
        admin_area_1: "Testshire",
        postal_code: "TE5 7ST",
        country_code: "GB"
      }
    }
  }]
};

function readSuccessPayload() {
  try {
    const payload = JSON.parse(sessionStorage.getItem(SUCCESS_PAYLOAD_KEY) || "null");
    if (!payload || !isValidSuccessSnapshot(payload.snapshot)) return null;
    return {
      snapshot: normalizeBasket(payload.snapshot),
      captureId: String(payload.captureId || "").trim()
    };
  } catch {
    return null;
  }
}

function writeSuccessPayload(snapshot, captureId = "") {
  if (!isValidSuccessSnapshot(snapshot)) return;
  try {
    sessionStorage.setItem(SUCCESS_PAYLOAD_KEY, JSON.stringify({
      snapshot: normalizeBasket(snapshot),
      captureId
    }));
  } catch {}
}

function clearSuccessPayload() {
  try {
    sessionStorage.removeItem(SUCCESS_PAYLOAD_KEY);
  } catch {}
}

function getActiveCheckoutBasket() {
  return currentSuccessSnapshot ? normalizeBasket(currentSuccessSnapshot) : readBasket();
}

function setPaymentSuccessVisible(isVisible) {
  if (!checkoutCard || !paymentSuccessHost) return;
  checkoutCard.classList.toggle("is-payment-success", isVisible);
  paymentSuccessHost.hidden = !isVisible;
}

function hidePaymentSuccess() {
  currentSuccessSnapshot = null;
  currentSuccessCaptureId = "";
  if (paymentSuccessHost) {
    paymentSuccessHost.replaceChildren();
  }
  setPaymentSuccessVisible(false);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateCheckoutData(basket, paymentStatus = "Paid via PayPal") {
  const normalizedBasket = normalizeBasket(basket);
  const currency = readCurrency();
  const subjectField = document.getElementById("form-subject");
  const basketSummaryField = document.getElementById("basket-summary-field");
  const basketTotalField = document.getElementById("basket-total-field");
  const basketLinesField = document.getElementById("basket-lines-field");
  const paymentStatusField = document.getElementById("payment-status-field");
  const sourcePageField = document.getElementById("source-page-field");
  const formMessageField = document.getElementById("form-message");
  const total = getBasketDisplayTotal(normalizedBasket, currency);
  const lines = getOrderLines(normalizedBasket, currency);
  const summary = getBasketSummaryText(normalizedBasket, currency);
  const message = buildCheckoutMessage(normalizedBasket, getCheckoutDetails(), paymentStatus, currency);

  if (subjectField) {
    subjectField.value = `Money From The Future order - ${formatMoney(total, currency)}`;
  }

  if (basketSummaryField) {
    basketSummaryField.value = summary;
  }

  if (basketTotalField) {
    basketTotalField.value = formatMoney(total, currency);
  }

  if (basketLinesField) {
    basketLinesField.value = lines.length ? lines.join("\n") : "[empty basket]";
  }

  if (paymentStatusField) {
    paymentStatusField.value = paymentStatus;
  }

  if (sourcePageField) {
    sourcePageField.value = currentSuccessSnapshot ? "basket-success" : "basket";
  }

  if (formMessageField) {
    formMessageField.value = message;
  }
}

function renderPaymentSuccess(snapshot, captureId = "") {
  const normalizedSnapshot = normalizeBasket(snapshot);
  const currency = readCurrency();

  if (!paymentSuccessHost || !paymentSuccessTemplate || !isValidSuccessSnapshot(normalizedSnapshot)) {
    hidePaymentSuccess();
    clearSuccessPayload();
    return;
  }

  currentSuccessSnapshot = normalizedSnapshot;
  currentSuccessCaptureId = captureId;
  updateCheckoutData(normalizedSnapshot, captureId ? `PayPal captured (${captureId})` : "PayPal captured");

  const fragment = paymentSuccessTemplate.content.cloneNode(true);
  const summaryNode = fragment.querySelector("[data-success-summary]");
  const linesNode = fragment.querySelector("[data-success-lines]");
  const totalNode = fragment.querySelector("[data-success-total]");

  if (summaryNode) {
    summaryNode.textContent = getBasketSummaryText(normalizedSnapshot, currency);
  }

  if (linesNode) {
    linesNode.innerHTML = normalizedSnapshot.map((item) => {
      const unit = getItemDisplayPrice(item, currency);
      const subtotal = item.quantity * unit;
      return `
        <div class="payment-success-line">
          <span>${escapeHtml(`${item.quantity} x ${item.title} (${item.slug})`)}</span>
          <strong>${escapeHtml(formatMoney(subtotal, currency))}</strong>
        </div>
      `;
    }).join("");
  }

  if (totalNode) {
    totalNode.textContent = formatMoney(getBasketDisplayTotal(normalizedSnapshot, currency), currency);
  }

  const shipNode = fragment.querySelector("[data-success-ship]");
  if (shipNode) {
    const details = getCheckoutDetails();
    const hasAddress = details.name && !details.name.startsWith("[");
    if (hasAddress) {
      shipNode.textContent = `Ships to ${[details.name, details.streetAddress, details.city, details.postcode, details.country].filter((part) => part && !part.startsWith("[")).join(", ")}`;
      shipNode.hidden = false;
    }
  }

  paymentSuccessHost.replaceChildren(fragment);
  setPaymentSuccessVisible(true);
}

function loadPayPalSdk(clientId, currencyCode) {
  const currency = getCurrencyConfig(currencyCode).code;
  if (window.paypal && paypalSdkCurrency === currency) return Promise.resolve(window.paypal);
  if (paypalSdkPromise) return paypalSdkPromise;

  paypalSdkPromise = new Promise((resolve, reject) => {
    document.querySelectorAll("script[data-paypal-sdk]").forEach((script) => script.remove());
    try {
      window.paypal = undefined;
    } catch {}

    const script = document.createElement("script");
    script.dataset.paypalSdk = currency;
    const params = new URLSearchParams({
      "client-id": clientId,
      currency,
      intent: "capture",
      components: "buttons"
    });

    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.onload = () => {
      paypalSdkCurrency = currency;
      resolve(window.paypal);
    };
    script.onerror = (error) => {
      paypalSdkPromise = null;
      reject(error);
    };
    document.head.appendChild(script);
  });

  return paypalSdkPromise;
}

function renderPayPalButtons(basket) {
  const normalizedBasket = normalizeBasket(basket);
  const currency = readCurrency();
  const container = document.getElementById("paypal-button-container");
  const status = document.getElementById("paypal-button-status");
  const hint = document.querySelector(".checkout-hint");
  if (!container) return;

  const total = getBasketDisplayTotal(normalizedBasket, currency);
  const clientId = (container.dataset.paypalClientId || "").trim();
  const renderKey = `${currency}:${total}`;

  if (!total) {
    container.innerHTML = "";
    renderedPayPalKey = null;
    if (hint) hint.hidden = true;
    if (status) status.textContent = "Your basket is empty — browse the catalogue and add an item to enable checkout.";
    return;
  }

  if (hint) hint.hidden = false;

  if (!clientId) {
    container.innerHTML = "";
    renderedPayPalKey = null;
    if (status) status.textContent = "PayPal smart button needs paypal_client_id in _config.yml.";
    return;
  }

  if (renderedPayPalKey === renderKey && container.childElementCount) return;

  container.innerHTML = "";
  renderedPayPalKey = renderKey;
  if (status) status.textContent = "";

  loadPayPalSdk(clientId, currency)
    .then((paypal) => {
      if (!paypal || !paypal.Buttons) throw new Error("PayPal SDK did not load buttons.");

      paypal.Buttons({
        style: {
          color: "gold",
          label: "paypal",
          layout: "vertical",
          shape: "rect"
        },
        createOrder: (data, actions) => actions.order.create({
          purchase_units: [{
            description: "Money From The Future canvas prints",
            amount: {
              currency_code: currency,
              value: total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: currency,
                  value: total.toFixed(2)
                }
              }
            },
            items: normalizedBasket.map((item) => ({
              name: item.title,
              quantity: String(item.quantity),
              unit_amount: {
                currency_code: currency,
                value: getItemDisplayPrice(item, currency).toFixed(2)
              }
            }))
          }]
        }),
        onApprove: (data, actions) => actions.order.capture().then((details) => {
          const snapshot = readBasket();
          applyPayPalDetails(details);
          clearSuccessPayload();
          writeBasket([]);
          renderBasket();
          renderPaymentSuccess(snapshot, details?.id || data?.orderID || "");
          sendOrderEmail();
          if (status) status.textContent = "";
        }),
        onError: () => {
          if (status) status.textContent = "PayPal button had an issue. Please try again.";
        }
      }).render(container);
    })
    .catch(() => {
      renderedPayPalKey = null;
      if (status) status.textContent = "PayPal button could not load.";
    });
}

function renderBasket() {
  const basket = readBasket();
  const basketItems = document.getElementById("basket-items");
  const basketSummary = document.getElementById("basket-summary");
  const basketTotal = document.getElementById("basket-total");
  const currency = readCurrency();
  const count = getBasketCount(basket);
  const total = getBasketDisplayTotal(basket, currency);

  updateBasketCount(count);
  updateCurrencyPrices(currency);
  updateCheckoutData(getActiveCheckoutBasket());
  renderPayPalButtons(basket);

  if (basketSummary) {
    basketSummary.textContent = `${count} ${count === 1 ? "print" : "prints"} in basket`;
  }

  if (basketTotal) {
    basketTotal.textContent = formatMoney(total, currency);
  }

  if (!basketItems) return;

  if (!basket.length) {
    basketItems.innerHTML = '<p class="basket-empty">No canvas prints selected yet.</p>';
    return;
  }

  basketItems.innerHTML = basket.map((item) => `
    <article class="basket-item" data-slug="${escapeHtml(item.slug)}">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
      <div class="basket-item-copy">
        <strong>${escapeHtml(item.title)}</strong>
        <span class="basket-item-unit">${escapeHtml(formatMoney(getItemDisplayPrice(item, currency), currency))} each</span>
        <div class="basket-qty">
          <button type="button" class="qty-btn" data-basket-dec aria-label="Decrease quantity">&minus;</button>
          <span class="qty-value" aria-live="polite">${item.quantity}</span>
          <button type="button" class="qty-btn" data-basket-inc aria-label="Increase quantity">+</button>
          <button type="button" class="basket-remove" data-basket-remove>Remove</button>
        </div>
      </div>
      <strong class="basket-item-total">${escapeHtml(formatMoney(item.quantity * getItemDisplayPrice(item, currency), currency))}</strong>
    </article>
  `).join("");
}

function showSimulatedPaymentSuccess() {
  const snapshot = readBasket();
  if (!isValidSuccessSnapshot(snapshot)) {
    updateBasketStatusMessage("Add at least one item before testing the successful checkout screen.");
    return;
  }

  writeBasket([]);

  if (paymentSuccessHost) {
    applyPayPalDetails(SIMULATED_PAYPAL_DETAILS);
    renderBasket();
    renderPaymentSuccess(snapshot, "simulated-checkout");
    sendOrderEmail();
    updateBasketStatusMessage("Simulated successful checkout shown for UI testing.");
    return;
  }

  writeSuccessPayload(snapshot, "simulated-checkout");
  window.location.href = "/investment-art/basket.html";
}

function initTestingShortcuts() {
  window.addEventListener("keydown", (event) => {
    const target = event.target;
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      !event.key ||
      event.key.length !== 1 ||
      (target instanceof HTMLElement && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.tagName === "SELECT"
      ))
    ) {
      return;
    }

    shortcutBuffer = (shortcutBuffer + event.key.toLowerCase()).slice(-3);
    window.clearTimeout(shortcutTimer);
    shortcutTimer = window.setTimeout(() => {
      shortcutBuffer = "";
    }, SHORTCUT_TIMEOUT_MS);

    if (shortcutBuffer === "ddd") {
      shortcutBuffer = "";
      showSimulatedPaymentSuccess();
    }
  });
}

function setOrderStatus(message) {
  const status = document.querySelector("[data-order-status]");
  if (status) {
    status.textContent = message;
  }
}

// Submit the order form to Formspree over fetch so the buyer stays on-page and
// sees an explicit success / failure result instead of being redirected away.
async function sendOrderEmail() {
  if (!orderForm) return;

  if (!orderForm.checkValidity()) {
    setOrderStatus("Please complete every delivery field, then send again.");
    orderForm.reportValidity();
    return;
  }

  setOrderStatus("Sending order details…");

  try {
    const response = await fetch(orderForm.action, {
      method: "POST",
      body: new FormData(orderForm),
      headers: { Accept: "application/json" }
    });

    if (response.ok) {
      setOrderStatus("Order details sent. We'll be in touch about your prints.");
      return;
    }

    const data = await response.json().catch(() => null);
    const detail = Array.isArray(data?.errors)
      ? data.errors.map((error) => error.message).filter(Boolean).join(", ")
      : "";
    setOrderStatus(detail
      ? `Could not send order details: ${detail}`
      : "Could not send order details. Please try again or email us directly.");
  } catch {
    setOrderStatus("Network problem sending order details. Please try again.");
  }
}

// Newsletter / contact form in the footer — submits to Formspree over fetch so
// the visitor stays on-page and gets an inline result. Doubles as a contact form
// via the optional message field.
function initNewsletter() {
  const form = document.getElementById("newsletter-form");
  if (!form) return;

  const status = form.querySelector("[data-newsletter-status]");
  const setStatus = (message) => { if (status) status.textContent = message; };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      setStatus("Please enter a valid email address.");
      form.reportValidity();
      return;
    }

    setStatus("Signing you up…");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });

      if (response.ok) {
        form.reset();
        setStatus("Thanks — you're on the list. 🙌");
        return;
      }

      const data = await response.json().catch(() => null);
      const detail = Array.isArray(data?.errors)
        ? data.errors.map((error) => error.message).filter(Boolean).join(", ")
        : "";
      setStatus(detail ? `Could not sign up: ${detail}` : "Could not sign up. Please try again.");
    } catch {
      setStatus("Network problem. Please try again.");
    }
  });
}

function resetPayPalSdk() {
  paypalSdkPromise = null;
  paypalSdkCurrency = null;
  renderedPayPalKey = null;
  document.querySelectorAll("script[data-paypal-sdk]").forEach((script) => script.remove());
  try {
    window.paypal = undefined;
  } catch {}
}

function initCurrencySelector() {
  const selectors = document.querySelectorAll("[data-currency-select]");
  if (!selectors.length) {
    updateCurrencyPrices();
    return;
  }

  const current = writeCurrency(readCurrency());
  updateCurrencyPrices(current);

  selectors.forEach((select) => {
    select.value = current;
    select.addEventListener("change", () => {
      const next = writeCurrency(select.value);
      resetPayPalSdk();
      updateCurrencyPrices(next);
      renderBasket();
      if (currentSuccessSnapshot) {
        renderPaymentSuccess(currentSuccessSnapshot, currentSuccessCaptureId);
      }
    });
  });
}

function initBasket() {
  document.querySelectorAll("[data-add-to-basket]").forEach((button) => {
    button.addEventListener("click", () => {
      hidePaymentSuccess();
      clearSuccessPayload();

      const basket = addItemToBasket(readBasket(), {
        id: button.dataset.id || button.dataset.slug,
        slug: button.dataset.slug || "",
        title: button.dataset.title || "Canvas print",
        image: button.dataset.image || "",
        price: Number(button.dataset.price || DEFAULT_ITEM_PRICE)
      }, 1);

      writeBasket(basket);
      renderBasket();

      const count = getBasketCount(basket);
      updateBasketStatusMessage(`${button.dataset.title || "Canvas print"} added. Basket now has ${count} ${count === 1 ? "print" : "prints"}.`);
    });
  });

  const clearBasket = document.getElementById("clear-basket");
  if (clearBasket) {
    clearBasket.addEventListener("click", () => {
      writeBasket([]);
      clearSuccessPayload();
      hidePaymentSuccess();
      renderBasket();
    });
  }

  // Per-line quantity + remove controls (delegated — items re-render on every change).
  const basketItems = document.getElementById("basket-items");
  if (basketItems) {
    basketItems.addEventListener("click", (event) => {
      const button = event.target.closest("[data-basket-dec], [data-basket-inc], [data-basket-remove]");
      if (!button) return;

      const slug = button.closest(".basket-item")?.dataset.slug;
      if (!slug) return;

      const basket = readBasket();
      const current = basket.find((entry) => entry.slug === slug);
      let next;

      if (button.hasAttribute("data-basket-remove")) {
        next = removeItemFromBasket(basket, slug);
      } else if (button.hasAttribute("data-basket-inc")) {
        next = setItemQuantity(basket, slug, (current?.quantity || 1) + 1);
      } else {
        next = setItemQuantity(basket, slug, (current?.quantity || 1) - 1);
      }

      writeBasket(next);
      clearSuccessPayload();
      hidePaymentSuccess();
      renderBasket();
    });
  }

  [nameInput, emailInput, streetAddressInput, cityInput, postcodeInput, countryInput]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener("input", () => updateCheckoutData(getActiveCheckoutBasket()));
    });

  if (orderForm) {
    orderForm.addEventListener("submit", (event) => {
      event.preventDefault();
      updateCheckoutData(getActiveCheckoutBasket());
      sendOrderEmail();
    });
  }

  hidePaymentSuccess();
  renderBasket();

  const pendingSuccess = readSuccessPayload();
  if (pendingSuccess) {
    clearSuccessPayload();
    renderPaymentSuccess(pendingSuccess.snapshot, pendingSuccess.captureId);
    updateBasketStatusMessage("Simulated successful checkout shown for UI testing.");
  }
}

function initHeroRotation() {
  const hero = document.querySelector("[data-hero-rotate]");
  if (!hero) return;

  const images = (hero.dataset.heroImages || "")
    .split("|")
    .map((image) => image.trim())
    .filter(Boolean);

  if (images.length < 2) return;

  const intervalMs = Number(hero.dataset.heroInterval || 5000);
  const fadeMs = 420;
  let index = 0;
  let timer = null;
  const progressFill = hero.querySelector("[data-hero-progress]");
  const heroArt = hero.querySelector(".hero-carousel-art");
  const counter = hero.querySelector("[data-hero-counter]");
  const prevButton = hero.querySelector("[data-hero-prev]");
  const nextButton = hero.querySelector("[data-hero-next]");

  if (!heroArt) return;

  for (let i = images.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [images[i], images[randomIndex]] = [images[randomIndex], images[i]];
  }

  heroArt.style.backgroundImage = `url("${images[index]}")`;

  const updateCounter = () => {
    if (!counter) return;
    const current = String(index + 1).padStart(2, "0");
    const total = String(images.length).padStart(2, "0");
    counter.textContent = `${current} / ${total}`;
  };

  const restartProgress = () => {
    if (!progressFill) return;
    progressFill.style.setProperty("--hero-interval", `${intervalMs}ms`);
    progressFill.classList.remove("is-running");
    void progressFill.offsetWidth;
    progressFill.classList.add("is-running");
  };

  const advance = (step) => {
    index = (index + step + images.length) % images.length;
    heroArt.classList.add("is-fading");
    window.setTimeout(() => {
      heroArt.style.backgroundImage = `url("${images[index]}")`;
      heroArt.classList.remove("is-fading");
      updateCounter();
      restartProgress();
    }, fadeMs);
  };

  const scheduleNext = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      advance(1);
      scheduleNext();
    }, intervalMs);
  };

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      advance(-1);
      scheduleNext();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      advance(1);
      scheduleNext();
    });
  }

  updateCounter();
  restartProgress();
  scheduleNext();
}

initHeroRotation();
initCurrencySelector();
initBasket();
initNewsletter();
initTestingShortcuts();
