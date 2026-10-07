# Kubernetes (шаблон)

Перед применением замените `YOUR_DOMAIN`, образы и secrets.

## Рекомендуемые объекты

1. **Namespace** `figurki-prod`
2. **Deployment** `figurki-app` — image из CI, `replicas: 2`, probes на `/api/health`
3. **HPA** — min 2, max 10, CPU 70%
4. **Service** ClusterIP → Ingress
5. **Ingress** — TLS cert-manager, rate limit annotation (nginx)
6. **Separate Ingress** `webhook-ingress` — host `pay-webhook.YOUR_DOMAIN`, path `/api/webhooks/payment`
7. **NetworkPolicy** — deny all default, allow postgres/redis from app only
8. **Secret** — `SESSION_SECRET`, `MODEL_ENCRYPTION_KEY`, `PAYMENT_WEBHOOK_SECRET`, `DATABASE_URL`
9. **PVC** — только если временно файлы на диске; лучше R2 без PVC

## Пример probe

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 20
readinessProbe:
  httpGet:
    path: /api/health?ready=1
    port: 3000
```

## Download isolation (phase 2)

Отдельный Deployment с env `DOWNLOAD_ONLY=true` и Ingress только на `/api/download/*` — меньше blast radius при DDoS на скачивание.
