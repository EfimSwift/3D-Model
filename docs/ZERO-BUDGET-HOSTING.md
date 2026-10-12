# Хостинг за $0 (без карты / без оплаты)

## Firebase — честно

| Тариф | Что даёт для вашего магазина |
|--------|------------------------------|
| **Spark (бесплатный)** | Статический Hosting, лимиты Functions. **Полный Next.js** (SSR, API, Prisma, скачивание файлов) **нормально не влезает**. |
| **Blaze** | **App Hosting** для Next.js — но это **оплата по факту**, нужна **карта**. |

**Вывод:** если принцип «ни копейки и без карты» — **Firebase App Hosting не подходит**. Spark можно использовать только для простой статической витрины (без вашего текущего backend как есть).

Зелёный замочек (HTTPS) на Firebase бесплатно есть на `*.web.app`, но **ваш проект туда в текущем виде на Spark не переехать**.

---

## Что подходит за $0 под ваш проект (Next.js + БД + HTTPS)

### Вариант A — **Cloudflare** (у вас уже подготовлено в репо)

**Деньги:** бесплатный план Cloudflare, для старта карта **не обязательна**.

**HTTPS / замочек:** да — на `*.workers.dev` и на **своём домене** (SSL от Cloudflare бесплатно).

**Что сделать:**

1. Аккаунт [dash.cloudflare.com](https://dash.cloudflare.com).
2. В `wrangler.jsonc` подставить **D1** `database_id`, создать **R2** bucket (см. `docs/CLOUDFLARE-DEV.md`).
3. Секреты через `wrangler secret put`.
4. `npm run cf:deploy` — получите URL с HTTPS.
5. Свой домен: Cloudflare DNS → Workers → custom domain.

**Лимиты free:** запросы Workers/D1/R2 — для dev и небольшого магазина обычно хватает; следите за панелью Usage.

---

### Вариант B — **Vercel Hobby** + **Neon Postgres** (бесплатные tier)

**Деньги:** Vercel Hobby $0, Neon free tier $0 (лимиты по объёму/времени).

**HTTPS:** да, на `*.vercel.app` и на своём домене.

**Плюс:** Next.js деплоится «как есть», без OpenNext/Workers.

**Минусы:** нужно перевести Prisma с SQLite на **Postgres** (`DATABASE_URL` Neon). Файлы моделей — не на диске сервера (Vercel ephemeral): позже S3/R2/Supabase Storage.

**Шаги в двух словах:**

1. [neon.tech](https://neon.tech) → проект → connection string.
2. `prisma/schema.prisma` → `provider = "postgresql"`.
3. GitHub → Import в [vercel.com](https://vercel.com) → env vars → Deploy.
4. Domains → ваш домен → DNS по инструкции Vercel → зелёный замочек.

---

### Вариант C — **Oracle Cloud Always Free** (VPS)

**Деньги:** $0 навсегда (1–2 маленькие VM в лимитах).

**HTTPS:** Caddy/Nginx + Let's Encrypt или Cloudflare proxy (бесплатно).

**Плюс:** можно Docker из вашего `docker-compose.yml`, SQLite на диске VM, файлы в `storage/private/`.

**Минус:** сложнее настроить, сами следите за сервером и обновлениями.

---

## Сравнение «что выбрать»

| | Cloudflare (A) | Vercel + Neon (B) | Firebase App Hosting |
|--|----------------|-------------------|----------------------|
| $0 без карты | обычно да | обычно да | **нет** (нужен Blaze) |
| Ваш код уже готов | частично (`cf:*`) | после Postgres | нет |
| Свой домен + HTTPS | да | да | да (но платный план) |
| SQLite как сейчас | нет (D1) | нет (Postgres) | нет |

**Практичный совет при «только бесплатно»:**  
- уже есть Cloudflare-конфиг → **вариант A**;  
- если Cloudflare кажется сложным → **вариант B (Vercel + Neon)**.

---

## Зелёный замочек на своём домене (общее)

1. Купить/иметь домен (сам домен — часто платный; иногда бесплатные поддомены у провайдеров).
2. В панели хостинга (Cloudflare / Vercel) добавить домен.
3. Прописать DNS (A/CNAME как в инструкции).
4. Подождать выпуск SSL (автоматически).

Без своего домена замочек всё равно будет на бесплатном поддомене хостинга (`*.vercel.app`, `*.workers.dev`, `*.hosted.app` и т.д.).

---

## Локально

Разработка без хостинга:

```bash
cd C:\Users\User\Desktop\3D-Model
npm run dev
```

Бесплатно, без интернета для логики (кроме 3D preview CDN).
