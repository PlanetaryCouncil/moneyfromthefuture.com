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
const SUCCESS_PAYLOAD_KEY = "moneyFromTheFutureSuccessPayload";
const SHORTCUT_TIMEOUT_MS = 900;

let paypalSdkPromise = null;
let renderedPayPalTotal = null;
let shortcutBuffer = "";
let shortcutTimer = null;
let currentSuccessSnapshot = null;

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
  const subjectField = document.getElementById("form-subject");
  const basketSummaryField = document.getElementById("basket-summary-field");
  const basketTotalField = document.getElementById("basket-total-field");
  const basketLinesField = document.getElementById("basket-lines-field");
  const paymentStatusField = document.getElementById("payment-status-field");
  const sourcePageField = document.getElementById("source-page-field");
  const formMessageField = document.getElementById("form-message");
  const total = getBasketTotal(normalizedBasket);
  const lines = getOrderLines(normalizedBasket);
  const summary = getBasketSummaryText(normalizedBasket);
  const message = buildCheckoutMessage(normalizedBasket, getCheckoutDetails(), paymentStatus);

  if (subjectField) {
    subjectField.value = `Money From The Future order - EUR ${total}`;
  }

  if (basketSummaryField) {
    basketSummaryField.value = summary;
  }

  if (basketTotalField) {
    basketTotalField.value = `EUR ${total}`;
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

  if (!paymentSuccessHost || !paymentSuccessTemplate || !isValidSuccessSnapshot(normalizedSnapshot)) {
    hidePaymentSuccess();
    clearSuccessPayload();
    return;
  }

  currentSuccessSnapshot = normalizedSnapshot;
  updateCheckoutData(normalizedSnapshot, captureId ? `PayPal captured (${captureId})` : "PayPal captured");

  const fragment = paymentSuccessTemplate.content.cloneNode(true);
  const summaryNode = fragment.querySelector("[data-success-summary]");
  const linesNode = fragment.querySelector("[data-success-lines]");
  const totalNode = fragment.querySelector("[data-success-total]");

  if (summaryNode) {
    summaryNode.textContent = getBasketSummaryText(normalizedSnapshot);
  }

  if (linesNode) {
    linesNode.innerHTML = getOrderLines(normalizedSnapshot).map((line) => {
      const parts = line.split(" - EUR ");
      const label = parts[0] || line;
      const subtotal = parts[parts.length - 1]?.replace(" total", "") || "0";
      return `
        <div class="payment-success-line">
          <span>${escapeHtml(label)}</span>
          <strong>EUR ${escapeHtml(subtotal)}</strong>
        </div>
      `;
    }).join("");
  }

  if (totalNode) {
    totalNode.textContent = `EUR ${getBasketTotal(normalizedSnapshot)}`;
  }

  paymentSuccessHost.replaceChildren(fragment);
  setPaymentSuccessVisible(true);
}

function loadPayPalSdk(clientId) {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (paypalSdkPromise) return paypalSdkPromise;

  paypalSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      "client-id": clientId,
      currency: "EUR",
      intent: "capture",
      components: "buttons"
    });

    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.onload = () => resolve(window.paypal);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return paypalSdkPromise;
}

function renderPayPalButtons(basket) {
  const normalizedBasket = normalizeBasket(basket);
  const container = document.getElementById("paypal-button-container");
  const status = document.getElementById("paypal-button-status");
  if (!container) return;

  const total = getBasketTotal(normalizedBasket);
  const clientId = (container.dataset.paypalClientId || "").trim();

  if (!total) {
    container.innerHTML = "";
    renderedPayPalTotal = null;
    if (status) status.textContent = "Add a canvas print to enable PayPal checkout.";
    return;
  }

  if (!clientId) {
    container.innerHTML = "";
    renderedPayPalTotal = null;
    if (status) status.textContent = "PayPal smart button needs paypal_client_id in _config.yml.";
    return;
  }

  if (renderedPayPalTotal === total && container.childElementCount) return;

  container.innerHTML = "";
  renderedPayPalTotal = total;
  if (status) status.textContent = "";

  loadPayPalSdk(clientId)
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
              currency_code: "EUR",
              value: total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: "EUR",
                  value: total.toFixed(2)
                }
              }
            },
            items: normalizedBasket.map((item) => ({
              name: item.title,
              quantity: String(item.quantity),
              unit_amount: {
                currency_code: "EUR",
                value: getItemPrice(item).toFixed(2)
              }
            }))
          }]
        }),
        onApprove: (data, actions) => actions.order.capture().then((details) => {
          const snapshot = readBasket();
          clearSuccessPayload();
          writeBasket([]);
          renderBasket();
          renderPaymentSuccess(snapshot, details?.id || data?.orderID || "");
          if (status) status.textContent = "";
        }),
        onError: () => {
          if (status) status.textContent = "PayPal button had an issue. Please try again.";
        }
      }).render(container);
    })
    .catch(() => {
      renderedPayPalTotal = null;
      if (status) status.textContent = "PayPal button could not load.";
    });
}

function renderBasket() {
  const basket = readBasket();
  const basketItems = document.getElementById("basket-items");
  const basketSummary = document.getElementById("basket-summary");
  const basketTotal = document.getElementById("basket-total");
  const count = getBasketCount(basket);
  const total = getBasketTotal(basket);

  updateBasketCount(count);
  updateCheckoutData(getActiveCheckoutBasket());
  renderPayPalButtons(basket);

  if (basketSummary) {
    basketSummary.textContent = `${count} ${count === 1 ? "print" : "prints"} in basket`;
  }

  if (basketTotal) {
    basketTotal.textContent = `EUR ${total}`;
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
        <span class="basket-item-unit">EUR ${getItemPrice(item)} each</span>
        <div class="basket-qty">
          <button type="button" class="qty-btn" data-basket-dec aria-label="Decrease quantity">&minus;</button>
          <span class="qty-value" aria-live="polite">${item.quantity}</span>
          <button type="button" class="qty-btn" data-basket-inc aria-label="Increase quantity">+</button>
          <button type="button" class="basket-remove" data-basket-remove>Remove</button>
        </div>
      </div>
      <strong class="basket-item-total">EUR ${item.quantity * getItemPrice(item)}</strong>
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
    renderBasket();
    renderPaymentSuccess(snapshot, "simulated-checkout");
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
    orderForm.addEventListener("submit", () => {
      updateCheckoutData(getActiveCheckoutBasket());
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
initBasket();
initTestingShortcuts();
