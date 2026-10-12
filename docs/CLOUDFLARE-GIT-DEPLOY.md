# Деплой на Cloudflare через Git (пошагово)

Через **Git** Cloudflare **сам клонирует репозиторий**, ставит зависимости (`npm ci`), **собирает** проект и **выкладывает** Worker. Это не загрузка папки мышкой — лимит **1000 файлов в браузере** здесь **не мешает**.

На free-плане через Git/Pages/Workers обычно до **20 000** статических файлов в деплое; `node_modules` в репозиторий **не кладут** — они ставятся при сборке.

---

## Что попадает в Git (и на сервер после сборки)

| В репозитории | Зачем |
|---------------|--------|
| `src/`, `public/` (GLB, картинки) | Код и **публичные** превью |
| `prisma/schema.prisma`, `prisma/seed.ts` | Схема БД |
| `package.json`, `wrangler.jsonc`, `open-next.config.ts` | Сборка Cloudflare |
| `storage/private/.gitkeep` | Папка есть, **без** секретных архивов |

| **Не** в Git (и так правильно) | Куда на проде |
|--------------------------------|---------------|
| `node_modules/`, `.next/`, `.open-next/` | Собираются на сервере |
| `.env` | Secrets в Cloudflare |
| `storage/private/*.enc` | **R2** (`npm run cf:models:upload`) |
| `prisma/dev.db` | **D1** (миграция + сид) |

«Все файлы сайта» для пользователя = **код + `public/`** в Git + **модели в R2** + **данные в D1**. Так и задумано.

---

## Шаг 0. Один раз на компьютере

```powershell
cd C:\Users\User\Desktop\3D-Model
npm install
npx wrangler login
```

---

## Шаг 1. Репозиторий на GitHub

1. Создайте репозиторий на GitHub (пустой или с README).
2. В папке проекта:

```powershell
cd C:\Users\User\Desktop\3D-Model
git init
git add .
git status
```

Убедитесь, что **нет** `.env`, `node_modules`, `dev.db`, `storage/private/*.enc`.

```powershell
git commit -m "Initial deploy to Cloudflare"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПО.git
git push -u origin main
```

---

## Шаг 2. D1 и R2 (один раз в аккаунте Cloudflare)

```powershell
npx wrangler d1 create figurki-3d-dev
npx wrangler r2 bucket create figurki-3d-models-dev
```

В `wrangler.jsonc` замените `REPLACE_WITH_D1_DATABASE_ID` на **database_id** из вывода команды.

Закоммитьте и запушьте:

```powershell
git add wrangler.jsonc
git commit -m "Configure D1 database id"
git push
```

Схема и сид в облачной D1 **с вашего ПК** (не из Git):

```powershell
npm run cf:db:schema
npm run cf:db:migrate:remote
npm run cf:db:seed:remote
```

Локально должны быть `.enc` после `npm run db:setup`, затем:

```powershell
npm run cf:models:upload
```

---

## Шаг 3. Секреты Worker (один раз)

```powershell
npx wrangler secret put SESSION_SECRET
npx wrangler secret put MODEL_ENCRYPTION_KEY
npx wrangler secret put PAYMENT_WEBHOOK_SECRET
```

(Вводите те же значения, что в локальном `.env`.)

---

## Шаг 4. Подключить Git в Cloudflare (Workers Builds)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**.
2. **Create** → **Worker** → вкладка **Connect to Git** (или у существующего Worker: **Settings** → **Builds** → Connect).
3. Выберите **GitHub**, разрешите доступ, выберите репозиторий.
4. **Production branch:** `main`.
5. **Build settings:**

| Поле | Значение |
|------|----------|
| **Root directory** | `/` (корень, где `package.json`) |
| **Build command** | `npm ci && npx opennextjs-cloudflare build` |
| **Deploy command** | `npx opennextjs-cloudflare deploy` |

6. **Node.js version:** 20 или 22.

7. **Build variables & secrets** (важно для `next build`):

   - `NODE_VERSION` = `20` (если есть такое поле)
   - Секреты для сборки, если нужны (часто те же, что runtime — см. логи первой сборки).

   Публичные переменные уже в `wrangler.jsonc` → `vars` (`NEXT_PUBLIC_APP_URL` и т.д.). После первого деплоя подставьте реальный URL Worker в `wrangler.jsonc` и сделайте push.

8. Сохраните и запустите **первый build**.

Cloudflare при каждом **push в `main`** будет: clone → `npm ci` → OpenNext build → deploy.

---

## Шаг 5. Проверка

- В Workers → ваш проект → URL вида `https://figurki-3d-dev.<поддомен>.workers.dev`.
- Откройте в браузере — каталог, HTTPS (замочек).
- Админ: `/staff/login` (если сид D1 прошёл).

Логи: **Deployments** / **Build log** в панели Worker.

---

## Preview-ветки (опционально)

В настройках Builds включите **Preview deployments** для PR или ветки `develop`.  
В `wrangler.jsonc` уже есть блок `env.preview` — для preview-деплоя deploy command может быть:

`npx opennextjs-cloudflare deploy --env preview`

(настройте отдельное окружение в UI, если Cloudflare предложит Non-production branch.)

---

## Если сборка падает

| Ошибка | Что сделать |
|--------|-------------|
| `REPLACE_WITH_D1_DATABASE_ID` | Подставить реальный id D1 в `wrangler.jsonc` |
| Prisma / DB | Выполнить `cf:db:migrate:remote` и `cf:db:seed:remote` |
| Скачивание модели 404 | Залить `.enc` в R2: `cf:models:upload` |
| Секреты | `wrangler secret put ...` |
| Лимит файлов | Вы не должны коммитить `node_modules`; деплой только через Git/CLI |

Локальная проверка **до** push:

```powershell
npm run cf:preview
```

---

## Краткая схема

```text
GitHub (код + public/)
    → push main
        → Cloudflare Build (npm ci + opennextjs-cloudflare build)
            → Worker + статика из .open-next/assets
D1 (данные)  — миграция/сид с ПК
R2 (архивы)  — upload с ПК
Secrets      — wrangler secret put
```

Так «заливаются» все нужные части проекта без лимита drag-and-drop в 1000 файлов.
