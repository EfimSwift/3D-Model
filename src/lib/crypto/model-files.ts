import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import { resolvePrivateFile } from "@/lib/paths";

const MAGIC = Buffer.from("FIGENC1");
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;

export function getModelEncryptionKey(): Buffer {
  const raw = process.env.MODEL_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("MODEL_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LEN) {
    throw new Error("MODEL_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  }
  return key;
}

export function isEncryptedModelBlob(blob: Buffer): boolean {
  return blob.length >= MAGIC.length && blob.subarray(0, MAGIC.length).equals(MAGIC);
}

export function encryptModelBuffer(plaintext: Buffer): Buffer {
  const key = getModelEncryptionKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, iv, tag, ciphertext]);
}

export function decryptModelBuffer(blob: Buffer): Buffer {
  if (!isEncryptedModelBlob(blob)) {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_PLAINTEXT_MODELS !== "true"
    ) {
      throw new Error("Plaintext model storage is disabled in production");
    }
    return blob;
  }

  const key = getModelEncryptionKey();
  let offset = MAGIC.length;
  const iv = blob.subarray(offset, offset + IV_LEN);
  offset += IV_LEN;
  const tag = blob.subarray(offset, offset + TAG_LEN);
  offset += TAG_LEN;
  const ciphertext = blob.subarray(offset);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function readPrivateModelFile(relativePath: string): Buffer {
  const fullPath = resolvePrivateFile(relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error("FILE_NOT_FOUND");
  }
  const stored = fs.readFileSync(fullPath);
  return decryptModelBuffer(stored);
}

export function writeEncryptedPrivateFile(relativePath: string, plaintext: Buffer): void {
  const fullPath = resolvePrivateFile(relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, encryptModelBuffer(plaintext));
}
