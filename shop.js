const artworkInput = document.getElementById("artwork");
const emailInput = document.getElementById("email");
const addressInput = document.getElementById("address");
const emailLink = document.getElementById("email-link");
const BASKET_KEY = "moneyFromTheFutureBasket";
const CANVAS_PRICE = 100;

function updateEmailLink() {
  if (!artworkInput || !emailInput || !addressInput || !emailLink) return;
  const artwork = artworkInput.value.trim() || "Canvas order";
  const email = emailInput.value.trim() || "[buyer email]";
  const address = addressInput.value.trim() || "[shipping address]";
  const subject = encodeURIComponent("Canvas order - " + artwork);
  const body = encodeURIComponent(
    "Artwork: " + artwork + "\n" +
    "Buyer email: " + email + "\n" +
    "Shipping address:\n" + address + "\n\n" +
    "Payment status: Paid via PayPal"
  );
  emailLink.href = "mailto:hello@moneyfromthefuture.com?subject=" + subject + "&body=" + body;
}

if (artworkInput && emailInput && addressInput && emailLink) {
  updateEmailLink();
  emailInput.addEventListener("input", updateEmailLink);
  addressInput.addEventListener("input", updateEmailLink);
}

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

function updateBasketCount() {
  const count = getBasketCount();
  document.querySelectorAll("[data-basket-count]").forEach((element) => {
    element.textContent = String(count);
  });
}

function getOrderLines(basket) {
  return basket.map((item) => `${item.quantity} x ${item.title} (${item.slug})`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateCheckoutLinks(basket) {
  const paypalLink = document.getElementById("paypal-link");
  const basketEmailLink = document.getElementById("email-link");
  const total = getBasketCount(basket) * CANVAS_PRICE;
  const email = emailInput ? emailInput.value.trim() || "[buyer email]" : "[buyer email]";
  const address = addressInput ? addressInput.value.trim() || "[shipping address]" : "[shipping address]";
  const lines = getOrderLines(basket);

  if (paypalLink) {
    if (total > 0) {
      paypalLink.href = `https://www.paypal.com/paypalme/moneyfromthefuture/${total}EUR`;
      paypalLink.textContent = `Pay EUR ${total} With PayPal`;
      paypalLink.setAttribute("target", "_blank");
      paypalLink.setAttribute("rel", "noreferrer");
    } else {
      paypalLink.href = "#";
      paypalLink.textContent = "Basket Is Empty";
      paypalLink.removeAttribute("target");
      paypalLink.removeAttribute("rel");
    }
  }

  if (basketEmailLink) {
    const subject = encodeURIComponent(`Canvas order - EUR ${total}`);
    const body = encodeURIComponent(
      "Order:\n" +
      (lines.length ? lines.join("\n") : "[empty basket]") +
      "\n\nBuyer email: " + email +
      "\nShipping address:\n" + address +
      "\n\nTotal: EUR " + total +
      "\nPayment status: Paid via PayPal"
    );
    basketEmailLink.href = `mailto:hello@moneyfromthefuture.com?subject=${subject}&body=${body}`;
  }
}

function renderBasket() {
  const basket = readBasket();
  const basketItems = document.getElementById("basket-items");
  const basketSummary = document.getElementById("basket-summary");
  const basketTotal = document.getElementById("basket-total");
  const totalCount = getBasketCount(basket);
  const total = totalCount * CANVAS_PRICE;

  updateBasketCount();
  updateCheckoutLinks(basket);

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
        <span>${item.quantity} x EUR ${CANVAS_PRICE}</span>
      </div>
      <strong>EUR ${item.quantity * CANVAS_PRICE}</strong>
    </article>
  `).join("");
}

function initBasket() {
  document.querySelectorAll("[data-add-to-basket]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = {
        id: button.dataset.id || button.dataset.slug,
        slug: button.dataset.slug || "",
        title: button.dataset.title || "Canvas print",
        image: button.dataset.image || "",
        quantity: 1
      };
      const basket = readBasket();
      const existing = basket.find((basketItem) => basketItem.slug === item.slug);

      if (existing) {
        existing.quantity += 1;
      } else {
        basket.push(item);
      }

      writeBasket(basket);
      renderBasket();

      const status = document.querySelector("[data-basket-status]");
      if (status) {
        const count = getBasketCount(basket);
        status.textContent = `${item.title} added. Basket now has ${count} ${count === 1 ? "print" : "prints"}.`;
      }
    });
  });

  const clearBasket = document.getElementById("clear-basket");
  if (clearBasket) {
    clearBasket.addEventListener("click", () => {
      writeBasket([]);
      renderBasket();
    });
  }

  if (emailInput) emailInput.addEventListener("input", () => updateCheckoutLinks(readBasket()));
  if (addressInput) addressInput.addEventListener("input", () => updateCheckoutLinks(readBasket()));

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
