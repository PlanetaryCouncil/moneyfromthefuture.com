const BASKET_KEY = "mftf:investment-art:basket:v1";
const UNIT_PRICE = 100;
const CURRENCY = "EUR";

function readBasket() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BASKET_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(function(item) {
      return item && item.slug && item.title;
    }) : [];
  } catch (error) {
    return [];
  }
}

function writeBasket(items) {
  localStorage.setItem(BASKET_KEY, JSON.stringify(items));
  updateBasketCount();
}

function totalFor(items) {
  return items.length * UNIT_PRICE;
}

function updateBasketCount() {
  const count = readBasket().length;
  document.querySelectorAll("[data-basket-count]").forEach(function(node) {
    node.textContent = String(count);
  });
}

function addToBasket(item) {
  const items = readBasket();
  const exists = items.some(function(existing) {
    return existing.slug === item.slug;
  });
  if (!exists) {
    items.push(item);
    writeBasket(items);
  }
  return !exists;
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
    return String(index + 1) + ". " + item.title + " - " + CURRENCY + " " + UNIT_PRICE;
  }).join("\n");

  return "Artworks:\n" + itemLines + "\n\n" +
    "Total: " + CURRENCY + " " + totalFor(items) + "\n" +
    "Buyer email: " + ((email && email.value.trim()) || "[buyer email]") + "\n" +
    "Shipping address:\n" + ((address && address.value.trim()) || "[shipping address]") + "\n\n" +
    "Payment status: Paid via PayPal";
}

function updateCheckoutLinks(items) {
  const paypalLink = document.getElementById("paypal-link");
  const emailLink = document.getElementById("email-link");
  const total = totalFor(items);

  if (paypalLink) {
    paypalLink.href = items.length > 0
      ? "https://www.paypal.com/paypalme/moneyfromthefuture/" + total + CURRENCY
      : "#";
    paypalLink.textContent = items.length > 0
      ? "Pay " + CURRENCY + " " + total + " With PayPal"
      : "Basket Is Empty";
  }

  if (emailLink) {
    if (items.length === 0) {
      emailLink.href = "#";
      emailLink.textContent = "Add Designs First";
    } else {
      const subject = encodeURIComponent("Canvas order - " + items.length + " design" + (items.length === 1 ? "" : "s"));
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
    empty.textContent = "Your basket is empty. Add a design from any artwork page.";
    basketItems.append(empty);
  } else {
    items.forEach(function(item) {
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
      price.textContent = CURRENCY + " " + UNIT_PRICE;

      const remove = document.createElement("button");
      remove.className = "basket-remove";
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", function() {
        removeFromBasket(item.slug);
      });

      copy.append(title, price);
      row.append(thumb, copy, remove);
      basketItems.append(row);
    });
  }

  if (totalNode) totalNode.textContent = CURRENCY + " " + totalFor(items);
  if (summaryNode) {
    summaryNode.textContent = items.length + " design" + (items.length === 1 ? "" : "s") + " in basket";
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
    const added = addToBasket(item);
    const status = document.querySelector("[data-basket-status]");
    if (status) {
      status.textContent = added
        ? item.title + " added to basket."
        : item.title + " is already in the basket.";
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