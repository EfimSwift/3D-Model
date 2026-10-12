/**
 * Генерирует SQL-сид и применяет к удалённой D1 (dev).
 * Локально: npm run db:setup — чтобы появились .enc в storage/private.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbName = "figurki-3d-dev";
const sqlPath = path.join(root, "prisma", "cloudflare-seed.sql");

async function main() {
  const adminHash = await bcrypt.hash("admin1234", 10);
  const now = new Date().toISOString();

  const sql = `
INSERT OR REPLACE INTO User (id, email, passwordHash, name, role, createdAt) VALUES
('seed-admin-1', 'admin@figurki.local', '${adminHash.replace(/'/g, "''")}', 'Admin', 'ADMIN', '${now}');

INSERT OR REPLACE INTO Product (id, slug, title, description, priceUah, type, previewGlbPath, coverImagePath, privateFilePath, createdAt) VALUES
('seed-prod-dragon', 'test-dragon', 'Тест: Дракон (3D модель)', 'Тестовая цифровая модель.', 299, 'DIGITAL', '/previews/test-dragon.glb', NULL, 'test-dragon.zip.enc', '${now}'),
('seed-prod-robot', 'test-robot', 'Тест: Робот (3D модель)', 'Вторая тестовая модель.', 199, 'DIGITAL', '/previews/test-robot.glb', NULL, 'test-robot.zip.enc', '${now}'),
('seed-prod-wizard', 'test-figurine-wizard', 'Фигурка «Маг» — на заказ', 'Фигурка под печать.', 890, 'PHYSICAL', NULL, '/images/test-figurine-wizard.svg', NULL, '${now}');
`.trim();

  fs.writeFileSync(sqlPath, sql, "utf8");
  console.log(`Wrote ${sqlPath}`);

  execSync(`npx wrangler d1 execute ${dbName} --remote --file="${sqlPath}"`, {
    cwd: root,
    stdio: "inherit",
  });

  console.log("D1 seed OK. Admin: admin@figurki.local / admin1234");
  console.log("Загрузите .enc в R2: npm run cf:models:upload");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
