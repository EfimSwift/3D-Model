import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type CfEnv = {
  DB?: D1Database;
  MODELS_BUCKET?: R2Bucket;
};

/** Cloudflare bindings (D1, R2). Вне Workers — null. */
export function getCfEnv(): CfEnv | null {
  try {
    const { env } = getCloudflareContext();
    return env as CfEnv;
  } catch {
    return null;
  }
}

export function isCloudflareWorkerRuntime(): boolean {
  try {
    getCloudflareContext();
    return true;
  } catch {
    return false;
  }
}
