import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { publicationFiles } from "./publication-files.mjs";

const root = process.cwd();
const output = join(root, "dist");
mkdirSync(output, { recursive: true });
for (const file of publicationFiles) {
  const source = join(root, file);
  if (!existsSync(source)) throw new Error(`Missing publication source: ${file}`);
  copyFileSync(source, join(output, file));
}
console.log(`Copied ${publicationFiles.length} approved static assets to dist.`);
