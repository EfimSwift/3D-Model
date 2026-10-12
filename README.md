# Figurki Shop

Основа магазина 3D-моделей и фигурок: каталог, 3D-превью, регистрация, заказы, защищённое скачивание после «оплаты». Платёжные шлюзы (LiqPay / WayForPay) — следующий этап.

## Быстрый старт

```bash
cd 3D-Model
npm install
npm run db:setup
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Покупатели

Регистрации нет — при оплате указывается **email**, на него уходит письмо с чеком и ссылкой.

### Админ (после `db:setup`)

`/staff/login` — `admin@figurki.local` / `admin1234`

### Тестовые товары

1. **test-dragon** — 3D модель, превью GLB, ZIP в `storage/private/`
2. **test-robot** — 3D модель, то же
3. **test-figurine-wizard** — физическая фигурка, только картинка

### Проверка «оплатил — скачал»

1. Войти как demo.
2. Открыть модель → **Купить (оплата позже)**.
3. **Тест: отметить как оплаченное** (включено, пока `ENABLE_TEST_PAYMENT=true`).
4. **Скачать архив модели** — файл отдаётся по короткоживущему токену, не из публичной папки.

Без оплаты доступно только 3D-превью на странице товара.

## Структура

- `prisma/` — SQLite, пользователи, товары, заказы
- `public/previews/` — публичные GLB для просмотра
- `storage/private/` — полные архивы (не в git, кроме `.gitkeep`)
- `src/app/api/download/` — выдача файла только владельцу оплаченного заказа

## Переменные окружения

Скопируйте `.env.example` в `.env`:

- `DATABASE_URL` — SQLite
- `SESSION_SECRET` — секрет для сессий и download-токенов
- `ENABLE_TEST_PAYMENT` — `true` для кнопки тестовой оплаты (выключить на проде)
- `MODEL_ENCRYPTION_KEY` — ключ AES для файлов моделей в `storage/private` (см. `SECURITY.md`)

Подробно:

- **`SECURITY.md`** — модели, шифрование, доступ
- **`docs/INFRASTRUCTURE.md`** — Docker/K8s, DDoS, разделение сервисов
- **`docs/PAYMENTS-SECURITY.md`** — оплата, PCI, webhook
- **`docs/ZERO-BUDGET-HOSTING.md`** — хостинг за $0 (без Firebase Blaze)
- **`docs/FIREBASE-DEPLOY.md`** — Firebase App Hosting (нужна карта / Blaze)
- **`docs/CLOUDFLARE-GIT-DEPLOY.md`** — деплой через GitHub (пошагово)
- **`docs/CLOUDFLARE-DEV.md`** — Cloudflare Workers (OpenNext + D1 + R2)

Docker: `docker compose up --build` → сайт на http://localhost:8080

Cloudflare dev: `npm run cf:deploy` (после настройки D1/R2 в `wrangler.jsonc`)

## Git

```bash
git init
git add .
git commit -m "Initial shop foundation"
```

Файлы в `storage/private/*.zip` создаются при `npm run db:setup` — их можно не коммитить (см. `.gitignore`).
