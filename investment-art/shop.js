const BASKET_KEY = "mftf:investment-art:basket:v1";
const UNIT_PRICE = 100;
const CURRENCY = "EUR";

function cleanQuantity(value) {
  const quantity = Number.parseInt(value, 10);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function normalizeBasket(items) {
  const bySlug = new Map();
  if (!Array.isArray(items)) return [];

  items.forEach(function(item) {
    if (!item || !item.slug || !item.title) return;
    const existing = bySlug.get(item.slug);
    const quantity = cleanQuantity(item.quantity);
    if (existing) {
      existing.quantity += quantity;
    } else {
      bySlug.set(item.slug, {
        id: item.id || "",
        slug: item.slug,
        title: item.title,
        image: item.image || "",
        price: UNIT_PRICE,
        quantity: quantity
      });
    }
  });

  return Array.from(bySlug.values());
}

function readBasket() {
  try {
    return normalizeBasket(JSON.parse(localStorage.getItem(BASKET_KEY) || "[]"));
  } catch (error) {
    return [];
  }
}

function writeBasket(items) {
  localStorage.setItem(BASKET_KEY, JSON.stringify(normalizeBasket(items)));
  updateBasketCount();
}

function countPrints(items) {
  return items.reduce(function(total, item) {
    return total + cleanQuantity(item.quantity);
  }, 0);
}

function totalFor(items) {
  return countPrints(items) * UNIT_PRICE;
}

function updateBasketCount() {
  const count = countPrints(readBasket());
  document.querySelectorAll("[data-basket-count]").forEach(function(node) {
    node.textContent = String(count);
  });
}

function addToBasket(item) {
  const items = readBasket();
  const existing = items.find(function(current) {
    return current.slug === item.slug;
  });
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push(Object.assign({}, item, { price: UNIT_PRICE, quantity: 1 }));
  }
  writeBasket(items);
  return existing ? existing.quantity : 1;
}

function changeQuantity(slug, delta) {
  const items = readBasket().map(function(item) {
    if (item.slug === slug) {
      return Object.assign({}, item, { quantity: cleanQuantity(item.quantity) + delta });
    }
    return item;
  }).filter(function(item) {
    return Number.parseInt(item.quantity, 10) > 0;
  });
  writeBasket(items);
  renderBasketPage();
}

function removeFromBasket(slug) {
  writeBasket(readBasket().filter(function(item) {
    return item.slug !== slug;
  }));
  renderBasketPage();
}

function buildOrderBody(items) {
  const email = document.getElementById("email");
  const address = document.getElementById("address");
  const itemLines = items.map(function(item, index) {
    const quantity = cleanQuantity(item.quantity);
    const subtotal = quantity * UNIT_PRICE;
    return String(index + 1) + ". " + item.title + " x " + quantity + " - " + CURRENCY + " " + subtotal;
  }).join("\n");

  return "Artworks:\n" + itemLines + "\n\n" +
    "Prints: " + countPrints(items) + "\n" +
    "Total: " + CURRENCY + " " + totalFor(items) + "\n" +
    "Buyer email: " + ((email && email.value.trim()) || "[buyer email]") + "\n" +
    "Shipping address:\n" + ((address && address.value.trim()) || "[shipping address]") + "\n\n" +
    "Payment status: Paid via PayPal";
}

function updateCheckoutLinks(items) {
  const paypalLink = document.getElementById("paypal-link");
  const emailLink = document.getElementById("email-link");
  const total = totalFor(items);
  const printCount = countPrints(items);

  if (paypalLink) {
    paypalLink.href = printCount > 0
      ? "https://www.paypal.com/paypalme/moneyfromthefuture/" + total + CURRENCY
      : "#";
    paypalLink.textContent = printCount > 0
      ? "Pay " + CURRENCY + " " + total + " With PayPal"
      : "Basket Is Empty";
  }

  if (emailLink) {
    if (printCount === 0) {
      emailLink.href = "#";
      emailLink.textContent = "Add Prints First";
    } else {
      const subject = encodeURIComponent("Canvas order - " + printCount + " print" + (printCount === 1 ? "" : "s"));
      const body = encodeURIComponent(buildOrderBody(items));
      emailLink.href = "mailto:hello@moneyfromthefuture.com?subject=" + subject + "&body=" + body;
      emailLink.textContent = "Forward Order Details";
    }
  }
}

function renderBasketPage() {
  const basketItems = document.getElementById("basket-items");
  if (!basketItems) return;

  const items = readBasket();
  const totalNode = document.getElementById("basket-total");
  const summaryNode = document.getElementById("basket-summary");

  basketItems.textContent = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "basket-empty";
    empty.textContent = "Your basket is empty. Add prints from any artwork page.";
    basketItems.append(empty);
  } else {
    items.forEach(function(item) {
      const quantity = cleanQuantity(item.quantity);
      const row = document.createElement("article");
      row.className = "basket-item";

      const thumb = document.createElement("div");
      thumb.className = "basket-thumb";
      thumb.style.backgroundImage = "url('" + item.image + "')";

      const copy = document.createElement("div");
      copy.className = "basket-copy";

      const title = document.createElement("h3");
      title.textContent = item.title;

      const price = document.createElement("span");
      price.textContent = CURRENCY + " " + UNIT_PRICE + " x " + quantity;

      const quantityControls = document.createElement("div");
      quantityControls.className = "basket-quantity";

      const decrease = document.createElement("button");
      decrease.type = "button";
      decrease.textContent = "-";
      decrease.addEventListener("click", function() {
        changeQuantity(item.slug, -1);
      });

      const quantityLabel = document.createElement("span");
      quantityLabel.textContent = String(quantity);

      const increase = document.createElement("button");
      increase.type = "button";
      increase.textContent = "+";
      increase.addEventListener("click", function() {
        changeQuantity(item.slug, 1);
      });

      const remove = document.createElement("button");
      remove.className = "basket-remove";
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", function() {
        removeFromBasket(item.slug);
      });

      quantityControls.append(decrease, quantityLabel, increase);
      copy.append(title, price);
      row.append(thumb, copy, quantityControls, remove);
      basketItems.append(row);
    });
  }

  if (totalNode) totalNode.textContent = CURRENCY + " " + totalFor(items);
  if (summaryNode) {
    const printCount = countPrints(items);
    summaryNode.textContent = printCount + " print" + (printCount === 1 ? "" : "s") + " in basket";
  }
  updateCheckoutLinks(items);
}

document.querySelectorAll("[data-add-to-basket]").forEach(function(button) {
  button.addEventListener("click", function() {
    const item = {
      id: button.dataset.id,
      slug: button.dataset.slug,
      title: button.dataset.title,
      image: button.dataset.image,
      price: UNIT_PRICE
    };
    const quantity = addToBasket(item);
    const status = document.querySelector("[data-basket-status]");
    if (status) {
      status.textContent = item.title + " quantity in basket: " + quantity + ".";
    }
  });
});

const clearBasketButton = document.getElementById("clear-basket");
if (clearBasketButton) {
  clearBasketButton.addEventListener("click", function() {
    writeBasket([]);
    renderBasketPage();
  });
}

["email", "address"].forEach(function(id) {
  const field = document.getElementById(id);
  if (field) {
    field.addEventListener("input", function() {
      updateCheckoutLinks(readBasket());
    });
  }
});

updateBasketCount();
renderBasketPage();