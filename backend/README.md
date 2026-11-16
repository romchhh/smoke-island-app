> Deployment and current credentials: see ../INSTALL-RU.md.

# Smoke Island backend

Express API and Telegram bot for the Smoke Island storefront.

## Local development

1. Copy `.env.example` to `.env.local` in the repository root and use development-only credentials.
2. In `backend/`, run `npm ci` and then `npm start`.
3. Run `npm run seed:demo` only against a disposable development database. Never seed demo data into a production catalog.
4. Serve `frontend/` over HTTP (for example, port 8765). Its API base is `/api/v1`; use the Vercel rewrite or a local proxy to reach the API.

The API health endpoint is `GET /api/health`. The frontend reads products and variants from `GET /api/v1/catalog`; registration/login, Google OAuth, orders, and support messages use the same-origin `/api/v1` path in production.

## Production configuration

Configure secrets in Railway Variables, never in source control. Required values include MongoDB connection/database, JWT and session secrets, Google OAuth credentials and callback (`GOOGLE_REDIRECT_URI` or `GOOGLE_CALLBACK_URL`), separate Telegram admin and client bot tokens, client bot username, admin IDs, order/support chat IDs, frontend URL, and Telegram Mini App URL. Never use the admin bot token as the client bot token. Keep a single running bot process for each Telegram bot token. The current Railway service uses one replica and long polling.

Set Railway `GOOGLE_REDIRECT_URI` to `https://smoke-island.vercel.app/api/v1/auth/google/callback` (it takes precedence over the legacy `GOOGLE_CALLBACK_URL`). Add that exact same URL under Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → Authorized redirect URIs. Vercel proxies `/api/v1/*` to Railway so browser requests and session cookies stay on the storefront origin.

## Storefront and support behavior

The catalog, variant labels, images, stock, and base prices come from MongoDB. Checkout rechecks inventory and prices on the server. Registration/login sessions use secure HTTP-only cookies. Support messages are persisted in MongoDB and forwarded to the configured Telegram support group. Managers can reply directly to a Telegram support notification using Telegram's Reply action; the response is saved and appears in the website chat. They can also use `/reply THREAD_ID text` in the admin bot chat.

Order and support destinations are independent. A successful health check confirms API/database connectivity; it does not confirm payment processing or fulfillment.

## Bonus cases

Opening a Start/Premium/Exclusive case costs 10/20/100 points. Confirming an order awards 3% of its final total, rounded down to whole points, once. Inventory is reserved in the cart for four hours of inactivity, transferred to pending orders on submission, and physically deducted on confirmation. The admin bot supports permanent case prizes and custom prizes in zł, %, or pkt. See [backend upgrade instructions](../docs/BACKEND-UPGRADE.md) for workflows, deployment and security requirements.

## Still requires business setup

Payments are currently manual; there is no payment provider integration. Password recovery is not implemented. Promo-code redemption is connected to the API. Email verification requires `RESEND_API_KEY` and `EMAIL_FROM` with a verified sender domain. The customer-facing Telegram bot must use a token different from the admin bot token; its Mini App menu and support DM forwarding run only when that separate bot is configured.


## Identity, email verification, referrals and support media

- A long-lived `si_visitor` HTTP-only cookie identifies guest activity. Guest checkouts and support threads are stored against a guest user record, then orders, bonus history, points, referral attribution and support threads move to the account when the visitor signs in on the same browser. Google and Telegram identities can be joined from an authenticated session through the account menu's **Połącz Telegram** action.
- Manual email registration uses `POST /api/v1/auth/email-code`, `POST /api/v1/auth/email-code/verify`, and `POST /api/v1/auth/email-code/resend`. Configure `RESEND_API_KEY` and a verified `EMAIL_FROM` sender. Codes expire after 10 minutes and allow five attempts. Without the mail configuration, registration intentionally returns `EMAIL_NOT_CONFIGURED`.
- Every account gets a referral code. A referred account qualifies after its first completed order. Each pair of qualified purchases awards 10 points to the referrer; duplicate completion callbacks cannot award the same pair twice.
- Support accepts up to four JPEG, PNG, GIF, WebP, PDF, or plain text attachments, up to 2 MB each. Website attachments are forwarded to the configured Telegram support group. A manager can reply to the original Telegram message with a photo or document; the media is stored in the website conversation and sent to the customer's Telegram when the separate client bot is configured.
- For production Google OAuth behind the Vercel API rewrite, `FRONTEND_URL` must be the exact public Vercel origin. The callback used by the backend is `FRONTEND_URL/api/v1/auth/google/callback`, which must be listed as an authorized redirect URI in Google Cloud.
- Telegram website sign-in uses the BotFather Login Widget OIDC credentials, not the customer bot token. Set `TELEGRAM_OIDC_CLIENT_ID` and `TELEGRAM_OIDC_CLIENT_SECRET` in the API service. The callback is `FRONTEND_URL/api/v1/auth/telegram/callback` (or the explicit `TELEGRAM_OIDC_REDIRECT_URI`) and must be registered as a Redirect URI in BotFather; the site origin must also be a Trusted Origin. The backend uses Authorization Code + PKCE and verifies the Telegram ID token signature, issuer, audience, expiration, and nonce.
