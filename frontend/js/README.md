# Storefront JS modules

Classic scripts (not ES modules) so they share one global scope without a bundler.
`index.html` loads them in this order:

| File | Responsibility |
|------|----------------|
| `icons.js` | `$` / `$$`, SVG system icons, `img`, `esc`, API base |
| `state.js` | Persisted state, pricing, cart mutations, catalog mapping |
| `api.js` | Catalog fetch, toast, Telegram login mount |
| `layout.js` | Header, breadcrumbs, banners |
| `pages-shop.js` | Home, catalog, product, cart, checkout, delivery |
| `pages-account.js` | Auth, bonus cases/rewards, referrals |
| `mobile.js` | Mobile shell + product/cart sheets |
| `support.js` | Support chat |
| `bonus-ui.js` | Bonus reel / open / claim UI |
| `pages-order.js` | Order accepted, email verify, referral loaders |
| `render.js` | Hash router + partial product updates |
| `events.js` | Main click / form / input handlers |
| `session.js` | Session restore, stock holds, promo |
| `boot.js` | Remaining listeners + app start |
