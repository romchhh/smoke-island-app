Статический frontend Smoke Island. Сборка не требуется.
Подробная установка: ../INSTALL-RU.md.
API: /api/v1 на том же origin; Nginx либо Vercel проксирует запросы в backend.
Каталог, заказы, аккаунты, поддержка, реальные кейсы и резервы работают через backend и MongoDB.
Все локальные изображения находятся в assets/.
На VPS vercel.json не используется; на Vercel замените destination на нужный backend.
