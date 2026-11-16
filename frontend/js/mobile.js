/* ==========================================================================
 * js/mobile.js — Mobile shell, catalog/product/cart sheets, mobile events
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

const isMobile = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(max-width: 720px)").matches;
let mobileQuantities = {},
  mobileCartCategory = "Wszystkie",
  mobileSheetIndex = -1;
const mobileFlavorNames = () =>
  productVariantNames(state.selectedProduct).map((s) => s.toUpperCase());
const mobileTotal = () =>
  Object.values(mobileQuantities).reduce((a, b) => a + b, 0);
function mobileCheckoutAtmosphere() {
  return `<div class="mc-atmosphere" aria-hidden="true">${[
    [11, 8, 2],
    [31, 3, 2],
    [46, 35, 2],
    [53, 35, 3],
    [28, 45, 2],
    [37, 52, 2],
    [68, 46, 2],
    [75, 55, 4],
    [88, 63, 2],
    [52, 88, 2],
    [16, 60, 1],
    [91, 9, 1],
  ]
    .map(
      ([x, y, size], i) =>
        `<i style="--x:${x}%;--y:${y}%;--s:${size}px;--d:${3.8 + (i % 4) * 0.6}s;--delay:${-i * 0.7}s;--travel:${x < 50 ? -22 : 22}px"></i>`,
    )
    .join("")}</div>`;
}
function mobileHeader(
  compact = false,
  resolvedRoute = location.hash.slice(1) || "home",
) {
  return `${["home", "home-old", "catalog", "catalog-old", "product", "mix", "cart", "checkout", "checkout-old", "checkout-delivery", "bonus", "opening", "referrals", "contact", "wishlist", "order-accepted"].includes(resolvedRoute) ? mobileCheckoutAtmosphere() : ""}<header class="m-topbar ${compact ? "m-topbar-compact" : ""}"><a class="m-logo" href="#home" aria-label="Smoke Island — strona główna">${img("logo", "Smoke Island", "", { eager: true })}</a><a class="m-top-link" href="#checkout"><span aria-hidden="true">${img("icon-orders-mobile", "")}</span> Zamówienia</a><a class="m-top-link ${location.hash === "#contact" ? "contact-active" : ""}" href="#contact"><span aria-hidden="true">${img("icon-account", "")}</span> Kontakt</a>${state.user ? `<button class="m-top-link m-account-toggle" data-action="account-toggle" aria-expanded="false"><span>${esc(state.user)}</span><span class="account-chevron" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><path d="m4 6 6 7 6-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>` : ""}<a class="m-points" href="#bonus" aria-label="${state.points} punktów">${state.points}${img("coin", "")}</a></header>${state.user ? `<section class="m-account-dropdown" hidden><strong>${esc(state.userInfo?.email || state.user)}</strong><span>${state.points} punktów · ${state.userInfo?.telegramId ? "Telegram połączony" : "konto Smoke Island"}</span><a href="#referrals">Link polecający</a>${state.userInfo?.telegramId ? "" : `<button type="button" data-action="connect-telegram">Połącz Telegram</button><div id="telegram-login-slot"></div>`}<button type="button" data-action="account-logout">Wyloguj się</button></section>` : ""}`;
}
function mobileNav(route) {
  const active = [
    "product",
    "mix",
    "home-old",
    "catalog-old",
    "home",
    "catalog",
    "checkout",
    "checkout-old",
    "checkout-delivery",
    "order-accepted",
  ].includes(route)
    ? "catalog"
    : route === "opening"
      ? "bonus"
      : route;
  return `<nav class="m-bottom-nav" aria-label="Główna nawigacja mobilna">${[
    ["referrals", "referral", "Polecenia"],
    ["bonus", "bonus", "Bonusy"],
    ["catalog", "catalog", "Katalog"],
    ["cart", "cart", "Koszyk"],
    ["wishlist", "heart", "Wybrane"],
  ]
    .map(
      ([id, icon, label]) =>
        `<a href="#${id === "catalog" ? "home" : id}" class="${active === id ? "active" : ""}${id === "catalog" ? " m-nav-catalog" : ""}" ${active === id ? 'aria-current="page"' : ""}>${icon === "heart" ? sysIcon("heart", "m-nav-heart-image") : sysIcon("icon-" + icon)}<span>${label}</span></a>`,
    )
    .join("")}</nav>`;
}
function mobileHero() {
  return '<section class="m-hero"><h1>Elektronika na każdy dzień!</h1><p>Miejsce, gdzie znajdziesz wszystko czego<br>potrzebujesz!</p><div class="m-hero-dots" aria-hidden="true"></div></section>';
}
function mobileSection(title, subtitle = "", back = false) {
  return `<div class="m-section"><div class="m-section-title">${back ? '<a class="m-back-circle" href="#home" aria-label="Wróć do kategorii">❮</a>' : ""}<h2 class="m-pill">${title}</h2></div>${subtitle ? `<p>${subtitle}</p>` : ""}</div>`;
}
function mobileHome() {
  const categories = homeCategoryList();
  const featured = products.slice(0, 6);
  return `<div class="m-home"><div class="hero-grid m-home-banners"><a class="hero-main" href="#catalog" aria-label="Gorąca wyprzedaż NOVA">${img("hero-sale", "GORĄCA WYPRZEDAŻ NOVA", "", { eager: true })}</a><a class="hero-small" href="#catalog" aria-label="Nowości">${img("hero-news", "NOWOŚCI W SMOKE ISLAND", "", { eager: true })}</a><a class="hero-small" href="#catalog">${img("hero-delivery", `DARMOWA DOSTAWA · Od ${FREE_SHIPPING} zł`, "", { eager: true })}</a></div>${mobileSection("Kategorie", "Wybierz kategorię i zamów w kilka minut!")}<section class="m-categories" aria-label="Kategorie">${
    categories
      .map((cat) => categoryTileHTML(cat, "category-tile"))
      .join("") || '<p class="muted">Katalog ładuje się…</p>'
  }</section>${mobileSection("Popularne produkty", "Najczęściej wybierane produkty")}<div class="product-grid home-product-grid m-home-products">${featured.map(productCard).join("") || '<p class="muted">Katalog ładuje się…</p>'}</div>${mobileSection("Informacja", "Promocje, nowości i ważne informacje!")}<div class="m-promo-carousel" aria-label="Promocje"><a href="#catalog"><img src="assets/mobile-sale-custom.png" alt="Gorąca wyprzedaż"></a><a class="m-promo-news" href="#catalog"><img src="assets/mobile-about-custom.png" alt="O nas — Smoke Island"></a></div></div>`;
}
const mobilePriceRail = (qty = 1) => {
  const tiers = [1, 3, 5, 10, 20, 50, 100];
  let level = 0;
  tiers.forEach((threshold, index) => {
    if (qty >= threshold) level = index;
  });
  const progress = (level / (tiers.length - 1)) * 100;
  return `<div class="m-price-rail" style="--smart-progress:${progress}%" role="img" aria-label="Smart Cena: ${qty} szt., poziom ${level + 1} z ${tiers.length}"><span class="m-rail-fill" aria-hidden="true"></span>${[0, 1, 2, 3, 4, 5].map((i) => `<i class="${(i / 5) * 100 <= progress ? "current" : ""}"></i>`).join("")}</div>`;
};
function mobileProductCard(p, mode = "catalog", index = -1) {
  const [id, name, , rawBadge, bestseller] = p;
  const sid = esc(id),
    sname = esc(name);
  const badge = rawBadge || "";
  const item = index >= 0 ? state.cart[index] : null;
  const qty = mode === "product" ? mobileTotal() : item?.qty || 1;
  const price = item
    ? cartUnitPrice(item)
    : unitPrice(qty, productBasePrice(id));
  const liked = state.wishlist.includes(id);
  const n = Object.values(item?.flavors || {}).filter((x) => x > 0).length;
  return `<article class="m-product-card ${mode === "cart" ? "is-cart" : ""} ${item?.demoReward ? "is-demo-reward" : ""} ${mode !== "cart" && (badge || bestseller) ? "has-badge" : ""}" data-id="${sid}"><h3>${sname}</h3>${mode === "cart" ? `<button class="m-remove" data-action="m-remove" data-i="${index}" aria-label="Usuń ${sname}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></svg></button>` : `<button class="m-card-heart ${liked ? "saved" : ""}" data-action="favorite" data-id="${sid}" aria-label="Dodaj ${sname} do wybranych" aria-pressed="${liked}">${sysIcon("heart")}</button>`}${mode !== "cart" && bestseller ? '<span class="m-hit"><b>✦</b> HIT SPRZEDAŻY</span>' : ""}${mode !== "cart" && badge ? `<div class="m-product-message ${badge === "PROMOCJA" ? "is-sale" : ""}"><strong>${badge === "PROMOCJA" ? '<svg class="m-status-icon" viewBox="0 0 24 28" aria-hidden="true"><path fill="currentColor" d="M13 0c2 7-3 8-2 13 2-1 3-3 3-5 7 5 11 15 3 19 1-4-1-6-3-8 0 4-5 4-3 9C0 26-2 17 4 10c-1 5 1 6 2 7C4 9 14 8 13 0Z"/></svg> PROMOCJA' : '<span class="m-new-sparkles" aria-hidden="true">✦</span> NOWOŚĆ'}</strong><small>• ${badge === "PROMOCJA" ? "Najlepszy moment na zakup!" : "Sprawdź pierwszy!"}</small></div>` : ""}<div class="m-card-smart"><button class="m-smart-label" data-action="${item?.demoReward ? "mb-reward-info" : mode === "cart" ? "m-open-smart" : "m-smart-info"}" data-i="${index}">${item?.demoReward ? "NAGRODA DEMO" : "SMART CENA"} <span>i</span></button>${mode === "cart" && !item?.demoReward ? `<button class="m-lower-price" data-action="m-open-smart" data-i="${index}">OBNIŻ CENĘ ›</button>${mobilePriceRail(qty)}` : mobilePriceRail(qty)}</div>${productArt(id, name, "m-card-image")}${mode === "catalog" ? `<button class="m-choose" data-action="m-product" data-id="${sid}">WYBIERZ WARIANT</button>` : mode === "product" ? `<div class="m-card-quantity">Ilość: <output>${qty}</output></div>` : `<div class="m-chosen"><p>Wybrane warianty <span>[${n}]</span></p><button data-action="${item?.demoReward ? "mb-reward-info" : "m-open-smart"}" data-i="${index}">Zobaczyć${item?.demoReward ? " · podgląd" : ""}</button></div>`}<p class="m-card-price">${mode === "cart" ? `${qty} SZT. <b class="blue">• &nbsp;${money(item ? cartItemTotal(item) : qty * price)}</b>` : `${mode === "product" ? qty : qty || 1} SZT. - <b class="${badge === "PROMOCJA" ? "sale-price" : ""}">${money(price)}</b>`}</p></article>`;
}
function mobileWishlist() {
  const list = products.filter((p) => state.wishlist.includes(p[0]));
  return `<div class="mw-page"><div class="m-cart-heading"><h1>Wybrane</h1><p>Twoje ulubione produkty</p></div>${list.length ? `<div class="product-grid home-product-grid mw-products">${list.map(productCard).join("")}</div>` : '<div class="me-empty"><img src="assets/wishlist-empty.png" alt="Puste wybrane produkty"><h2>Twoje wybrane są puste</h2><p>Dodaj produkty z katalogu.</p></div>'}<a class="m-primary me-continue" href="#catalog">ZOBACZ KATALOG</a></div>`;
}
function mobileCatalog(wishlist = false) {
  if (wishlist) return mobileWishlist();
  const list = products.filter(
    (p) => category === "Wszystkie" || p[2] === category,
  );
  const preferred = ["moon", "raya", "bc"];
  const ordered = [...list].sort((a, b) => {
    const ai = preferred.indexOf(a[0]),
      bi = preferred.indexOf(b[0]);
    return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
  });
  const empty = catalogUnavailable
    ? "Katalog jest chwilowo niedostępny."
    : "Ładowanie katalogu…";
  return `${mobileHero() + mobileSection(category === "Wszystkie" ? "Wszystkie produkty" : esc(category), "Najlepsze modele w jednym miejscu!", true)}<section class="m-product-list" aria-label="Produkty">${ordered.length ? ordered.map((p) => mobileProductCard(p)).join("") : `<div class="m-empty"><p>${empty}</p><a class="m-primary" href="#catalog">ZOBACZ KATALOG</a></div>`}</section>`;
}
function mobileFlavorRows(
  values,
  actionPrefix = "m-flavor",
  selectedOnly = false,
  productId = state.selectedProduct,
) {
  const labels = productVariantNames(productId);
  let entries = selectedOnly
    ? Object.keys(values)
        .filter((i) => values[i] > 0)
        .map(Number)
    : labels.map((_, i) => i);
  if (!entries.length) return '<p class="muted">Brak aktywnych wariantów.</p>';
  return entries
    .map((i) => {
      const raw = labels[i] || "Wariant";
      const label = esc(raw);
      const qty = values[i] || 0;
      const color = flavorColor(raw, i);
      const selected = qty > 0;
      return compactHTML(`
        <div class="m-flavor-row ${selected ? "is-selected" : ""}" style="--flavor-color:${color}">
          <span class="flavor-swatch" style="--flavor:${color}" aria-hidden="true"></span>
          <span class="m-flavor-name">${label}</span>
          <div class="m-flavor-stepper" role="group" aria-label="Ilość ${label}">
            <button type="button" data-action="${actionPrefix}-minus" data-i="${i}" aria-label="Mniej ${label}">−</button>
            <output>${qty}</output>
            <button type="button" data-action="${actionPrefix}-plus" data-i="${i}" aria-label="Więcej ${label}">+</button>
          </div>
        </div>
      `);
    })
    .join("");
}
function mobileProduct() {
  if (!products.length) {
    return `<section class="mp-page"><p class="muted">${catalogUnavailable ? "Katalog jest chwilowo niedostępny." : "Ładowanie produktu…"}</p></section>`;
  }
  const p = productById(state.selectedProduct);
  const qty = mobileTotal();
  const picked = Object.values(mobileQuantities).filter((v) => v > 0).length;
  const base = productBasePrice(p[0]);
  const price = unitPrice(Math.max(1, qty), base);
  const saving = Math.max(0, (base - price) * qty);
  const variants = productVariantNames(p[0]).length;

  return compactHTML(`
    <section class="mp-page">
      <a class="mp-back" href="#catalog">← Katalog</a>
      <header class="mp-hero">
        <div class="mp-hero-media">${productArt(p[0], p[1])}</div>
        <div class="mp-hero-copy">
          <p class="mp-kicker">${esc(p[2] || "Produkt")}</p>
          <h1>${esc(p[1])}</h1>
          <p class="mp-price-line">
            <strong>${money(price)}</strong>
            <span>/ szt.${qty ? ` · ${qty} szt.` : ""}</span>
          </p>
          ${saving > 0 ? `<p class="mp-save">Oszczędzasz ${money(saving)}</p>` : `<p class="mp-hint">Im więcej sztuk, tym niższa cena</p>`}
        </div>
      </header>

      <div class="mp-section-head">
        <div>
          <h2>Wybierz smaki</h2>
          <p>${variants} wariantów · ustaw ilość przy wybranych</p>
        </div>
        <span class="mp-picked ${picked ? "" : "is-empty"}">${picked ? `${picked} wybrane` : "0 wybranych"}</span>
      </div>

      <label class="mp-search">
        <span class="sr-only">Szukaj smaku</span>
        <input id="mobile-flavor-filter" type="search" value="${esc(flavorFilter)}" placeholder="Szukaj smaku…" autocomplete="off" spellcheck="false">
      </label>

      <section class="m-flavor-list mp-flavor-list ${qty ? "with-selection" : ""}" id="mobile-flavors" aria-label="Wybór wariantów">
        ${mobileFilteredFlavorRows()}
      </section>

      <div class="mp-dock">
        <div class="mp-dock-meta">
          <strong>${qty || 0} szt.</strong>
          <span>${money(price * Math.max(qty, 0))}</span>
        </div>
        <button class="m-primary" data-action="m-add-cart" ${qty < 1 ? "disabled" : ""}>
          Dodaj do koszyka
        </button>
      </div>
    </section>
  `);
}
function mobileFilteredFlavorRows() {
  const labels = productVariantNames(state.selectedProduct);
  const q = flavorFilter.trim().toLowerCase();
  const values = mobileQuantities;
  const entries = labels
    .map((raw, i) => ({ raw, i }))
    .filter(({ raw }) => !q || String(raw).toLowerCase().includes(q));
  if (!labels.length) return '<p class="muted">Brak aktywnych wariantów.</p>';
  if (!entries.length) return '<p class="muted">Brak smaków dla tego wyszukiwania.</p>';
  return entries
    .map(({ raw, i }) => {
      const label = esc(raw);
      const qty = values[i] || 0;
      const color = flavorColor(raw, i);
      return compactHTML(`
        <div class="m-flavor-row ${qty ? "is-selected" : ""}" style="--flavor-color:${color}">
          <span class="flavor-swatch" style="--flavor:${color}" aria-hidden="true"></span>
          <span class="m-flavor-name">${label}</span>
          <div class="m-flavor-stepper" role="group" aria-label="Ilość ${label}">
            <button type="button" data-action="m-flavor-minus" data-i="${i}" aria-label="Mniej ${label}">−</button>
            <output>${qty}</output>
            <button type="button" data-action="m-flavor-plus" data-i="${i}" aria-label="Więcej ${label}">+</button>
          </div>
        </div>
      `);
    })
    .join("");
}
function mobileCart() {
  if (!state.cart.length)
    return `<div class="m-cart-heading"><h1>Twój Koszyk</h1><p>0 kategorie • 0 produkty • 0 pozycji</p></div><section class="me-frame"><div class="me-empty"><img src="assets/empty-basket.png" alt="Pusty koszyk"><h2>Twój koszyk jest pusty</h2><p>Dodaj produkty z katalogu i złóż zamówienie.</p></div><a class="m-primary me-continue" href="#catalog">KONTYNUUJ ZAKUPY</a></section>`;
  const list = state.cart
    .map((item, i) => ({ item, i }))
    .filter(
      ({ item }) =>
        mobileCartCategory === "Wszystkie" ||
        productById(item.id)[2] === mobileCartCategory,
    );
  return `<div class="m-cart-heading"><h1>Twój Koszyk</h1><p>${new Set(state.cart.map((p) => productById(p.id)[2])).size} kategorie • ${state.cart.length} produkty • ${cartCount()} pozycji</p></div><div class="m-cart-filter"><label for="m-cart-category">Kategorie:</label><select id="m-cart-category">${["Wszystkie", ...new Set(state.cart.map((p) => productById(p.id)[2]))].map((c) => `<option value="${c}" ${mobileCartCategory === c ? "selected" : ""}>${c === "Wszystkie" ? "Wszystkie produkty" : c}</option>`).join("")}</select><span aria-hidden="true">⌄</span></div><section class="m-cart-items" aria-label="Produkty w koszyku">${list.length ? list.map(({ item, i }) => mobileProductCard(productById(item.id), "cart", i)).join("") : '<p class="m-empty">Koszyk jest pusty.</p>'}<a class="m-primary m-add-other" href="#catalog">DODAĆ INNY PRODUKT</a></section>${state.cart.length ? '<div class="m-fixed-action"><button class="m-primary" data-action="m-cart-checkout">PRZEJŚĆ DO PODSUMOWANIA</button></div>' : ""}`;
}
function mobileSmartMarkup() {
  const item = state.cart[mobileSheetIndex];
  if (!item) return "";
  const n = item.qty,
    base = productBasePrice(item.id),
    price = unitPrice(n, base),
    active = n >= 3,
    max = n >= 100,
    next = [1, 3, 5, 10, 20, 50, 100].find((t) => t > n) || 100,
    difference = Math.max(0, next - n),
    saving = (base - price) * n,
    nextPrice = unitPrice(next, base);
  return `<div class="m-sheet-scroll"><header class="m-sheet-head"><span class="m-sheet-product-crop">${productArt(item.id, productById(item.id)[1])}</span><div><h2>${esc(productById(item.id)[1])}</h2><h3>Wybrane warianty</h3><span class="m-smart-status ${active ? "active" : ""}">Smart Cena ${active ? "aktywna" : "nie aktywna"}</span></div><button class="m-sheet-close" data-action="m-close-smart" aria-label="Zamknij panel Smart Cena">×</button></header><div class="m-sheet-flavors">${mobileFlavorRows(item.flavors, "m-sheet", true, item.id)}</div>${active ? `<div class="m-active-price"><span class="m-tick">✓</span><div><strong>${max ? "Najlepsza cena aktywna!" : "Smart Cena aktywna!"}</strong><p>${max ? "Osiągnąłeś maksymalny próg cenowy" : `Nowa cena: ${money(price)}/szt`}</p></div><b>${money(price)}<small>/szt</small></b></div>` : ""}<section class="m-smart-panel ${max ? "is-max" : ""}"><header><div><h3><b>★</b> SMART CENA</h3><p>Więcej kupisz - mniej płacisz</p></div><span class="m-savings ${!active ? "inactive" : ""}">${max ? "MAX" : `oszczędność ${money(saving)}`}</span></header><p class="m-threshold">${n}<small>/ ${next} szt.</small></p><div class="m-smart-track"><i style="width:${max ? 100 : Math.min(100, (n / next) * 100)}%"></i>${max ? "" : `<b style="left:${Math.min(100, (n / next) * 100)}%"></b>`}</div><div class="m-next-tier">${max ? `<span>✓ Maksymalny próg osiągnięty</span><b>−${money(saving)} oszczędności</b>` : `jeszcze <b>${difference} szt.</b> do niższej ceny`}</div><div class="m-price-comparison"><div><span>${max ? "Było" : "Teraz"}</span><strong class="${max ? "crossed" : ""}">${money(max ? base : price)}</strong><small>za szt.</small></div><span class="m-price-arrow">→</span><div><span>${max ? "Teraz" : `Po dodaniu +${difference}`}</span><strong class="${max ? "green" : "blue"}">${money(max ? price : nextPrice)}</strong><small>za szt.</small></div><div class="m-comparison-saving"><span>${max ? "Oszczędności" : "Oszczędzasz"}</span><strong>${money(max ? saving : (base - nextPrice) * next)}</strong><small>na zamów.</small></div></div>${max ? "" : `<p class="m-mix-help">• możesz dobrać dowolny wariant tego modelu</p><button class="m-primary" data-action="m-sheet-add">DODAJ +${Math.min(difference, 2) || 1} SZT. I OBNIŻ CENĘ</button><button class="m-secondary" data-action="m-sheet-mix">MIX - dodaj automatycznie</button><p class="m-mix-help">MIX automatycznie dobierze wariant do tego modelu</p>`}</section></div>`;
}
function mobileMinimumOrder() {
  const missing = Math.max(0, 2 - cartCount());
  const d = $("#mobile-smart");
  d.classList.add("is-minimum-order");
  d.innerHTML = `<div class="m-minimum-order"><button class="m-sheet-close" data-action="m-close-smart" aria-label="Zamknij">×</button><span class="m-minimum-icon" aria-hidden="true">i</span><h2>Minimalne zamówienie</h2><p>Aby przejść do podsumowania, musisz mieć<br>minimum 2 sztuki dowolnych produktów.</p><div class="m-minimum-missing"><span>♧ &nbsp; Brakuje jeszcze:</span><b>${missing} szt.</b></div><p>Możesz dodać kolejny wariant lub inny produkt.</p><button class="m-primary" data-action="m-minimum-add">DODAJ JESZCZE ${missing} SZT. <span>›</span></button><button class="m-secondary" data-action="m-close-smart">ZOSTAŃ W KOSZYKU</button></div>`;
  d.showModal();
  document.body.classList.add("smart-sheet-open");
  d.onclose = () => {
    d.classList.remove("is-minimum-order");
    document.body.classList.remove("smart-sheet-open");
    render();
  };
}
function showMobileSmart(index) {
  mobileSheetIndex = index;
  const d = $("#mobile-smart");
  d.classList.remove("is-minimum-order");
  d.innerHTML = mobileSmartMarkup();
  d.showModal();
  document.body.classList.add("smart-sheet-open");
  d.onclose = () => {
    mobileSheetIndex = -1;
    document.body.classList.remove("smart-sheet-open");
    render();
  };
}
function refreshMobileSmart() {
  const d = $("#mobile-smart"),
    scroll = $(".m-sheet-scroll", d)?.scrollTop || 0;
  d.innerHTML = mobileSmartMarkup();
  if ($(".m-sheet-scroll", d)) $(".m-sheet-scroll", d).scrollTop = scroll;
  save();
}
function adjustSheetFlavor(index, delta) {
  const item = state.cart[mobileSheetIndex];
  if (!item) return;
  item.flavors = { ...(item.flavors || {}) };
  const sum = Object.values(item.flavors).reduce((a, b) => a + b, 0);
  if (sum !== item.qty) {
    const first = Object.keys(item.flavors)[0] || "0";
    item.flavors = { [first]: item.qty };
  }
  const next = (item.flavors[index] || 0) + delta;
  if (next < 0 || next > 999 || item.qty + delta < 1) return;
  if (delta > 0 && !canAddStock(item.id, { [index]: delta })) return;
  item.flavors[index] = next;
  item.qty += delta;
  refreshMobileSmart();
}
function desktopWishlist() {
  const list = products.filter((p) => state.wishlist.includes(p[0]));
  if (!list.length) {
    return `<div class="desktop-empty-cart desktop-empty-wishlist"><header class="dec-heading"><div>${breadcrumb("Wybrane")}<h1>Wybrane</h1><p>0 ulubionych produktów</p></div>${banner()}</header><section class="dec-frame"><div class="dec-visual"><div class="dec-art"><img src="assets/wishlist-empty.png" alt="Puste wybrane produkty"></div><a class="primary dec-continue" href="#catalog">ZOBACZ KATALOG</a></div><div class="dec-message"><h2>Twoje wybrane są puste</h2><p>Dodaj produkty z katalogu do ulubionych.</p></div></section></div>`;
  }
  return `${breadcrumb("Wybrane")}<div class="page wishlist-page">${pageHead("Wybrane produkty", "Twoje ulubione produkty z katalogu.")}<div class="product-grid">${list.map(productCard).join("")}</div></div>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b || !b.dataset.action.startsWith("m-")) return;
  e.preventDefault();
  if (b.hasAttribute("data-add-bonus-reward")) {
    e.preventDefault();
    addBonusRewardToCart(b.dataset.addBonusReward);
    return;
  }
  if (b.hasAttribute("data-add-bonus-reward")) {
    e.preventDefault();
    addBonusRewardToCart(b.dataset.addBonusReward);
    return;
  }
  const a = b.dataset.action,
    i = Number(b.dataset.i);
  switch (a) {
    case "m-checkout-methods":
      mobileCheckoutMethods();
      break;
    case "m-cart-checkout":
      if (cartCount() < 2) mobileMinimumOrder();
      else location.hash = "checkout";
      break;
    case "m-minimum-add": {
      const d = $("#mobile-smart");
      d.addEventListener(
        "close",
        () => {
          if (state.cart.length) showMobileSmart(0);
          else location.hash = "catalog";
        },
        { once: true },
      );
      d.close();
      break;
    }
    case "m-product":
      state.selectedProduct = b.dataset.id;
      mobileQuantities = {};
      save();
      if (location.hash === "#product") render();
      else location.hash = "product";
      break;
    case "m-flavor-plus":
      if (
        !canSelectStock(
          state.selectedProduct,
          i,
          (mobileQuantities[i] || 0) + 1,
        )
      )
        return;
      mobileQuantities[i] = Math.min(999, (mobileQuantities[i] || 0) + 1);
      renderMobileProductUpdate();
      break;
    case "m-flavor-minus":
      mobileQuantities[i] = Math.max(0, (mobileQuantities[i] || 0) - 1);
      renderMobileProductUpdate();
      break;
    case "m-add-cart": {
      const n = mobileTotal();
      if (!n) return;
      if (
        addCartProduct(state.selectedProduct, { ...mobileQuantities }) === false
      )
        return;
      save();
      location.hash = "cart";
      toast("Produkt dodany do koszyka");
      break;
    }
    case "m-remove":
      state.cart.splice(i, 1);
      save();
      render();
      break;
    case "m-open-smart":
      showMobileSmart(i);
      break;
    case "m-close-smart":
      $("#mobile-smart").close();
      break;
    case "m-sheet-plus":
      adjustSheetFlavor(i, 1);
      break;
    case "m-sheet-minus":
      adjustSheetFlavor(i, -1);
      break;
    case "m-sheet-add": {
      const item = state.cart[mobileSheetIndex],
        next = [1, 3, 5, 10, 20, 50, 100].find((t) => t > item.qty) || 100;
      const count = Math.min(2, next - item.qty);
      for (let k = 0; k < count; k++)
        adjustSheetFlavor(Number(Object.keys(item.flavors)[0] || 0), 1);
      break;
    }
    case "m-sheet-mix": {
      const item = state.cart[mobileSheetIndex];
      const next = [1, 3, 5, 10, 20, 50, 100].find((t) => t > item.qty);
      if (!next) return;
      const count = next - item.qty;
      for (let k = 0; k < count; k++)
        adjustSheetFlavor(k % Math.max(1, variantsFor(item.id).length), 1);
      break;
    }
    case "m-smart-info":
      dialog(
        "Smart Cena",
        "Im więcej kupisz, tym mniej zapłacisz za sztukę. Wybierz smaki i ilość, aby zobaczyć aktualną cenę.",
      );
      break;
  }
});
function renderMobileProductUpdate() {
  const page = $(".mp-page");
  const list = $("#mobile-flavors");
  if (page && list) {
    const scroll = list.scrollTop;
    const focus = document.activeElement?.closest("[data-action]");
    const action = focus?.dataset.action;
    const index = focus?.dataset.i;
    const qty = mobileTotal();
    const picked = Object.values(mobileQuantities).filter((v) => v > 0).length;
    const base = productBasePrice(state.selectedProduct);
    const price = unitPrice(Math.max(1, qty), base);
    const saving = Math.max(0, (base - price) * qty);

    list.innerHTML = mobileFilteredFlavorRows();
    list.scrollTop = scroll;

    const pickedEl = $(".mp-picked");
    if (pickedEl) {
      pickedEl.textContent = picked ? `${picked} wybrane` : "0 wybranych";
      pickedEl.classList.toggle("is-empty", !picked);
    }
    const priceLine = $(".mp-price-line");
    if (priceLine) {
      priceLine.innerHTML = `<strong>${money(price)}</strong><span>/ szt.${qty ? ` · ${qty} szt.` : ""}</span>`;
    }
    const saveEl = $(".mp-save, .mp-hint");
    if (saveEl) {
      saveEl.className = saving > 0 ? "mp-save" : "mp-hint";
      saveEl.textContent =
        saving > 0
          ? `Oszczędzasz ${money(saving)}`
          : "Im więcej sztuk, tym niższa cena";
    }
    const dockMeta = $(".mp-dock-meta");
    if (dockMeta) {
      dockMeta.innerHTML = `<strong>${qty || 0} szt.</strong><span>${money(price * Math.max(qty, 0))}</span>`;
    }
    const addBtn = $('.mp-dock [data-action="m-add-cart"]');
    if (addBtn) addBtn.disabled = qty < 1;
    list.classList.toggle("with-selection", qty > 0);

    if (action)
      $(`[data-action="${action}"][data-i="${index}"]`)?.focus({
        preventScroll: true,
      });
    return;
  }

  let scroll = $(".m-flavor-list")?.scrollTop || 0;
  const focus = document.activeElement?.closest("[data-action]");
  const action = focus?.dataset.action,
    index = focus?.dataset.i;
  if (Number(index) < 2 && scroll < 60) scroll = 0;
  const y = window.scrollY;
  render();
  if ($(".m-flavor-list")) $(".m-flavor-list").scrollTop = scroll;
  if (action)
    $(`[data-action="${action}"][data-i="${index}"]`)?.focus({
      preventScroll: true,
    });
  window.scrollTo(0, y);
}
document.addEventListener("change", (e) => {
  if (e.target.id === "m-cart-category") {
    mobileCartCategory = e.target.value;
    render();
  }
});
if (typeof window.matchMedia === "function")
  window.matchMedia("(max-width: 720px)").addEventListener("change", () => {
    if ($("#mobile-smart")?.open) $("#mobile-smart").close();
    render();
  });

// Support messages are stored by the API and synchronized into this chat.
const supportIcons = {
  chat: '<path d="M21 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 1 1 17-5Z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4L22 2Z"/><path d="m11 13 6-6"/>',
  clip: '<path d="m8 13 7-7a3 3 0 0 1 4 4L9 20a5 5 0 0 1-7-7L13 2a7 7 0 0 1 10 10L12 23" transform="translate(1 0) scale(.85)"/>',
  image:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.4"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
  smile:
    '<circle cx="12" cy="12" r="10"/><path d="M7 14c1 5 9 5 10 0M8 8h.1M16 8h.1"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.1"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  minus: '<path d="M5 12h14"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  box: '<path d="m12 2 10 5v10l-10 5-10-5V7l10-5Zm0 10v10M2 7l10 5 10-5M7 4l10 5"/>',
  percent:
    '<path d="m5 20 14-16"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/>',
  truck:
    '<path d="M1 5h13v12H1Zm13 5h5l4 4v3h-9"/><circle cx="5" cy="19" r="3"/><circle cx="18" cy="19" r="3"/>',
  order: '<path d="M6 2h9l5 5v15H4V2h2Zm9 0v6h5M8 12h8M8 16h8"/>',
};
