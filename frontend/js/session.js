/* ==========================================================================
 * js/session.js — Telegram mini-app, website session, stock holds, promo
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

async function bootstrapTelegramMiniApp() {
  const tg = window.Telegram?.WebApp;
  if (!tg?.initData || telegramAuthStarted) return;
  telegramAuthStarted = true;
  tg.ready();
  try {
    const r = await fetch(API_BASE + "/auth/telegram/mini-app", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    });
    if (!r.ok) throw new Error("Telegram authentication failed");
    const data = await r.json();
    state.user = data.user.firstName || data.user.username;
    state.userInfo = data.user;
    state.points = data.user.points;
    save();
    loadBonusRewards();
    render();
  } catch {
    toast("Nie udało się zweryfikować sesji Telegram. Odśwież Mini App.");
  }
}
async function restoreWebsiteSession() {
  try {
    const r = await fetch(API_BASE + "/me", { credentials: "include" });
    if (!r.ok) {
      if (state.user) {
        state.user = null;
        state.userInfo = null;
        state.points = 0;
        save();
        render();
      }
      return;
    }
    const u = await r.json();
    state.user = u.firstName || u.username || u.email;
    state.userInfo = u;
    state.points = u.points || 0;
    save();
    loadBonusRewards();
    render();
  } catch {}
}

let reservationTimer,
  reservationFingerprint = "",
  reservationQueue = Promise.resolve(),
  reservationLastError = null;
function rewardValueLabel(reward) {
  if (reward.rewardUnit === "discount") return money(reward.rewardValue);
  return ["%", "pkt"].includes(reward.rewardUnit)
    ? `${reward.rewardValue} ${reward.rewardUnit}`
    : money((reward.valueMinor || 0) / 100);
}
function cacheRewardProduct(reward) {
  if (!reward?.image || productRecords.has(reward.productSlug)) return;
  productRecords.set(reward.productSlug, {
    slug: reward.productSlug,
    name: reward.productName,
    category: "Nagrody",
    image: reward.image,
    rewardOnly: true,
    variants: [
      {
        key: reward.variantKey,
        label: reward.variant,
        priceMinor: reward.valueMinor,
        stock: 1,
        active: true,
      },
    ],
  });
}
function cartReservationItems() {
  const merged = new Map();
  for (const item of state.cart) {
    if (item.demoReward || productRecords.get(item.id)?.rewardOnly) continue;
    for (const [index, count] of Object.entries(item.flavors || {})) {
      if (count <= 0) continue;
      const variantKey = variantKeyFor(item.id, index),
        key = item.id + ":" + variantKey + ":" + (item.bonusRewardId || ""),
        old = merged.get(key);
      merged.set(key, {
        slug: item.id,
        variantKey,
        quantity: (old?.quantity || 0) + Number(count),
        ...(item.bonusRewardId ? { bonusRewardId: item.bonusRewardId } : {}),
      });
    }
  }
  return [...merged.values()];
}
function promoDiscount() {
  const p = state.promoDiscount;
  return Math.min(
    cartSubtotal(),
    p?.percent
      ? Math.floor((cartSubtotal() * 100 * p.percent) / 100) / 100
      : (p?.amountMinor || 0) / 100,
  );
}
function checkoutTotal() {
  return Math.max(0, cartSubtotal() + shipping() - promoDiscount());
}
function cartStockQuantity(id, index) {
  return state.cart
    .filter((p) => p.id === id && !p.bonusReward)
    .reduce((sum, p) => sum + Number(p.flavors?.[index] || 0), 0);
}
function canSelectStock(id, index, count) {
  const v = variantFor(id, index);
  if (!v || count + cartStockQuantity(id, index) > v.stock) {
    toast(
      `Brak dostępnej ilości: ${productById(id)[1]} / ${v?.label || ""}. Dostępne: ${Math.max(0, (v?.stock || 0) - cartStockQuantity(id, index))}. Wybierz inny wariant.`,
    );
    return false;
  }
  return true;
}
function canAddStock(id, flavors) {
  return Object.entries(flavors).every(([index, count]) =>
    canSelectStock(id, index, Number(count)),
  );
}
function scheduleCartReservation() {
  clearTimeout(reservationTimer);
  reservationTimer = setTimeout(
    () => flushCartReservation().catch(() => {}),
    250,
  );
}
function flushCartReservation(force = false) {
  clearTimeout(reservationTimer);
  const items = cartReservationItems(),
    fingerprint = JSON.stringify(items);
  if (!force && fingerprint === reservationFingerprint) return reservationQueue;
  reservationQueue = reservationQueue
    .catch(() => {})
    .then(async () => {
      const r = await fetch(API_BASE + "/cart/reservation", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const d = await r.json();
      if (!r.ok) {
        reservationLastError = new Error(
          d.error?.details?.message ||
            "Nie udało się zarezerwować produktów. Sprawdź dostępność.",
        );
        toast(reservationLastError.message);
        await refreshCatalog();
        throw reservationLastError;
      }
      reservationLastError = null;
      reservationFingerprint = fingerprint;
      state.cartHoldExpires = d.expiresAt;
      try {
        localStorage.setItem("smoke-island-native-v2", JSON.stringify(state));
      } catch {}
    });
  return reservationQueue;
}
async function checkCartHold() {
  if (!reservationReady || !state.cartHoldExpires) return;
  if (Date.parse(state.cartHoldExpires) > Date.now()) return;
  const r = await fetch(API_BASE + "/cart/reservation", {
    credentials: "include",
    cache: "no-store",
  });
  if (!r.ok) return;
  const d = await r.json();
  if (!d.expiresAt) {
    state.cart = state.cart.filter((p) => p.bonusReward);
    state.cartHoldExpires = null;
    reservationFingerprint = JSON.stringify(cartReservationItems());
    save();
    render();
    toast("Rezerwacja wygasła po 4 godzinach. Koszyk został wyczyszczony.");
  } else state.cartHoldExpires = d.expiresAt;
}
async function initCartReservations() {
  await checkCartHold();
  reservationReady = true;
  await refreshCatalog();
  await checkCartHold();
  if (state.cart.length) await flushCartReservation().catch(() => {});
}
async function applyPromo() {
  const input = document.querySelector(
    'input[placeholder*="kod"],input[placeholder*="Kod"]',
  );
  const code = input?.value?.trim();
  if (!code) return toast("Wpisz kod promocyjny");
  const r = await fetch(API_BASE + "/promos/preview", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const d = await r.json();
  if (!r.ok) return toast("Kod nieaktywny lub wygasł");
  state.promoCode = d.code;
  state.promoDiscount = d;
  save();
  render();
  toast("Kod zastosowany. Rabat zostanie uwzględniony w zamówieniu.");
}
