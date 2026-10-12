# Деплой на Cloudflare (dev / preview)

Next.js 16 разворачивается через **OpenNext** (`@opennextjs/cloudflare`) на **Cloudflare Workers** (рекомендуемый путь вместо legacy Pages + `@cloudflare/next-on-pages`).

Локально по-прежнему: `npm run dev` (SQLite + файлы в `storage/private/`).

На Cloudflare:

| Ресурс | Назначение |
|--------|------------|
| **D1** (`DB`) | SQLite-совместимая БД (Prisma + `@prisma/adapter-d1`) |
| **R2** (`MODELS_BUCKET`) | Зашифрованные `.enc` архивы моделей |
| **Secrets** | `SESSION_SECRET`, `MODEL_ENCRYPTION_KEY`, `PAYMENT_WEBHOOK_SECRET` |

Публичные GLB/картинки остаются в `public/` и отдаются как статика Worker.

---

## 1. Один раз: аккаунт и CLI

```bash
npm install
npx wrangler login
```

Создайте ресурсы (имена как в `wrangler.jsonc` или свои — тогда поправьте конфиг):

```bash
npx wrangler d1 create figurki-3d-dev
npx wrangler r2 bucket create figurki-3d-models-dev
```

Скопируйте `database_id` из вывода `d1 create` в `wrangler.jsonc` → `d1_databases[0].database_id` (замените `REPLACE_WITH_D1_DATABASE_ID`).

---

## 2. Схема БД в D1

```bash
npm run cf:db:schema
npm run cf:db:migrate:local
npm run cf:db:migrate:remote
```

Сид тестовых товаров и админа на dev (после миграции):

```bash
npm run cf:db:seed:remote
npm run cf:models:upload
```

---

## 3. Модели в R2

Ключ объекта = значение `privateFilePath` в БД (например `test-dragon.zip.enc`).

```bash
npx wrangler r2 object put figurki-3d-models-dev/test-dragon.zip.enc --file=storage/private/test-dragon.zip.enc
npx wrangler r2 object put figurki-3d-models-dev/test-robot.zip.enc --file=storage/private/test-robot.zip.enc
```

Или пакетно: `npm run cf:models:upload`

---

## 4. Секреты и переменные

Публичные vars — в `wrangler.jsonc` → `vars`.

Секреты (не коммитить):

```bash
npx wrangler secret put SESSION_SECRET
npx wrangler secret put MODEL_ENCRYPTION_KEY
npx wrangler secret put PAYMENT_WEBHOOK_SECRET
```

Обновите `NEXT_PUBLIC_APP_URL` в `wrangler.jsonc` на реальный URL Workers (`*.workers.dev` или свой домен).

Локальный preview Workers:

```bash
cp .dev.vars.example .dev.vars
# заполните секреты
npm run cf:preview
```

Откроется обычно `http://localhost:8788`.

---

## 5. Сборка и деплой

```bash
npm run cf:build
npm run cf:deploy
```

Preview-окружение (отдельное имя в `wrangler.jsonc` → `env.preview`):

```bash
npm run cf:deploy -- --env preview
```

---

## 6. Git → Cloudflare (dev branch)

В [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Connect Git**.

| Поле | Значение |
|------|----------|
| Build command | `npm run cf:build` |
| Deploy command | `npx wrangler deploy` (или `npm run cf:deploy` в CI с `CLOUDFLARE_API_TOKEN`) |
| Node.js | 20+ |

Добавьте в репозиторий секреты CI: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

Для **preview deployments** включите ветки `develop` / PR и задайте переменные `ENABLE_TEST_PAYMENT=true` только на preview.

---

## 7. Ограничения dev на Workers

- In-memory rate limit в `middleware.ts` не общий между инстансами — на dev норм; на проде включите Redis/KV или полагайтесь на Cloudflare WAF.
- Размер Worker bundle — следите за лимитами Free/Paid плана.
- `ENABLE_TEST_PAYMENT` на публичном dev держите осознанно; на проде — `false`.

---

## Полезные команды

| Команда | Действие |
|---------|----------|
| `npm run cf:preview` | Сборка + локальный Workers runtime |
| `npm run cf:deploy` | Деплой в Cloudflare |
| `npm run cf:typegen` | Типы bindings → `cloudflare-env.d.ts` |
| `npm run cf:db:migrate:remote` | Применить SQL-схему к D1 |
