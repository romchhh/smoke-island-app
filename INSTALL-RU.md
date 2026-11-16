# Установка Smoke Island — полный frontend + backend

Снимок актуальных исходников: 15 ноября 2026 года, после исправления хедера оформления и выравнивания элементов. Frontend статический; backend — Node.js/Express + MongoDB + Telegram. Сборка frontend не нужна.

## 1. Что находится в архиве

- `frontend/`: HTML, CSS, JavaScript и все локальные изображения.
- `backend/`: API, Telegram-боты, управление товарами/остатками/промокодами/призами, lock-файл зависимостей и тесты.
- `secrets/railway-production.env`: действующие переменные приложения из текущего Railway. Значения не помещены в публичные инструкции.
- `.env.example`: шаблон разработки; `deploy/production.env.example`: шаблон нового сервера.
- `deploy/`: пример Nginx и systemd для одного Linux VPS.
- `docs/`: документация; актуальную процедуру установки задаёт этот файл.
- `SHA256SUMS`: контрольные суммы содержимого.

Данные магазина не являются частью исходного кода. Каталог, остатки, пользователи, заказы, переписка, баллы и изображения, загруженные через админ-бота, находятся в MongoDB. Дамп MongoDB в этот архив не включён. Для сохранения магазина используйте текущее подключение из `secrets/railway-production.env` либо перенесите базу по разделу 6. `frontend/assets/` включён полностью.

## 2. Необходимые компоненты

Linux VPS, Node.js 22.x и npm, Nginx, HTTPS-сертификат, доступ к MongoDB Atlas либо MongoDB replica set. Одиночный MongoDB standalone не подходит: заказы, резервы и баллы используют транзакции. Данные должны сохраняться на постоянном диске/в Atlas. Для нативной зависимости argon2 при отсутствии готового бинарника могут понадобиться Python 3, make и C/C++ compiler.

Один процесс backend запускает API и оба Telegram-бота. При long polling держите ровно один работающий процесс на каждый токен; не запускайте одновременно Railway и VPS с одинаковыми токенами. Не используйте один токен для админского и клиентского бота.

## 3. Переменные окружения и ключи

Для переноса действующего магазина возьмите `secrets/railway-production.env`, сохраните как `/etc/smoke-island.env` и скорректируйте домены. Для нового независимого магазина заполните `deploy/production.env.example` новыми ключами.

| Переменная | Назначение / где получить |
| --- | --- |
| DATABASE_URL | Строка подключения MongoDB, MongoDB Atlas → Connect → Drivers. Пользователь должен читать и писать базу. Разрешите IP нового сервера в Network Access. |
| DATABASE_NAME | Имя нужной базы; при переносе существующих данных сохраните имя из текущей конфигурации. |
| JWT_SECRET, SESSION_SECRET | Два разных случайных секрета, минимум по 32 символа. Для нового окружения: два раза `openssl rand -hex 32`. Смена завершает текущие сессии. |
| NODE_ENV | `production`. |
| PORT | `3000` для данного VPS-примера. В Railway берётся порт платформы. |
| FRONTEND_URL | `https://smoke-island.telebots.site`, без завершающего `/`. |
| BACKEND_URL | Публичный адрес API; при общей схеме — `https://smoke-island.telebots.site`. |
| CORS_ORIGIN | Точный HTTPS-origin сайта; несколько — через запятую, без `*`. |
| GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET | Google Cloud Console → OAuth web client. Существующие значения в файле secrets. |
| GOOGLE_REDIRECT_URI | `https://smoke-island.telebots.site/api/v1/auth/google/callback`. В production при заданном FRONTEND_URL код формирует именно этот callback из FRONTEND_URL. |
| TELEGRAM_ADMIN_BOT_TOKEN | Токен админского бота от BotFather. |
| TELEGRAM_ADMIN_IDS | Числовые Telegram ID администраторов через запятую. Не username. |
| TELEGRAM_ORDERS_CHAT_ID | ID чата/группы для заказов. Бот должен иметь доступ к отправке сообщений. |
| TELEGRAM_SUPPORT_CHAT_ID | Отдельный ID чата/группы поддержки; менеджер отвечает через Telegram Reply. |
| TELEGRAM_CLIENT_BOT_TOKEN, TELEGRAM_CLIENT_BOT_USERNAME | Отдельный клиентский бот от BotFather; username без `@`. |
| TELEGRAM_WEB_APP_URL | Публичный HTTPS-адрес магазина для Mini App. |
| TELEGRAM_OIDC_CLIENT_ID, TELEGRAM_OIDC_CLIENT_SECRET | Настройки website login / OIDC в BotFather. Это отдельные данные, а не токен бота. |
| TELEGRAM_OIDC_REDIRECT_URI | `https://smoke-island.telebots.site/api/v1/auth/telegram/callback`. Зарегистрируйте этот Redirect URI и origin сайта в настройках OIDC у BotFather. |
| RESEND_API_KEY, EMAIL_FROM | Resend API key и адрес с проверенного отправляющего домена. В текущем Railway НЕ заданы: без них регистрация по email возвращает EMAIL_NOT_CONFIGURED. |
| TELEGRAM_WEBHOOK_URL, TELEGRAM_WEBHOOK_SECRET | Не нужны при long polling. При переходе на webhook задаются оба, URL проксируется в backend. Активный webhook старого бота нужно убрать перед переходом на polling. |
| BONUS_REWARD_PRODUCT_SLUG | Необязательный fallback для Start, если приз не назначен в админке; по умолчанию `bc`. |
| ENV_FILE | Не секрет. Путь к env-файлу для dotenv; задан в systemd. При ручном запуске из backend по умолчанию читается `../.env.local`. |

