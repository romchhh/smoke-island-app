/* ==========================================================================
 * js/api.js — Catalog refresh, toast, Telegram login mount
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

async function refreshCatalog() {
  await loadBonusCases();
  try {
    const response = await fetch(API_BASE + "/catalog", {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("catalog-unavailable");
    const payload = await response.json();
    if (!Array.isArray(payload.items)) throw new Error("invalid-catalog");
    productRecords = new Map(payload.items.map((p) => [p.slug, p]));
    products = catalogDisplayProducts(
      payload.items.filter((p) => p.active !== false),
    );
    for (const c of Object.values(bonusCases))
      for (const p of c.products || []) productRecords.set(p.slug, p);
    for (const reward of state.pendingBonusRewards || [])
      cacheRewardProduct(reward);
    catalogUnavailable = false;
    if (
      products.length &&
      !products.some((p) => p[0] === state.selectedProduct)
    )
      state.selectedProduct = products[0][0];
    if (
      !(
        mobileBonusPhase === "opening" &&
        ["bonus", "opening"].includes(location.hash.slice(1))
      )
    )
      render();
  } catch {
    catalogUnavailable = true;
    if (
      !(
        mobileBonusPhase === "opening" &&
        ["bonus", "opening"].includes(location.hash.slice(1))
      )
    )
      render();
    toast("Nie udało się pobrać aktualnego katalogu.");
  }
}
const toast = (text) => {
  const el = $("#toast");
  el.textContent = text;
  el.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.style.display = "none"), 3500);
};
async function mountTelegramLogin() {
  const slot = $("#telegram-login-slot");
  if (slot) slot.textContent = "Łączenie z Telegramem…";
  try {
    const config = await fetch(
      API_BASE +
        "/public/config" +
        (state.referralCode
          ? "?ref=" + encodeURIComponent(state.referralCode)
          : ""),
      { credentials: "include", cache: "no-store" },
    ).then((r) => r.json());
    if (!config.telegramOidcConfigured) {
      if (slot)
        slot.textContent =
          "Logowanie Telegram nie jest jeszcze skonfigurowane. Administrator musi dodać dane OIDC z BotFather w Railway.";
      return;
    }
    location.assign(
      API_BASE +
        "/auth/telegram" +
        (state.referralCode
          ? "?ref=" + encodeURIComponent(state.referralCode)
          : ""),
    );
  } catch {
    if (slot)
      slot.textContent = "Nie udało się sprawdzić konfiguracji Telegram.";
    else toast("Nie udało się połączyć z Telegramem");
  }
}
const navItems = [
  ["home", "catalog", "Katalog"],
  ["referrals", "referral", "Polecenia"],
  ["cart", "cart", "Koszyk"],
  ["bonus", "bonus", "Bonusy"],
];
