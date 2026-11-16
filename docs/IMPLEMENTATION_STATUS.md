> Историческая техническая документация. Актуальная установка и ограничения: [INSTALL-RU.md](../INSTALL-RU.md).

# Implementation status

## Audit snapshot

Audited the current local project on 2026-11-01. The delivered frontend is a static HTML/CSS/JavaScript application in `outputs/smoke-island`; it has no React app, package manifest, backend, database, migrations, API calls, or existing server functions. `outputs/index.html` is a generated standalone bundle; `outputs/smoke-island-html.zip` packages the editable source. Keep source changes in `outputs/smoke-island` and regenerate distribution files with `work/package-native.py`.

Current catalog was adapted to consumer electronics/accessories (audio, power, cables, adapters). No restricted vape/liquid catalog remains in the active product copy. A few source asset identifiers still use historic internal names; the displayed product names and artwork are electronics. The requested legal store assortment is described as candy/examples in the prompt, so confirm actual categories before seeding production data; current electronics are safe demo fixtures.

## Page and feature audit

| Route / feature | Current user actions and browser state | Required server contract, permissions, integration | Current gap |
|---|---|---|---|
| `#home` | Browse banners, categories, featured products; navigate to catalog | Public catalog/category read; content-managed banners if admin scope requires it | Static banners and featured products |
| `#catalog`, `#catalog-old` | Filter, sort, open product, wishlist toggle | Public paginated product/category search; authenticated wishlist read/write | Product/category fixtures in JS; sorting/filtering client-only |
| `#product`, `#mix` | Choose product variants, quantities and tier pricing; add to cart | Product/variant/price/stock read; server validated price quote; cart mutation | Product and 20 color options are constants; prices are hardcoded tiers; cart localStorage |
| `#cart` | Change quantity, remove lines, see totals/shipping, continue checkout | Server cart or signed guest cart; authoritative totals, discounts, stock, shipping quote | Browser computes totals; promotional code only shows failure; shipping threshold hardcoded |
| `#checkout`, `#checkout-old`, `#checkout-delivery`, `#delivery` | Contact/address fields, select InPost/courier/Żabka, submit | Validate contact/address and serviceability; create idempotent order; manual payment status; shipping method and fee | Contact/delivery saved locally; no inventory check; no real carrier API; submit creates a demo order locally |
| `#order-accepted` | View local demo order number/status, copy number, contact support, return to catalog | Read order by scoped session/user/order token; display authoritative status/history | Number/status are local demo state, no durable order |
| `#login`, `#register` | Forms, password rules, Google/Telegram buttons, reset link | Register/login/logout, password reset, secure session, account lock, verified Telegram Login/OAuth | Telegram button is present, but currently opens a generic “requires OAuth and server” dialog; no auth request, SDK, or signed identity verification exists |
| `#bonus`, `#opening` | Desktop bonus interaction; mobile Start/Premium/Exclusive, animation, reward result | Authenticated balance; server-priced case, atomic debit/draw, reward ledger, idempotency | Mobile animation is deterministic demo, points not charged; desktop rewards mocked |
| `#referrals` | Copy referral link, claim bonus | Referral attribution, abuse prevention, reward ledger | Link/claim are local/demo |
| `#contact` and support widget | Sample chat, quick prompts, local messages, attachments, emoji, minimize/close; Telegram channel card | Auth or guest conversation, persisted messages/files, manager inbox, status/read receipts, real-time events, notifications to a separate support Telegram group and reply relay to the right customer | Messages/attachments stay in browser; sample transcript is static; no manager/admin interface or support-group route |
| Global navigation, mobile bottom nav, wishlist, toast/dialog | Navigate, select, save favorites, show feedback | Account-scoped wishlist and navigation state where persistence is expected | Wishlist persists locally; no profile/order history/admin page |
| Telegram Mini App | User intends to open the shop inside Telegram; preserve the adapted mobile layout/footer | Client bot launch URL, server-side validation of Telegram `initData`, linked account/session | No WebApp SDK, initData handling or bot launch configuration found in source |
| Admin / Telegram | No admin route or admin controls in current frontend | Role-protected admin API/bot, separate order and customer-support groups, audit log and manager/store scopes | Entirely absent |

### Shared data and invariants

Current `localStorage` key is `smoke-island-native`; it includes demo cart, wishlist, points, delivery/contact, selected product, claimed state, and support messages. It is not trusted input. Server must derive totals from active product price and stock, ignore client-supplied prices/roles/balances, and make order creation, inventory reservation, bonus ledger updates, and bot notification delivery idempotent. Payment is explicitly manual; no payment gateway is requested. Delivery provider integrations and actual manager destinations are not configured.

