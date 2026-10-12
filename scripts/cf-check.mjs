import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wranglerPath = path.join(root, "wrangler.jsonc");
const text = fs.readFileSync(wranglerPath, "utf8");

if (text.includes("REPLACE_WITH_D1_DATABASE_ID")) {
  console.error(
    "wrangler.jsonc: замените REPLACE_WITH_D1_DATABASE_ID на id из `wrangler d1 create`.",
  );
  process.exit(1);
}

console.log("wrangler.jsonc: database_id задан.");
