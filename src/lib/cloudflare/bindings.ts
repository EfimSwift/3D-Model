import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

export type CfEnv = {
  DB?: D1Database;
  MODELS_BUCKET?: R2Bucket;
};

const cloudflareContextSymbol = Symbol.for("__cloudflare-context__");

type CloudflareContextStore = {
  env: CfEnv;
};

/** Тот же store, что OpenNext кладёт в ALS (см. @opennextjs/cloudflare init). */
function getCloudflareStore(): CloudflareContextStore | undefined {
  const store = (globalThis as Record<symbol, CloudflareContextStore | undefined>)[
    cloudflareContextSymbol
  ];
  return store ?? undefined;
}

/** Cloudflare bindings (D1, R2). Вне Workers — null. */
export function getCfEnv(): CfEnv | null {
  const store = getCloudflareStore();
  if (!store?.env) return null;
  return store.env;
}

export function isCloudflareWorkerRuntime(): boolean {
  return getCloudflareStore() !== undefined;
}
