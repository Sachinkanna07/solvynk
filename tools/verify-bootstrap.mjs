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
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (packageJson.packageManager !== "pnpm@11.7.0" || packageJson.engines?.node !== ">=24 <25") {
  console.error("Bootstrap toolchain constraints are incorrect.");
  process.exit(1);
}
const tsconfig = JSON.parse(readFileSync(join(root, "packages/config/tsconfig/base.json"), "utf8"));
if (tsconfig.compilerOptions?.strict !== true || tsconfig.compilerOptions?.noUncheckedIndexedAccess !== true) {
  console.error("Bootstrap TypeScript configuration must be strict.");
  process.exit(1);
}
const workspace = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
if (!/^\s*- apps\/\*\s*$/m.test(workspace) || !/^\s*- packages\/\*\s*$/m.test(workspace)) {
  console.error("Bootstrap workspace globs are incomplete.");
  process.exit(1);
}
const workspacePackages = [
  "apps/web", "apps/admin", "apps/worker", "apps/prototype",
  "packages/core", "packages/ui", "packages/testing", "packages/config"
];
const missingManifests = workspacePackages.filter((item) => !existsSync(join(root, item, "package.json")));
if (missingManifests.length) {
  console.error("Workspace package manifests missing: " + missingManifests.join(", "));
  process.exit(1);
}
const envExample = readFileSync(join(root, ".env.example"), "utf8");
if (/ghp_|github_pat_|AKIA[0-9A-Z]{16}|BEGIN .*PRIVATE KEY/.test(envExample)) {
  console.error("Bootstrap contains a credential-shaped value.");
  process.exit(1);
}
const env = Object.fromEntries(envExample.split(/\r?\n/).filter(line => line && !line.startsWith("#")).map(line => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1)];
}));
for (const key of ["APP_ORIGIN", "ADMIN_ORIGIN", "USERCONTENT_ORIGIN"]) {
  if (!env[key] || new URL(env[key]).protocol !== "http:") {
    console.error("Bootstrap local origin invalid: " + key);
    process.exit(1);
  }
}
if (new Set([env.APP_ORIGIN, env.ADMIN_ORIGIN, env.USERCONTENT_ORIGIN].map(origin => new URL(origin).hostname)).size !== 3) {
  console.error("Bootstrap local origins must use separate hostnames.");
  process.exit(1);
}
const registeredLicense = readFileSync(join(root, "docs/02_DECISIONS.md"), "utf8");
if (!registeredLicense.includes("| TypeScript 5.9.3 | Strict typechecking and bootstrap tooling | Apache-2.0 | T-000 |")) {
  console.error("Bootstrap TypeScript license is not registered.");
  process.exit(1);
}
console.log("Bootstrap structure valid: " + required.length + " paths checked.");
