import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const required = [
  "package.json", "pnpm-workspace.yaml", "tsconfig.json", ".nvmrc", ".npmrc", ".env.example",
  "apps/web", "apps/admin", "apps/worker", "apps/prototype", "packages/core", "packages/ui",
  "packages/testing", "packages/config", "infra", "spikes", "tools/concierge", "docs"
];
const missing = required.filter((item) => !existsSync(join(root, item)));
if (missing.length) {
  console.error("Bootstrap missing: " + missing.join(", "));
  process.exit(1);
}
const envExample = readFileSync(join(root, ".env.example"), "utf8");
if (/ghp_|github_pat_|AKIA[0-9A-Z]{16}|BEGIN .*PRIVATE KEY/.test(envExample)) {
  console.error("Bootstrap contains a credential-shaped value.");
  process.exit(1);
}
console.log("Bootstrap structure valid: " + required.length + " paths checked.");
