import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * R2 для ISR/data cache — раскомментируйте bucket в wrangler.jsonc
 * и подключите override:
 * import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
 */
export default defineCloudflareConfig({});
