# Docker

## Quick start

```bash
cp .env.docker.example .env.docker
# edit secrets in .env.docker if needed
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker --profile seed run --rm seed
```

Open http://localhost:8080

## Services

| Service | Role |
| --- | --- |
| `web` | Nginx static frontend + `/api` reverse proxy → `api` |
| `api` | Node.js Express API and Telegram bots |
| `mongo` | MongoDB 8 replica set `rs0` (required for transactions) |
| `seed` | Optional profile that inserts the demo catalog |

## Production notes

Production domain: `https://smoke-island.telebots.site`.

- For local Docker keep HTTP `localhost:8080` defaults from `.env.docker.example`.
- On the server set `NODE_ENV=production` with HTTPS `FRONTEND_URL` / `CORS_ORIGIN` from `deploy/production.env.example`.
- Prefer managed MongoDB Atlas by overriding `DATABASE_URL` / `DATABASE_NAME`.
- Do not commit `.env.docker`. Keep tokens in a private secret store.
- Map host port with `ports` on `web` (default `8080:80`) or put another TLS proxy in front.
