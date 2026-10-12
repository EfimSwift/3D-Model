# Только твой шаг: деплой через Git

D1, сид, секреты и `wrangler.jsonc` уже настроены.  
**Один раз в браузере:** [Cloudflare Dashboard → R2](https://dash.cloudflare.com/) → **Enable R2** (бесплатный лимит).  
Потом на ПК: `npm run cf:models:upload` (зальёт модели в облако).

## Подключить Git в Cloudflare

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Worker** → **Connect Git**
2. Репозиторий: **EfimSwift/3D-Model**, ветка **main**
3. **Node.js:** **22** (Wrangler 4 требует ≥22)
4. **Build command:** оставь **пустым** (сборка OpenNext в `wrangler.jsonc` → `build.command`)
5. **Deploy command:**
   ```
   npx wrangler deploy --env=""
   ```
6. **Retry deployment**

Альтернатива (если пустой build нельзя):
- Build: `npx opennextjs-cloudflare build`
- Deploy: `npx opennextjs-cloudflare deploy --env=""`
6. **Save and Deploy**

## После первого успешного деплоя

Скопируй URL сайта → в `wrangler.jsonc` поле `NEXT_PUBLIC_APP_URL` → commit → push.

Готово. Дальше каждый push в `main` = автодеплой.
