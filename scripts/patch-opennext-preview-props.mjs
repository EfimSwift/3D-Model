/**
 * Next.js 16.4+ loads preview-props.json via loadManifest; OpenNext must inline it
 * or treat it as optional (see route-module.ts handleMissing).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(
  root,
  "node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js",
);

if (!fs.existsSync(target)) {
  console.warn("patch-opennext-preview-props: OpenNext not installed, skip.");
  process.exit(0);
}

let text = fs.readFileSync(target, "utf8");

if (text.includes('p.endsWith("preview-props")')) {
  console.log("patch-opennext-preview-props: already applied.");
  process.exit(0);
}

const globNeedle =
  'join(dotNextDir, "**/{*-manifest,required-server-files,prefetch-hints}.json")';
const globReplacement =
  'join(dotNextDir, "**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json")';

const optionalNeedle = 'p.endsWith("prefetch-hints")) {';
const optionalReplacement =
  'p.endsWith("prefetch-hints") ||\n        p.endsWith("preview-props")) {';

if (!text.includes(globNeedle) || !text.includes(optionalNeedle)) {
  console.error(
    "patch-opennext-preview-props: unexpected OpenNext load-manifest.js — update the patch script.",
  );
  process.exit(1);
}

text = text.replace(globNeedle, globReplacement).replace(optionalNeedle, optionalReplacement);
fs.writeFileSync(target, text);
console.log("patch-opennext-preview-props: applied.");
