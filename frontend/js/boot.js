/* ==========================================================================
 * js/boot.js — Remaining listeners + Telegram presentation + app boot
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

document.addEventListener(
  "click",
  (event) => {
    const link = event.target.closest('a[href="#contact"]');
    if (link) {
      state.supportOrderContext =
        location.hash === "#order-accepted" ? state.lastOrder?.number : null;
      save();
    }
  },
  true,
);
setInterval(() => {
  checkCartHold().catch(() => {});
  if (["#product", "#catalog", "#mix"].includes(location.hash))
    refreshCatalog();
}, 60000);
let cartActivityTouch = 0;
for (const eventName of ["pointerdown", "keydown"])
  document.addEventListener(
    eventName,
    (event) => {
      if (
        !event.isTrusted ||
        !reservationReady ||
        !state.cart.length ||
        !["#cart", "#checkout", "#mix", "#product"].includes(location.hash) ||
        Date.now() - cartActivityTouch < 60000
      )
        return;
      cartActivityTouch = Date.now();
      checkCartHold()
        .then(() => flushCartReservation(true))
        .catch(() => {});
    },
    { passive: true },
  );
window.addEventListener("focus", () => checkCartHold().catch(() => {}));
window.addEventListener("hashchange", () => {
  render();
  if (location.hash === "#bonus") {
    loadBonusRewards();
    loadBonusCases().then(() => {
      if (location.hash === "#bonus" && mobileBonusPhase === "idle") render();
    });
  }
  if (location.hash === "#referrals") loadReferralData(true);
});
render();
const telegramError = new URLSearchParams(location.search).get(
  "telegram_error",
);
if (telegramError && $("#auth-status")) {
  $("#auth-status").textContent =
    telegramError === "telegram_account_conflict"
      ? "Ten Telegram jest już połączony z innym kontem. Zaloguj się na właściwe konto i spróbuj ponownie."
      : telegramError === "telegram_account_blocked"
        ? "To konto jest zablokowane. Skontaktuj się z obsługą."
        : "Logowanie Telegram nie powiodło się. Sprawdź ustawienia OIDC w BotFather i spróbuj ponownie.";
  history.replaceState(null, "", location.pathname + location.hash);
}
supportPollTimer = setInterval(() => {
  if (state.support.threadId && (supportOpen || location.hash === "#contact"))
    loadSupportMessages();
}, 5000);
setInterval(() => {
  if (location.hash === "#referrals") loadReferralData(true);
}, 8000);
captureReferralLanding().finally(() => {
  initCartReservations().catch(() => {});
  if (location.hash === "#bonus") {
    loadBonusRewards();
    loadBonusCases().then(() => {
      if (location.hash === "#bonus" && mobileBonusPhase === "idle") render();
    });
  }
  if (window.Telegram?.WebApp?.initData) bootstrapTelegramMiniApp();
  else restoreWebsiteSession();
});

document.addEventListener("input", (e) => {
  if (!e.target.matches(".checkout-page [data-contact]")) return;
  const panel = e.target.closest(".contact-panel");
  if (!panel) return;
  const count = panel.querySelector(
    "[data-contact-count],[data-delivery-count]",
  );
  if (count)
    count.textContent = [
      ...panel.querySelectorAll("input[data-contact]"),
    ].filter((input) => input.value.trim()).length;
});

document.addEventListener("change", (e) => {
  if (
    e.target.name === "delivery" &&
    isMobile() &&
    $("#mobile-smart")?.classList.contains("mc-method-dialog")
  )
    $("#mobile-smart").close();
});

// Keep native mobile editing at normal scale and inside the visible keyboard viewport.
(() => {
  const editable = (el) =>
    el instanceof HTMLElement &&
    el.matches(
      "input:not([type=radio]):not([type=checkbox]):not([type=button]):not([type=submit]),textarea,select",
    ) &&
    !el.readOnly;
  let focusTimer;
  const reveal = () => {
    const el = document.activeElement;
    if (!isMobile() || !editable(el)) return;
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop || 0,
      bottom = top + (viewport?.height || window.innerHeight);
    const rect = el.getBoundingClientRect();
    if (rect.bottom > bottom - 20 || rect.top < top + 20)
      el.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "auto",
      });
  };
  const sync = () => {
    const viewport = window.visualViewport;
    const editing = isMobile() && editable(document.activeElement);
    const keyboard =
      editing && viewport && window.innerHeight - viewport.height > 120;
    document.body.classList.toggle("m-keyboard-open", !!keyboard);
    if (keyboard) reveal();
  };
  document.addEventListener("focusin", (e) => {
    if (!isMobile() || !editable(e.target)) return;
    clearTimeout(focusTimer);
    focusTimer = setTimeout(() => {
      sync();
      reveal();
    }, 300);
  });
  document.addEventListener("focusout", () => {
    clearTimeout(focusTimer);
    setTimeout(sync, 0);
  });
  window.visualViewport?.addEventListener("resize", sync);
  window.visualViewport?.addEventListener("scroll", sync);
})();

document.addEventListener("pointerdown", (e) => {
  const active = document.activeElement;
  if (
    active?.matches("[data-support-draft]") &&
    !e.target.closest(".support-composer") &&
    !e.target.closest('[data-action^="support-"]')
  )
    active.blur();
});

// Keep Telegram presentation independent from the API session bootstrap.
function configureTelegramPresentation() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
  if (
    typeof tg.disableVerticalSwipes === "function" &&
    (!tg.isVersionAtLeast || tg.isVersionAtLeast("7.7"))
  )
    tg.disableVerticalSwipes();
}
configureTelegramPresentation();
// Prevent pinch/gesture zoom while preserving ordinary scrolling and editing.
document.addEventListener("gesturestart", (e) => e.preventDefault(), {
  passive: false,
});
document.addEventListener("gesturechange", (e) => e.preventDefault(), {
  passive: false,
});
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);
document.addEventListener(
  "wheel",
  (e) => {
    if (e.ctrlKey) e.preventDefault();
  },
  { passive: false },
);

// A real range control keeps pointer capture while its dependent view updates.
document.addEventListener("input", (e) => {
  if (!e.target.matches(".smart-range")) return;
  const range = e.target,
    target = Number(range.value),
    variants = variantsFor(state.selectedProduct);
  let remaining = target,
    next = {};
  const indexes = mixMode
    ? [
        ...new Set([
          ...Object.keys(quantities).map(Number),
          ...variants.map((_, i) => i),
        ]),
      ]
    : [selectedFlavor];
  for (const i of indexes) {
    const inCart = state.cart
      .filter((p) => p.id === state.selectedProduct && !p.bonusReward)
      .reduce((n, p) => n + Number(p.flavors?.[i] || 0), 0);
    const capacity = Math.max(0, Number(variants[i]?.stock || 0) - inCart),
      take = Math.min(remaining, capacity);
    if (take) next[i] = take;
    remaining -= take;
    if (!remaining) break;
  }
  const actual = target - remaining;
  if (mixMode) quantities = next;
  else quantity = Math.max(1, actual);
  const temp = document.createElement("div");
  temp.innerHTML = smartHTML();
  const smart = $("#smart");
  if (!smart) return;
  for (const cls of [
    "smart-title",
    "progress-label",
    "progress-foot",
    "tiers",
    "current-price",
    "selection-total",
    "quantity-line",
  ]) {
    const old = smart.querySelector("." + cls),
      fresh = temp.querySelector("." + cls);
    if (old && fresh) old.replaceWith(fresh);
  }
  const fill = smart.querySelector(".track-fill");
  if (fill) fill.style.width = Math.min(100, actual) + "%";
  range.value = String(Math.max(1, actual));
  const addBtn = smart.querySelector('[data-action="add-cart"]');
  if (addBtn) addBtn.disabled = actual < 1;
  range.setAttribute("aria-valuetext", actual + " szt.");
  if (mixMode) {
    const flavors = $("#flavors");
    if (flavors) flavors.innerHTML = flavorsHTML();
  }
});
