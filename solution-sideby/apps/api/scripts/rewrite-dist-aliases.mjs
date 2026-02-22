import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "..", "dist");

async function collectJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function toImportPath(fromFile, aliasPath) {
  const target = path.resolve(distDir, aliasPath);
  let relativePath = path.relative(path.dirname(fromFile), target).replace(/\\/g, "/");

  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
}

function rewriteContent(content, filePath) {
  let next = content;

  next = next.replace(/(from\s+["'])@\/([^"']+)(["'])/g, (_, prefix, aliasPath, suffix) => {
    return `${prefix}${toImportPath(filePath, aliasPath)}${suffix}`;
  });

  next = next.replace(/(import\s+["'])@\/([^"']+)(["'])/g, (_, prefix, aliasPath, suffix) => {
    return `${prefix}${toImportPath(filePath, aliasPath)}${suffix}`;
  });

  return next;
}

async function main() {
  const files = await collectJsFiles(distDir);

  await Promise.all(
    files.map(async (filePath) => {
      const source = await readFile(filePath, "utf8");
      const rewritten = rewriteContent(source, filePath);

      if (rewritten !== source) {
        await writeFile(filePath, rewritten, "utf8");
      }
    }),
  );
}

main().catch((error) => {
  globalThis.console.error(error);
  globalThis.process.exit(1);
});
