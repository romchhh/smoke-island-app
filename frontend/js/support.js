/* ==========================================================================
 * js/support.js — Support chat UI + messaging
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

const supportIcon = (name) =>
  `<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${supportIcons[name] || supportIcons.chat}</svg>`;
const supportAvatar = () =>
  `<span class="support-avatar" aria-hidden="true">${img("icon-support", "")}</span>`;
if (!state.support || typeof state.support !== "object")
  state.support = { messages: [], dismissed: false, threadId: "" };
if (!Array.isArray(state.support.messages)) state.support.messages = [];
let supportOpen = false,
  supportDraft = "",
  supportEmojiOpen = false,
  supportPendingFiles = [],
  supportMessageCounter = 0,
  supportSending = false,
  supportAccessToken = sessionStorage.getItem("si_support_token") || "",
  supportPollTimer = null;
const supportImagePreviews = new Map(),
  supportFileBlobs = new Map();
let referralData = null,
  referralDataLoading = false;
const supportQuickQuestions = [
  ["box", "Dobór produktu", "Pomóż mi wybrać produkt."],
  ["percent", "Aktualne promocje", "Jakie są aktualne promocje?"],
  ["truck", "Dostawa i płatność", "Jakie są opcje dostawy i płatności?"],
  ["order", "Status zamówienia", "Chcę zapytać o status zamówienia."],
];
function supportPromotion() {
  const p = products[0] || [
    "merry-mi-blade-30000",
    "MERRY MI BLADE 30000",
    "Jednorazówki",
  ];
  const price = productBasePrice(p[0]);
  return `<a class="support-promotion" href="#product" data-product="${esc(p[0])}" aria-label="Zobacz ${esc(p[1])}"><div><div class="support-promo-title">${esc(p[1])}</div><div class="support-promo-details"><b>HIT SPRZEDAŻY</b><ul><li>${esc(p[2] || "Katalog")}</li><li>Dostępne warianty</li><li>Szybka wysyłka</li></ul><span>Od <strong>${money(price)}</strong> / szt.</span></div></div>${productArt(p[0], p[1])}</a>`;
}
function supportMessageHTML(m) {
  const user = m.role === "user";
  const attachments = Array.isArray(m.attachments) ? m.attachments : [];
  return `<article class="support-message ${user ? "from-user" : "from-manager"}">${user ? "" : supportAvatar()}<div class="support-bubble ${m.type === "product" ? "is-promotion" : ""}">${
    m.type === "product"
      ? supportPromotion()
      : `${m.text ? `<p>${esc(m.text).replace(/\n/g, "<br>")}</p>` : ""}${attachments
          .map((a) => {
            const local = supportImagePreviews.get(a.id),
              url = a.url
                ? API_BASE +
                  a.url +
                  (supportAccessToken
                    ? "?token=" + encodeURIComponent(supportAccessToken)
                    : "")
                : null;
            return `<a class="support-attachment" ${url ? `href="${esc(url)}" target="_blank" rel="noopener"` : ""}>${local ? `<img src="${local}" alt="${esc(a.name)}">` : url && /^image\//.test(a.mimeType) ? `<img src="${esc(url)}" alt="${esc(a.name)}">` : supportIcon("clip")}<span>${esc(a.name)}<small>${Math.max(1, Math.ceil((a.size || 0) / 1024))} KB${url ? " · pobierz" : " · załącznik"}</small></span></a>`;
          })
          .join(
            "",
          )}<span class="support-message-meta"><time>${esc(m.time || "")}</time>${user ? `<span class="${m.sample ? "sample-check" : m.sent ? "sent-check" : "local-check"}" aria-label="${m.sample ? "Przykładowa wiadomość" : m.sent ? "Wysłano do wsparcia" : "Nie wysłano — zapis lokalny"}">${m.sample ? "✓✓" : m.sent ? "✓ wysłano" : "◷ lokalnie"}</span>` : ""}</span>`
  }</div></article>`;
}
function supportChat(mode = "widget") {
  const page = mode === "page";
  return `<header class="support-chat-header">${supportAvatar()}<div><h2>${page ? "Menedżer Smoke Island" : "Wsparcie Smoke Island"}</h2><p><span class="support-online"></span> Online <span class="support-response-time">· Zwykle odpowiadamy w 1–3 min</span></p></div><div class="support-header-actions">${page ? `<button type="button" data-action="support-attach" aria-label="Dodaj zdjęcie">${supportIcon("image")}</button><button type="button" data-action="support-info" aria-label="Informacje o czacie">${supportIcon("info")}</button>` : `<button type="button" data-action="support-minimize" aria-label="Zminimalizuj czat">${supportIcon("minus")}</button><button type="button" data-action="support-close" aria-label="Zamknij czat">${supportIcon("x")}</button>`}</div></header><div class="support-thread" tabindex="0" role="log" aria-label="Rozmowa ze wsparciem" aria-live="polite" aria-relevant="additions"><div class="support-day"><span>Dzisiaj</span></div>${state.support.messages.length ? state.support.messages.map(supportMessageHTML).join("") : `<div class="support-empty"><span class="support-empty-icon" aria-hidden="true">${supportIcon("chat")}</span><strong>Jak możemy pomóc?</strong><p class="support-sample-label">Napisz do nas — odpowiedź menedżera pojawi się tutaj.</p></div>`}</div><div class="support-quick-questions" aria-label="Szybkie pytania">${supportQuickQuestions.map(([icon, title, text], i) => `<button type="button" data-action="support-quick" data-i="${i}">${supportIcon(icon)}<span>${title}</span></button>`).join("")}</div><p class="support-local-note">Wiadomości są zapisywane i przekazywane do zespołu wsparcia.</p>${supportPendingFiles.length ? `<div class="support-pending-files">${supportPendingFiles.map((a, i) => `<span>${supportIcon("clip")}<b>${esc(a.name)}</b><button type="button" data-action="support-remove-file" data-i="${i}" aria-label="Usuń załącznik ${esc(a.name)}">×</button></span>`).join("")}</div>` : ""}<form class="support-composer" id="support-compose-${mode}"><button type="button" class="support-attach" data-action="support-attach" aria-label="Dodaj załącznik">${supportIcon("clip")}</button><div class="support-input-wrap"><textarea name="message" data-support-draft rows="1" maxlength="2000" placeholder="Napisz wiadomość…" aria-label="Wiadomość do wsparcia">${esc(supportDraft)}</textarea><button type="button" class="support-image-button" data-action="support-attach" aria-label="Dodaj zdjęcie do wiadomości">${supportIcon("image")}</button><button type="button" data-action="support-emoji" aria-expanded="${supportEmojiOpen}" aria-label="Wybierz emoji">${supportIcon("smile")}</button>${supportEmojiOpen ? `<div class="support-emoji-picker" aria-label="Emoji">${["👋", "😊", "👍", "💙", "🔥", "🙏", "📦", "❓"].map((e) => `<button type="button" data-action="support-add-emoji" data-emoji="${e}" aria-label="Wstaw ${e}">${e}</button>`).join("")}</div>` : ""}</div><button class="support-send" type="submit" aria-label="Wyślij wiadomość">${supportIcon("send")}</button></form>`;
}
function supportDesktop() {
  if (supportOpen)
    return `<section class="support-widget" role="region" aria-label="Czat ze wsparciem Smoke Island">${supportChat()}</section>`;
  return `${state.support.dismissed ? "" : `<aside class="support-invitation" aria-label="Powitanie wsparcia"><button class="support-invitation-close" data-action="support-dismiss" aria-label="Zamknij powitanie">${supportIcon("x")}</button><div>${supportAvatar()}<div><h2>Cześć! 👋</h2><p>Masz pytania? Otwórz czat z naszym managerem — pomożemy z wyborem produktu, zamówieniem i dostawą.</p></div></div><button class="support-open-chat" data-action="support">${supportIcon("chat")}<span>Otwórz czat z pomocą</span><b>→</b></button></aside>`}<button class="support-launcher" data-action="support" aria-expanded="false" aria-label="Otwórz czat z pomocą">${supportIcon("chat")}<span></span></button>`;
}
function contactPage() {
  return `<div class="contact-page">${breadcrumb("Kontakt")}<section class="contact-hero"><h1>Kontakt</h1><p>Masz pytania? Skontaktuj się z nami!<br>Nasz zespół chętnie Ci pomoże.</p></section><div class="contact-channels"><button class="contact-channel active" data-action="support-focus">${supportAvatar()}<span><strong>Czat<br class="contact-mobile-break"> z menedżerem</strong><small><i class="support-online"></i> Online <em>· czat online</em></small></span>${supportIcon("chevron")}</button><button class="contact-channel" data-action="support-telegram"><span class="support-avatar telegram-avatar">${img("icon-telegram", "")}</span><span><strong>Telegram</strong><small>Aktualności i promocje</small></span>${supportIcon("chevron")}</button></div><section class="support-contact-chat" role="region" aria-label="Czat z menedżerem">${supportChat("page")}</section></div>`;
}
function refreshSupport(focus = false, scroll = false) {
  const active = document.activeElement;
  if (!focus && active?.matches("[data-support-draft]")) {
    const contact = $(".support-contact-chat"),
      thread = contact?.querySelector(".support-thread");
    if (thread) {
      const previous = thread.scrollTop;
      const next = state.support.messages.length
        ? '<div class="support-day"><span>Dzisiaj</span></div>' +
          state.support.messages.map(supportMessageHTML).join("")
        : `<div class="support-day"><span>Dzisiaj</span></div><div class="support-empty"><span class="support-empty-icon" aria-hidden="true">${supportIcon("chat")}</span><strong>Jak możemy pomóc?</strong><p class="support-sample-label">Napisz do nas — odpowiedź menedżera pojawi się tutaj.</p></div>`;
      if (thread.innerHTML !== next) thread.innerHTML = next;
      thread.scrollTop = scroll ? thread.scrollHeight : previous;
      return;
    }
  }
  const positions = $$(".support-thread").map((t) => t.scrollTop);
  const host = $("#support-layer");
  if (host)
    host.innerHTML = location.hash !== "#contact" ? supportDesktop() : "";
  const contact = $(".support-contact-chat");
  if (contact) contact.innerHTML = supportChat("page");
  $$(".support-thread").forEach((t, i) => {
    t.scrollTop = scroll ? t.scrollHeight : positions[i] || 0;
  });
  if (focus) $("[data-support-draft]")?.focus({ preventScroll: true });
}
function openSupport() {
  state.support.dismissed = true;
  save();
  if (location.hash === "#contact") refreshSupport(true);
  else {
    supportOpen = true;
    refreshSupport(true);
  }
}
async function loadSupportMessages(scroll = false) {
  if (!state.support.threadId) return;
  const headers = supportAccessToken
    ? { "X-Support-Token": supportAccessToken }
    : {};
  try {
    const response = await fetch(
      API_BASE +
        `/support/threads/${encodeURIComponent(state.support.threadId)}/messages`,
      { credentials: "include", headers, cache: "no-store" },
    );
    if (response.status === 404) {
      state.support.threadId = "";
      supportAccessToken = "";
      sessionStorage.removeItem("si_support_token");
      state.support.messages = [];
      save();
      return;
    }
    if (!response.ok) return;
    const data = await response.json(),
      timeFormat = new Intl.DateTimeFormat("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Warsaw",
      });
    state.support.messages = (data.items || []).map((m) => ({
      role: m.senderRole === "CUSTOMER" ? "user" : "manager",
      text: m.text,
      attachments: m.attachments || [],
      time: timeFormat.format(new Date(m.createdAt || Date.now())),
      sent: true,
    }));
    save();
    if (supportOpen || location.hash === "#contact")
      refreshSupport(false, scroll);
  } catch {}
}
async function sendSupportMessage() {
  const text = supportDraft.trim();
  if (!text && !supportPendingFiles.length) {
    $("[data-support-draft]")?.focus();
    return false;
  }
  if (supportSending) return false;
  supportSending = true;
  $$(".support-send").forEach((b) => {
    b.disabled = true;
    b.setAttribute("aria-busy", "true");
  });
  try {
    const attachments = await Promise.all(
      supportPendingFiles.map(async (item) => {
        const file = supportFileBlobs.get(item.id);
        if (!file) throw new Error("missing-file");
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        return { name: file.name, mimeType: file.type, size: file.size, data };
      }),
    );
    const body = {
      orderNumber: state.supportOrderContext || undefined,
      message: text.slice(0, 2000),
      attachments,
      referralCode: state.referralCode || undefined,
      ...(state.referralCode ? { referralCode: state.referralCode } : {}),
      ...(state.support.threadId ? { threadId: state.support.threadId } : {}),
    };
    const send = (includeThread) =>
      fetch(API_BASE + "/support/threads", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(supportAccessToken
            ? { "X-Support-Token": supportAccessToken }
            : {}),
        },
        body: JSON.stringify({
          ...body,
          ...(includeThread
            ? { threadId: state.support.threadId }
            : { threadId: undefined }),
        }),
      });
    let response = await send(Boolean(state.support.threadId));
    if (response.status === 404 && state.support.threadId) {
      state.support.threadId = "";
      supportAccessToken = "";
      sessionStorage.removeItem("si_support_token");
      state.support.messages = [];
      response = await send(false);
    }
    if (!response.ok) throw new Error("support-send-failed");
    const data = await response.json();
    state.support.threadId = data.threadId;
    if (data.accessToken) {
      supportAccessToken = data.accessToken;
      sessionStorage.setItem("si_support_token", supportAccessToken);
    }
    save();
    supportDraft = "";
    supportPendingFiles = [];
    supportFileBlobs.clear();
    supportImagePreviews.clear();
    supportEmojiOpen = false;
    await loadSupportMessages(true);
    $("[data-support-draft]")?.blur();
    refreshSupport(false, true);
    return true;
  } catch {
    toast(
      "Nie udało się wysłać wiadomości lub załącznika. Sprawdź rozmiar pliku (do 2 MB) i połączenie.",
    );
    return false;
  } finally {
    supportSending = false;
    $$(".support-send").forEach((b) => {
      b.disabled = false;
      b.removeAttribute("aria-busy");
    });
  }
}
document.addEventListener("input", (e) => {
  if (e.target.id !== "flavor-filter") return;
  flavorFilter = e.target.value;
  flavorPage = 0;
  updateProduct();
});
document.addEventListener("input", (e) => {
  if (e.target.hasAttribute?.("data-support-draft"))
    supportDraft = e.target.value.slice(0, 2000);
});
document.addEventListener("submit", (e) => {
  if (e.target.id?.startsWith("support-compose-")) {
    e.preventDefault();
    sendSupportMessage();
  }
});
document.addEventListener("keydown", (e) => {
  if (
    e.target.hasAttribute?.("data-support-draft") &&
    e.key === "Enter" &&
    !e.shiftKey &&
    !e.isComposing
  ) {
    e.preventDefault();
    sendSupportMessage();
  }
  if (
    e.key === "Escape" &&
    (supportOpen || supportEmojiOpen) &&
    !$("#dialog")?.open
  ) {
    e.preventDefault();
    if (supportEmojiOpen) supportEmojiOpen = false;
    else supportOpen = false;
    refreshSupport();
    $(".support-launcher")?.focus();
  }
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const action = b.dataset.action;
  if (!action.startsWith("support-")) return;
  e.preventDefault();
  switch (action) {
    case "support-close":
    case "support-minimize":
      supportOpen = false;
      state.support.dismissed = true;
      save();
      refreshSupport();
      $(".support-launcher")?.focus();
      break;
    case "support-dismiss":
      state.support.dismissed = true;
      save();
      refreshSupport();
      break;
    case "support-focus":
      refreshSupport(true);
      $(".support-contact-chat")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      break;
    case "support-info":
      dialog(
        "Wsparcie Smoke Island",
        "Wiadomości tekstowe wysyłamy do zespołu wsparcia w Telegramie. Załączniki nie są jeszcze obsługiwane.",
      );
      break;
    case "support-telegram":
      dialog(
        "Telegram",
        "Adres oficjalnego kanału Telegram nie został jeszcze skonfigurowany. Dodaj go podczas podłączania obsługi klienta.",
      );
      break;
    case "support-quick":
      supportDraft = supportQuickQuestions[Number(b.dataset.i)]?.[2] || "";
      refreshSupport(true);
      break;
    case "support-emoji":
      supportEmojiOpen = !supportEmojiOpen;
      refreshSupport(true);
      break;
    case "support-add-emoji":
      supportDraft = (supportDraft + b.dataset.emoji).slice(0, 2000);
      supportEmojiOpen = false;
      refreshSupport(true);
      break;
    case "support-attach":
      $("#support-file-input")?.click();
      break;
    case "support-remove-file": {
      const [removed] = supportPendingFiles.splice(Number(b.dataset.i), 1);
      if (removed) {
        supportImagePreviews.delete(removed.id);
        supportFileBlobs.delete(removed.id);
      }
      refreshSupport(true);
      break;
    }
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.id !== "support-file-input") return;
  for (const file of [...(e.target.files || [])]) {
    if (supportPendingFiles.length >= 4) {
      toast("Możesz dodać do 4 plików.");
      break;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("Maksymalny rozmiar pliku to 2 MB.");
      continue;
    }
    if (
      ![
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
      ].includes(file.type)
    ) {
      toast("Dozwolone są obrazy, PDF i pliki tekstowe.");
      continue;
    }
    const id = "support-" + Date.now() + "-" + ++supportMessageCounter;
    supportPendingFiles.push({
      id,
      name: file.name,
      type: file.type,
      size: file.size,
    });
    supportFileBlobs.set(id, file);
    if (/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
      const preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
      if (preview) supportImagePreviews.set(id, preview);
    }
  }
  e.target.value = "";
  refreshSupport(true);
});

// Mobile bonus presentation state; costs and rewards are verified by the API.
const mobileBonusRewards = [
  ["bonus-products", "NOVA", "HEADPHONES"],
  ["bonus-ticket", "Punkty", "bonusowe"],
  ["bonus-shipping", "Darmowa", "dostawa"],
  ["bonus-discount", "Zniżka", "na zamówienie"],
  ["bonus-gift", "Inne", "nagrody"],
];
