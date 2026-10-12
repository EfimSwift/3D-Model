import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bucket = process.env.CF_MODELS_BUCKET ?? "figurki-3d-models-dev";
const dir = path.join(root, "storage", "private");

if (!fs.existsSync(dir)) {
  console.error("No storage/private directory");
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".enc"));
if (files.length === 0) {
  console.log("No .enc files in storage/private — run npm run db:setup locally first.");
  process.exit(0);
}

for (const file of files) {
  const local = path.join(dir, file);
  console.log(`Uploading ${file} → r2://${bucket}/${file}`);
  execSync(
    `npx wrangler r2 object put ${bucket}/${file} --remote --file="${local}"`,
    { cwd: root, stdio: "inherit" },
  );
}

console.log("Done.");
