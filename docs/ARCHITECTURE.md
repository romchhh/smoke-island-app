> Историческая техническая документация. Актуальная установка и ограничения: [INSTALL-RU.md](../INSTALL-RU.md).

# Proposed architecture

## Current baseline

The current website is buildless static HTML/CSS/JavaScript. No framework, server, database, cloud account binding, or external service integration is present. Keep `outputs/smoke-island` as the editable frontend source and `outputs/index.html` as a generated standalone preview.

## Target

- **Frontend:** current responsive static app, served by Vercel; same-origin API proxy or configured API URL.
- **API:** Node.js + TypeScript + Express REST service on Railway.
- **Persistence:** MongoDB Atlas. API and Telegram bot share the same domain services and collections.
- **Telegram:** separate Telegraf admin and client bot processes on Railway; webhook in production, long polling locally. Client bot launches the Mini App and relays customer support. Order alerts and customer support use different Telegram groups.
- **Manual payment:** order records include payment method/instructions/status, changed by authorized manager. No payment gateway.
- **Realtime:** begin with persisted REST polling/SSE for support/order updates; add WebSocket only if verified UX needs it.

## Data model (initial)

- `User`: normalized email, password hash or verified provider identity, roles/status, profile, timestamps.
- `OAuthIdentity`: provider (`google` or `telegram`), immutable provider subject ID, verified claims and linked user; unique provider+subject index.
- `Session`: hashed opaque token, expiry, rotation/revocation metadata.
- `Category`, `Product`, `Variant`: slug, localized copy, image metadata, active/archive state, price in minor units, stock, variant attributes, version.
- `Cart`: user or guest session owner, line product/variant/quantity; prices recalculated from catalog.
- `Order`: unique public number, owner/guest contact snapshot, line snapshots, totals, discount/bonus, delivery, manual payment state, order state, idempotency key, timestamps.
- `OrderEvent`: immutable status/payment/admin audit history.
- `BonusAccount`, `BonusLedger`: balance and append-only credit/debit entries; enforce atomic nonnegative balance updates and unique operation keys.
- `Promotion`, `Referral`, `CaseConfig`, `CaseOpening`: server-validated rules, attributable referral, odds version, unique opening and reward ledger.
- `SupportThread`, `SupportMessage`: owner/guest token, assigned manager, persisted messages, attachments metadata, delivery/read state.
- `StorePoint`, `ManagerAssignment`, `TelegramDelivery`: store routing, authorized Telegram IDs, deduplicated outbound messages and Telegram message references.
- `TelegramIdentity`: verified Telegram user ID linked to an optional site account; trust only signed `initData` within the permitted age window.
- `TelegramRoute`: route type (`ORDER_NOTIFICATION` or `CUSTOMER_SUPPORT`), Telegram chat ID, store scope, active state; IDs are configuration, never bot token secrets.
- `AuditLog`: actor, role, action, target, timestamp, request ID; never store passwords or secrets.

Use MongoDB transactions for multi-document order/inventory/bonus updates; require a replica-set-capable test cluster. Add unique indexes for normalized email, order number, idempotency key, Telegram identity, ledger operation key, and referral/case replay guards.

## API outline

- `GET /api/v1/catalog`, `GET /categories`, `GET /products/:slug`
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/password-reset`, optional verified Telegram login
- `POST /auth/telegram/mini-app`: validate Telegram Web App `initData` using the client bot token and issue/rotate the regular site session.
- `GET/POST/PATCH/DELETE /cart`; totals are server calculated
- `POST /orders`, `GET /orders/:number`, `GET /me/orders`, `POST /orders/:number/cancel`
- `GET /me/bonuses`, `GET /me/bonus-ledger`, `POST /bonus-cases/:id/open`, referral/promo endpoints
- `POST /support/threads`, `GET/POST /support/threads/:id/messages`, manager-scoped support endpoints
- `/admin/*` guarded by server-side roles for products, stock, orders, users, bonuses, promotions, stores, support, reports and settings
- Telegram webhook endpoint with secret-token verification; bot calls shared application services, not public admin bypasses

All writes validate schemas and permissions, use request IDs, and return stable error codes. Public order access must use an unguessable scoped token or authenticated owner access. Admin endpoints require explicit roles; Telegram user IDs must be verified against configured administrators and current database role.

Google OAuth uses authorization-code/OIDC with state and nonce checks and a server-only client secret. The client Mini App uses a configured HTTPS Web App URL and sends raw SDK `initData` to the server; validate its signature and age before login. Telegram Login Widget (if offered) has a separate signed-payload verifier. Telegram IDs and chat IDs are configuration, not secrets; bot tokens and webhook secret are secrets. Keep distinct orders and support destinations. Support-group replies must resolve to one persisted thread and relay only to the matching customer; a customer must start the bot before Telegram permits bot messages to that user.

## Security and operations

Use Argon2id password hashes; short-lived access credentials and rotating/revocable HttpOnly Secure SameSite cookies; rate-limit auth, promo, case, and support endpoints. Apply CORS allowlist, request size limits, upload MIME/size checks, CSRF protection for cookie-auth writes, and redacted structured logs. Keep secrets only in local ignored env files and hosting secret stores. Health/readiness endpoints must not expose configuration values.

Backups: enable Atlas automated snapshots and document restore drills before production. Railway should run API and bot as separate services with restart policy and health checks. Vercel deploys static frontend. CI runs typecheck, lint if configured, tests, and build; production deploy remains a manual approved step.

## Open decisions

Confirm actual store assortment, whether Telegram Login Widget should coexist with Mini App login, which carrier method is manual vs API-integrated, and whether account creation should remain email-based. Do not request payment gateway credentials.
