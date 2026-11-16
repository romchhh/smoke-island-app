# Smoke Island

Магазин + Express API + Telegram-боти + MongoDB.

**Prod:** https://smoke-island.telebots.site  
**Repo:** https://github.com/romchhh/smoke-island-app

На одному VPS з **elf-duck-shop** — не займайте порти `3000–3006`.

## Структура

| Шлях | Призначення |
|------|-------------|
| `frontend/` | Статичний сайт (без збірки) |
| `backend/` | API, сесії, OAuth, Telegram-боти |
| `deploy/` | nginx, systemd, production env |
| `docker-compose.yml` | web + api + mongo (replica set) |

## Порти на хості

| Порт | Сервіс |
|------|--------|
| **8080** | Web (Docker nginx → фронт + `/api`) |
| **3010** | API (для host nginx / health) |
| **3017** | MongoDB з хоста |

Усередині compose: API `3000`, Mongo `27017`.

## Домени (nginx → localhost)

| Домен | Upstream |
|-------|----------|
| `smoke-island.telebots.site` | `127.0.0.1:3010` для `/api` + статика з `frontend/` **або** весь трафік на `8080` (Docker web) |

Elf Duck на тому ж сервері: `elfduck-api` → 3000, `elfduck` → 3001, `elfduck-crm` → 3002, `tegger` → 3005.

## Docker (рекомендовано)

```bash
cp .env.docker.example .env.docker
# заповни секрети
npm run docker:build    # BuildKit, кеш npm/apt
npm run docker:up       # старт без примусового rebuild
npm run docker:seed
```

Сайт: http://localhost:8080 · health: http://localhost:8080/api/health

Перезбірка:
- `npm run docker:rebuild` — api + web
- `npm run docker:rebuild:api` / `docker:rebuild:web` — лише змінений сервіс

Образи: `smoke-island-api:local` / `smoke-island-web:local` (seed бере api-образ, без другого білду).

Prod: у `.env.docker` постав `NODE_ENV=production` і **лише HTTPS** URL з `deploy/production.env.example` (інакше API впаде на старті).

Якщо API `unhealthy` після першого запуску Mongo: `docker compose logs api` і за потреби скинь volume (`docker compose down -v`) лише на порожній dev-базі.

### TLS (certbot webroot)

`web` монтує `./frontend` і віддає `/.well-known/acme-challenge/`. Після зміни volume:

```bash
docker compose --env-file .env.docker up -d --force-recreate --build web
mkdir -p frontend/.well-known/acme-challenge
echo ok > frontend/.well-known/acme-challenge/test
curl -sS http://smoke-island.telebots.site/.well-known/acme-challenge/test   # → ok
# якщо домен іде на host nginx:80 — використовуй deploy/nginx.conf.example (root = шлях до frontend)
sudo certbot certonly --webroot -w "$(pwd)/frontend" -d smoke-island.telebots.site
```

## Локально без Docker

```bash
cp .env.example .env.local
# Mongo replica set на 27017 (локальний mongod) або Docker mongo на 3017
cd backend && npm ci && cd ..
npm run seed   # лише на dev-базі
npm run dev    # API :3010 + статика :8765
```

- Storefront: http://127.0.0.1:8765  
- API: http://127.0.0.1:3010/api/health  

## VPS (без Docker web)

1. DNS A/AAAA → VPS для `smoke-island.telebots.site`
2. Скопіюй `deploy/production.env.example` → `/etc/smoke-island.env`, заповни секрети (`PORT=3010`)
3. Встанови unit: `deploy/smoke-island.service`
4. Nginx: `deploy/nginx.conf.example` → `proxy_pass http://127.0.0.1:3010`
5. TLS: `certbot --nginx -d smoke-island.telebots.site`

Не відкривай 3010/3017/8080 у firewall для світу — лише 80/443 (+ SSH).

## Env

| Файл | Навіщо |
|------|--------|
| `.env.example` | Шаблон локального `.env.local` |
| `.env.docker.example` | Шаблон для Compose |
| `deploy/production.env.example` | Prod на VPS |

Обов’язково: `DATABASE_URL` (replica set), `JWT_SECRET`, `SESSION_SECRET`, Google OAuth, окремі токени admin/client ботів, `FRONTEND_URL` / `CORS_ORIGIN`.

Google redirect: `https://smoke-island.telebots.site/api/v1/auth/google/callback`  
Telegram OIDC: `…/api/v1/auth/telegram/callback`

## Корисні команди

```bash
npm run docker:build
npm run docker:up
npm run docker:rebuild:api
npm run docker:seed
npm run docker:logs
npm run docker:down
npm test
```
