// One-off: stamp a nav `order` into the vault frontmatter so sections read in a
// sensible sequence rather than alphabetically. Safe to re-run (skips files that
// already have an order). Run against the vault (source of truth), then `npm run sync`.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VAULT = "/Users/gunnar/VAULTS/STREET-Training";

const ORDER = {
  "00-Start-Here/Welcome.md": 1,
  "00-Start-Here/Going-Live-Checklist.md": 2,
  "01-Getting-Set-Up/Installing-the-App.md": 1,
  "01-Getting-Set-Up/Finishing-Your-Setup.md": 2,
  "01-Getting-Set-Up/Choosing-Your-Products.md": 3,
  "01-Getting-Set-Up/Your-Locations.md": 4,
  "02-Running-Orders/Receiving-Orders.md": 1,
  "02-Running-Orders/Accepting-Orders.md": 2,
  "02-Running-Orders/Packing-and-Collection.md": 3,
  "02-Running-Orders/Tracking-Deliveries.md": 4,
  "03-Returns-and-Refunds/Returns-and-Refunds.md": 1,
  "04-Billing/How-Billing-Works.md": 1,
  "04-Billing/Reading-Your-Invoice.md": 2,
  "04-Billing/Caps-and-Alerts.md": 3,
  "05-Doing-It-Well/Dos-and-Donts.md": 1,
  "05-Doing-It-Well/Customer-Service.md": 2,
  "06-Reference/Glossary.md": 1,
  "06-Reference/Order-Status-Flow.md": 2,
  "06-Reference/FAQ.md": 3,
  "06-Reference/Get-Help.md": 4,
};

let patched = 0;
for (const [rel, order] of Object.entries(ORDER)) {
  const file = join(VAULT, rel);
  const raw = readFileSync(file, "utf8");
  if (!raw.startsWith("---\n")) {
    console.warn(`no frontmatter, skipped: ${rel}`);
    continue;
  }
  const end = raw.indexOf("\n---\n", 4);
  const fm = raw.slice(4, end);
  if (/^order:\s*/m.test(fm)) continue; // already ordered
  // insert `order` right after the title line
  const newFm = fm.replace(/^(title:.*)$/m, `$1\norder: ${order}`);
  const next = `---\n${newFm}\n---\n` + raw.slice(end + 5);
  writeFileSync(file, next);
  patched++;
}
console.log(`stamped order into ${patched} files`);
