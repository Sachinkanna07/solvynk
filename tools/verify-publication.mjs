import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { publicationFiles } from "./publication-files.mjs";

const root = process.cwd();
const output = join(root, "dist");
function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [relative(output, path).replaceAll('\\', '/')];
  });
}
const actual = filesIn(output).sort();
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
