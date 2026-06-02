const artworkInput = document.getElementById("artwork");
const emailInput = document.getElementById("email");
const addressInput = document.getElementById("address");
const emailLink = document.getElementById("email-link");

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