## Proposed implementation sequence

1. Verify the user's existing MongoDB deployment and bot(s), then provision a least-privilege test database/bot configuration.
2. Create a TypeScript REST API with MongoDB-backed users, products/categories/variants, carts, orders/order events, bonus ledger, referrals/promotions, support threads/messages, store points/managers, and audit logs. Use schema validation, centralized errors, request IDs, rate limits, secure cookies/session rotation, CSRF protection where cookie auth is used, and role/point scoping.
3. Add Telegram Admin Bot as a separate process using the same API/domain services and database; authorize every callback by Telegram user ID and role from the database. Keep manager chats and store routing in configuration records, not source constants.
4. Integrate existing browser routes through a small API client with loading/empty/error states. Preserve visual structure. Keep anonymous browsing and guest cart, associate after login.
5. Add unit, API, database integration, concurrency/idempotency, Telegram adapter, and browser journey coverage. Use test DB and Telegram test bot/chat first.
6. Prepare Railway API/bot worker and Vercel static frontend only after credentials and explicit production deployment approval. Payment providers are out of scope. InPost/Żabka carrier APIs are not assumed until the user selects/credentials a provider.

## Missing access / decisions

- MongoDB Atlas test cluster URI and database name, or confirmation to create a test cluster and who provisions it.
- Telegram admin bot token and admin Telegram numeric IDs for authorization.
- Manager chat IDs/store routing and manager Telegram IDs/roles. These are configuration data, not secrets; they can be added after first authenticated bot startup.
- Separate Telegram group/chat ID for order notifications.
- Separate Telegram group/chat ID for customer support conversations and manager replies. Keep it distinct from the orders group.
- Manager Telegram user IDs, roles and store assignments.
- Client bot token and username for Mini App launch, signed `initData` validation and customer support relay; keep separate from the admin bot.
- Public HTTPS Mini App URL and bot menu/launch configuration (URL is not secret).
- Confirm actual demo catalog categories/products (prompt example says candy, current safe demo is electronics).
- Frontend/backend domains are needed before deployment. Production hosting access is requested only after a separate deployment approval.

## Test status

Backend implementation is in progress under `backend/`. MongoDB Atlas connectivity was verified; the provided Telegram admin bot token is valid and the bot is administrator in both supplied groups. The Atlas database `SmokeIsland` had no prior collections; a 14-item consumer-electronics demo catalog was inserted idempotently.

Implemented so far: public catalog read and product create API, email registration/login/session, Google OAuth start/callback, Telegram Mini App and Login Widget signature verification endpoints, profile read, order creation with server price/stock validation and Mongo transaction, manual payment state, scoped order tracking token, basic admin order/status/points routes, support thread creation, and a minimal Telegram admin bot for reading orders/status/manual paid plus `/reply`.

Verified on a temporary database which was removed after the run: health and database ping, 14 catalog items, registration/session profile, order create, idempotent retry, scoped order tracking, forged Telegram widget signature rejection. Google OAuth redirect URL generation returned a provider redirect; actual consent/callback is pending a browser sign-in and Google Console redirect-URI confirmation. Telegram Login Widget endpoint rejects forged signatures; Mini App validator is implemented but a live signed Mini App login has not been exercised. No real Telegram messages were sent to the supplied groups. `npm audit --omit=dev --audit-level=high` reported zero vulnerabilities.

Still incomplete: frontend support chat is still browser-local; Telegram support relay has only the initial server endpoint and `/reply` command; bot has no full product/user/bonus/admin menu; product editing/archive/stock changes are incomplete; cancellation with transactional stock restoration is implemented but has not yet been exercised in an integration test; password reset, referral/promo/case ledger, customer order history/wishlist/cart APIs, file uploads, realtime, scoped multi-store manager authorization, outbox retries, backup/monitoring and deployment are not implemented. Telegram Mini App URL/menu configuration and public Google/Telegram domain auth cannot be verified until the public HTTPS host is available. The checkout UI is wired to the API and has passed a browser test through the accepted-order page. Network failures now tell the user to open the site over localhost HTTP and start the API. The support chat and remaining surfaces are not yet wired to APIs.

## Next action

Continue with secure cancellation/restock, admin product/user/order workflows, valid signed Telegram auth tests, frontend API integration, and support persistence/relay. Configure Mini App and OAuth public callbacks after the HTTPS domain is ready. Rotate all credentials exposed in chat before production, and do not deploy production until explicit approval.
