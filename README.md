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
| `deploy/` | host nginx, systemd, production env |
| `docker-compose.yml` | **api + mongo** (nginx окремо на хості) |

## Порти на хості

| Порт | Сервіс |
|------|--------|
| **3010** | API |
| **3017** | MongoDB з хоста |

Усередині compose: API `3000`, Mongo `27017`.

## Домени (host nginx → localhost)

| Домен | Upstream |
|-------|----------|
| `smoke-island.telebots.site` | статика `frontend/` + `/api` → `127.0.0.1:3010` |

Шаблон: `deploy/nginx.conf.example`.

Elf Duck: `elfduck-api` → 3000, `elfduck` → 3001, `elfduck-crm` → 3002, `tegger` → 3005.

## Docker (api + mongo)

```bash
cp .env.docker.example .env.docker
# заповни секрети
npm run docker:build
npm run docker:up
npm run docker:seed
```

Health: http://127.0.0.1:3010/api/health

Перезбірка API: `npm run docker:rebuild` або `npm run docker:rebuild:api`.

Prod: у `.env.docker` — `NODE_ENV=production` і **лише HTTPS** URL з `deploy/production.env.example`.

Якщо API `unhealthy`: `docker compose logs api`; на порожній dev-базі можна `docker compose down -v`.

## Host nginx + TLS

```bash
# підстав deploy/nginx.conf.example (root = шлях до frontend)
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d smoke-island.telebots.site
# або webroot:
# sudo certbot certonly --webroot -w /root/smoke-island/frontend -d smoke-island.telebots.site
```

## Локально без Docker

```bash
cp .env.example .env.local
cd backend && npm ci && cd ..
npm run seed
npm run dev    # API :3010 + статика :8765
```

## Env

| Файл | Навіщо |
|------|--------|
| `.env.example` | Шаблон локального `.env.local` |
| `.env.docker.example` | Шаблон для Compose |
| `deploy/production.env.example` | Prod URL/секрети |

Обов’язково: `DATABASE_URL` (replica set), `JWT_SECRET`, `SESSION_SECRET`, Google OAuth, окремі токени admin/client ботів, `FRONTEND_URL` / `CORS_ORIGIN`.

Google redirect: `https://smoke-island.telebots.site/api/v1/auth/google/callback`  
Telegram OIDC: `…/api/v1/auth/telegram/callback`

## Команди

```bash
npm run docker:build
npm run docker:up
npm run docker:rebuild:api
npm run docker:seed
npm run docker:logs
npm run docker:down
npm test
```
