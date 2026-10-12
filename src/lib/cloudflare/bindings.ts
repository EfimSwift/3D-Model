import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

type CfEnv = {
  DB?: D1Database;
  MODELS_BUCKET?: R2Bucket;
};

/** Cloudflare bindings (D1, R2). Вне Workers — null. */
export function getCfEnv(): CfEnv | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare") as {
      getCloudflareContext: () => { env: CfEnv };
    };
    const { env } = getCloudflareContext();
    return env ?? null;
  } catch {
    return null;
  }
}

export function isCloudflareWorkerRuntime(): boolean {
  return getCfEnv() !== null;
}
