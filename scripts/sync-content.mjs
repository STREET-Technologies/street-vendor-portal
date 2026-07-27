// Copy retailer-facing training content from the Obsidian vault into ./content.
// Only the numbered section folders are copied. The vault's _Internal/ staff layer,
// top-level README and assets/README are deliberately left out of the published site.
//
// Workflow: edit pages in Obsidian -> `npm run sync` -> commit/push -> Vercel rebuilds.
import { cpSync, rmSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const VAULT = process.env.TRAINING_VAULT || "/Users/gunnar/VAULTS/STREET-Training";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEST = join(ROOT, "content");

const isSection = (name) => /^\d\d-/.test(name);

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });

let sections = 0;
for (const name of readdirSync(VAULT)) {
  const src = join(VAULT, name);
  if (!isSection(name) || !statSync(src).isDirectory()) continue;
  cpSync(src, join(DEST, name), { recursive: true });
  sections++;
}

console.log(`synced ${sections} sections from ${VAULT} -> content/`);
