Smoke Island — полный проект (обновлён 16.11.2026)

Начните с INSTALL-RU.md.
Исходники: frontend/ и backend/.
Локальный запуск (Mongo + API + сайт): npm run dev
  Storefront: http://127.0.0.1:8765
  API health: http://127.0.0.1:3000/api/health
Демо-каталог: npm run seed
Установка на VPS: deploy/nginx.conf.example и deploy/smoke-island.service.
Действующие ключи: secrets/railway-production.env (передача только приватно).
Данные каталога, заказы и загруженные админом изображения находятся в MongoDB; дамп в архив не включён.
Контроль целостности: sha256sum -c SHA256SUMS.
