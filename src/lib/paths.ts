import path from "path";

const projectRoot = process.cwd();

export function resolvePrivateFile(relativePath: string): string {
  const normalized = relativePath.replace(/^[/\\]+/, "");
  const full = path.resolve(projectRoot, "storage", "private", normalized);
  const privateRoot = path.resolve(projectRoot, "storage", "private");
  if (!full.startsWith(privateRoot)) {
    throw new Error("Invalid file path");
  }
  return full;
}
