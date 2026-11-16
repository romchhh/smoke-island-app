# Smoke Island

Магазин + Express API + Telegram-боти + MongoDB Atlas.

**Prod:** https://smoke-island.telebots.site  
**Repo:** https://github.com/romchhh/smoke-island-app

На одному VPS з **elf-duck-shop** — не займайте порти `3000–3006`.

## Env (один файл)

У корені проєкту лише **`.env`** (шаблон: `.env.example`).  
Його читають і Node (`backend`), і Docker Compose. Не комітити.

```bash
cp .env.example .env
# заповни секрети + Atlas URI
```

## Структура

| Шлях | Призначення |
|------|-------------|
| `frontend/` | Статичний сайт |
| `backend/` | API + Telegram-боти |
| `deploy/` | host nginx, systemd |
| `docker-compose.yml` | лише **api** (Mongo = Atlas) |

## Порти

| Порт | Сервіс |
|------|--------|
| **3010** | API (host → container `3000`) |

## MongoDB

Той самий Atlas, що Elf Duck, інша база (`DATABASE_NAME`, напр. `SmokeIslandProduction`).

## Host nginx

`deploy/nginx.conf.example` — статика з `frontend/`, `/api` → `127.0.0.1:3010`.

## Docker

```bash
# потрібен кореневий .env
npm run docker:build
npm run docker:up
npm run docker:seed
```

Health: http://127.0.0.1:3010/api/health

```bash
docker compose up -d --force-recreate api   # після зміни .env
docker compose exec api printenv DATABASE_URL DATABASE_NAME NODE_ENV FRONTEND_URL
```

## Локально без Docker

```bash
cd backend && npm ci && cd ..
npm run seed
npm run dev
```

## Команди

```bash
npm run docker:up
npm run docker:rebuild:api
npm run docker:logs
npm run docker:down
npm test
```
