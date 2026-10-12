# Только твой шаг: деплой через Git

Остальное уже сделано скриптом `npm run cf:bootstrap` (после `wrangler login`).

## 1. Один раз: войти в Cloudflare (если ещё не)

```powershell
cd C:\Users\User\Desktop\3D-Model
npx wrangler login
npm run cf:bootstrap
git add wrangler.jsonc
git commit -m "Cloudflare D1 id"
git push
```

## 2. Подключить Git в Cloudflare

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Worker** → **Connect Git**
2. Репозиторий: **EfimSwift/3D-Model**, ветка **main**
3. **Build command:** `npm ci && npx opennextjs-cloudflare build`
4. **Deploy command:** `npx opennextjs-cloudflare deploy`
5. **Node.js:** 20
6. **Save and Deploy**

## 3. После первого успешного деплоя

Скопируй URL сайта → в `wrangler.jsonc` поле `NEXT_PUBLIC_APP_URL` → commit → push.

Готово. Дальше каждый push в `main` = автодеплой.
