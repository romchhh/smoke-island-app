/* ==========================================================================
 * js/pages-account.js — Auth, bonus cases, referrals (desktop + mobile referrals)
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

function auth(register = false) {
  const title = register
    ? 'Utwórz <span class="blue">swoje konto</span>'
    : 'Witamy <span class="blue">ponownie</span>';
  const subtitle = register
    ? 'Zarejestruj się, aby korzystać z promocji, zbierać nagrody i więcej!'
    : 'Zaloguj się, aby kontynuować zakupy i korzystać z benefitów.';
  const nameFields = register
    ? `
      <div class="two-cols">
        <div>
          <label for="first-name">Imię</label>
          <input id="first-name" name="firstName" required placeholder="♙  Wpisz swoje imię" autocomplete="given-name">
        </div>
        <div>
          <label for="last-name">Nazwisko</label>
          <input id="last-name" name="lastName" required placeholder="♙  Wpisz swoje nazwisko" autocomplete="family-name">
        </div>
      </div>
    `
    : '';
  const passwordMin = register ? 8 : 1;
  const passwordAutocomplete = register ? 'new-password' : 'current-password';
  const passwordPlaceholder = register ? 'Utwórz hasło' : 'Wpisz swoje hasło';
  const repeatPassword = register
    ? `
      <div>
        <label for="repeat-password">Powtórz hasło</label>
        <div class="input-password">
          <input id="repeat-password" name="repeat" type="password" required minlength="8" autocomplete="new-password" placeholder="♙  Powtórz hasło">
          <button type="button" class="eye" data-action="password" data-for="repeat-password" aria-label="Pokaż hasło">${sysIcon('eye')}</button>
        </div>
      </div>
    `
    : '';
  const passwordExtras = register
    ? `
      <div class="password-rules">
        <span data-rule="length">✓ Min. 8 znaków</span>
        <span data-rule="digit">✓ Cyfra</span>
        <span data-rule="upper">✓ Wielka litera</span>
        <span data-rule="special">✓ Znak specjalny</span>
      </div>
    `
    : '<a class="forgot" href="#" data-action="forgot">Nie pamiętasz hasła?</a>';
  const submitLabel = register ? 'Załóż konto' : 'Zaloguj się';
  const bottom = register
    ? 'Masz już konto? <a href="#login">Zaloguj się teraz ⟶</a>'
    : 'Nie masz konta? <a href="#register">Załóż je teraz ⟶</a>';

  return `
    <div class="auth-stage">
      ${img('star', '', 'auth-decor')}
      ${img('bag', '', 'auth-decor right')}
      <h1>${title}</h1>
      <p>${subtitle}</p>
      <form class="auth-card" id="auth-form" data-register="${register}">
        <div class="auth-tabs">
          <a class="${!register ? 'active' : ''}" href="#login">Zaloguj się</a>
          <a class="${register ? 'active' : ''}" href="#register">Załóż konto</a>
        </div>
        ${nameFields}
        <label for="auth-email">Adres e-mail</label>
        <input id="auth-email" name="email" type="email" required placeholder="✉  Wpisz swój e-mail" autocomplete="email">
        <div class="${register ? 'two-cols' : ''}">
          <div>
            <label for="auth-password">Hasło</label>
            <div class="input-password">
              <input
                id="auth-password"
                name="password"
                type="password"
                required
                minlength="${passwordMin}"
                autocomplete="${passwordAutocomplete}"
                placeholder="♙  ${passwordPlaceholder}"
              >
              <button class="eye" type="button" data-action="password" data-for="auth-password" aria-label="Pokaż hasło">${sysIcon('eye')}</button>
            </div>
          </div>
          ${repeatPassword}
        </div>
        ${passwordExtras}
        <button type="submit" class="primary wide">${submitLabel}</button>
        <p class="status-message" id="auth-status" role="status"></p>
        <div class="auth-divider" role="separator"><span>lub</span></div>
        <div class="socials">
          <button type="button" class="social-btn social-google" data-action="social" data-provider="google">
            <span class="social-badge" aria-hidden="true">
              <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </span>
            <span class="social-label">Kontynuuj z Google</span>
          </button>
          <button type="button" class="social-btn social-telegram" data-action="social" data-provider="telegram">
            <span class="social-badge" aria-hidden="true">
              <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="#2AABEE"/>
                <path fill="#fff" d="M17.6 7.2 5.9 11.7c-.8.3-.8.8-.1 1l3 1 1.2 3.6c.1.4.3.5.6.5.3 0 .4-.1.6-.3l1.7-1.7 3.5 2.6c.6.3 1.1.2 1.2-.6l2.2-10.3c.2-.9-.3-1.3-.9-1z"/>
              </svg>
            </span>
            <span class="social-label">Kontynuuj z Telegram</span>
          </button>
          <div id="telegram-login-slot"></div>
        </div>
      </form>
      <div class="auth-bottom">${bottom}</div>
    </div>
  `;
}

let bonusCases = {};
async function loadBonusCases() {
  try {
    const r = await fetch(API_BASE + "/bonus/cases", {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) return;
    const d = await r.json();
    bonusCases = d.cases || {};
    for (const c of Object.values(bonusCases))
      for (const p of c.products || []) productRecords.set(p.slug, p);
  } catch {}
}
function casePreviewItems() {
  return (bonusCases[bonusTab]?.products || []).flatMap((p) =>
    p.variants
      .filter((v) => v.active && (p.rewardOnly || v.stock > 0))
      .map((v) => ({
        slug: p.slug,
        name: p.name,
        variant: v.label,
        value:
          p.rewardUnit === "%"
            ? p.rewardValue + "%"
            : p.rewardUnit === "pkt"
              ? p.rewardValue + " pkt"
              : money(v.priceMinor / 100),
      })),
  );
}
function prizeCards() {
  const items = casePreviewItems();
  return (
    items
      .map(
        (p) =>
          `<article class="prize">${productArt(p.slug, p.name)}<h3>${esc(p.name)}</h3><p>${esc(p.value)}</p></article>`,
      )
      .join("") || '<p class="muted">Nagrody są chwilowo niedostępne.</p>'
  );
}

const rewardActionLabel = (r) =>
  r.status === "REDEEMED"
    ? "ODEBRANO"
    : r.rewardUnit === "discount" || r.rewardUnit === "%"
      ? "ODBIERZ RABAT"
      : r.rewardUnit === "pkt"
        ? "ODBIERZ PUNKTY"
        : "DODAĆ DO KOSZYKA";
function bonusRewardCards() {
  return (state.pendingBonusRewards || [])
    .map(
      (r) =>
        `<article class="bonus-pending"><div>${productArt(r.productSlug || "bc", r.productName || "Nagroda bonusowa")}<span><b>${esc(r.productName || "Nagroda bonusowa")}</b><small>${esc(r.variant || "")} · bezpłatna</small></span></div><button class="secondary" data-add-bonus-reward="${esc(r._id)}">${rewardActionLabel(r)}</button></article>`,
    )
    .join("");
}
async function loadBonusRewards() {
  if (!state.user || Date.now() - bonusRewardsLoadAt < 4000) return;
  bonusRewardsLoadAt = Date.now();
  try {
    const r = await fetch(API_BASE + "/bonus/rewards", {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) return;
    const d = await r.json();
    state.pendingBonusRewards = d.items || [];
    for (const reward of state.pendingBonusRewards) cacheRewardProduct(reward);
    save();
    if (
      ["bonus", "opening"].includes(location.hash.slice(1)) &&
      mobileBonusPhase !== "opening"
    )
      render();
  } catch {}
}
async function addBonusRewardToCart(id) {
  const reward =
    (state.pendingBonusRewards || []).find((r) => r._id === id) ||
    activeBonusReward;
  if (!reward?._id) return false;
  if (["%", "pkt", "discount"].includes(reward.rewardUnit)) {
    const r = await fetch(
      API_BASE + "/bonus/rewards/" + encodeURIComponent(reward._id) + "/redeem",
      { method: "POST", credentials: "include" },
    );
    const d = await r.json();
    if (!r.ok) {
      toast("Nie udało się odebrać nagrody");
      return false;
    }
    state.points = d.points;
    if (d.code) {
      state.promoCode = d.code;
      state.promoDiscount = { percent: d.percent, amountMinor: d.amountMinor };
    }
    reward.status = "REDEEMED";
    if (activeBonusReward?._id === reward._id) {
      activeBonusReward.status = "REDEEMED";
      mobileBonusClaimed = true;
    }
    state.pendingBonusRewards = (state.pendingBonusRewards || []).filter(
      (r) => r._id !== reward._id,
    );
    save();
    render();
    bonusRewardsLoadAt = 0;
    await loadBonusRewards();
    toast(d.code ? "Kod rabatowy został zastosowany" : "Punkty zostały dodane");
    return true;
  }
  if (!variantsFor(reward.productSlug).length) {
    const r = await fetch(
      API_BASE + "/products/" + encodeURIComponent(reward.productSlug),
      { credentials: "include" },
    );
    if (r.ok) {
      const record = await r.json();
      productRecords.set(record.slug, record);
      products.push([record.slug, record.name, record.category, ""]);
    }
  }
  const variants = variantsFor(reward.productSlug),
    idx = variants.findIndex((v) => v.key === reward.variantKey);
  if (idx < 0) {
    toast(
      "Wariant nagrody jest chwilowo niedostępny w katalogu. Odśwież stronę i spróbuj ponownie.",
    );
    return false;
  }
  if (!state.cart.some((p) => p.bonusRewardId === reward._id))
    state.cart.push({
      id: reward.productSlug,
      qty: 1,
      flavors: { [idx]: 1 },
      bonusReward: true,
      bonusRewardId: reward._id,
    });
  save();
  location.hash = "cart";
  toast("Bezpłatna nagroda dodana do koszyka. Dostawa naliczana standardowo.");
  return true;
}
async function requestBonusReward() {
  if (!state.user) {
    location.hash = "login";
    toast("Zaloguj się, aby otworzyć case.");
    throw new Error("UNAUTHORIZED");
  }
  const key = crypto.randomUUID(),
    response = await fetch(API_BASE + "/bonus/open", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ tier: bonusTab }),
    }),
    data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.code || "BONUS_OPEN_FAILED");
  state.points = data.points;
  activeBonusReward = data.reward;
  cacheRewardProduct(data.reward);
  state.pendingBonusRewards = state.pendingBonusRewards || [];
  if (!state.pendingBonusRewards.some((r) => r._id === data.reward._id))
    state.pendingBonusRewards.push(data.reward);
  save();
  return data.reward;
}
function desktopBonusResult(reward) {
  const name = esc(reward.productName || "Nagroda bonusowa"),
    variant = esc(reward.variant || ""),
    value = rewardValueLabel(reward);
  return `<div class="db-result"><section class="db-result-visual">${bonusAtmosphere()}<div class="db-result-product">${productArt(reward.productSlug || "bc", name)}<div><p>Otrzymujesz:</p><h2>${name}</h2></div></div></section><div class="db-result-bottom"><section class="db-result-value"><h2>Wartość nagrody: <span>${value}</span></h2><p>Wariant: ${variant}</p></section><div class="db-result-actions"><button data-add-bonus-reward="${esc(reward._id)}" ${reward.status === "REDEEMED" ? "disabled" : ""}>${rewardActionLabel(reward)}</button><button data-action="bonus-reset">← OTWÓRZ KOLEJNY CASE</button></div></div></div>`;
}
function desktopPendingRewards() {
  const rewards = (state.pendingBonusRewards || []).filter(
    (r) => mobileBonusPhase !== "result" || r._id !== activeBonusReward?._id,
  );
  return `<section class="db-pending"><header><span><i aria-hidden="true">i</i>Twoje niezamówione nagrody</span><span>Przesuń, aby zobaczyć →</span></header><div class="db-pending-track">${rewards.length ? rewards.map((r) => `<article class="db-pending-card">${productArt(r.productSlug || "bc", r.productName || "Nagroda bonusowa")}<div><h3>${esc(r.productName || "Nagroda bonusowa")}</h3><p>${esc(r.variant || "")} &nbsp;•&nbsp; bezpłatna</p><button data-add-bonus-reward="${esc(r._id)}">${rewardActionLabel(r)}</button></div></article>`).join("") + (rewards.length === 1 ? '<button class="db-pending-more" data-action="bonus-reset" aria-label="Otwórz kolejny case">+</button>' : "") : '<div class="db-pending-empty">Jeszcze nie masz <span>nagród...</span></div>'}</div></section>`;
}
function bonusAtmosphere() {
  return `<div class="bonus-case-glow" aria-hidden="true"></div><div class="bonus-case-particles" aria-hidden="true">${Array.from(
    { length: 18 },
    (_, i) => {
      const left = i < 9,
        j = i % 9;
      return `<i style="--x:${left ? 5 + ((j * 9) % 33) : 64 + ((j * 7) % 31)}%;--y:${15 + ((j * 17) % 70)}%;--size:${j % 4 === 0 ? 5 : 2}px;--travel:${left ? -(20 + (j % 6)) : 20 + (j % 6)}px;--duration:${3.5 + (j % 4) * 0.6}s;--delay:${-i * 0.57}s"></i>`;
    },
  ).join("")}</div>`;
}
function mountSmokeAtmosphere() {
  if (document.querySelector(".si-smoke")) return;
  const layer = document.createElement("div");
  layer.className = "si-smoke";
  layer.setAttribute("aria-hidden", "true");
  document.body.prepend(layer);
}
function bonus() {
  if (isMobile()) return mobileBonus();
  const costs = { Start: 10, Premium: 20, Exclusive: 100 },
    reward = activeBonusReward,
    opening = mobileBonusPhase === "opening";
  return `<div class="page bonus-page bonus-tier-${bonusTab.toLowerCase()}"><div class="bonus-intro"><nav class="breadcrumb bonus-breadcrumb" aria-label="Okruszki"><a href="#home">Strona główna</a><span aria-hidden="true">›</span><a href="#catalog">Katalog</a><span aria-hidden="true">›</span><a class="bonus-crumb-current" href="#catalog">Wszystkie produkty</a></nav><div class="bonus-heading"><h1>Twoje bonusy</h1><p>Wybierz swój case i wykorzystaj zebrane punkty.</p></div>${banner()}</div><div class="bonus-tabs"><div class="tabs">${["Start", "Premium", "Exclusive"].map((t) => '<button class="tab ' + (t === bonusTab ? "active" : "") + '" data-bonus="' + t + '">' + t + "</button>").join("")}</div><small class="bonus-points-note"><span aria-hidden="true">ⓘ</span>Punkty zbierasz za zrealizowane zamówienia.</small></div><section class="case-panel">${mobileBonusPhase === "requesting" ? `<div class="case-stage">${bonusAtmosphere()}<p>Sprawdzamy saldo i przygotowujemy case…</p></div>` : opening ? `<div class="desktop-bonus-animation">${bonusAtmosphere()}${desktopBonusReel()}</div>` : mobileBonusPhase === "result" && reward ? desktopBonusResult(reward) : `<div class="case-stage">${bonusAtmosphere()}${img("bonus-stars", "Niebieskie gwiazdy bonusowe")}<button class="primary" data-action="open-case" aria-label="Otwórz case za ${costs[bonusTab]} punktów">OTWÓRZ CASE</button></div><div class="prizes">${prizeCards()}</div>`}${!opening && mobileBonusPhase !== "requesting" ? desktopPendingRewards() : ""}</section></div>`;
}
function referralGuestIcon(type) {
  const map = { people: "referral", link: "link", gift: "gift", bolt: "bonus" };
  if (type === "link")
    return `<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 1 0-5.7l1.4-1.4a4 4 0 0 1 5.7 5.7l-1 1"/><path d="M14 10a4 4 0 0 1 0 5.7l-1.4 1.4a4 4 0 1 1-5.7-5.7l1-1"/></svg>`;
  return sysIcon(map[type] || "referral");
}
function desktopReferralGuestPage() {
  return `<div class="desktop-referral-guest"><header class="dec-heading"><div>${breadcrumb("Bonusy", "Zaproś przyjaciół")}<h1>Zaproś przyjaciół</h1><p>Podziel się linkiem. Zbieraj punkty. Otwieraj bonusowe case’y.</p></div>${banner()}</header><section class="dec-frame"><div class="dec-visual">${bonusAtmosphere()}<div class="dec-art"><img src="assets/referral-invite-friends.png" alt="Zaproś przyjaciół i zdobywaj bonusy"></div><a class="primary dec-continue" href="#login">ZALOGUJ SIĘ</a></div><div class="dec-message"><h2>Zaloguj się, aby zapraszać znajomych</h2><p>Po zalogowaniu otrzymasz swój unikalny link polecający, którym możesz dzielić się ze znajomymi i zdobywać bonusy.</p></div></section></div>`;
}
function referralGuestPage() {
  if (!isMobile()) return desktopReferralGuestPage();
  return `${breadcrumb("Bonusy", "Polecenia")}<div class="page referral-guest"><div class="page-head referral-guest-heading"><div><h1>Polecenia</h1><p>Zaproś znajomych i zdobywaj bonusy!</p></div></div><section class="referral-guest-panel" aria-labelledby="referral-guest-title"><div class="referral-guest-art"><img src="assets/referral-invite-friends.png" alt="Zaproś przyjaciół i zdobywaj bonusy"></div><div class="referral-guest-content"><h2 id="referral-guest-title">Zaloguj się, aby <span>zapraszać znajomych</span></h2><p>Po zalogowaniu otrzymasz swój unikalny link polecający, którym możesz dzielić się ze znajomymi i zdobywać bonusy.</p><a class="referral-guest-login primary" href="#login"><span>ZALOGUJ SIĘ</span></a></div></section><div class="referral-guest-benefits">${[
    ["link", "Twój unikalny link", "Otrzymaj link polecający po zalogowaniu."],
    [
      "gift",
      "Nagrody za zaproszenia",
      "Zdobywaj punkty za aktywnych znajomych.",
    ],
    ["bolt", "Szybkie i proste", "Zaproś w kilka sekund i zbieraj bonusy."],
  ]
    .map(
      ([icon, title, copy]) =>
        `<article class="referral-guest-benefit"><span class="referral-benefit-icon">${referralGuestIcon(icon)}</span><div><h3>${title}</h3><p>${copy}</p></div></article>`,
    )
    .join("")}</div></div>`;
}
function referrals() {
  if (isMobile()) return mobileReferrals();
  const d = referralData;
  if (!state.user) return referralGuestPage();
  if (!d)
    return `${breadcrumb("Bonusy", "Zaproś przyjaciół")}<div class="page referral-account">${pageHead("Zaproś przyjaciół", "Ładujemy Twoje statystyki…")}<section class="referral-account-panel"></section></div>`;
  const ordered = [...d.invited].sort(
    (a, b) =>
      (a.rewardGroup ?? Number.MAX_SAFE_INTEGER) -
        (b.rewardGroup ?? Number.MAX_SAFE_INTEGER) ||
      new Date(a.joinedAt) - new Date(b.joinedAt),
  );
  const groups = [];
  for (let i = 0; i < ordered.length; i += 2)
    groups.push(ordered.slice(i, i + 2));
  return `${breadcrumb("Bonusy", "Zaproś przyjaciół")}<div class="page referral-account">${pageHead("Zaproś przyjaciół", "Podziel się linkiem. Zbieraj punkty. Otwieraj bonusowe case’y.")}<section class="referral-account-panel"><div class="referral-top"><div><h2>Dwie osoby. Jeden bonus.</h2><p>Za każdą parę zaproszonych przyjaciół, którzy dokonają zakupu, otrzymasz <span class="blue">10 punktów.</span> Wykorzystasz je do otwierania case’ów w sekcji Bonusy.</p></div><div class="copy-box"><input id="referral-url" readonly aria-label="Twój link polecający" value="${esc(d.link)}"><button class="primary" data-action="copy">SKOPIUJ LINK</button></div></div><div class="stats">${[
    ["Zaproszeni przyjaciele", d.invited.length],
    ["Zakupy przyjaciół", d.qualified],
    ["Zdobyte punkty", d.points],
    ["Gotowe pary", d.pairs],
  ]
    .map(
      ([label, value]) =>
        `<div class="stat"><p>${label}</p><strong>${value}</strong></div>`,
    )
    .join(
      "",
    )}</div><h2>Twoi przyjaciele</h2><div class="friend-grid">${groups.map((group, i) => `<article class="friend-card"><header><h3>Para ${String(group.find((x) => x.rewardGroup)?.rewardGroup || i + 1).padStart(2, "0")}</h3><span>${group.filter((x) => x.purchased).length}/2 zakupy</span></header>${group.map((friend) => `<div class="friend"><span class="avatar">${esc(friend.name.slice(0, 2).toUpperCase())}</span><div><strong>${esc(friend.name)}</strong><small>${new Date(friend.joinedAt).toLocaleDateString("pl-PL")} · ${friend.registered ? "konto aktywne" : "konto gościa"}</small></div><em class="${friend.purchased ? "" : "pending"}">${friend.purchased ? "Zakup dokonany" : friend.registered ? "Brak zakupu" : "Oczekuje na rejestrację"}</em></div>`).join("")}<div class="referral-reward-status primary" role="status">${group.length === 2 && group.every((x) => x.rewardGroup) ? "10 PUNKTÓW PRZYZNANO" : `ZAKUPY ZNAJOMYCH: ${group.filter((x) => x.purchased).length} / 2`}</div></article>`).join("") || '<p class="muted">Jeszcze nikt nie skorzystał z Twojego linku.</p>'}</div></section></div>`;
}
function mobileReferrals() {
  if (!state.user) return referralGuestPage();
  const d = referralData;
  const title = `<header class="mr-heading"><h1>Zaproś przyjaciół</h1><p>Podziel się linkiem. Zbieraj punkty. Otwieraj bonusowe case’y.</p></header>`;
  if (!d)
    return `<div class="mr-page">${title}<section class="mr-frame"><p class="mr-loading" role="status">Ładujemy Twoje statystyki…</p></section></div>`;
  const ordered = [...d.invited].sort(
      (a, b) =>
        (a.rewardGroup ?? Number.MAX_SAFE_INTEGER) -
          (b.rewardGroup ?? Number.MAX_SAFE_INTEGER) ||
        new Date(a.joinedAt) - new Date(b.joinedAt),
    ),
    groups = [];
  for (let i = 0; i < ordered.length; i += 2)
    groups.push(ordered.slice(i, i + 2));
  return `<div class="mr-page">${title}<section class="mr-frame"><div class="mr-intro"><h2>Dwie osoby. Jeden bonus.</h2><p>Za każdą parę zaproszonych przyjaciół, którzy dokonają zakupu, otrzymasz <span>10 punktów.</span> Wykorzystasz je do otwierania case’ów w sekcji Bonusy.</p><div class="mr-copy"><input id="referral-url" readonly aria-label="Twój link polecający" value="${esc(d.link)}"><button type="button" class="mr-primary" data-action="copy">SKOPIUJ LINK</button></div></div><section class="mr-stats" aria-label="Statystyki poleceń"><header><span class="mr-coin">${img("coin", "")}</span><h2>Punkty za polecenia</h2><p><b>${Number(d.points) || 0}</b> pkt</p></header><div class="mr-stat-grid">${[
    [d.invited.length, "Zaproszeni"],
    [d.qualified, "Z zakupem"],
    [Math.max(0, d.invited.length - (Number(d.qualified) || 0)), "Bez zakupu"],
  ]
    .map(
      ([n, label]) =>
        `<div><b>${Number(n) || 0}</b><span>${label}</span></div>`,
    )
    .join(
      "",
    )}</div></section><div class="mr-friends-heading"><h2>Twoi przyjaciele</h2><small>2 zakupy = <b>10 punktów</b></small></div><div class="mr-friend-list">${
    groups
      .map((group, i) => {
        const purchased = group.filter((x) => x.purchased).length,
          awarded = group.length === 2 && group.every((x) => x.rewardGroup);
        return `<article class="mr-friend-card"><header><h3>Para ${String(group.find((x) => x.rewardGroup)?.rewardGroup || i + 1).padStart(2, "0")}</h3><span>${purchased}/2 zakupy</span></header>${group
          .map(
            (friend) =>
              `<div class="mr-friend"><span class="mr-avatar">${esc(
                (friend.name || "Gość")
                  .split(/\s+/)
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase(),
              )}</span><div><strong>${esc(friend.name || "Gość")}</strong><small>${friend.registered ? "Zaproszony przyjaciel" : "Konto gościa"}</small></div><em class="${friend.purchased ? "is-purchased" : ""}">${friend.purchased ? "Zakup dokonany" : friend.registered ? "Brak zakupu" : "Oczekuje na rejestrację"}</em></div>`,
          )
          .join(
            "",
          )}<div class="mr-reward-status mr-primary" role="status">${awarded ? "10 PUNKTÓW PRZYZNANO" : `ZAKUPY ZNAJOMYCH: ${purchased} / 2`}</div></article>`;
      })
      .join("") ||
    '<p class="mr-empty">Jeszcze nikt nie skorzystał z Twojego linku.</p>'
  }</div></section></div>`;
}
// Mobile layouts follow the 375 px PDF artboards; data and prices are shared with desktop.
