/* ==========================================================================
 * js/icons.js — DOM helpers + system SVG icons + image helpers
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */
'use strict';

const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const asset = (name) => `assets/${name}.webp`;
const sysIconPaths = {
  catalog:
    '<path d="M4 10h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10Z"/><path d="M4 10 6.5 4h11L20 10"/><path d="M9 14h6"/>',
  referral:
    '<path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"/><circle cx="9" cy="7" r="3.5"/><path d="M22 19v-1a3.5 3.5 0 0 0-2.6-3.4"/><path d="M16.5 3.7a3.5 3.5 0 0 1 0 6.6"/>',
  cart: '<path d="M3.5 5h1.8l1.4 11h11.6l1.7-8H7"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="16.5" cy="19.5" r="1.4"/>',
  bonus:
    '<path d="M12 7v14"/><path d="M5 11h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8Z"/><path d="M5 11a3 3 0 0 1 3-3c2 0 4 3 4 3s2-3 4-3a3 3 0 0 1 3 3"/>',
  heart:
    '<path d="M12 20s-7-4.4-9.2-8.1A5.1 5.1 0 0 1 12 6a5.1 5.1 0 0 1 9.2 5.9C19 15.6 12 20 12 20Z"/>',
  account: '<circle cx="12" cy="8" r="3.6"/><path d="M5 19.5a7 7 0 0 1 14 0"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 19.5a7 7 0 0 1 14 0"/>',
  support:
    '<path d="M4.5 13a7.5 7.5 0 0 1 15 0"/><path d="M4.5 13v3.2a2 2 0 0 0 2 2H8"/><path d="M19.5 13v3.2a2 2 0 0 1-2 2H16"/><path d="M12 19v2"/><path d="M9.5 21h5"/>',
  telegram:
    '<path d="M21 5 3.4 12.4c-.8.3-.8.8-.1 1l4.4 1.4 1.7 4.9c.2.5.5.6.8.3l2.4-2.5 4.8 3.5c.6.4 1 .2 1.2-.5L22 6c.2-.9-.3-1.3-1-1Z"/>',
  contact: '<path d="M21 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 1 1 17-5Z"/>',
  orders:
    '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3.5 6h.01"/><path d="M3.5 12h.01"/><path d="M3.5 18h.01"/>',
  truck:
    '<path d="M1 7h12v10H1z"/><path d="M13 10h5l3 4v3h-8"/><circle cx="5.5" cy="19.5" r="1.8"/><circle cx="17.5" cy="19.5" r="1.8"/>',
  map: '<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5 9 4.5Z"/><path d="M9 4.5v13"/><path d="M15 6.5v13"/>',
  gift: '<path d="M12 8v13"/><path d="M5 12h14v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7Z"/><path d="M5 12a3 3 0 0 1 3-3c2 0 4 3 4 3s2-3 4-3a3 3 0 0 1 3 3"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="m12 7.2 1.4 2.8 3.1.5-2.2 2.2.5 3.1L12 14.2 9.2 15.8l.5-3.1-2.2-2.2 3.1-.5L12 7.2Z"/>',
  eye: '<path d="M2.2 12S5.5 5.5 12 5.5 21.8 12 21.8 12 18.5 18.5 12 18.5 2.2 12 2.2 12Z"/><circle cx="12" cy="12" r="3.1"/>',
  "eye-off":
    '<path d="m4 4 16 16"/><path d="M9.9 9.9A3.1 3.1 0 0 0 14 14"/><path d="M6.7 6.8C4.2 8.3 2.5 11 2.2 12c0 0 3.3 6.5 9.8 6.5 1.7 0 3.2-.4 4.5-1"/><path d="M17.4 14.7c1.7-1.1 3-2.8 3.6-3.7 0 0-3.3-6.5-9.8-6.5-1 .0-1.9.1-2.8.4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.6-3.6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
};
const sysIconKey = (name) => {
  const raw = String(name || "");
  const map = {
    "icon-catalog": "catalog",
    "icon-referral": "referral",
    "icon-cart": "cart",
    "icon-bonus": "bonus",
    "icon-account": "account",
    "icon-support": "support",
    "icon-telegram": "telegram",
    "icon-contact": "contact",
    "icon-contact-mobile": "contact",
    "icon-orders-mobile": "orders",
    "icon-truck": "truck",
    "checkout-user": "user",
    "checkout-delivery-data": "map",
    "checkout-gift": "gift",
    "checkout-delivery": "truck",
    coin: "coin",
    "featured-heart": "heart",
    heart: "heart",
  };
  if (map[raw]) return map[raw];
  return raw.replace(/^icon-/, "").replace(/-mobile$/, "");
};
const sysIcon = (name, cls = "") => {
  const key = sysIconKey(name);
  const body = sysIconPaths[key] || sysIconPaths.catalog;
  const filled = key === "coin" || key === "telegram" ? " sys-icon-fill" : "";
  return `<svg class="sys-icon${filled}${cls ? ` ${cls}` : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
};
const isSysIconName = (name) =>
  /^(icon-|checkout-user|checkout-delivery|checkout-gift|coin|featured-heart|heart$)/.test(
    String(name || ""),
  );
const img = (name, alt = "", cls = "", opts = {}) => {
  if (isSysIconName(name)) return sysIcon(name, cls);
  const loading = opts.eager
    ? ' fetchpriority="high" decoding="async"'
    : ' loading="lazy" decoding="async"';
  return `<img src="${asset(name)}" alt="${alt}" class="${cls}" draggable="false"${loading}>`;
};
const API_BASE =
  window.SMOKE_ISLAND_CONFIG?.apiBase ||
  document.querySelector('meta[name="api-base"]')?.content ||
  "http://localhost:3010/api/v1";
const FREE_SHIPPING = 950;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
