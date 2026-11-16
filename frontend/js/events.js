/* ==========================================================================
 * js/events.js — Primary click/change/input/submit handlers
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

document.addEventListener("click", async (e) => {
  const prod = e.target.closest("[data-product]");
  if (prod) {
    state.selectedProduct = prod.dataset.product;
    flavorPage = 0;
    flavorFilter = "";
    save();
    if (prod.hash === location.hash) render();
  }
  const cat = e.target.closest("[data-category]");
  if (cat) {
    category = cat.dataset.category;
    catalogPage = 1;
  }
  const page = e.target.closest("[data-page]");
  if (page) {
    catalogPage = Number(page.dataset.page);
    render();
  }
  const bt = e.target.closest("[data-bonus]");
  if (bt) {
    if (mobileBonusPhase === "requesting") return;
    resetMobileBonus(bt.dataset.bonus);
    return;
  }
  const rewardButton = e.target.closest("[data-add-bonus-reward]");
  if (rewardButton) {
    e.preventDefault();
    await addBonusRewardToCart(rewardButton.dataset.addBonusReward);
    return;
  }
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action,
    i = Number(b.dataset.i);
  if (b.tagName === "BUTTON" && !b.hasAttribute("type")) e.preventDefault();
  switch (a) {
    case "account-toggle": {
      const menu =
        b.parentElement?.querySelector(".account-dropdown") ||
        $(".m-account-dropdown");
      if (menu) {
        menu.hidden = !menu.hidden;
        b.setAttribute("aria-expanded", String(!menu.hidden));
        if (!menu.hidden && $("#telegram-login-slot")) mountTelegramLogin();
      }
      break;
    }
    case "account-logout": {
      try {
        await fetch(API_BASE + "/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch {}
      state.user = null;
      state.userInfo = null;
      state.points = 0;
      state.pendingEmail = "";
      referralData = null;
      save();
      location.hash = "home";
      render();
      break;
    }
    case "connect-telegram":
      mountTelegramLogin();
      break;
    case "resend-code": {
      b.disabled = true;
      b.textContent = "Enviando…";
      try {
        const r = await fetch(API_BASE + "/auth/email-code/resend", {
          method: "POST",
          credentials: "include",
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error?.code);
        $("#verify-status").textContent = "Nowy kod został wysłany.";
        b.textContent = "Wyślij kod ponownie";
      } catch {
        b.disabled = false;
        b.textContent = "Wyślij kod ponownie";
        $("#verify-status").textContent =
          "Nie udało się wysłać kodu. Spróbuj ponownie.";
      }
      break;
    }
    case "copy-order": {
      try {
        await navigator.clipboard.writeText(state.lastOrder?.number || "");
        toast("Numer zamówienia skopiowany");
      } catch {
        toast("Numer zamówienia: " + (state.lastOrder?.number || ""));
      }
      break;
    }
    case "menu": {
      const open = $(".mobile-nav").classList.toggle("open");
      b.setAttribute("aria-expanded", open);
      break;
    }
    case "filter":
      category = b.dataset.filter;
      catalogPage = 1;
      render();
      break;
    case "favorite": {
      const id = b.dataset.id;
      if (!id) break;
      const saved = state.wishlist.includes(id);
      state.wishlist = saved
        ? state.wishlist.filter((x) => x !== id)
        : [...state.wishlist, id];
      save();
      $$('[data-action="favorite"]')
        .filter((el) => el.dataset.id === id)
        .forEach((el) => {
          el.classList.toggle("saved", !saved);
          el.setAttribute("aria-pressed", String(!saved));
          el.setAttribute(
            "aria-label",
            (!saved ? "Usuń z wybranych: " : "Dodaj do wybranych: ") +
              productById(id)[1],
          );
        });
      if (location.hash === "#wishlist") render();
      else toast(saved ? "Usunięto z wybranych" : "Dodano do wybranych");
      break;
    }
    case "flavor-page":
      flavorPage = Math.max(
        0,
        Math.min(
          Math.ceil(filteredFlavorEntries().length / 15) - 1,
          Number(b.dataset.flavorPage) || 0,
        ),
      );
      updateProduct();
      break;
    case "flavor":
      if (!canSelectStock(state.selectedProduct, i, (quantities[i] || 0) + 1))
        return;
      if (!mixMode) {
        selectedFlavor = i;
        updateProduct();
      } else {
        quantities[i] = (quantities[i] || 0) + 1;
        updateProduct();
      }
      break;
    case "flavor-plus":
      if (!canSelectStock(state.selectedProduct, i, (quantities[i] || 0) + 1))
        return;
      quantities[i] = Math.min(999, (quantities[i] || 0) + 1);
      updateProduct();
      break;
    case "flavor-minus":
      quantities[i] = Math.max(0, (quantities[i] || 0) - 1);
      updateProduct();
      break;
    case "qty-plus":
      quantity = Math.min(999, quantity + 1);
      updateProduct();
      break;
    case "qty-minus":
      quantity = Math.max(1, quantity - 1);
      updateProduct();
      break;
    case "tier":
      quantity = Number(b.dataset.qty);
      if (mixMode) {
        quantities = {};
        for (let k = 0; k < quantity; k++)
          quantities[k % 15] = (quantities[k % 15] || 0) + 1;
      }
      updateProduct();
      break;
    case "mix": {
      quantities = {};
      for (let k = 0; k < quantity; k++)
        quantities[k % 15] = (quantities[k % 15] || 0) + 1;
      location.hash = "mix";
      break;
    }
    case "all-flavors":
      mixMode = true;
      updateProduct();
      break;
    case "add-cart": {
      const q = mixMode ? totalQty() : quantity;
      if (q < 1) return;
      if (
        addCartProduct(
          state.selectedProduct,
          mixMode ? { ...quantities } : { [selectedFlavor]: q },
        ) === false
      )
        return;
      save();
      location.hash = "cart";
      toast("Produkt dodany do koszyka");
      break;
    }
    case "cart-edit-quantity": {
      const input = document.querySelector(`[data-cart-input="${i}"]`);
      input?.focus();
      input?.select();
      break;
    }
    case "cart-page":
      desktopCartPage = Number(b.dataset.cartPage) || 0;
      render();
      break;
    case "cart-plus":
      if (state.cart[i].demoReward || state.cart[i].bonusReward) return;
      resizeCartItem(state.cart[i], Math.min(999, state.cart[i].qty + 1));
      save();
      render();
      break;
    case "cart-minus":
      if (state.cart[i].demoReward || state.cart[i].bonusReward) return;
      resizeCartItem(state.cart[i], Math.max(1, state.cart[i].qty - 1));
      save();
      render();
      break;
    case "remove":
      state.cart.splice(i, 1);
      save();
      render();
      break;
    case "promo":
      await applyPromo();
      break;
    case "delivery":
      location.hash = "delivery";
      break;
    case "password": {
      const input = document.getElementById(b.dataset.for);
      input.type = input.type === "password" ? "text" : "password";
      b.setAttribute(
        "aria-label",
        input.type === "password" ? "Pokaż hasło" : "Ukryj hasło",
      );
      b.innerHTML = sysIcon(input.type === "password" ? "eye" : "eye-off");
      break;
    }
    case "forgot":
      e.preventDefault();
      dialog(
        "Odzyskiwanie hasła",
        "Reset hasła nie jest jeszcze dostępny. Napisz do nas przez czat wsparcia lub Telegram, a pomożemy odzyskać dostęp.",
      );
      break;
    case "social":
      if (b.dataset.provider === "google") {
        location.href =
          API_BASE +
          "/auth/google" +
          (state.referralCode
            ? "?ref=" + encodeURIComponent(state.referralCode)
            : "");
        break;
      }
      if (b.dataset.provider === "telegram") {
        mountTelegramLogin();
        break;
      }
      break;
    case "order-support":
      state.supportOrderContext = state.lastOrder?.number || null;
      openSupport();
      break;
    case "support":
      state.supportOrderContext = null;
      openSupport();
      break;
    case "close-dialog":
      $("#dialog").close();
      break;
    case "copy": {
      const input = $("#referral-url");
      try {
        await navigator.clipboard.writeText(input.value);
        toast("Link skopiowany");
      } catch {
        input.select();
        toast("Link zaznaczony. Naciśnij Ctrl+C lub ⌘C, aby skopiować.");
      }
      break;
    }
    case "claim":
      toast(
        "Nagrody za polecenia nie są jeszcze podłączone do konta. Punkty są naliczane po realizacji zamówień.",
      );
      break;
    case "open-case":
      startBonusOpen();
      break;
    case "bonus-reset":
      resetMobileBonus();
      break;
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "sort") {
    sort = e.target.value;
    catalogPage = 1;
    render();
  }
  if (e.target.id === "quantity") {
    quantity = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
    updateProduct();
  }
  if (e.target.hasAttribute("data-cart-input")) {
    const i = Number(e.target.dataset.cartInput);
    if (state.cart[i].demoReward || state.cart[i].bonusReward) return;
    resizeCartItem(
      state.cart[i],
      Math.max(1, Math.min(999, parseInt(e.target.value) || 1)),
    );
    save();
    render();
  }
  if (e.target.name === "delivery") {
    state.delivery = e.target.value;
    save();
    if (location.hash === "#delivery") location.hash = "checkout";
    else render();
  }
  if (e.target.dataset.contact) {
    state.contact[e.target.dataset.contact] = e.target.value;
    save();
  }
});
document.addEventListener("input", (e) => {
  if (e.target.dataset.contact) {
    state.contact[e.target.dataset.contact] = e.target.value;
    save();
  }
  if (e.target.id === "auth-password") {
    const s = e.target.value;
    const rules = {
      length: s.length >= 8,
      digit: /\d/.test(s),
      upper: /[A-ZĄĆĘŁŃÓŚŹŻ]/.test(s),
      special: /[^\p{L}\p{N}]/u.test(s),
    };
    Object.entries(rules).forEach(([k, v]) =>
      $(`[data-rule="${k}"]`)?.classList.toggle("valid", v),
    );
  }
  if (e.target.id === "repeat-password" || e.target.id === "auth-password")
    $("#repeat-password")?.setCustomValidity(
      $("#repeat-password").value !== $("#auth-password").value
        ? "Hasła muszą być identyczne"
        : "",
    );
});
document.addEventListener("submit", async (e) => {
  if (e.target.id === "auth-form") {
    e.preventDefault();
    const form = e.target,
      register = form.dataset.register === "true",
      fd = new FormData(form),
      status = $("#auth-status"),
      button = form.querySelector("[type=submit]");
    if (!form.reportValidity()) return;
    const password = String(fd.get("password") || "");
    if (
      register &&
      (!/\d/.test(password) ||
        !/[A-ZĄĆĘŁŃÓŚŹŻ]/.test(password) ||
        !/[^\p{L}\p{N}]/u.test(password))
    ) {
      status.textContent =
        "Hasło musi zawierać cyfrę, wielką literę i znak specjalny.";
      return;
    }
    if (register && password !== fd.get("repeat")) {
      status.textContent = "Hasła muszą być identyczne.";
      return;
    }
    const payload = { email: String(fd.get("email")).trim(), password };
    if (register) {
      payload.firstName = String(fd.get("firstName")).trim();
      payload.lastName = String(fd.get("lastName")).trim();
    }
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    status.textContent = register ? "Tworzenie konta…" : "Logowanie…";
    try {
      payload.referralCode = state.referralCode || undefined;
      const response = await fetch(
        API_BASE + (register ? "/auth/email-code" : "/auth/login"),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const code = data.error?.code;
        status.textContent =
          code === "EMAIL_NOT_CONFIGURED"
            ? "Weryfikacja e-mail wymaga skonfigurowania usługi pocztowej. Skontaktuj się z administratorem."
            : code === "INVALID_CREDENTIALS"
              ? "Nieprawidłowy adres e-mail lub hasło."
              : code === "ACCOUNT_EXISTS"
                ? "Konto z tym adresem e-mail już istnieje."
                : code === "PASSWORD_POLICY"
                  ? "Hasło nie spełnia wymagań."
                  : response.status === 429
                    ? "Zbyt wiele prób. Spróbuj ponownie później."
                    : "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.";
        return;
      }
      if (register) {
        state.pendingEmail = payload.email;
        save();
        location.hash = "verify-email";
        return;
      }
      state.user = data.user.firstName || data.user.email;
      state.userInfo = data.user;
      state.points = data.user.points || 0;
      referralData = null;
      save();
      location.hash = "home";
    } catch {
      status.textContent =
        "Nie udało się połączyć z serwerem. Spróbuj ponownie.";
    } finally {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }
  if (e.target.id === "checkout-form") {
    e.preventDefault();
    if (!state.cart.length) {
      toast("Koszyk jest pusty");
      return;
    }
    if (!state.delivery) {
      $("#order-status").textContent = "Wybierz metodę dostawy.";
      return;
    }
    if (!e.target.reportValidity()) return;
    try {
      await flushCartReservation();
      const lines = state.cart.flatMap((item) =>
        Object.entries(item.flavors || {})
          .filter(([, q]) => q > 0)
          .map(([index, quantity]) => ({
            slug: item.id,
            variantKey: variantKeyFor(item.id, index),
            quantity,
            ...(item.bonusRewardId
              ? { bonusRewardId: item.bonusRewardId }
              : {}),
          })),
      );
      const orderKey =
        sessionStorage.getItem("si-order-key") || crypto.randomUUID();
      sessionStorage.setItem("si-order-key", orderKey);
      const response = await fetch(API_BASE + "/orders", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": orderKey,
        },
        body: JSON.stringify({
          promoCode: state.promoCode || undefined,
          items: lines,
          contact: {
            name: state.contact.name,
            ...(state.contact.email?.trim()
              ? { email: state.contact.email.trim() }
              : {}),
            phone: state.contact.phone,
            city: state.contact.city,
            address: state.contact.locker,
          },
          deliveryMethod: state.delivery,
          paymentMethod: "manual",
          referralCode: state.referralCode,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error?.details?.message || data.error?.code || "ORDER_FAILED",
        );
      state.lastOrder = { ...data, createdAt: new Date().toISOString() };
      state.cart = [];
      state.promoCode = "";
      state.promoDiscount = null;
      state.cartHoldExpires = null;
      reservationFingerprint = "[]";
      sessionStorage.removeItem("si-order-key");
      save();
      location.hash = "order-accepted";
    } catch (error) {
      $("#order-status").textContent =
        error.message?.startsWith("Za mało") ||
        error.message?.startsWith("Недостаточно")
          ? error.message
          : error.message === "INSUFFICIENT_STOCK"
            ? "Część produktów nie jest już dostępna w wybranej ilości."
            : error.message === "PRODUCT_UNAVAILABLE"
              ? "Produkt nie jest już dostępny."
              : error instanceof TypeError && location.protocol === "file:"
                ? "Otwórz stronę przez lokalny adres http://localhost:8765 - plik index.html blokuje połączenie z serwerem."
                : error instanceof TypeError
                  ? "Serwer API nie jest uruchomiony. Uruchom backend i spróbuj ponownie."
                  : "Nie udało się wysłać zamówienia. Sprawdź dane i spróbuj ponownie.";
    }
  }
});
document.addEventListener("input", (e) => {
  if (e.target.closest(".verify-code-inputs")) {
    const input = e.target,
      box = input.parentElement,
      items = [...box.querySelectorAll("input")],
      digits = input.value.replace(/\D/g, "").slice(-1);
    input.value = digits;
    if (digits && items[items.indexOf(input) + 1])
      items[items.indexOf(input) + 1].focus();
  }
});
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Backspace" &&
    e.target.closest(".verify-code-inputs") &&
    !e.target.value
  ) {
    const items = [...e.target.parentElement.querySelectorAll("input")],
      index = items.indexOf(e.target);
    items[index - 1]?.focus();
  }
});
document.addEventListener("paste", (e) => {
  if (!e.target.closest(".verify-code-inputs")) return;
  const digits = (e.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, 6),
    items = [...e.target.parentElement.querySelectorAll("input")];
  if (!digits) return;
  e.preventDefault();
  items.forEach((input, i) => (input.value = digits[i] || ""));
  items[Math.min(digits.length, 5)]?.focus();
});
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "verify-email-form") return;
  e.preventDefault();
  const code = [...e.target.querySelectorAll(".verify-code-inputs input")]
      .map((x) => x.value)
      .join(""),
    status = $("#verify-status"),
    button = e.target.querySelector("[type=submit]");
  if (!/^\d{6}$/.test(code)) {
    status.textContent = "Wpisz wszystkie sześć cyfr.";
    return;
  }
  button.disabled = true;
  status.textContent = "Weryfikujemy kod…";
  try {
    const r = await fetch(API_BASE + "/auth/email-code/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      }),
      d = await r.json().catch(() => ({}));
    if (!r.ok) {
      const c = d.error?.code;
      status.textContent =
        c === "INVALID_EMAIL_CODE"
          ? "Kod jest nieprawidłowy. Sprawdź wiadomość i spróbuj ponownie."
          : c === "EMAIL_CHALLENGE_EXPIRED"
            ? "Kod wygasł. Wróć do rejestracji i wyślij nowy kod."
            : "Nie udało się potwierdzić kodu. Spróbuj ponownie.";
      return;
    }
    state.user = d.user.firstName || d.user.email;
    state.userInfo = d.user;
    state.points = d.user.points || 0;
    state.pendingEmail = "";
    referralData = null;
    save();
    location.hash = "home";
  } catch {
    status.textContent = "Nie udało się połączyć z serwerem.";
  } finally {
    button.disabled = false;
  }
});
let telegramAuthStarted = false;
