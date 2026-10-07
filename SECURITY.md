# Безопасность Figurki.studio

Документ для разработки и продакшена: как не отдать 3D-модель бесплатно и не запустить фигурку без оплаты.

## Главное правило

**Клиент (браузер) ничему не верит.** Любая кнопка «оплачено» / «скачать» — только UI. Решение всегда на сервере: статус заказа в БД + проверка в API.

---

## Цифровая модель (DIGITAL)

| Сценарий | Что пытается юзер | Защита |
|----------|-------------------|--------|
| Открыть `/downloads/...` без оплаты | Прямой URL | Редирект на `/checkout`, `userOwnsProduct` = только `PAID` |
| `GET /api/download/request` без логина | API | 401 |
| Запросить скачивание без оплаты | API | 403, `canDownloadDigitalProduct` |
| Подставить чужой `productId` | API | Проверка сессии + владение заказом |
| Угадать путь к ZIP в `public/` | Статика | Файлы только в `storage/private/`, не в git |
| Повторно использовать ссылку скачивания | Replay | `DownloadGrant` одноразовый (`usedAt`) |
| Передать ссылку другу | Утечка URL | JWT + grant привязан к `userId`, повторная проверка `PAID` |
| Подменить путь файла в токене | JWT tampering | В токене только `grantId` + `productId`; путь читается из БД |
| Скачать «полную» модель из GLB превью | Реверс превью | Превью — отдельный упрощённый GLB, не полный STL/ZIP |
| Вызвать тестовую оплату на проде | `simulate-pay` | `isTestPaymentAllowed()` — на `production` выключено по умолчанию |
| Поставить себе `PAID` в DevTools | Подмена UI | Не влияет на БД |
| Взломать чужой заказ по `orderId` | IDOR | `simulate-pay` только если `order.userId === session.id` |

**Продакшен:** статус `PAID` только через `POST /api/webhooks/payment` с HMAC-подписью (`PAYMENT_WEBHOOK_SECRET`) или ручной админ.

---

## Фигурка на заказ (PHYSICAL)

| Сценарий | Защита |
|----------|--------|
| Попасть в «производство» без оплаты | В кабинете/админке в работу только заказы `status = PAID` |
| Скачать файл как у цифры | `canDownloadDigitalProduct` требует тип `DIGITAL` |
| Дважды нажать «оплатить» | Один `PENDING` на товар и пользователя, повтор не создаёт дубль |
| Отмена оплаты / возврат | Позже: webhook `refund` → `CANCELLED`, снятие с очереди печати |
| Повторная оплата того же товара | Разрешена (новый заказ) — отдельная поставка |

Физический товар **никогда** не отдаётся файлом через `/api/download/*`.

---

## Оплата (будущий LiqPay / WayForPay)

1. Создать заказ `PENDING` на сервере, передать в шлюз **внутренний `orderId`**.
2. Юзер платит на стороне банка.
3. Шлюз шлёт **server-to-server webhook** (не redirect в браузере).
4. Проверить подпись шлюза → `markOrderPaid(orderId, { provider, paymentExternalId })`.
5. Redirect «успех» в браузере — только для UX; без webhook заказ остаётся `PENDING`.

`paymentExternalId` уникален — защита от двойного зачисления одного платежа.

---

## Админка

- Роль `ADMIN` только в БД (не из JWT клиента без проверки на сервере).
- Ручная отметка оплаты — только для поддержки, с отдельным `paymentProvider: admin_manual`.

---

## Секреты и деплой

| Переменная | Назначение |
|------------|------------|
| `SESSION_SECRET` | Сессии и JWT скачивания (длинная случайная строка) |
| `MODEL_ENCRYPTION_KEY` | AES-256-GCM ключ для файлов в `storage/private` (32 байта, base64) |
| `PAYMENT_WEBHOOK_SECRET` | HMAC для webhook |
| `ENABLE_TEST_PAYMENT` | `true` только локально |
| `ALLOW_TEST_PAYMENT_IN_PRODUCTION` | не включать без крайней нужды |
| `ALLOW_PLAINTEXT_MODELS` | только dev; на проде всегда `false` / не задавать |

