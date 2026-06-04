const artworkInput = document.getElementById("artwork");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const streetAddressInput = document.getElementById("street-address");
const cityInput = document.getElementById("city");
const postcodeInput = document.getElementById("postcode");
const countryInput = document.getElementById("country");
const orderForm = document.getElementById("order-form");
const successSubmitButton = document.getElementById("success-submit");
const checkoutCard = document.querySelector(".checkout-card");
const checkoutFlow = document.getElementById("checkout-flow");
const paymentSuccessScreen = document.getElementById("payment-success-screen");
const BASKET_KEY = "moneyFromTheFutureBasket";
const DEFAULT_ITEM_PRICE = 100;
const SHORTCUT_TIMEOUT_MS = 900;
let paypalSdkPromise = null;
let renderedPayPalTotal = null;
let shortcutBuffer = "";
let shortcutTimer = null;

const artworkCatalog = (() => {
  const node = document.getElementById("artwork-catalog-data");
  if (!node) return [];
  try {
    const parsed = JSON.parse(node.textContent || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
})();

function readBasket() {
  try {
    const basket = JSON.parse(localStorage.getItem(BASKET_KEY) || "[]");
    return Array.isArray(basket) ? basket : [];
  } catch {
    return [];
  }
}

function writeBasket(basket) {
  localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
}

function getBasketCount(basket = readBasket()) {
  return basket.reduce((total, item) => total + Number(item.quantity || 0), 0);
}

function getItemPrice(item) {
  const price = Number(item.price);
  return Number.isFinite(price) ? price : DEFAULT_ITEM_PRICE;
}

function updateBasketCount() {
  const count = getBasketCount();
  document.querySelectorAll("[data-basket-count]").forEach((element) => {
    element.textContent = String(count);
  });
}

function getOrderLines(basket) {
  return basket.map((item) => {
    const unitPrice = getItemPrice(item);
    const subtotal = unitPrice * Number(item.quantity || 0);
    return `${item.quantity} x ${item.title} (${item.slug}) - EUR ${unitPrice} each - EUR ${subtotal} total`;
  });
}

function getBasketTotal(basket) {
  return basket.reduce((total, item) => total + (Number(item.quantity || 0) * getItemPrice(item)), 0);
}

function setPaymentSuccessVisible(isVisible) {
  if (!checkoutCard || !paymentSuccessScreen) return;
  checkoutCard.classList.toggle("is-payment-success", isVisible);
  paymentSuccessScreen.hidden = !isVisible;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function addItemToBasket(item, quantity = 1) {
  const basket = readBasket();
  const slug = item.slug || item.id || "";
  const normalizedItem = {
    id: item.id || slug,
    slug,
    title: item.title || "Canvas print",
    image: item.image || "",
    price: Number(item.price || DEFAULT_ITEM_PRICE),
    quantity: Math.max(1, Number(quantity) || 1)
  };
  const existing = basket.find((basketItem) => basketItem.slug === normalizedItem.slug);

  if (existing) {
    existing.quantity += normalizedItem.quantity;
  } else {
    basket.push(normalizedItem);
  }

  writeBasket(basket);
  renderBasket();
  return basket;
}

function updateBasketStatusMessage(message) {
  const status = document.querySelector("[data-basket-status]");
  if (status) {
    status.textContent = message;
  }
}

function renderPaymentSuccess(basket, captureId) {
  const summary = document.getElementById("payment-success-summary");
  const totalNode = document.getElementById("payment-success-total");
  const linesNode = document.getElementById("payment-success-lines");
  const total = getBasketTotal(basket);
  const count = getBasketCount(basket);

  if (summary) {
    summary.textContent = `${count} ${count === 1 ? "print" : "prints"} - EUR ${total}`;
  }

  if (totalNode) {
    totalNode.textContent = `EUR ${total}`;
  }

  if (linesNode) {
    if (!basket.length) {
      linesNode.innerHTML = '<div class="payment-success-line"><span>No items recorded</span><strong>EUR 0</strong></div>';
    } else {
      linesNode.innerHTML = basket.map((item) => `
        <div class="payment-success-line">
          <span>${escapeHtml(item.title)} x ${Number(item.quantity || 0)}</span>
          <strong>EUR ${Number(item.quantity || 0) * getItemPrice(item)}</strong>
        </div>
      `).join("");
    }
  }

  const paymentStatusField = document.getElementById("payment-status-field");
  if (paymentStatusField) {
    paymentStatusField.value = captureId ? `PayPal captured (${captureId})` : "PayPal captured";
  }

  if (successSubmitButton) {
    successSubmitButton.disabled = !basket.length;
  }

  setPaymentSuccessVisible(true);
}

function updateCheckoutLinks(basket) {
  const subjectField = document.getElementById("form-subject");
  const basketSummaryField = document.getElementById("basket-summary-field");
  const basketTotalField = document.getElementById("basket-total-field");
  const basketLinesField = document.getElementById("basket-lines-field");
  const paymentStatusField = document.getElementById("payment-status-field");
  const sourcePageField = document.getElementById("source-page-field");
  const formMessageField = document.getElementById("form-message");
  const total = getBasketTotal(basket);
  const details = getCheckoutDetails();
  const lines = getOrderLines(basket);
  const totalCount = getBasketCount(basket);
  const basketSummaryText = `${totalCount} ${totalCount === 1 ? "print" : "prints"} - EUR ${total}`;
  const message =
    "Basket summary:\n" +
    (lines.length ? lines.join("\n") : "[empty basket]") +
    "\n\nBasket situation: " + basketSummaryText +
    "\n\nBuyer details:\n" +
    "Name: " + details.name +
    "\nEmail: " + details.email +
    "\nStreet address: " + details.streetAddress +
    "\nCity: " + details.city +
    "\nPostcode: " + details.postcode +
    "\nCountry: " + details.country +
    "\n\nTotal: EUR " + total +
    "\nPayment status: Paid via PayPal";

  if (subjectField) {
    subjectField.value = `Money From The Future order - EUR ${total}`;
  }

  if (basketSummaryField) {
    basketSummaryField.value = basketSummaryText;
  }

  if (basketTotalField) {
    basketTotalField.value = `EUR ${total}`;
  }

  if (basketLinesField) {
    basketLinesField.value = lines.length ? lines.join("\n") : "[empty basket]";
  }

  if (paymentStatusField) {
    paymentStatusField.value = "Paid via PayPal";
  }

  if (sourcePageField) {
    sourcePageField.value = "basket";
  }

  if (formMessageField) {
    formMessageField.value = message;
  }

  if (successSubmitButton) {
    successSubmitButton.disabled = total === 0;
    successSubmitButton.textContent = total > 0 ? "Send Delivery Details" : "Basket Is Empty";
  }
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
  const container = document.getElementById("paypal-button-container");
  const status = document.getElementById("paypal-button-status");
  if (!container) return;

  const total = getBasketTotal(basket);
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
            items: basket.map((item) => ({
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
          const basketAfterPayment = readBasket();
          renderPaymentSuccess(basketAfterPayment, details?.id || data?.orderID || "");
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
  const totalCount = getBasketCount(basket);
  const total = getBasketTotal(basket);

  if (!total) {
    setPaymentSuccessVisible(false);
  }

  updateBasketCount();
  updateCheckoutLinks(basket);
  renderPayPalButtons(basket);

  if (basketSummary) {
    basketSummary.textContent = `${totalCount} ${totalCount === 1 ? "print" : "prints"} in basket`;
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
    <article class="basket-item">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
      <div class="basket-item-copy">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${item.quantity} x EUR ${getItemPrice(item)}</span>
      </div>
      <strong>EUR ${item.quantity * getItemPrice(item)}</strong>
    </article>
  `).join("");
}

function getRandomArtwork() {
  if (!artworkCatalog.length) return null;
  const index = Math.floor(Math.random() * artworkCatalog.length);
  return artworkCatalog[index];
}

function addRandomArtwork(quantity = 1) {
  const artwork = getRandomArtwork();
  if (!artwork) return;
  const basket = addItemToBasket(artwork, quantity);
  const count = getBasketCount(basket);
  updateBasketStatusMessage(`${artwork.title} added for testing. Basket now has ${count} ${count === 1 ? "print" : "prints"}.`);
}

function addMultipleRandomArtworks() {
  if (!artworkCatalog.length) return;
  const targetCount = Math.min(artworkCatalog.length, 2 + Math.floor(Math.random() * 4));
  const pool = [...artworkCatalog];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[randomIndex]] = [pool[randomIndex], pool[i]];
  }

  const chosen = pool.slice(0, targetCount);
  let basket = readBasket();
  chosen.forEach((artwork) => {
    basket = addItemToBasket(artwork, 1);
  });

  const count = getBasketCount(basket);
  updateBasketStatusMessage(`${chosen.length} random works added for testing. Basket now has ${count} ${count === 1 ? "print" : "prints"}.`);
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
      addRandomArtwork(1);
    }

    if (shortcutBuffer === "fff") {
      shortcutBuffer = "";
      addMultipleRandomArtworks();
    }
  });
}

function initBasket() {
  document.querySelectorAll("[data-add-to-basket]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = {
        id: button.dataset.id || button.dataset.slug,
        slug: button.dataset.slug || "",
        title: button.dataset.title || "Canvas print",
        image: button.dataset.image || "",
        price: Number(button.dataset.price || DEFAULT_ITEM_PRICE)
      };
      const basket = addItemToBasket(item, 1);

      const count = getBasketCount(basket);
      updateBasketStatusMessage(`${item.title} added. Basket now has ${count} ${count === 1 ? "print" : "prints"}.`);
    });
  });

  const clearBasket = document.getElementById("clear-basket");
  if (clearBasket) {
    clearBasket.addEventListener("click", () => {
      writeBasket([]);
      setPaymentSuccessVisible(false);
      renderBasket();
    });
  }

  [nameInput, emailInput, streetAddressInput, cityInput, postcodeInput, countryInput]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener("input", () => updateCheckoutLinks(readBasket()));
    });

  if (orderForm) {
    orderForm.addEventListener("submit", () => {
      updateCheckoutLinks(readBasket());
    });
  }

  renderBasket();
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
