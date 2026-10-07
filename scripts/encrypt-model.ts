/**
 * Шифрует ZIP/STL в storage/private/*.enc для загрузки на сервер.
 * Usage: npx tsx scripts/encrypt-model.ts path/to/model.zip output-name.zip.enc
 */
import fs from "fs";
import path from "path";
import { encryptModelBuffer, getModelEncryptionKey } from "../src/lib/crypto/model-files";

const [, , inputArg, outputName] = process.argv;

if (!inputArg || !outputName) {
  console.error("Usage: npx tsx scripts/encrypt-model.ts <input-file> <output-name.enc>");
  process.exit(1);
}

getModelEncryptionKey();

const input = path.resolve(inputArg);
const outDir = path.join(process.cwd(), "storage", "private");
const output = path.join(outDir, outputName);

const plain = fs.readFileSync(input);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(output, encryptModelBuffer(plain));
console.log(`Written encrypted file: ${output}`);
