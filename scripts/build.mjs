import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
const client = resolve(output, "client");

async function assertFile(path) {
  await access(resolve(root, path));
}

const manifestSource = await readFile(resolve(root, "workflow.js"), "utf8");
const pagePaths = [...manifestSource.matchAll(/path: "\.\/(pages\/[^"]+)"/g)]
  .map((match) => match[1]);

if (pagePaths.length !== 12) {
  throw new Error(`Expected 12 workflow page fragments, found ${pagePaths.length}`);
}

await Promise.all([
  "index.html",
  "app.js",
  "workflow.js",
  "styles.css",
  "worker/index.js",
  ".openai/hosting.json",
  ...pagePaths,
].map(assertFile));

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "server"), { recursive: true });
await mkdir(resolve(output, ".openai"), { recursive: true });

for (const file of ["index.html", "app.js", "workflow.js", "styles.css"]) {
  await cp(resolve(root, file), resolve(client, file));
}
await cp(resolve(root, "pages"), resolve(client, "pages"), { recursive: true });
await cp(resolve(root, "public"), client, { recursive: true });
await cp(resolve(root, "worker/index.js"), resolve(output, "server/index.js"));
await cp(resolve(root, ".openai/hosting.json"), resolve(output, ".openai/hosting.json"));

console.log(`Built ${pagePaths.length} lazy-loaded workflow pages.`);
