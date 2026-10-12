/**
 * Один раз после `npx wrangler login`.
 * Создаёт D1/R2, патчит wrangler.jsonc, миграция, сид, R2 upload, secrets из .env
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wranglerPath = path.join(root, "wrangler.jsonc");
const dbName = "figurki-3d-dev";
const bucketName = "figurki-3d-models-dev";

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", ...opts });
}

function runOut(cmd) {
  return execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function patchWranglerDatabaseId(databaseId) {
  let text = fs.readFileSync(wranglerPath, "utf8");
  if (!text.includes("REPLACE_WITH_D1_DATABASE_ID")) {
    if (text.includes(databaseId)) {
      console.log("wrangler.jsonc already has database_id");
      return;
    }
    throw new Error("wrangler.jsonc: expected REPLACE_WITH_D1_DATABASE_ID placeholder");
  }
  text = text.replace("REPLACE_WITH_D1_DATABASE_ID", databaseId);
  fs.writeFileSync(wranglerPath, text, "utf8");
  console.log("Updated wrangler.jsonc with database_id");
}

function getOrCreateD1Id() {
  try {
    const json = runOut(`npx wrangler d1 list --json`);
    const dbs = JSON.parse(json);
    const found = dbs.find((d) => d.name === dbName);
    if (found?.uuid) {
      console.log(`D1 already exists: ${found.uuid}`);
      return found.uuid;
    }
  } catch {
    /* create below */
  }
  const out = runOut(`npx wrangler d1 create ${dbName}`);
  const idMatch = out.match(/database_id\s*=\s*"?([0-9a-f-]{36})"?/i) || out.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (!idMatch) throw new Error("Could not parse database_id from wrangler d1 create");
  return idMatch[1];
}

function pushSecrets(env) {
  const keys = ["SESSION_SECRET", "MODEL_ENCRYPTION_KEY", "PAYMENT_WEBHOOK_SECRET"];
  for (const key of keys) {
    const val = env[key];
    if (!val || val.includes("replace-with")) {
      console.warn(`Skip secret ${key} — set in .env first`);
      continue;
    }
    const r = spawnSync("npx", ["wrangler", "secret", "put", key], {
      cwd: root,
      input: val,
      stdio: ["pipe", "inherit", "inherit"],
      shell: process.platform === "win32",
    });
    if (r.status !== 0) throw new Error(`secret put failed: ${key}`);
  }
}

try {
  runOut("npx wrangler whoami");
} catch {
  console.error("\nСначала: npx wrangler login\n");
  process.exit(1);
}

const databaseId = getOrCreateD1Id();
patchWranglerDatabaseId(databaseId);

try {
  run(`npx wrangler r2 bucket create ${bucketName}`);
} catch {
  console.log("R2 bucket may already exist — continuing");
}

run("npm run cf:db:schema");
run("npm run cf:db:migrate:remote");
run("npm run cf:db:seed:remote");

const encDir = path.join(root, "storage", "private");
const encFiles = fs.existsSync(encDir) ? fs.readdirSync(encDir).filter((f) => f.endsWith(".enc")) : [];
if (encFiles.length === 0) {
  console.warn("No .enc in storage/private — run: npm run db:setup");
} else {
  run("npm run cf:models:upload");
}

pushSecrets(parseEnvFile(path.join(root, ".env")));

console.log("\n✅ Cloudflare bootstrap done. Commit wrangler.jsonc and push, then connect Git in dashboard.\n");
