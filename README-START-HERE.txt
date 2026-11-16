Smoke Island — полный проект (обновлён 16.11.2026)

Домен: https://smoke-island.telebots.site
Начните с INSTALL-RU.md.
Исходники: frontend/ и backend/.

Docker (рекомендуется):
  cp .env.docker.example .env.docker
  docker compose --env-file .env.docker up -d --build
  docker compose --env-file .env.docker --profile seed run --rm seed
  Сайт: http://localhost:8080
  API health: http://localhost:8080/api/health

Локальный запуск без Docker (Mongo + API + сайт): npm run dev
  Storefront: http://127.0.0.1:8765
  API health: http://127.0.0.1:3000/api/health
Демо-каталог: npm run seed
Установка на VPS: deploy/nginx.conf.example и deploy/smoke-island.service.
Действующие ключи: secrets/railway-production.env (передача только приватно).
Данные каталога, заказы и загруженные админом изображения находятся в MongoDB; дамп в архив не включён.
Контроль целостности: sha256sum -c SHA256SUMS.
