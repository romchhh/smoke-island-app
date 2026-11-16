> Историческая техническая документация. Актуальная установка и ограничения: [INSTALL-RU.md](../INSTALL-RU.md).

# API contract plan

Status: partial implementation in `backend/src/server.js`; routes marked in this document must be compared with the source before relying on them.

Base path: `/api/v1`. JSON requests/responses. Errors use `{ error: { code, message, requestId, fields? } }`. Authenticated browser writes use Secure HttpOnly SameSite cookies plus CSRF token. All list endpoints accept bounded `limit` and opaque `cursor`.

| Endpoint | Access | Purpose |
|---|---|---|
| `GET /catalog`, `GET /categories`, `GET /products/:slug` | Public | Active catalog, variants, stock availability, server prices |
| `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` | Public/session | Account and session lifecycle |
| `POST /auth/password-reset`, `POST /auth/password-reset/confirm` | Public, rate limited | Password recovery |
| `GET /auth/google`, `GET /auth/google/callback` | Public/OAuth state | Google OIDC authorization-code flow, state/nonce validation, verified email and explicit account-linking policy |
| `POST /auth/telegram/mini-app` | Public, signed payload required | Validate raw Telegram Mini App `initData` server-side; never trust `initDataUnsafe` or browser-supplied Telegram IDs |
| `POST /auth/telegram/widget` | Public, signed payload required if Login Widget retained | Independently validate Telegram Login Widget payload |
| `GET /me`, `GET /me/orders`, `GET /me/wishlist`, `PUT /me/wishlist` | User | Profile, order history, wishlist |
| `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` | Guest/session or user | Cart; server recalculates prices and totals |
| `POST /orders` | Guest/session or user | Idempotent order creation with contact, delivery and manual payment selection |
| `GET /orders/:number` | Scoped order token or owner | Read order status without exposing another customer's order |
| `POST /orders/:number/cancel` | Owner, if eligible | Cancel order and release reserved stock exactly once |
| `GET /me/bonuses`, `GET /me/bonus-ledger` | User | Balance and history |
| `POST /bonus-cases/:id/open` | User | Atomic server draw/debit and unique opening result |
| `POST /referrals/claim`, `POST /promotions/validate` | User/session | Validate referral/promo and return server quote |
| `POST /support/threads`, `GET /support/threads/:id/messages`, `POST /support/threads/:id/messages` | Owner/session | Persist support thread/messages |
| `GET /admin/orders`, `PATCH /admin/orders/:id` | Manager+ | Search orders and append status/payment event |
| `/admin/products`, `/admin/categories`, `/admin/users`, `/admin/bonuses`, `/admin/promotions`, `/admin/stores`, `/admin/support`, `/admin/reports` | Explicit role per action | Admin operations with audit entries |
| `POST /webhooks/telegram/admin` | Telegram secret header | Verified Telegram update ingress |

## Order creation contract

Client submits cart line identifiers and quantities, customer/delivery fields, optional promotion, manual payment method, and an idempotency key. Client does not submit authoritative price, discount, bonus balance, or status. Server rechecks active products, variants, stock, delivery eligibility, promotion limits and totals in a transaction; persists order plus initial `PENDING_CONFIRMATION` event; queues Telegram notification through an outbox; returns order number, scoped read token and authoritative summary. Retries with the same idempotency key return the same order.

## Order/payment states

Order states: `CREATED`, `PENDING_CONFIRMATION`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`. Payment is manual: `UNPAID`, `INSTRUCTIONS_SENT`, `PAID`, `REFUNDED`; only authorized managers may update it. Every transition is checked and recorded with actor, reason and timestamp.

## Telegram delivery

Order creation writes an outbox event. Worker sends once per destination/event key, records Telegram `chat_id` and `message_id`, and edits the existing message on status change. Failed sends retry with bounded exponential backoff. Manager callbacks reauthorize the Telegram actor and store assignment on every action.

Order notifications go to a configured order group. Customer support routes to a separate configured support group. The client bot relays user messages with an opaque thread reference; manager replies resolve that thread and relay only to the matching customer. A Telegram bot cannot initiate a private conversation with a user who has never started it.

## Telegram Mini App authentication

The bot menu/deep link opens the HTTPS Mini App URL. The frontend loads Telegram Web Apps SDK and sends raw `initData` to the API. API verifies signature, bot identity, and auth-date freshness before linking or issuing a site session. Telegram Login Widget, if retained, is a separate signed flow. Screenshot-confirmed buttons and Mini App launch must not be treated as implemented until their respective flows are connected.

Actual response schemas and validation limits will be finalized with implementation; this document does not claim endpoints currently run.
