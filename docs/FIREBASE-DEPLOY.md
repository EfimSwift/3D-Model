# Firebase: сайт с HTTPS (зелёный замочек) и свой домен

> **Только бесплатно, без карты?** App Hosting требует тариф **Blaze** (оплата по факту). См. **`docs/ZERO-BUDGET-HOSTING.md`** — Cloudflare или Vercel + Neon.

Для вашего **Next.js 16** (каталог, API, оплата, скачивание) нужен не классический «только Hosting», а **Firebase App Hosting** — он собирает Next.js из GitHub и отдаёт по HTTPS.

**Зелёный замочек** = обычный **HTTPS**. На адресах Firebase (`*.hosted.app`, `*.web.app`) сертификат уже есть. На **своём домене** Firebase сам выпускает и продлевает SSL после правильных DNS-записей.

---

## Важно до деплоя (иначе сайт упадёт)

| Сейчас локально | На Firebase |
|-----------------|-------------|
| SQLite `prisma/dev.db` | **Нужна облачная БД** (рекомендуем [Neon](https://neon.tech) Postgres, бесплатный tier) |
| Файлы в `storage/private/` | **Облачное хранилище** (Firebase Storage / Google Cloud Storage) — отдельный этап |

Пока БД только SQLite, полноценный магазин на Firebase **не заработает**. Сначала Postgres + `DATABASE_URL`, потом деплой.

---

## Шаг 1. Аккаунт и проект Firebase

1. Откройте [Firebase Console](https://console.firebase.google.com/).
2. **Create project** → имя (например `figurki-studio`).
3. Подключите **Google Analytics** по желанию.
4. **Тариф Blaze** (оплата по факту): Project settings → Usage and billing → **Modify plan → Blaze**.  
   App Hosting и SSR без Blaze обычно недоступны. На dev трафик часто копеечный, но карта нужна.

---

## Шаг 2. Код на GitHub

1. Репозиторий с проектом (папка `3D-Model` на рабочем столе).
2. **Не коммитьте** `.env`, `prisma/dev.db`, `storage/private/*.enc`.
3. Запушьте в GitHub (`main`).

Без GitHub App Hosting из консоли не подключить автодеплой.

---

## Шаг 3. Облачная база (Postgres)

1. Создайте проект на [Neon](https://console.neon.tech) → скопируйте **connection string** (PostgreSQL).
2. В `prisma/schema.prisma` смените:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Локально в `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

4. Примените схему и сид:

```bash
npx prisma db push
npm run db:seed
```

5. Эту же `DATABASE_URL` потом добавите в Firebase (шаг 6) как **секрет**.

---

## Шаг 4. Создать App Hosting backend

1. Firebase Console → **Build** → **App Hosting** (или Hosting & Serverless → App Hosting).
2. **Get started** / **Create backend**.
3. **Connect GitHub** → разрешите Firebase → выберите репозиторий `3D-Model`.
4. Настройки:
   - **Root directory** — `/` (где `package.json`).
   - **Live branch** — `main`.
   - **Automatic rollouts** — включить (деплой при каждом push).
   - **Region** — ближе к пользователям (например `europe-west4`).
   - **Node.js** — 20+.
5. Создайте **Firebase Web App** в мастере, если просят.
6. Дождитесь первого **rollout** (сборка 5–15 мин).

После успеха откроется URL вида:

`https://ВАШ-BACKEND--PROJECT-ID.REGION.hosted.app`

Откройте в браузере — **замочек уже должен быть зелёным** (это и есть HTTPS).

---

## Шаг 5. Переменные окружения и секреты

Console → ваш backend → **Settings** → **Environment**.

Добавьте (значения как в `.env.example`, но **боевые**):

| Переменная | Заметка |
|------------|---------|
| `DATABASE_URL` | Neon Postgres (лучше как **Secret**) |
| `SESSION_SECRET` | длинная случайная строка |
| `MODEL_ENCRYPTION_KEY` | base64, 32 байта |
| `PAYMENT_WEBHOOK_SECRET` | для webhook |
| `NEXT_PUBLIC_APP_URL` | сначала URL `*.hosted.app`, потом свой домен |
| `ENABLE_TEST_PAYMENT` | `true` только на dev |
| `ALLOW_TEST_PAYMENT_IN_PRODUCTION` | `false` |

После сохранения — **новый rollout** (Redeploy / push в `main`).

Секреты через CLI (опционально):

```bash
npm i -g firebase-tools
firebase login
firebase apphosting:secrets:set SESSION_SECRET --project ВАШ_PROJECT_ID
```

---

## Шаг 6. Свой домен и зелёный замочек

1. App Hosting → ваш backend → **Domains** → **Add custom domain**.
2. Введите домен, например `shop.example.com` или `example.com`.
3. Firebase покажет **DNS-записи** (обычно **A**, **TXT** и **CNAME для ACME**).  
   **Не используйте старый один CNAME** — в 2025+ нужен набор из консоли.
4. В панели **регистратора домена** (Namecheap, Cloudflare DNS, nic.ua и т.д.) добавьте записи **как в Firebase**.
5. Подождите проверку (от нескольких минут до 48 ч). Статус станет **Connected**.
6. SSL выпускается **автоматически** — в браузере зелёный замочек на `https://ваш-домен`.

Обновите в Firebase:

`NEXT_PUBLIC_APP_URL=https://ваш-домен`

и сделайте ещё один rollout.

**Миграция без простоя:** в консоли есть flow **Migrate a domain** — используйте его, если домен уже где-то привязан.

---

## Шаг 7. Проверка

- `https://ваш-домен` — каталог открывается.
- `/staff/login` — админ (после сида).
- Тестовая оплата только если `ENABLE_TEST_PAYMENT=true`.

Логи: App Hosting → **Rollouts** → выбранный деплой → build / runtime logs.

---

## Что не переносится с Cloudflare-инструкции

Папки `wrangler.jsonc`, скрипты `cf:*` — для **Cloudflare**, на Firebase **не нужны**. Можно не трогать, они не мешают сборке.

---

## Краткий чеклист

1. [ ] Firebase проект + **Blaze**
2. [ ] Код на **GitHub**
3. [ ] **Postgres** (Neon) + `prisma` на `postgresql`
4. [ ] **App Hosting** backend + первый успешный rollout
5. [ ] **Environment** / secrets
6. [ ] Проверка `*.hosted.app` (HTTPS)
7. [ ] **Custom domain** + DNS → зелёный замочек
8. [ ] (Позже) файлы моделей в облачное хранилище вместо `storage/private/`

---

## Локальная разработка

Как и раньше:

```bash
cd C:\Users\User\Desktop\3D-Model
npm run dev
```

Деплой на Firebase — через **push в `main`**, не через `firebase deploy` для статики (если только App Hosting).