Пароли кабинетов хостинга/Google/Atlas/BotFather не экспортируются из Railway. При необходимости владелец должен выдать программисту доступ в соответствующие кабинеты для изменения доменов, OAuth и MongoDB Network Access. Фактический список экспортированных переменных: `docs/CONFIGURATION-STATUS.txt`.

## 4. Развёртывание на VPS: Nginx + systemd

Пример рассчитан на systemd и установленный Node.js 22 по пути `/usr/bin/node`. Проверьте `node --version` и `command -v node`; если путь другой, измените ExecStart в unit-файле. Рабочий домен магазина: `smoke-island.telebots.site`. Направьте его DNS A/AAAA на сервер и установите nginx, unzip, openssl, certbot и nginx-плагин certbot средствами вашей ОС.

1. Распакуйте архив в закрытую рабочую директорию и проверьте контрольные суммы:

```bash
unzip smoke-island-full-2026-11-15.zip
cd smoke-island-full-2026-11-15
sha256sum -c SHA256SUMS
```

2. Создайте пользователя сервиса и скопируйте приложение:

```bash
sudo useradd --system --user-group --home-dir /srv/smoke-island --shell /usr/sbin/nologin smokeisland
sudo mkdir -p /srv/smoke-island
sudo cp -a backend frontend deploy /srv/smoke-island/
sudo chown -R smokeisland:smokeisland /srv/smoke-island
sudo chmod 755 /srv /srv/smoke-island /srv/smoke-island/frontend
sudo cp secrets/railway-production.env /etc/smoke-island.env
sudo chown smokeisland:smokeisland /etc/smoke-island.env
sudo chmod 600 /etc/smoke-island.env
sudoedit /etc/smoke-island.env
```

В последнем файле исправьте FRONTEND_URL, BACKEND_URL, CORS_ORIGIN, callback URL, TELEGRAM_WEB_APP_URL и PORT; сохраните нужные ключи и базу. Для нового магазина используйте шаблон вместо текущего файла secrets. Не копируйте `secrets/` в корень сайта.

3. Установите backend-зависимости:

```bash
cd /srv/smoke-island/backend
sudo -u smokeisland npm ci --omit=dev
```

4. Оставьте в `frontend/config.js` `apiBase: '/api/v1'`. На VPS файл `frontend/vercel.json` не используется: запросы проксирует Nginx. Его текущая настройка адресована старому Railway и нужна только для Vercel.

5. Установите конфигурацию Nginx, заменив домен в копии:

```bash
sudo cp /srv/smoke-island/deploy/nginx.conf.example /etc/nginx/sites-available/smoke-island
sudoedit /etc/nginx/sites-available/smoke-island
sudo ln -s /etc/nginx/sites-available/smoke-island /etc/nginx/sites-enabled/smoke-island
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d smoke-island.telebots.site
```

Уберите конфликтующий default vhost, если он уже обслуживает этот домен. Разрешите входящие 80/443 и административный SSH; не открывайте порт 3000 для внешних клиентов. Backend слушает 0.0.0.0, поэтому изоляция порта обеспечивается firewall/security group. HTTPS обязателен для production cookie и OAuth.

6. Настройте Google Cloud и BotFather для нового домена по таблице выше. Убедитесь, что MongoDB доступна с IP сервера.

7. Перед запуском на тех же токенах остановите старый backend в Railway. Если используется та же MongoDB, финальный дамп/восстановление не нужны. Запустите службу:

```bash
sudo cp /srv/smoke-island/deploy/smoke-island.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now smoke-island
sudo systemctl status smoke-island
sudo journalctl -u smoke-island -n 100 --no-pager
curl --fail https://smoke-island.telebots.site/api/health
```

