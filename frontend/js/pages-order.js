/* ==========================================================================
 * js/pages-order.js — Order accepted + email verify + referral data loaders
 * Part of the Smoke Island storefront. Loaded as a classic script (shared globals).
 * ========================================================================== */

function orderAccepted() {
  if (!state.lastOrder)
    return `${breadcrumb("Zamówienia", "Potwierdzenie")}<div class="page order-accepted"><section class="panel"><h1>Brak danych zamówienia</h1><p>Nie znaleziono potwierdzonego zamówienia w tej sesji.</p><a class="primary" href="#catalog">WRÓĆ DO SKLEPU</a></section></div>`;
  const order = state.lastOrder;
  return `<div class="desktop-order-confirmation"><header class="dec-heading"><div>${breadcrumb("Zamówienia", "Zamówienie przyjęte")}<h1>Zamówienie <span>przyjęte</span></h1><p>Zamówienie zostało zapisane. Dziękujemy za zaufanie!</p></div>${banner()}</header><section class="dec-frame"><div class="dec-visual">${bonusAtmosphere()}<div class="dec-art"><img src="assets/delivery-method-bag.webp" alt=""></div><button class="dec-continue" type="button" data-action="copy-order" aria-label="Skopiuj numer zamówienia">#${esc(order.number)}</button></div><div class="doc-bottom"><div class="dec-message"><h2>Oczekiwanie na <span>potwierdzenie</span></h2><p>Skontaktuj się z menedżerem, aby potwierdzić zamówienie.</p></div><div class="doc-actions"><button class="doc-manager" type="button" data-action="order-support">NAPISZ DO MENEDŻERA</button><a class="doc-return" href="#home"><span aria-hidden="true">←</span> WRÓĆ DO SKLEPU</a></div></div>${order.telegramNotified === false ? '<p class="doc-notification">Zamówienie jest zapisane. Powiadomienie Telegram nie zostało potwierdzone.</p>' : ""}</section></div>`;
}
function verifyEmailPage() {
  const email = state.pendingEmail || "";
  return `${breadcrumb("Konto", "Potwierdź e-mail")}<div class="auth-stage verify-stage">${img("star", "", "auth-decor")}${img("bag", "", "auth-decor right")}<h1>Potwierdź swój <span class="blue">e-mail</span></h1><p>Wpisz 6-cyfrowy kod, który wysłaliśmy na adres:<br><strong class="blue">${esc(email)}</strong></p><form class="auth-card verify-card" id="verify-email-form"><div class="verify-envelope">✉</div><label>Wpisz 6-cyfrowy kod</label><div class="verify-code-inputs">${Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" pattern="[0-9]" maxlength="1" aria-label="Cyfra ${i + 1}" required ${i === 0 ? "autofocus" : ""}>`).join("")}</div><div class="verify-note">ⓘ &nbsp;Nie otrzymałeś wiadomości? Sprawdź folder Spam lub Oferty.</div><p class="status-message" id="verify-status" role="status"></p><button class="primary wide" type="submit">Potwierdź e-mail</button><div class="verify-resend">Nie otrzymałeś kodu? <button type="button" data-action="resend-code">Wyślij kod ponownie</button></div></form><div class="auth-bottom"><a href="#register">← Wróć do rejestracji</a></div></div>`;
}
async function loadReferralData(force = false) {
  if (!state.user || referralDataLoading || (!force && referralData)) return;
  referralDataLoading = true;
  try {
    const r = await fetch(API_BASE + "/referrals/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) return;
    const next = await r.json(),
      changed = JSON.stringify(next) !== JSON.stringify(referralData);
    referralData = next;
    if (changed && location.hash === "#referrals") {
      const scrollY = window.scrollY;
      render();
      window.scrollTo(0, scrollY);
    }
  } catch {
  } finally {
    referralDataLoading = false;
  }
}
async function captureReferralLanding() {
  const ref = new URLSearchParams(location.search).get("ref");
  if (!ref) return;
  try {
    const response = await fetch(
      API_BASE + "/referrals/visit?ref=" + encodeURIComponent(ref),
      { credentials: "include", cache: "no-store" },
    );
    if (response.ok)
      history.replaceState(null, "", location.pathname + location.hash);
  } catch {}
}
