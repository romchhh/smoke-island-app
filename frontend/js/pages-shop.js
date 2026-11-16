/* ==========================================================================
 * js/pages-shop.js — Home, catalog, product, cart, checkout, delivery pages
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

function compactHTML(html) {
  return String(html).replace(/>\s+</g, "><").trim();
}

const FLAVOR_PALETTE = [
  "#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#38d9a9",
  "#4dabf7", "#748ffc", "#da77f2", "#f783ac", "#ff8787",
  "#20c997", "#15aabf", "#845ef7", "#e64980", "#fd7e14",
];

function flavorColor(name, index = 0) {
  const n = String(name || "").toLowerCase();
  const rules = [
    [/grape|jagod|berry|blueberry|blackcurrant|currant|porzeczk/, "#9b5de5"],
    [/mint|mi[eę]t|menthol|ice|frost|frozen|ch[lł]od/, "#20c997"],
    [/lemon|cytr|lime|citrus|lemoniad/, "#fcc419"],
    [/cherry|wi[sś]n|cranberry|pomegranate|granat/, "#f03e3e"],
    [/mango|peach|brzoskw|apricot|orange|fanta|pomara[nń]/, "#ff922b"],
    [/apple|jab[lł]|pear|gruszk/, "#51cf66"],
    [/banana|melon|watermelon|arbuz|ananas|pineapple/, "#94d82d"],
    [/coconut|cola|coffee|tobacco|vanilla|wanili/, "#e8590c"],
    [/aloe|kiwi|green|forest/, "#37b24d"],
    [/dragon|pink|strawberry|trusk|malin|raspberry/, "#f06595"],
    [/blue|niebies|ocean|breeze/, "#339af0"],
    [/grape\s*slush|slush|fizzy/, "#9775fa"],
  ];
  for (const [re, color] of rules) if (re.test(n)) return color;
  let h = 2166136261;
  for (const c of n) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return FLAVOR_PALETTE[(h + Number(index || 0)) % FLAVOR_PALETTE.length];
}

function flavorSwatch(name, index = 0) {
  const color = flavorColor(name, index);
  return `<span class="flavor-swatch" style="--flavor:${color}" aria-hidden="true"></span>`;
}


function home() {
  if (isMobile()) return mobileHome();
  const categories = homeCategoryList();
  const featured = products.slice(0, 8);
  return `<div class="page home-page"><div class="hero-grid"><a class="hero-main" href="#catalog" aria-label="Gorąca wyprzedaż NOVA">${img("hero-sale", "GORĄCA WYPRZEDAŻ NOVA", "", { eager: true })}</a><a class="hero-small" href="#catalog" aria-label="Nowości">${img("hero-news", "NOWOŚCI W SMOKE ISLAND", "", { eager: true })}</a><a class="hero-small" href="#catalog">${img("hero-delivery", `DARMOWA DOSTAWA · Od ${FREE_SHIPPING} zł`, "", { eager: true })}</a></div><div class="section-row"><h2 class="section-title">Kategorie</h2><a class="section-link" href="#catalog">Wszystkie produkty ⟶</a></div><div class="categories">${
    categories.map((cat) => categoryTileHTML(cat, "desktop")).join("") ||
    '<p class="muted">Katalog ładuje się…</p>'
  }</div><div class="section-row"><h2 class="section-title">Popularne produkty</h2><a class="section-link" href="#catalog">Zobacz wszystkie ⟶</a></div><div class="product-grid home-product-grid">${featured.map(productCard).join("") || '<p class="muted">Katalog ładuje się…</p>'}</div></div>`;
}

function productCard(p) {
  const [id, name, cat, badge, bestseller] = p;
  const sid = esc(id),
    sname = esc(name),
    scat = esc(cat || "");
  const wish = state.wishlist.includes(id);
  const price = productBasePrice(id);
  const promo = badge === "PROMOCJA";
  const oldPrice = promo ? Math.round(price * 1.08 * 100) / 100 : null;
  const tags = [
    badge === "NOWOŚĆ" ? "Nowość" : "",
    bestseller ? "Hit sprzedaży" : "",
  ].filter(Boolean);
  return `<article class="product-card" data-id="${sid}"><div class="product-card-media">${promo ? `<span class="badge badge-discount">-8%</span>` : ""}<button type="button" class="heart ${wish ? "saved" : ""}" data-action="favorite" data-id="${sid}" aria-label="${wish ? "Usuń z wybranych: " : "Dodaj do wybranych: "}${sname}" aria-pressed="${wish}">${sysIcon("heart")}</button><a class="product-card-image" href="#product" data-product="${sid}" aria-label="${sname}">${productArt(id, name)}</a>${tags.length ? `<div class="product-card-tags">${tags.map((t) => `<span class="product-tag ${t === "Nowość" ? "is-new" : "is-hit"}">${esc(t)}</span>`).join("")}</div>` : ""}</div><div class="product-card-body"><h3><a href="#product" data-product="${sid}">${sname}</a><svg class="product-card-arrow" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 17.6 15.6 9H10V7h9v9h-2v-5.6L8.4 19.4 7 17.6Z"/></svg></h3>${scat ? `<p class="product-card-cat">${scat}</p>` : ""}<div class="product-card-footer"><div class="product-card-price">${oldPrice ? `<span class="price-old">${money(oldPrice)}</span>` : ""}<span class="price">${money(price)}</span></div><a class="product-card-cta" href="#product" data-product="${sid}"><span>Wybierz</span><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 17.6 15.6 9H10V7h9v9h-2v-5.6L8.4 19.4 7 17.6Z"/></svg></a></div></div></article>`;
}

function catalogPagination(page, total) {
  if (total <= 1) return "";
  const visible = [
    ...new Set([
      1,
      total,
      ...Array.from({ length: 5 }, (_, i) => page - 2 + i).filter(
        (n) => n > 0 && n <= total,
      ),
    ]),
  ].sort((a, b) => a - b);
  return `<nav class="pagination" aria-label="Strony katalogu"><button data-page="${Math.max(1, page - 1)}" ${page === 1 ? "disabled" : ""} aria-label="Poprzednia strona">‹</button>${visible.map((n, i) => `${i && n - visible[i - 1] > 1 ? '<span class="pagination-gap" aria-hidden="true">…</span>' : ""}<button data-page="${n}" class="${page === n ? "active" : ""}" ${page === n ? 'aria-current="page"' : ""} aria-label="Strona ${n}">${n}</button>`).join("")}<button data-page="${Math.min(total, page + 1)}" ${page === total ? "disabled" : ""} aria-label="Następna strona">›</button></nav>`;
}
function catalog() {
  if (isMobile()) return mobileCatalog();
  const categories = categoryOptions();
  let list = products.filter(
    (p) => category === "Wszystkie" || p[2] === category,
  );
  if (sort === "name") list.sort((a, b) => a[1].localeCompare(b[1], "pl"));
  if (sort === "reverse") list.reverse();
  const pages = Math.max(1, Math.ceil(list.length / 14));
  catalogPage = Math.max(1, Math.min(catalogPage, pages));
  const visible = list.slice((catalogPage - 1) * 14, catalogPage * 14);
  return `${breadcrumb("Katalog", "Wszystkie produkty")}<div class="page catalog-page">${pageHead("Wszystkie produkty", "Sprawdź pełną ofertę i wybierz swój ulubiony wariant.")}<div class="catalog-tools"><div class="tabs" role="group" aria-label="Kategorie produktów">${categories.map((c) => `<button class="tab ${c === category ? "active" : ""}" data-action="filter" data-filter="${esc(c)}" aria-pressed="${c === category}">${esc(c)}</button>`).join("")}</div><label class="catalog-sort">Sortuj: <select id="sort" aria-label="Sortowanie produktów"><option value="popular" ${sort === "popular" ? "selected" : ""}>Popularność</option><option value="name" ${sort === "name" ? "selected" : ""}>Nazwa A–Z</option><option value="reverse" ${sort === "reverse" ? "selected" : ""}>Najnowsze</option></select><svg viewBox="0 0 16 12" aria-hidden="true"><path d="m3 4 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></label></div><section class="panel catalog-box"><p class="catalog-count">Znaleziono: <span class="blue">${list.length} produktów</span></p>${visible.length ? `<div class="product-grid">${visible.map(productCard).join("")}</div>` : '<p class="muted">Brak aktywnych produktów w tej kategorii.</p>'}</section>${catalogPagination(catalogPage, pages)}</div>`;
}

function filteredFlavorEntries() {
  const options = productVariantNames(state.selectedProduct),
    q = flavorFilter.trim().toLowerCase();
  return options
    .map((raw, i) => ({ raw, i }))
    .filter(({ raw }) => !q || String(raw).toLowerCase().includes(q));
}
function flavorPagerHTML(total) {
  const pages = Math.max(1, Math.ceil(total / 15));
  if (pages <= 1) return "";
  flavorPage = Math.max(0, Math.min(flavorPage, pages - 1));
  return `<div class="flavor-pager" role="navigation" aria-label="Strony wariantów"><button data-action="flavor-page" data-flavor-page="${Math.max(0, flavorPage - 1)}" aria-label="Poprzednia strona wariantów" ${flavorPage === 0 ? "disabled" : ""}>‹</button>${Array.from({ length: pages }, (_, i) => `<button class="${i === flavorPage ? "active" : ""}" data-action="flavor-page" data-flavor-page="${i}" aria-label="Strona wariantów ${i + 1}">${i + 1}</button>`).join("")}<button data-action="flavor-page" data-flavor-page="${Math.min(pages - 1, flavorPage + 1)}" aria-label="Następna strona wariantów" ${flavorPage === pages - 1 ? "disabled" : ""}>›</button></div>`;
}
function flavorToolsHTML() {
  const all = productVariantNames(state.selectedProduct).length;
  const entries = filteredFlavorEntries();
  const picked = Object.values(quantities).filter((v) => v > 0).length;
  const units = totalQty();
  const pickedLabel = picked
    ? `<span class="flavor-picked">${picked} wybrane · ${units} szt.</span>`
    : `<span class="flavor-picked is-empty">Nic nie wybrano</span>`;

  return compactHTML(`
    <div class="flavor-tools-head">
      <div class="flavor-tools-copy">
        <span class="flavor-step">1</span>
        <div>
          <strong>Wybierz warianty</strong>
          <p>Ustaw ilość przy smakach, które chcesz dodać</p>
        </div>
      </div>
      <span class="tag">${all} wariantów</span>
    </div>
    <div class="flavor-tools-bar">
      <label class="flavor-search">
        <span class="sr-only">Szukaj smaku</span>
        <input
          id="flavor-filter"
          type="search"
          value="${esc(flavorFilter)}"
          placeholder="Szukaj smaku…"
          autocomplete="off"
          spellcheck="false"
        >
      </label>
      <div class="flavor-tools-meta">
        ${pickedLabel}
        ${flavorPagerHTML(entries.length)}
      </div>
    </div>
  `);
}
function flavorsHTML() {
  const entries = filteredFlavorEntries();
  if (!productVariantNames(state.selectedProduct).length) {
    return '<p class="muted">Brak aktywnych wariantów.</p>';
  }
  if (!entries.length) {
    return '<p class="muted flavor-empty">Brak smaków dla tego wyszukiwania.</p>';
  }

  const start = mixMode ? flavorPage * 15 : 0;
  const count = mixMode ? 15 : entries.length;
  const slice = entries.slice(start, start + count);

  return slice
    .map(({ raw, i }) => {
      const f = esc(raw);
      const qty = quantities[i] || 0;
      const selected = mixMode ? qty > 0 : selectedFlavor === i;
      const color = flavorColor(raw, i);
      const hint = selected
        ? mixMode
          ? `${qty} szt. w zestawie`
          : "Wybrany smak"
        : "Dotknij, aby dodać";
      const qtyControls = mixMode
        ? `<div class="flavor-qty" role="group" aria-label="Ilość ${f}"><button type="button" data-action="flavor-minus" data-i="${i}" aria-label="Mniej ${f}">−</button><output aria-label="Ilość ${f}">${qty}</output><button type="button" data-action="flavor-plus" data-i="${i}" aria-label="Więcej ${f}">+</button></div>`
        : "";

      return compactHTML(`
        <div class="flavor ${selected ? "selected" : ""}" data-flavor-index="${i}" style="--flavor-color:${color}">
          <button type="button" class="flavor-pick" data-action="flavor" data-i="${i}" aria-label="Wybierz ${f}" aria-pressed="${selected ? "true" : "false"}">
            ${flavorSwatch(raw, i)}
            <span class="flavor-copy">
              <span class="flavor-name">${f}</span>
              <span class="flavor-hint">${hint}</span>
            </span>
            <span class="check" aria-hidden="true"></span>
          </button>
          ${qtyControls}
        </div>
      `);
    })
    .join("");
}
function smartHTML() {
  const base = productBasePrice(state.selectedProduct);
  const n = mixMode ? totalQty() : quantity;
  const price = unitPrice(n, base);
  const saving = (base - price) * n;
  const next = [1, 3, 5, 10, 20, 50, 100].find((t) => t > n);
  const percent = Math.min(100, (n / 100) * 100);
  const activeTier = [1, 3, 5, 10, 20, 50, 100]
    .filter((t) => t <= Math.max(1, n))
    .at(-1);

  const tiers = [1, 3, 5, 10, 20, 50, 100]
    .map(
      (t) => `
        <button
          class="tier ${t === activeTier ? 'active' : ''}"
          data-action="tier"
          data-qty="${t}"
          aria-label="Wybierz ${t} sztuk"
        >
          <span>${t} szt.</span>
          <strong class="${t >= 20 ? 'green' : ''}">${money(unitPrice(t, base))}</strong>
          <small>za szt.</small>
        </button>
      `,
    )
    .join('');

  const foot = next
    ? `jeszcze <b>${next - n} szt.</b> do niższej ceny`
    : 'Najlepsza cena za sztukę';

  const selectionOrQty = mixMode
    ? `
      <div class="selection-total">
        <div>
          <span class="selection-label">Twój zestaw</span>
          <b>${Object.values(quantities).filter((v) => v > 0).length} wariantów</b>
        </div>
        <strong>${n} <small>szt.</small></strong>
      </div>
    `
    : `
      <div class="quantity-line">
        <label for="quantity">3. Wybierz ilość</label>
        <div class="stepper">
          <button data-action="qty-minus" aria-label="Zmniejsz ilość">−</button>
          <input id="quantity" type="number" min="1" max="999" value="${quantity}" aria-label="Ilość produktów">
          <button data-action="qty-plus" aria-label="Zwiększ ilość">+</button>
        </div>
        <button class="text-btn" data-action="mix">MIX - dodaj automatycznie</button>
      </div>
      <button class="secondary" data-action="qty-plus">DODAJ +1 SZT. I OBNIŻ CENĘ</button>
    `;

  const note = mixMode
    ? ''
    : '<p class="note">• Mix wariantów możliwy w ramach wybranej ilości.</p>';

  return compactHTML(`
    <div class="smart-title">
      <div>
        <h2><span class="flavor-step">2</span> Smart Cena</h2>
        <p>Im więcej kupisz, tym mniej płacisz za sztukę</p>
      </div>
      <span class="save-pill">−${money(saving)}</span>
    </div>
    <div class="smart-progress">
      <div class="progress-label">${n} <small class="muted">/ 100 szt.</small></div>
      <div class="track">
        <div class="track-fill" style="width:${percent}%"></div>
        <input
          class="smart-range"
          type="range"
          min="1"
          max="100"
          value="${Math.max(1, n)}"
          aria-label="Ilość produktów Smart Cena"
        >
      </div>
      <p class="progress-foot">${foot}</p>
    </div>
    <div class="tiers">${tiers}</div>
    <div class="current-price">
      <div>
        <small>Cena teraz</small>
        <strong>${money(price)} / szt.</strong>
      </div>
      <div class="saving">
        <small>Oszczędzasz</small>
        <strong>${money(saving)}</strong>
        <span class="tiny">Przy zakupie ${n} sztuk</span>
      </div>
    </div>
    ${selectionOrQty}
    <button class="primary add-cart-btn" data-action="add-cart" ${n < 1 ? 'disabled' : ''}>
      Dodaj do koszyka
    </button>
    ${note}
  `);
}
function product() {
  if (isMobile()) return mobileProduct();
  if (!products.length) {
    const message = catalogUnavailable
      ? 'Katalog jest chwilowo niedostępny. Spróbuj odświeżyć stronę.'
      : 'Ładowanie produktu…';
    return compactHTML(`
      ${breadcrumb('Katalog', 'Produkt')}
      <div class="page">
        <section class="panel"><p class="muted">${message}</p></section>
      </div>
    `);
  }

  const p = productById(state.selectedProduct);
  return compactHTML(`
    ${breadcrumb('Katalog', esc(p[2]), esc(p[1]), 'Wybierz wariant')}
    <div class="page product-layout">
      <section class="panel flavor-panel">
        <div class="product-intro">
          <div class="product-intro-media">${productArt(p[0], p[1])}</div>
          <div>
            <div class="name">${esc(p[1])}</div>
            <h1>Wybierz smaki</h1>
            <p>Dodaj warianty i ilość — im więcej sztuk, tym niższa cena za sztukę.</p>
          </div>
          <span class="hit-badge">HIT</span>
        </div>
        <div class="flavor-tools">${flavorToolsHTML()}</div>
        <div class="flavor-grid" id="flavors">${flavorsHTML()}</div>
      </section>
      <section class="panel smart-panel" id="smart" aria-label="Smart Cena">
        ${smartHTML()}
      </section>
    </div>
  `);
}
function shippingProgress(subtotal) {
  const left = Math.max(0, FREE_SHIPPING - subtotal);
  return `<div class="shipping-progress"><div class="section-row"><span>Do darmowej dostawy</span><span>zostało <strong>${money(left)}</strong></span></div><div class="track"><div class="track-fill" style="width:${Math.min(100, (subtotal / FREE_SHIPPING) * 100)}%"></div></div><footer><span>${money(subtotal)}</span><span>${FREE_SHIPPING}zł <b class="free-tag">FREE</b></span></footer></div>`;
}
const promo = () =>
  '<div class="promo-field"><span>🎟</span><label for="promo">Masz kod promocyjny?</label><input id="promo" placeholder="Wpisz kod promocyjny" aria-label="Kod promocyjny"><button data-action="promo" aria-label="Zastosuj kod">◯</button></div>';
const cartStepper = (p, i) =>
  `<div class="stepper"><button data-action="cart-minus" ${p.demoReward || p.bonusReward ? "disabled" : ""} data-i="${i}" aria-label="Zmniejsz ilość ${productById(p.id)[1]}">−</button><input type="number" min="1" max="999" value="${p.qty}" ${p.demoReward || p.bonusReward ? "readonly" : ""} data-cart-input="${i}" aria-label="Ilość ${productById(p.id)[1]}"><button data-action="cart-plus" ${p.demoReward || p.bonusReward ? "disabled" : ""} data-i="${i}" aria-label="Zwiększ ilość ${productById(p.id)[1]}">+</button><button class="trash" data-action="remove" data-i="${i}" aria-label="Usuń ${productById(p.id)[1]}">▤</button></div>`;
function cartEmpty() {
  return `<div class="desktop-empty-cart"><header class="dec-heading"><div>${breadcrumb("Koszyk")}<h1>Twój koszyk</h1><p>0 kategorii &nbsp;•&nbsp; 0 produktów &nbsp;•&nbsp; 0 pozycji</p></div>${banner()}</header><section class="dec-frame"><div class="dec-visual">${bonusAtmosphere()}<div class="dec-art"><img src="assets/empty-basket.png" alt="Pusty koszyk zakupowy"></div><a class="primary dec-continue" href="#catalog">KONTYNUUJ ZAKUPY</a></div><div class="dec-message"><h2>Twój koszyk jest pusty</h2><p>Dodaj produkty z katalogu i złóż zamówienie.</p></div></section></div>`;
}

let desktopCartPage = 0;
function cartControlIcon(type) {
  return type === "edit"
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m5 16 1-4L17 1l4 4L10 16l-5 1Zm10-13 4 4M3 22h18"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 5h18M9 5V2h6v3M5 5l1 17h12l1-17M9 9v9m3-9v9m3-9v9"/></svg>';
}
function desktopCartControls(p, i) {
  return `<div class="cart-edit-controls"><button type="button" data-action="cart-edit-quantity" data-i="${i}" aria-label="Edytuj ilość ${esc(productById(p.id)[1])}" ${p.demoReward || p.bonusReward ? "disabled" : ""}>${cartControlIcon("edit")}</button><input type="number" min="1" max="999" value="${p.qty}" data-cart-input="${i}" aria-label="Ilość ${esc(productById(p.id)[1])}" ${p.demoReward || p.bonusReward ? "readonly" : ""}><button type="button" data-action="remove" data-i="${i}" aria-label="Usuń ${esc(productById(p.id)[1])}">${cartControlIcon("trash")}</button></div>`;
}
function cartShippingProgress(subtotal) {
  const target = FREE_SHIPPING,
    remaining = Math.max(0, target - subtotal),
    percent = Math.max(0, Math.min(100, (subtotal / target) * 100));
  return `<div class="shipping-progress cart-shipping-progress"><div class="section-row"><span>Do darmowej dostawy</span><span>zostało <strong>${money(remaining)}</strong></span></div><div class="cart-shipping-labels"><span>${money(subtotal)}</span><span>${money(target)}</span></div><div class="cart-shipping-bottom"><div class="cart-shipping-track" role="progressbar" aria-label="Postęp do darmowej dostawy" aria-valuemin="0" aria-valuemax="${FREE_SHIPPING}" aria-valuenow="${Math.max(0, Math.min(target, subtotal))}"><div class="cart-shipping-fill" style="width:${percent}%"></div><span class="cart-shipping-truck" style="left:clamp(.65rem,${percent}%,calc(100% - .65rem))" aria-hidden="true">🚚</span></div><span class="cart-free">FREE</span></div></div>`;
}
function desktopCartSuggestions() {
  const suggestions = state.cart
    .filter((p) => !p.bonusReward && !p.demoReward)
    .map((p) => {
      const base = productBasePrice(p.id),
        current = cartUnitPrice(p),
        next = [3, 5, 10, 20, 50, 100].find((n) => n > p.qty);
      return next
        ? {
            p,
            next,
            missing: next - p.qty,
            saving: Math.max(0, (current - unitPrice(next, base)) * next),
          }
        : null;
    })
    .filter(Boolean)
    .slice(0, 2);
  if (!suggestions.length) return "";
  return `<section class="smart-cart"><div class="smart-cart-title"><span class="cart-smart-heading"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/></svg> SMART CENA W KOSZYKU <small>• &nbsp; Im więcej kupisz - mniej płacisz za sztukę!</small></span><span class="green small">Możesz oszczędzić do ${money(suggestions.reduce((n, s) => n + s.saving, 0))}</span></div><div class="suggestions">${suggestions.map(({ p, next, missing, saving }) => `<div class="suggestion"><div class="suggestion-details"><h3>${productArt(p.id, "")}${esc(productById(p.id)[2])}</h3><div class="suggestion-progress"><div class="track"><div class="track-fill" style="width:${Math.min(100, (p.qty / next) * 100)}%"></div></div><span>${p.qty} / ${next} szt.</span></div><p>Brakuje ${missing} szt. do niższej ceny · Oszczędzisz <span class="green">${money(saving)}</span></p></div><a href="#mix" data-product="${esc(p.id)}">Dobierz ${missing === 1 ? "jeden" : missing}<br>${missing === 1 ? "produkt" : "produkty"} →</a></div>`).join("")}</div></section>`;
}
function cart() {
  if (isMobile()) return mobileCart();
  const sub = cartSubtotal();
  if (!state.cart.length) return cartEmpty();
  const pages = Math.ceil(state.cart.length / 3);
  desktopCartPage = Math.max(0, Math.min(desktopCartPage, pages - 1));
  const start = desktopCartPage * 3,
    visible = state.cart.slice(start, start + 3);
  return `${breadcrumb("Koszyk")}<div class="page filled-cart"><div class="cart-heading"><h1>Koszyk</h1><p>${new Set(state.cart.map((p) => productById(p.id)[2])).size} kat. • ${state.cart.length} prod. • ${cartCount()} szt.</p></div><div class="cart-layout"><div><section class="cart-products"><div class="section-row"><h2>Wybrane produkty</h2><div class="cart-list-nav"><span>Pokazano ${visible.length} z ${state.cart.length} produktów</span>${pages > 1 ? `<nav aria-label="Strony koszyka"><button data-action="cart-page" data-cart-page="${desktopCartPage - 1}" ${desktopCartPage === 0 ? "disabled" : ""} aria-label="Poprzednia strona">‹</button>${Array.from({ length: pages }, (_, i) => `<button data-action="cart-page" data-cart-page="${i}" class="${desktopCartPage === i ? "active" : ""}" aria-label="Strona ${i + 1}" ${desktopCartPage === i ? 'aria-current="page"' : ""}>${i + 1}</button>`).join("")}<button data-action="cart-page" data-cart-page="${desktopCartPage + 1}" ${desktopCartPage === pages - 1 ? "disabled" : ""} aria-label="Następna strona">›</button></nav>` : ""}</div></div>${visible
    .map((p, j) => {
      const i = start + j;
      return `<article class="cart-row"><div class="cart-product">${productArt(p.id, productById(p.id)[1])}<div><h3>${esc(productById(p.id)[1])}</h3><p class="small muted">${p.bonusReward ? "Nagroda bonusowa · bezpłatna" : esc(productById(p.id)[2])}</p><a href="#mix" data-product="${esc(p.id)}"><span>Obecnie wybrane:</span><br>${Object.values(p.flavors || {}).filter((n) => n > 0).length} wariantów</a></div></div><div class="cart-cell"><small>Cena za szt.</small><strong>${money(cartUnitPrice(p))}</strong></div><div class="cart-cell"><small>Ilość</small>${desktopCartControls(p, i)}</div><div class="cart-cell sum"><small>Razem</small><strong class="${p.qty >= 3 ? "green" : ""}">${money(cartItemTotal(p))}</strong></div></article>`;
    })
    .join(
      "",
    )}</section>${desktopCartSuggestions()}</div><aside class="cart-aside"><a class="secondary cart-continue" href="#catalog"><svg viewBox="0 0 32 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M30 12H3m8-8-8 8 8 8"/></svg><span class="cart-continue-label">KONTYNUUJ ZAKUPY</span></a><section class="summary-panel"><h2>Podsumowanie zamówienia</h2><div class="money-row"><span>Wartość produktów</span><b>${money(sub)}</b></div><div class="money-row"><span>Dostawa <span class="cart-info" aria-label="Koszt dostawy">i</span></span><b>${money(shipping())}</b></div><div class="cart-shipping">${cartShippingProgress(sub)}</div><div class="money-row total"><span>Razem do zapłaty</span><b>${money(checkoutTotal())}</b></div><div class="cart-promo">${promo()}</div><a class="primary wide cart-checkout" href="#checkout">PRZEJDŹ DO PODSUMOWANIA</a></section></aside></div></div>`;
}

function contactFields() {
  const c = state.contact;
  return `<section class="contact-panel"><header><span class="checkout-contact-caption">${img("checkout-user", "")} Dane kontaktowe</span><small><span data-contact-count>${["name", "phone", "email"].filter((k) => c[k]).length}</span> <span class="field-count-total">/ 3</span></small></header><div class="contact-fields"><label><input form="checkout-form" required autocomplete="name" name="name" data-contact="name" value="${esc(c.name)}" placeholder="Imię i Nazwisko:   Kliknij żeby wpisać" aria-label="Imię i nazwisko"></label><label><input form="checkout-form" required type="tel" autocomplete="tel" name="phone" data-contact="phone" value="${esc(c.phone)}" placeholder="Numer telefonu:   🇵🇱  +48 (000) 000-000" aria-label="Numer telefonu" pattern="[+0-9 ()-]{7,20}"></label><label><input form="checkout-form" required type="email" autocomplete="email" name="email" data-contact="email" value="${esc(c.email)}" placeholder="Adres e-mail:   Kliknij żeby wpisać" aria-label="Adres e-mail"></label></div></section>`;
}
const deliveryNames = {
  inpost: "Paczkomaty InPost",
  courier: "Kurier InPost",
  zabka: "Żappka",
};
function deliveryOption(id, selectPage = false) {
  return `<label class="delivery-option ${id === "zabka" ? "zabka" : ""}">${id === "inpost" ? '<span class="fast">ϟ NAJSZYBSZA</span>' : ""}<div class="option-main"><strong><span class="carrier">${id === "zabka" ? "żabka" : "InPost"}</span> ${deliveryNames[id]}</strong><p>• Płatność kartą przy odbiorze.<br>• ${id === "courier" ? "Dostawa pod wskazany adres." : "Odbierz w Paczkomacie lub Punkcie Obsługi Paczek InPost."}</p></div>${selectPage ? "" : `<span class="cost">${money(shipping())}</span>`}<input type="radio" name="delivery" value="${id}" ${state.delivery === id ? "checked" : ""} aria-label="${deliveryNames[id]}"></label>`;
}
function deliveryFields() {
  const c = state.contact;
  return `<section class="contact-panel checkout-delivery-fields"><header><span class="checkout-contact-caption">${img("checkout-delivery-data", "")} Dane dostawy</span><small><span data-delivery-count>${(c.city ? 1 : 0) + (c.locker ? 1 : 0)}</span> <span class="field-count-total">/ 2</span></small></header><div class="contact-fields"><label class="checkout-labeled-field"><span>Miasto:</span><input form="checkout-form" required data-contact="city" name="city" autocomplete="address-level2" value="${esc(c.city)}" placeholder="Warszawa" aria-label="Miasto"></label><label class="checkout-labeled-field"><span>${state.delivery === "courier" ? "Adres:" : "Kod paczkomatu:"}</span><input form="checkout-form" required data-contact="locker" name="locker" autocomplete="street-address" value="${esc(c.locker)}" placeholder="Kliknij żeby wpisać" aria-label="${state.delivery === "courier" ? "Adres dostawy" : "Kod paczkomatu"}"></label></div></section>${state.delivery === "inpost" ? '<div class="info-note"><span class="checkout-help-icon" aria-hidden="true">i</span><div>Gdzie znaleźć kod paczkomatu?<small>Kod paczkomatu znajdziesz w aplikacji InPost lub na stronie internetowej InPost.</small></div></div>' : ""}`;
}

function checkoutTruckIcon() {
  return '<svg viewBox="0 0 48 36" fill="currentColor" aria-hidden="true"><path d="M13 3h17v19H9v-4h9v-3H5v-3h13V9h-8V6h3V3Zm19 8h7l7 9v9h-4a6 6 0 0 0-12 0H20a6 6 0 0 0-12 0H4v-5h28V11Zm3 3v7h8l-5-7h-3Z"/><circle cx="14" cy="29" r="4"/><circle cx="36" cy="29" r="4"/></svg>';
}
function mobileCheckoutField(key, label, placeholder, type = "text") {
  const c = state.contact || {};
  return `<label class="mc-field"><span>${label}</span><input form="checkout-form" data-contact="${key}" name="${key}" type="${type}" value="${esc(c[key] || "")}" placeholder="${placeholder}" required ${type === "tel" ? 'pattern="[+0-9 ()-]{7,20}" autocomplete="tel"' : type === "email" ? 'autocomplete="email"' : key === "name" ? 'minlength="2" autocomplete="name"' : key === "city" ? 'minlength="2" autocomplete="address-level2"' : key === "locker" ? 'minlength="2"' : ""}><i aria-hidden="true"></i></label>`;
}
function mobileCheckout() {
  const sub = cartSubtotal(),
    free = shipping() === 0,
    percent = Math.max(0, Math.min(100, (sub / FREE_SHIPPING) * 100));
  return `<div class="mc-page"><div class="m-cart-heading"><h1>Podsumowanie</h1><p>${new Set(state.cart.map((p) => productById(p.id)[2])).size} kategorie • ${state.cart.length} produkty • ${cartCount()} pozycji</p></div><form id="checkout-form"><section class="mc-summary-frame"><div class="mc-summary"><div class="mc-row"><span>Produkty <b>(${state.cart.length}) &nbsp;•&nbsp; ${cartCount()} pozycji</b></span><strong>${money(sub)}</strong></div><div class="mc-row"><span>Dostawa <span class="mc-info">i</span></span><strong class="${free ? "mc-green" : ""}">${free ? "🎁 Darmowa!" : money(shipping())}</strong></div><div class="mc-shipping ${free ? "is-free" : ""}">${free ? "" : `<div class="mc-row"><span>Do darmowej dostawy</span><span>zostało <b>${money(Math.max(0, FREE_SHIPPING - sub))}</b></span></div>`}<div class="mc-shipping-labels"><b>${money(sub)}</b><span>${FREE_SHIPPING}zł</span></div><div class="mc-shipping-bottom"><div class="mc-shipping-track" role="progressbar" aria-label="Darmowa dostawa" aria-valuemin="0" aria-valuemax="${FREE_SHIPPING}" aria-valuenow="${Math.min(FREE_SHIPPING, sub)}"><i style="width:${percent}%"></i><span style="left:clamp(6px,${percent}%,calc(100% - 6px))" aria-hidden="true">🚚</span></div><small>FREE</small></div>${free ? "<p>ⓥ Darmowa dostawa została aktywowana</p>" : ""}</div><details class="mc-promo"><summary>${img("bonus-ticket", "")}<span>Masz kod promocyjny?</span><i aria-hidden="true"></i></summary><div><input id="promo" placeholder="Wpisz kod promocyjny" aria-label="Kod promocyjny"><button type="button" data-action="promo">Zastosuj</button></div></details><div class="mc-total"><span>Razem do zapłaty</span><b>${money(checkoutTotal())}</b></div></div></section><section class="mc-fields" aria-label="Dane kontaktowe">${mobileCheckoutField("name", "Imię i Nazwisko:", "Kliknij żeby wpisać")}${mobileCheckoutField("phone", "Numer telefonu: 🇵🇱", "+48 (000) 000-000", "tel")}</section><h2 class="mc-delivery-title"><span>• • • ●</span> DOSTAWA <span>● • • •</span></h2><section class="mc-fields" aria-label="Dane dostawy"><button type="button" class="mc-method" data-action="m-checkout-methods"><span>Metod dostawy:</span>${state.delivery ? `<b class="mc-carrier ${state.delivery === "zabka" ? "is-zabka" : ""}">${state.delivery === "zabka" ? "żabka" : "InPost"}</b><small>${deliveryNames[state.delivery]}</small>` : "<small>Wybierz metodę dostawy</small>"}<i aria-hidden="true">⌄</i></button>${mobileCheckoutField("city", "Miasto:", "Warszawa")}${state.delivery ? mobileCheckoutField("locker", state.delivery === "courier" ? "Adres:" : "Kod paczkomatu:", "Kliknij żeby wpisać") : ""}</section><p id="order-status" class="status-message" role="status"></p><div class="m-fixed-action"><button type="submit" class="m-primary">POTWIERDŹ ZAMÓWIENIE</button></div></form></div>`;
}
function mobileCheckoutMethods() {
  const d = $("#mobile-smart");
  d.classList.add("mc-method-dialog");
  d.classList.remove("is-minimum-order");
  d.innerHTML = `<header class="m-sheet-head mc-method-head"><div><small>${state.delivery ? deliveryNames[state.delivery] : "Dostawa"}</small><h2>Metod Dostawy</h2></div><button class="m-sheet-close" data-action="m-close-smart" aria-label="Zamknij">×</button></header><div class="mc-method-options">${Object.keys(
    deliveryNames,
  )
    .map(
      (id) =>
        `<div><label class="mc-method-choice"><span class="mc-carrier ${id === "zabka" ? "is-zabka" : ""}">${id === "zabka" ? "żabka" : "InPost"}</span><span>${deliveryNames[id]}</span><input type="radio" name="delivery" value="${id}" ${state.delivery === id ? "checked" : ""} aria-label="${deliveryNames[id]}"></label>${state.delivery === id ? `<p>• Płatność kartą przy odbiorze.<br>• ${id === "courier" ? "Dostawa pod wskazany adres." : "Odbierz w Paczkomacie lub Punkcie Obsługi Paczek InPost."}</p>` : ""}</div>`,
    )
    .join("")}</div>`;
  d.showModal();
  document.body.classList.add("smart-sheet-open");
  d.onclose = () => {
    d.classList.remove("mc-method-dialog");
    document.body.classList.remove("smart-sheet-open");
    render();
  };
}
function mobileOrderAccepted() {
  if (!state.lastOrder)
    return '<div class="mc-accepted"><h1>Brak danych zamówienia</h1><a class="m-primary" href="#catalog">WRÓĆ DO SKLEPU</a></div>';
  return `<div class="mc-accepted"><div class="mc-success" aria-hidden="true"><img src="assets/order-accepted-icon.png" alt=""></div><h1>Zamówienie przyjęte!</h1><button type="button" class="mc-order-number" data-action="copy-order" aria-label="Skopiuj numer zamówienia">#${esc(state.lastOrder.number)}</button><section class="mc-thankyou"><h2>Dziękujemy za zakup! 🎉</h2><p>Twoje zamówienie zostało zapisane i oczekuje na potwierdzenie. Dziękujemy za zaufanie i zapraszamy ponownie! 💙</p><p>W przypadku pytań lub problemów prosimy o kontakt z naszym managerem.</p><button class="m-primary" type="button" data-action="order-support">NAPISZ DO MANAGERA</button>${state.lastOrder.telegramNotified === false ? '<p class="mc-notification-note">Powiadomienie Telegram nie zostało potwierdzone. Zamówienie jest zapisane.</p>' : ""}</section><a class="m-secondary mc-return" href="#home">WRÓĆ DO SKLEPU</a></div>`;
}
function checkout(old = false) {
  if (isMobile()) return mobileCheckout();
  const sub = cartSubtotal(),
    minor = Math.round(sub * 100),
    points = Math.floor((Math.round(checkoutTotal() * 100) * 3) / 10000);
  return `<div class="page checkout-page">${breadcrumb("Koszyk", "Podsumowanie")}${pageHead("Podsumowanie", `${new Set(state.cart.map((p) => productById(p.id)[2])).size} kat. • ${new Set(state.cart.map((p) => p.id)).size} prod. • ${cartCount()} szt.`, `<div class="points-banner">${img("checkout-gift", "")}<div><p>Otrzymasz <span class="purple">${points} pkt</span> za to zamówienie!</p><small>Punkty pojawią się po realizacji zamówienia.</small></div></div>`)}<form id="checkout-form"><div class="checkout-layout"><section class="summary-panel"><h2 class="checkout-title"><span class="icon">${img("icon-cart", "")}</span>Twoje zamówienie <span class="blue" style="margin-left:auto;font-size:1.2rem">${money(sub)}</span></h2><div class="money-row"><span>Dostawa <span class="cart-info">i</span></span><b>${money(shipping())}</b></div><div class="checkout-shipping">${cartShippingProgress(sub)}</div><div class="checkout-promo">${promo()}</div><div class="money-row total"><span>Razem do zapłaty</span><b>${money(checkoutTotal())}</b></div>${contactFields()}</section><section class="panel summary-panel checkout-delivery"><h2 class="checkout-title"><span class="checkout-delivery-icon">${img("checkout-delivery", "")}</span>Dostawa</h2><p class="muted" style="font-size:1.3rem">Wybierz metodę dostawy</p>${
    old
      ? `<div style="margin-top:2rem">${Object.keys(deliveryNames)
          .map((id) => deliveryOption(id))
          .join("")}</div>`
      : state.delivery
        ? `<div style="margin-top:3rem">${deliveryOption(state.delivery)}</div><button type="button" class="text-btn" data-action="delivery">Zmień metodę dostawy</button>${deliveryFields()}`
        : `<button type="button" class="delivery-empty" data-action="delivery"><div><strong>Wybierz metodę dostawy</strong><span>Kliknij, aby wybrać sposób dostawy</span></div><b>›</b></button>`
  }<button type="submit" class="primary wide checkout-confirm">POTWIERDŹ ZAMÓWIENIE</button><p id="order-status" class="status-message" role="status"></p></section></div></form></div>`;
}
function delivery() {
  return `<div class="page delivery-stage"><div class="delivery-ambient" aria-hidden="true"></div><div class="delivery-particles" aria-hidden="true">${Array.from(
    { length: 24 },
    (_, i) => {
      const left = i < 12,
        j = i % 12;
      return `<i class="delivery-particle ${left ? "on-left" : "on-right"}" style="--x:${left ? 19 + ((j * 5) % 11) : 70 + ((j * 3) % 12)}%;--y:${20 + ((j * 11) % 61)}%;--size:${j % 5 === 0 ? 7 : j % 3 === 0 ? 4 : 2}px;--travel:${left ? -(20 + (j % 6)) : 20 + (j % 6)}px;--duration:${3.2 + (j % 5) * 0.45}s;--delay:${-(i * 0.53)}s"></i>`;
    },
  ).join(
    "",
  )}</div>${img("delivery-method-star", "", "auth-decor")}${img("delivery-method-bag", "", "auth-decor right")}<h1>Wybierz <span class="blue">metodę dostawy</span></h1><p>Wybierz najwygodniejszy sposób otrzymania zamówienia</p><section class="delivery-card">${img("delivery-method-truck", "Samochód dostawczy")}${Object.keys(
    deliveryNames,
  )
    .map((id) => deliveryOption(id, true))
    .join(
      "",
    )}</section><a class="back" href="#checkout">⟵ Wróć do podsumowania</a></div>`;
}