Ожидаемый health: `{"ok":true,"db":"connected"}`. Этот ответ подтверждает API/MongoDB, но не корректность всех внешних ключей.

## 5. Проверка магазина

- Откройте сайт: каталог и изображения загрузились; /api/v1/catalog возвращает JSON.
- Проверьте Google/Telegram login. В production Google callback должен находиться на том же origin, что и сайт.
- Для email регистрации настройте Resend и проверенный EMAIL_FROM.
- В админском боте отправьте `/start`: Товары, Добавить товар, Наличие, Промокод, Приз, Создать приз. Проверьте шаги и возврат назад.
- Тестовый заказ/сообщение проверяйте на staging: production проверка создаёт реальные резервы и Telegram уведомления.
- У заказа есть резерв, подтверждение менеджером списывает остатки и начисляет 3% один раз. Неактивный резерв корзины освобождается через 4 часа; ожидающий заказ этим таймером не очищается.
- Кейсы: 10/20/100 баллов. При первом запуске миграция задаёт Premium = скидка 100 zł, Exclusive = скидка 200 zł; последующие назначения через админку не перезаписываются. Start использует назначенный приз либо `bc`.
- Приз-скидка выдаёт именной однократный код на 90 дней, максимум до суммы товаров; доставка скидкой не покрывается. В блоке возможных наград отображается серверное назначение.

## 6. Перенос MongoDB на другой кластер

Без переноса базы новый пустой кластер не содержит текущий каталог и заказы. Самый простой перенос сервера — оставить существующий кластер и добавить IP VPS в MongoDB Atlas.

Если нужен другой кластер, используйте MongoDB Database Tools (`mongodump` / `mongorestore`) или штатный перенос Atlas. Сначала остановите оформление заказов и старый backend; сделайте согласованный backup всей базы, включая все коллекции и индексы. Не храните пароль в истории shell; используйте закрытый конфигурационный файл Database Tools. Для неинтерактивного примера после безопасного задания переменных:

```bash
mongodump --uri="$SOURCE_DATABASE_URL" --db="$SOURCE_DATABASE_NAME" --archive=/secure/smoke-island.mongo.gz --gzip
mongorestore --uri="$TARGET_DATABASE_URL" --archive=/secure/smoke-island.mongo.gz --gzip
```

При одинаковом имени базы архив восстанавливается с исходным namespace. При переименовании используйте nsFrom/nsTo. На новом кластере нужен replica set/Atlas; проверьте число документов, media, индексы и связи, затем измените DATABASE_URL/DATABASE_NAME в env. Не используйте `seed:demo` для переноса реального магазина. Дамп включает личные данные и не должен быть доступен через Nginx.

## 7. Альтернатива: оставить Railway + Vercel

Из корня распакованного проекта после привязки CLI к своим проектам:

```bash
railway up backend --path-as-root --service api
cd frontend
vercel --prod
```

В Railway задайте переменные из secrets или своего шаблона. Явный `--path-as-root` нужен, чтобы в архиве сборки корнем был backend. Не загружайте всю папку проекта как Node-приложение. Для Git-деплоя установите Root Directory = backend, Start Command = npm start, Healthcheck = /api/health.

Vercel: Root Directory = frontend, preset Other, build command не нужен, статические файлы находятся в frontend. Измените destination в `frontend/vercel.json` на адрес вашего API, сохранив `/api/v1/:path*`. Оставьте apiBase='/api/v1' — браузер работает с same-origin cookie. Если публичный origin меняется, обновите OAuth и переменные Railway. Папки .vercel и node_modules из архива исключены, привязка к аккаунту выполняется программистом.

## 8. Тесты, обновление и ограничения

В изолированном тестовом окружении:

```bash
cd backend
npm ci
npm test
npm run test:integration
```

Интеграционные тесты запускают собственный MongoDB replica set, очищают Telegram-переменные внутри тестового процесса и не используют production базу. Для первого запуска тестов нужен доступ к загрузке MongoDB binary; API теста занимает локальный порт 31379.

Перед обновлением сохраните env и backup MongoDB, замените код, выполните npm ci --omit=dev и systemctl restart smoke-island. Unit-файл не запускает миграции сторонней БД, кроме встроенной одноразовой настройки призов и служебной подготовки записей/индексов.

Платежи подтверждаются вручную менеджером; эквайринга и интеграции отправки посылок нет. Восстановление пароля ещё не реализовано. Email подтверждение зависит от Resend; OIDC зависит от регистрации нового домена у провайдеров. Текущий working URL: https://smoke-island.telebots.site.
