type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

type LimitResult = { allowed: boolean; retryAfterSec?: number };

function memoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): LimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > maxRequests) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true };
}

let redisClient: import("redis").RedisClientType | null = null;
let redisConnecting: Promise<void> | null = null;

async function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (redisClient?.isOpen) return redisClient;

  if (!redisConnecting) {
    redisConnecting = (async () => {
      const { createClient } = await import("redis");
      redisClient = createClient({ url });
      redisClient.on("error", () => {
        /* fallback to memory on next call if needed */
      });
      await redisClient.connect();
    })();
  }

  try {
    await redisConnecting;
    return redisClient;
  } catch {
    redisClient = null;
    redisConnecting = null;
    return null;
  }
}

async function redisRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<LimitResult> {
  const redis = await getRedis();
  if (!redis) {
    return memoryRateLimit(key, maxRequests, windowMs);
  }

  const redisKey = `rl:${key}`;
  const ttlSec = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, ttlSec);
    }
    if (count > maxRequests) {
      const ttl = await redis.ttl(redisKey);
      return { allowed: false, retryAfterSec: ttl > 0 ? ttl : ttlSec };
    }
    return { allowed: true };
  } catch {
    return memoryRateLimit(key, maxRequests, windowMs);
  }
}

/**
 * Rate limit: Redis при REDIS_URL (Docker/K8s), иначе in-memory (один инстанс).
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<LimitResult> {
  if (process.env.REDIS_URL) {
    return redisRateLimit(key, maxRequests, windowMs);
  }
  return memoryRateLimit(key, maxRequests, windowMs);
}

export function clientIpFromRequest(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
