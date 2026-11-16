# Smoke Island

Магазин + Express API + Telegram-боти + MongoDB Atlas.

**Prod:** https://smoke-island.telebots.site  
**Repo:** https://github.com/romchhh/smoke-island-app

На одному VPS з **elf-duck-shop** — не займайте порти `3000–3006`.

## Структура

| Шлях | Призначення |
|------|-------------|
| `frontend/` | Статичний сайт (без збірки) |
| `backend/` | API, сесії, OAuth, Telegram-боти |
| `deploy/` | host nginx, systemd, production env |
| `docker-compose.yml` | **лише api** (Mongo = Atlas; nginx на хості) |

## Порти на хості

| Порт | Сервіс |
|------|--------|
| **3010** | API |

## MongoDB

Той самий Atlas-кластер, що й Elf Duck, **інша база**:

| Проєкт | БД |
|--------|-----|
| Elf Duck | `test` / `elfduck` (як у їхньому URI) |
| Smoke Island | `SmokeIslandLocal` (dev) / `SmokeIslandProduction` (prod) |

```bash
DATABASE_URL=mongodb+srv://USER:PASS@….mongodb.net/?retryWrites=true&w=majority&appName=smoke-island
DATABASE_NAME=SmokeIslandProduction
```

У Network Access Atlas має бути IP VPS (як для Elf Duck).

## Домени (host nginx → localhost)

| Домен | Upstream |
|-------|----------|
| `smoke-island.telebots.site` | статика `frontend/` + `/api` → `127.0.0.1:3010` |

Шаблон: `deploy/nginx.conf.example`.

## Docker (api)

```bash
cp .env.docker.example .env.docker
# встав Atlas DATABASE_URL + DATABASE_NAME
npm run docker:build
npm run docker:up
npm run docker:seed
```

Health: http://127.0.0.1:3010/api/health

Prod: `NODE_ENV=production` і **лише HTTPS** URL у `.env.docker`.

Старий локальний mongo-контейнер більше не потрібен:
`docker compose --env-file .env.docker down --remove-orphans`

## Host nginx + TLS

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d smoke-island.telebots.site
```

## Локально без Docker

```bash
cp .env.example .env.local
# Atlas DATABASE_URL + DATABASE_NAME=SmokeIslandLocal
cd backend && npm ci && cd ..
npm run seed
npm run dev    # API :3010 + статика :8765
```

## Env

| Файл | Навіщо |
|------|--------|
| `.env.example` | Шаблон `.env.local` |
| `.env.docker.example` | Шаблон Compose |
| `deploy/production.env.example` | Prod |

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
