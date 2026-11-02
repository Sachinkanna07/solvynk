import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { publicationFiles } from "./publication-files.mjs";

const root = process.cwd();
const output = join(root, "dist");
const actual = readdirSync(output, { recursive: true }).map(String).sort();
const expected = [...publicationFiles].sort();
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error(`Publication inventory differs. Expected: ${expected.join(", ")}; actual: ${actual.join(", ")}`);
}
for (const file of expected) {
  const source = readFileSync(join(root, file));
  const published = readFileSync(join(output, file));
  if (!source.equals(published)) throw new Error(`Publication differs from source: ${file}`);
}
console.log(`Publication verified: ${expected.length} approved assets, byte-identical to tracked sources.`);
