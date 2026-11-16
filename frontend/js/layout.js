/* ==========================================================================
 * js/layout.js — Header, breadcrumbs, banners, shared layout bits
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

function header(route) {
  const active = [
    "catalog",
    "catalog-old",
    "home",
    "home-old",
    "product",
    "mix",
    "checkout",
    "checkout-old",
    "checkout-delivery",
    "delivery",
  ].includes(route)
    ? "home"
    : route;
  const detailRoutes = [
    "checkout",
    "checkout-old",
    "checkout-delivery",
    "delivery",
  ];
  const routeItems = navItems;
  const nav = routeItems
    .map(
      ([id, ic, label, href]) =>
        `<a class="nav-link ${id !== "telegram" && active === id ? "active" : ""} ${id === "telegram" ? "nav-telegram" : ""}" href="#${href || id}" ${active === id ? 'aria-current="page"' : ""}><span class="icon" aria-hidden="true">${img("icon-" + ic, "")}</span>${label}</a>`,
    )
    .join("");
  return `<header class="shell topbar"><a class="logo" href="#home" aria-label="Smoke Island - strona główna">${img("logo", "Smoke Island", "", { eager: true })}</a><nav class="mainnav" aria-label="Główna nawigacja">${nav}</nav><div class="header-right"><a href="#bonus" class="points" aria-label="${state.points} punktów">${state.points}<span class="coin">${img("coin", "")}</span></a>${state.user ? `<div class="account-menu"><button class="login-link account-toggle" type="button" data-action="account-toggle" aria-expanded="false"><span class="icon" aria-hidden="true">${img("icon-account", "")}</span><span>${esc(state.user)}</span><span class="account-chevron" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><path d="m4 6 6 7 6-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button><section class="account-dropdown" hidden><strong>${esc(state.userInfo?.email || state.user)}</strong><span>${state.points} punktów · ${state.userInfo?.telegramId ? "Telegram połączony" : "konto Smoke Island"}</span><a href="#referrals">Link polecający</a>${state.userInfo?.telegramId ? "" : `<button type="button" data-action="connect-telegram">Połącz Telegram</button><div id="telegram-login-slot"></div>`}<button type="button" class="account-logout" data-action="account-logout">Wyloguj się</button></section></div>` : `<a class="login-link" href="#login"><span class="icon" aria-hidden="true">${img("icon-account", "")}</span>Zaloguj się</a>`}<button class="menu-toggle" aria-label="Otwórz menu" aria-expanded="false" data-action="menu">☰</button></div></header><nav class="shell mobile-nav" aria-label="Menu mobilne">${nav}</nav>`;
}
const breadcrumb = (...names) =>
  `<nav class="breadcrumb" aria-label="Okruszki"><a href="#home">Strona główna</a>${names.map((n, i) => `<span aria-hidden="true">›</span><${i === names.length - 1 ? "span" : 'a href="#catalog"'} class="${i === names.length - 1 ? "blue" : ""}">${n}</${i === names.length - 1 ? "span" : "a"}>`).join("")}</nav>`;
const banner = () =>
  `<a href="#catalog" class="delivery-banner" aria-label="Darmowa dostawa od ${FREE_SHIPPING} zł">${img("hero-delivery", `DARMOWA DOSTAWA · Od ${FREE_SHIPPING} zł`, "wide")}</a>`;
const pageHead = (title, sub = "", extra = banner()) =>
  `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div>${extra}</div>`;
const support = () => "";

const categoryMedia = (src, alt = "") => {
  if (!src) return "";
  if (/^https?:\/\/|^\//i.test(src))
    return `<img src="${esc(src)}" alt="${esc(alt)}" class="category-media" draggable="false" loading="lazy" decoding="async">`;
  return img(src, alt, "category-media");
};
const categoryImages = {
  Jednorazówki: "/assets/category-disposable.png",
  Liquidy: "/assets/category-liquids.png",
  Pody: "/assets/category-pods.jpg",
  Cartidges: "/assets/category-cartridges.webp",
};

