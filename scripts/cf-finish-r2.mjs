#!/usr/bin/env node
/** После включения R2 в дашборде: bucket + upload моделей */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bucket = "figurki-3d-models-dev";

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

try {
  run(`npx wrangler r2 bucket create ${bucket}`);
} catch {
  console.log("Bucket already exists or create skipped");
}
run("npm run cf:models:upload");
console.log("R2 ready.");