Сгенерировать ключ моделей (PowerShell / bash):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

После `prisma migrate` / `db push` не коммитить `prisma/dev.db` с реальными заказами.

---

## Шифрование и защита файлов моделей

### Что шифруется

| Данные | Где | Как |
|--------|-----|-----|
| Полные ZIP/STL | `storage/private/*.enc` | AES-256-GCM, ключ только в `MODEL_ENCRYPTION_KEY` |
| Пароли пользователей | SQLite | bcrypt (не расшифровываются) |
| Сессии / download JWT | cookie + токен | HMAC-SHA256 (`SESSION_SECRET`) |
| Превью GLB | `public/previews/` | **не шифруются** — публичные, упрощённые |

На диске и в бэкапе без ключа лежит только шифротекст. Расшифровка — **только** в момент выдачи оплатившему пользователю после всех проверок.

### Угрозы «взлома сайта»

| Атака | Митигация |
|-------|-----------|
| SQL injection | Prisma (параметризованные запросы) |
| Кража диска / git с моделями | `.enc` + ключ в secrets хостинга, не в репозитории |
| XSS → украсть cookie | `httpOnly` cookie, CSP в `next.config` |
| Brute-force пароля | rate limit на `/api/auth/login` |
| Массовый перебор скачиваний | rate limit на `/api/download/request` |
| MITM | HTTPS + HSTS на проде |
| Утечка превью GLB | Отдельный asset, низкий poly, без внутренних mesh |
| Компрометация сервера | Ключ в env всё равно на сервере → минимизировать SSH, обновления, отдельный bucket + IAM |

**Важно:** если злоумышленник получил **root на сервере**, он может прочитать `MODEL_ENCRYPTION_KEY` из env. Защита тогда — инфраструктура (VPS hardening, secrets manager, отдельный worker для расшифровки). 100% «невзламываемости» не бывает; цель — не отдавать модели через веб без оплаты и не хранить их открытым текстом.

### Загрузка новой модели

1. Локально: `npx tsx scripts/encrypt-model.ts ./my-model.zip my-model.zip.enc`
2. Залить только `.enc` на сервер (SFTP / R2 private bucket).
3. В админке/БД указать `privateFilePath: my-model.zip.enc`.
4. Превью положить отдельно в `public/previews/` или CDN.

### Продакшен (рекомендация)

- Private bucket (Cloudflare R2 / S3) без публичного доступа.
- Выдача через signed URL **после** проверки оплаты (как сейчас логика, но файл в облаке).
- SSE на bucket + ротация `MODEL_ENCRYPTION_KEY` по процедуре (re-encrypt файлов).

---

## Инфраструктура и DDoS

Подробно: **`docs/INFRASTRUCTURE.md`** (Docker Compose, Kubernetes, разделение webhook/download/CDN).

Кратко:

- **Cloudflare** (или аналог) перед origin — основная защита от DDoS.
- **Caddy/Nginx** в `docker-compose.yml` — отдельный контейнер, app не на публичном порту.
- **Redis** (`REDIS_URL`) — общий rate limit на все реплики.
- **`middleware.ts`** — базовый лимит на `/api/*`.
- **`/api/health`** — probes для K8s.

## Платежи и персональные данные

**`docs/PAYMENTS-SECURITY.md`** — PCI, что хранить, webhook, без PAN/CVV.

## Что ещё добавить перед боем

- Логи выдачи файлов (audit)
- WAF / CDN, отдельный bucket R2 с signed URL вместо чтения с диска
- Watermark на превью-GLB, лимит полигонов
- 2FA для админа
- Мониторинг: заказ `PAID` без `paymentExternalId` от live-провайдера
- Managed PostgreSQL вместо SQLite
