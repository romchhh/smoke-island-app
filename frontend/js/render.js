/* ==========================================================================
 * js/render.js — Router render + product partial updates + dialog
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

function render() {
  mountSmokeAtmosphere();
  let route = location.hash.slice(1) || "home";
  // Product page always uses mix-style qty pickers (per-flavor steppers).
  mixMode = route === "product" || route === "mix";
  if (route === "checkout-delivery" && !state.delivery) {
    state.delivery = "inpost";
    save();
  }
  const pages = {
    "order-accepted": orderAccepted,
    home,
    "home-old": home,
    catalog,
    "catalog-old": catalog,
    product,
    mix: product,
    cart,
    checkout,
    "checkout-old": () => checkout(true),
    "checkout-delivery": checkout,
    delivery,
    login: () => auth(false),
    register: () => auth(true),
    "verify-email": verifyEmailPage,
    bonus,
    opening: bonus,
    referrals,
    contact: contactPage,
    wishlist: () => (isMobile() ? mobileWishlist() : desktopWishlist()),
  };
  if (!pages[route]) route = "home";
  const mobileChromeRoutes = new Set([
    "home",
    "home-old",
    "catalog",
    "catalog-old",
    "product",
    "mix",
    "cart",
    "checkout",
    "checkout-old",
    "checkout-delivery",
    "wishlist",
    "bonus",
    "opening",
    "order-accepted",
    "referrals",
    "contact",
  ]);
  const mobile = isMobile();
  const narrow = isNarrowViewport();
  const showBottomNav =
    narrow && mobileChromeRoutes.has(route);
  if (document.body) {
    document.body.dataset.layout = mobile ? "mobile" : "desktop";
    document.body.dataset.route = route;
    document.body.dataset.mobileDock = showBottomNav ? "1" : "";
  }
  const titles = {
    "order-accepted": "Zamówienie przyjęte",
    home: "Strona główna",
    catalog: "Wszystkie produkty",
    product: "Wybierz smak",
    mix: "Mix wariantów",
    cart: "Koszyk",
    checkout: "Podsumowanie",
    delivery: "Dostawa",
    login: "Zaloguj się",
    register: "Załóż konto",
    bonus: "Twoje bonusy",
    referrals: "Zaproś przyjaciół",
    contact: "Kontakt",
    wishlist: "Wybrane",
  };
  const app = $("#app");
  if (!app) return;
  const body = pages[route]();
  let dockHost = document.getElementById("si-bottom-dock");
  if (!dockHost) {
    dockHost = document.createElement("div");
    dockHost.id = "si-bottom-dock";
    document.body.appendChild(dockHost);
  }
  dockHost.innerHTML = showBottomNav ? mobileNav(route) : "";

  if (mobile && mobileChromeRoutes.has(route)) {
    const compact = route === "product" || route === "mix";
    app.innerHTML =
      mobileHeader(compact, route) +
      `<main class="m-main m-route-${route} si-page-enter" id="main">${body}</main>` +
      support();
  } else {
    app.innerHTML =
      header(route) +
      `<main class="shell si-page-enter" id="main">${body}</main>` +
      support() +
      (showBottomNav
        ? ""
        : `<footer class="footer-links"><a href="#home">Strona główna</a><a href="#catalog">Katalog</a><a href="#referrals">Polecenia</a><a href="#contact">Kontakt</a></footer>`);
  }
  document.title = "Smoke Island · " + (titles[route] || "Smoke Island");
  refreshSupport();
  animateMobileBonus();
  if (route === "referrals") loadReferralData();
  window.scrollTo(0, 0);
  requestAnimationFrame(() => {
    $("#main")?.classList.add("si-page-enter-active");
  });
}
function updateProduct() {
  const tools = $(".flavor-tools");
  const flavors = $("#flavors");
  const smart = $("#smart");
  if (!tools || !flavors || !smart) return;

  const active = document.activeElement;
  const activeId = active?.id;
  const sel =
    activeId === "flavor-filter"
      ? [active.selectionStart, active.selectionEnd]
      : null;

  tools.innerHTML = flavorToolsHTML();
  flavors.innerHTML = flavorsHTML();
  smart.innerHTML = smartHTML();

  if (activeId === "quantity") $("#quantity")?.focus();
  if (activeId === "flavor-filter") {
    const el = $("#flavor-filter");
    if (el) {
      el.focus();
      if (sel) el.setSelectionRange(sel[0], sel[1]);
    }
  }
}
function dialog(title, body) {
  const d = $("#dialog");
  d.innerHTML = `<h2>${title}</h2><p>${body}</p><button class="primary wide" data-action="close-dialog">ZAMKNIJ</button>`;
  d.showModal();
}
