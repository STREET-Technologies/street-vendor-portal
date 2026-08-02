import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/guide/guide.css", "utf8");

// Selectors, minus at-rules, comments and declaration bodies.
const selectors = css
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("}")
  .flatMap((block) => (block.split("{")[0] ?? "").split(","))
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("@"));

describe("guide.css containment", () => {
  it("finds selectors to check", () => {
    expect(selectors.length).toBeGreaterThan(50);
  });

  it("scopes every selector under .guide so it cannot reach the funnel", () => {
    for (const sel of selectors) {
      expect(sel.startsWith(".guide"), sel).toBe(true);
    }
  });
});
