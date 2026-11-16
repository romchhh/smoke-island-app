/* ==========================================================================
 * js/state.js — App state, persistence, pricing, cart mutations, catalog mapping
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

const money = (n) =>
  `${Number(n).toLocaleString("pl-PL", { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 })}zł`;
let products = [];
let productRecords = new Map();
const defaults = {
  cart: [],
  wishlist: [],
  points: 0,
  userInfo: null,
  pendingEmail: "",
  referralCode: new URLSearchParams(location.search).get("ref") || "",
  delivery: "",
  contact: { name: "", phone: "", email: "", city: "Warszawa", locker: "" },
  selectedProduct: "merry-mi-blade-30000",
  claimed: false,
  pendingBonusRewards: [],
};
var reservationReady = false;
const save = () => {
  try {
    localStorage.setItem("smoke-island-native-v2", JSON.stringify(state));
  } catch {}
  if (reservationReady) scheduleCartReservation();
};
let state;
try {
  state = {
    ...defaults,
    ...JSON.parse(localStorage.getItem("smoke-island-native-v2") || "{}"),
  };
} catch {
  state = structuredClone(defaults);
}
if (new URLSearchParams(location.search).get("ref")) {
  state.referralCode = new URLSearchParams(location.search).get("ref");
  save();
}
let quantities = {},
  quantity = 1,
  selectedFlavor = 0,
  flavorPage = 0,
  flavorFilter = "",
  mixMode = false,
  category = "Wszystkie",
  sort = "popular",
  catalogPage = 1,
  bonusTab = "Start",
  activeBonusReward = null,
  mobileBonusPhase = "idle",
  mobileBonusClaimed = false,
  mobileBonusTimer,
  mobileBonusDeadline = 0,
  mobileBonusRun = 0,
  toastTimer,
  catalogUnavailable = false,
  bonusRewardsLoadAt = 0;
const totalQty = () => Object.values(quantities).reduce((a, b) => a + b, 0);
const unitPrice = (n, base = 65) =>
  Math.min(
    base,
    n >= 100
      ? 40
      : n >= 50
        ? 45
        : n >= 20
          ? 48
          : n >= 10
            ? 55
            : n >= 5
              ? 60
              : n >= 3
                ? 65
                : 70,
  );
const productById = (id) =>
  products.find((p) => p[0] === id) ||
  (productRecords.has(id)
    ? [
        id,
        productRecords.get(id).name,
        productRecords.get(id).category || "Nagrody",
        productRecords.get(id).image,
      ]
    : null) ||
  products[0] || ["", "Product", "Other", ""];
const variantsFor = (id) =>
  (productRecords.get(id)?.variants || []).filter((v) => v.active !== false);
const variantFor = (id, index) =>
  variantsFor(id)[Number(index)] || variantsFor(id)[0];
const variantBasePrice = (id, index = 0) =>
  (variantFor(id, index)?.priceMinor ?? 6500) / 100;
const productBasePrice = (id) => variantBasePrice(id, 0);
const variantKeyFor = (id, index) =>
  variantFor(id, index)?.key ?? String(index);
const cartItemTotal = (p) =>
  p.bonusReward || p.demoReward
    ? 0
    : Object.entries(p.flavors || {}).reduce(
        (sum, [index, count]) =>
          sum +
          Number(count || 0) * unitPrice(p.qty, variantBasePrice(p.id, index)),
        0,
      );
const cartUnitPrice = (p) =>
  p.bonusReward || p.demoReward
    ? 0
    : p.qty
      ? Math.round(cartItemTotal(p) / p.qty)
      : unitPrice(p.qty, productBasePrice(p.id));
const cartSubtotal = () =>
  state.cart.reduce((sum, p) => sum + cartItemTotal(p), 0);
const cartCount = () => state.cart.reduce((sum, p) => sum + p.qty, 0);
const shipping = () =>
  !state.cart.length || cartSubtotal() >= FREE_SHIPPING ? 0 : 30;
const categoryOptions = () => [
  "Wszystkie",
  ...new Set(products.map((p) => p[2]).filter(Boolean)),
];
const productArt = (id, alt = "", cls = "") => {
  const image = productRecords.get(id)?.image;
  const src =
    (image &&
      (/^(https:\/\/|\/)/i.test(image)
        ? image.startsWith("/api/v1/")
          ? API_BASE.replace(/\/api\/v1\/?$/, "") + image
          : image
        : asset(image))) ||
    asset(id);
  return `<img src="${esc(src)}" alt="${esc(alt)}" class="${esc(cls)}" draggable="false" loading="lazy" decoding="async">`;
};
const productVariantNames = (id) =>
  variantsFor(id)
    .map((v) => v.label)
    .filter(Boolean);
function addCartProduct(id, flavors) {
  if (!canAddStock(id, flavors)) return false;
  const additions = Object.fromEntries(
    Object.entries(flavors).filter(([, count]) => Number(count) > 0),
  );
  const qty = Object.values(additions).reduce(
    (sum, count) => sum + Number(count),
    0,
  );
  if (!qty) return;
  const item = state.cart.find(
    (p) => p.id === id && !p.demoReward && !p.bonusReward,
  );
  if (item) {
    for (const [key, count] of Object.entries(additions))
      item.flavors[key] = (item.flavors[key] || 0) + Number(count);
    item.qty = Object.values(item.flavors).reduce(
      (sum, count) => sum + Number(count),
      0,
    );
  } else state.cart.push({ id, qty, flavors: additions });
}
function resizeCartItem(item, nextQty) {
  if (nextQty > item.qty) {
    const index =
      Object.keys(item.flavors || {}).find((k) => item.flavors[k] > 0) || 0;
    if (!canAddStock(item.id, { [index]: nextQty - item.qty })) return;
  }
  if (item.demoReward || item.bonusReward) return;
  const values = { ...(item.flavors || {}) };
  let sum = Object.values(values).reduce((a, b) => a + Number(b || 0), 0);
  if (!sum) {
    values[0] = item.qty;
    sum = item.qty;
  }
  if (nextQty > sum) {
    const key = Object.keys(values).find((k) => values[k] > 0) || "0";
    values[key] = (values[key] || 0) + (nextQty - sum);
  } else if (nextQty < sum) {
    let remove = sum - nextQty;
    for (const key of Object.keys(values).sort(
      (a, b) => Number(b) - Number(a),
    )) {
      const take = Math.min(remove, values[key] || 0);
      values[key] -= take;
      remove -= take;
      if (!remove) break;
    }
  }
  for (const key of Object.keys(values)) if (!values[key]) delete values[key];
  item.flavors = values;
  item.qty = nextQty;
}
// Stable presentation assignments requested for the catalog; stored metadata takes precedence.
function catalogDisplayProducts(items) {
  const hash = (value) => {
    let n = 2166136261;
    for (const c of value) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
    return n >>> 0;
  };
  const groups = new Map(),
    metadata = new Map();
  for (const p of items) {
    const cat = p.category || "Inne";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(p);
  }
  for (const [cat, rows] of groups) {
    const preferred = ["moon", "raya", "bc"];
    const ordered = [...rows].sort((a, b) => {
      const rank = (p) => {
        const i = preferred.indexOf(p.slug);
        return i < 0 ? Infinity : i;
      };
      return (
        rank(a) - rank(b) ||
        a.name.localeCompare(b.name, "pl") ||
        a.slug.localeCompare(b.slug)
      );
    });
    const selected = [...rows]
      .sort(
        (a, b) =>
          hash(cat + ":" + a.slug) - hash(cat + ":" + b.slug) ||
          a.slug.localeCompare(b.slug),
      )
      .slice(0, 3);
    for (const p of rows) {
      const selectedIndex = selected.indexOf(p);
      metadata.set(p.slug, {
        badge:
          selectedIndex < 0
            ? ""
            : selectedIndex % 2 === 0
              ? "PROMOCJA"
              : "NOWOŚĆ",
        bestseller: ordered.indexOf(p) < 2,
      });
    }
  }
  return items.map((p) => {
    const m = metadata.get(p.slug);
    return [
      p.slug,
      p.name,
      p.category || "Inne",
      p.badge === undefined
        ? m.badge
        : ["PROMOCJA", "NOWOŚĆ"].includes(p.badge)
          ? p.badge
          : "",
      typeof p.bestseller === "boolean" ? p.bestseller : m.bestseller,
    ];
  });
}
