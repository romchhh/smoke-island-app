/* ==========================================================================
 * js/bonus-ui.js — Bonus reel/open/claim UI (mobile + desktop helpers)
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

const mobileGift = () =>
  `<span class="mb-gift" style="--gift:url('${asset("icon-bonus")}')" aria-hidden="true"></span>`;
function mobileBonusHeader() {
  return mobileHeader(true);
}
function mobileBonusPreviewItems() {
  return casePreviewItems();
}
function mobileBonusPrizeCard(item, cls = "mb-prize-card", landing = false) {
  return `<article class="${cls}" ${landing ? 'data-landing="true"' : ""}>${productArt(item.slug, item.name)}<div><h3>${esc(item.name)}</h3><small>${esc(item.variant || "")}</small><p>${esc(item.value)}</p></div></article>`;
}
function mobileBonusContents() {
  const items = mobileBonusPreviewItems();
  return `<section class="mb-contents" aria-label="Możliwe nagrody"><div class="mb-prize-strip" tabindex="0" aria-label="Przewiń możliwe nagrody">${items.map((item) => mobileBonusPrizeCard(item)).join("") || '<p class="muted">Nagrody są chwilowo niedostępne.</p>'}</div></section>`;
}
function desktopBonusReel() {
  const product = products[0],
    second = products[1] || product;
  const items = [
    {
      slug: product?.[0] || "bc",
      name: product?.[1] || "NOVA HEADPHONES",
      value: money(productBasePrice(product?.[0] || "bc")),
    },
    {
      slug: second?.[0] || "bc",
      name: second?.[1] || "Akcesoria audio",
      value: money(productBasePrice(second?.[0] || "bc")),
    },
    { asset: "bonus-ticket", name: "Karta podarunkowa", value: "50 zł" },
    { asset: "bonus-shipping", name: "Darmowa dostawa", value: "30 zł" },
    { asset: "bonus-gift", name: "Nagroda specjalna", value: "65 zł" },
    { asset: "bonus-ticket", name: "Punkty bonusowe", value: "10 pkt" },
    { asset: "bonus-shipping", name: "Darmowa dostawa", value: "30 zł" },
  ];
  const reward = activeBonusReward;
  return `<div class="mb-reel-window"><div class="mb-reel-track">${Array.from(
    { length: 24 },
    (_, i) => {
      const item =
        i === 16 && reward
          ? {
              slug: reward.productSlug,
              name: reward.productName,
              value: rewardValueLabel(reward),
            }
          : items[i % items.length];
      return `<article class="mb-reel-card" ${i === 16 ? 'data-landing="true"' : ""}>${item.slug ? productArt(item.slug, item.name) : img(item.asset, item.name)}<div class="desktop-reel-caption"><h3>${esc(item.name || "Nagroda")}</h3><p>${esc(item.value)}</p></div></article>`;
    },
  ).join(
    "",
  )}</div><div class="mb-reel-pointer" aria-hidden="true"></div></div><div class="mb-opening-status" role="status" aria-live="polite"><h2>Case się <span>otwiera…</span></h2></div>`;
}
function mobileBonusReel() {
  const items = mobileBonusPreviewItems(),
    reward = activeBonusReward;
  return `<div class="mb-reel-window"><div class="mb-reel-track">${Array.from(
    { length: 24 },
    (_, i) => {
      const item =
        i === 16 && reward
          ? {
              slug: reward.productSlug,
              name: reward.productName,
              variant: reward.variant,
              value: rewardValueLabel(reward),
            }
          : items[i % Math.max(1, items.length)];
      return item ? mobileBonusPrizeCard(item, "mb-reel-card", i === 16) : "";
    },
  ).join(
    "",
  )}</div><div class="mb-reel-pointer" aria-hidden="true"></div></div>`;
}
function mobileBonusResult() {
  const r = activeBonusReward;
  if (!r)
    return '<p role="status">Nie udało się pobrać nagrody. Spróbuj ponownie.</p>';
  return `<div class="mb-result-scene"><h2 class="mb-result-label" id="mb-result-title" tabindex="-1">TWOJA NAGRODA</h2>${bonusAtmosphere()}<div class="mb-result-image">${productArt(r.productSlug || "bc", r.productName || "Nagroda", "mb-reward-art")}</div><button class="mb-open-button mb-claim-button" data-action="mb-claim" ${mobileBonusClaimed ? "disabled" : ""}>${mobileBonusClaimed ? "ODEBRANO NAGRODĘ" : "POBRAĆ NAGRODĘ"}</button><p class="mb-result-caption">${esc(r.productName || "Nagroda")}: <span>${esc(r.variant || "")}</span></p></div>`;
}
function mobilePendingBonusRewards() {
  const rewards = (state.pendingBonusRewards || []).filter(
    (r) => mobileBonusPhase !== "result" || r._id !== activeBonusReward?._id,
  );
  return `<div class="mb-rewards-heading mb-pending-heading"><span><i>i</i> Twoje niezamówione nagrody</span><span>Przesuń, aby zobaczyć →</span></div><section class="mb-pending-carousel" aria-label="Twoje niezamówione nagrody">${rewards.length ? `<div class="mb-pending-strip" tabindex="0" aria-label="Przewiń niezamówione nagrody">${rewards.map((r) => `<article class="mb-pending-card"><div class="mb-pending-image">${productArt(r.productSlug || "bc", r.productName || "Nagroda")}</div><div class="mb-pending-copy"><h3>${esc(r.productName || "Nagroda bonusowa")}</h3><p>${esc(r.variant || "")} <span>• bezpłatna</span></p><button class="m-primary" data-add-bonus-reward="${esc(r._id)}">${rewardActionLabel(r)}</button></div></article>`).join("")}</div>` : '<p class="mb-pending-empty">Jeszcze nie masz <span>nagród…</span></p>'}</section>`;
}
function mobileBonus() {
  const costs = { Start: 10, Premium: 20, Exclusive: 100 },
    opening = mobileBonusPhase === "opening",
    idle = mobileBonusPhase === "idle";
  return `<div class="mb-page mb-tier-${bonusTab.toLowerCase()}"><header class="mb-page-heading"><h1>Twoje bonusy</h1><p>Wybierz swój case i wykorzystaj zebrane punkty.</p></header><div class="mb-tabs">${["Start", "Premium", "Exclusive"].map((t) => `<button data-mb-tier="${t}" class="${t === bonusTab ? "active" : ""}" aria-pressed="${t === bonusTab}">${t}</button>`).join("")}</div><section class="mb-main-case mb-state-${mobileBonusPhase}"><div class="mb-case-view">${mobileBonusPhase === "requesting" ? '<div class="mb-requesting" role="status">Sprawdzamy saldo i przygotowujemy case…</div>' : opening ? mobileBonusReel() : mobileBonusPhase === "result" ? mobileBonusResult() : `<div class="mb-case-intro"><span class="mb-case-title">${bonusTab.toUpperCase()} CASE</span>${bonusAtmosphere()}${img("bonus-stars", "Niebieskie gwiazdy Smoke Island", "mb-star-art")}<button class="mb-open-button" data-action="mb-open">OTWÓRZ CASE</button><p class="mb-case-cost">Koszt otwarcia: <span>${costs[bonusTab]} punktów</span></p></div>`}</div>${mobileBonusPhase !== "result" ? `<div class="mb-rewards-heading"><span><i>i</i> Możliwe nagrody</span><span>Przesuń, aby zobaczyć →</span></div>${opening ? '<div class="mb-opening-status" role="status" aria-live="polite"><h2>Case się <span>otwiera…</span></h2></div>' : mobileBonusContents()}` : ""}${!opening && mobileBonusPhase !== "requesting" ? mobilePendingBonusRewards() : ""}</section></div>`;
}
const BONUS_SPIN_DURATION = 7200;
let bonusLandingFraction = 0.5;
function animateMobileBonus() {
  if (mobileBonusPhase !== "opening") return;
  const track = $(".mb-reel-track"),
    landing = $("[data-landing]"),
    windowEl = $(".mb-reel-window");
  if (!track || !landing || !windowEl) return;
  const reduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stop = Math.max(
    0,
    landing.offsetLeft +
      landing.offsetWidth * bonusLandingFraction -
      windowEl.clientWidth / 2,
  );
  const remaining = Math.max(1, mobileBonusDeadline - Date.now());
  if (track.animate && !reduced)
    track.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(-${stop}px)` }],
      {
        duration: remaining,
        easing: "cubic-bezier(.10,.72,.12,1)",
        fill: "forwards",
      },
    );
  else track.style.transform = `translateX(-${stop}px)`;
  const fill = $(".mb-opening-progress i");
  if (fill) fill.style.animationDuration = remaining + "ms";
}
async function startBonusOpen() {
  if (mobileBonusPhase === "requesting" || mobileBonusPhase === "opening")
    return;
  if (!state.user) {
    location.hash = "login";
    toast("Zaloguj się, aby otworzyć case.");
    return;
  }
  mobileBonusPhase = "requesting";
  mobileBonusClaimed = false;
  activeBonusReward = null;
  render();
  const run = ++mobileBonusRun;
  try {
    await requestBonusReward();
    if (run !== mobileBonusRun) return;
    bonusLandingFraction =
      0.18 +
      (crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296) * 0.64;
    mobileBonusDeadline = Date.now() + BONUS_SPIN_DURATION;
    mobileBonusPhase = "opening";
    render();
    mobileBonusTimer = setTimeout(() => {
      if (run !== mobileBonusRun) return;
      mobileBonusPhase = "result";
      if (["bonus", "opening"].includes(location.hash.slice(1))) {
        render();
        $("#mb-result-title")?.focus({ preventScroll: true });
      }
    }, BONUS_SPIN_DURATION);
  } catch (error) {
    if (run !== mobileBonusRun) return;
    if (error.message === "INSUFFICIENT_BONUS_POINTS") {
      try {
        const balance = await fetch(API_BASE + "/me/bonuses", {
          credentials: "include",
          cache: "no-store",
        });
        if (balance.ok) {
          const data = await balance.json();
          state.points = data.points;
          save();
        }
      } catch {}
    }
    mobileBonusPhase = "idle";
    activeBonusReward = null;
    render();
    toast(
      error.message === "INSUFFICIENT_BONUS_POINTS"
        ? "Za mało punktów, aby otworzyć case."
        : error.message === "BONUS_REWARD_UNAVAILABLE"
          ? "Nagroda jest chwilowo niedostępna."
          : "Nie udało się otworzyć case. Spróbuj ponownie.",
    );
  }
}
function resetMobileBonus(tier = bonusTab) {
  if (mobileBonusPhase === "requesting") return;
  clearTimeout(mobileBonusTimer);
  mobileBonusRun++;
  bonusTab = tier;
  mobileBonusPhase = "idle";
  mobileBonusClaimed = false;
  activeBonusReward = null;
  render();
}
async function claimMobileBonus() {
  if (mobileBonusPhase !== "result" || mobileBonusClaimed || !activeBonusReward)
    return false;
  const added = await addBonusRewardToCart(activeBonusReward._id);
  if (added) mobileBonusClaimed = true;
  return added;
}
document.addEventListener("click", async (e) => {
  const tier = e.target.closest("[data-mb-tier]");
  if (tier) {
    if (mobileBonusPhase === "requesting") return;
    if (tier.dataset.mbTier !== bonusTab) resetMobileBonus(tier.dataset.mbTier);
    return;
  }
  const b = e.target.closest("[data-action]");
  if (!b || !b.dataset.action.startsWith("mb-")) return;
  e.preventDefault();
  switch (b.dataset.action) {
    case "mb-open":
      startBonusOpen();
      break;
    case "mb-reset":
      resetMobileBonus();
      break;
    case "mb-claim":
      await claimMobileBonus();
      break;
  }
});
document.addEventListener("input", (e) => {
  if (e.target.classList?.contains("mb-prize-scroll")) {
    const strip = $(".mb-prize-strip");
    if (strip)
      strip.scrollLeft =
        ((strip.scrollWidth - strip.clientWidth) * Number(e.target.value)) /
        100;
  }
});
document.addEventListener(
  "scroll",
  (e) => {
    if (e.target.classList?.contains("mb-prize-strip")) {
      const range = $(".mb-prize-scroll"),
        max = e.target.scrollWidth - e.target.clientWidth;
      if (range)
        range.value =
          max > 0 ? Math.round((e.target.scrollLeft / max) * 100) : 0;
    }
  },
  true,
);

