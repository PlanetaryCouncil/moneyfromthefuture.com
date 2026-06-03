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
