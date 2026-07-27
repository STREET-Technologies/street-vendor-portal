import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The section rail must be rendered by the article LAYOUT, never by the article
// PAGE. A page's subtree unmounts on every param change while layouts persist,
// so a page-rendered rail is rebuilt on each click and its scroll position
// resets to the top. This was a real bug; these assertions stop it returning.
const LAYOUT = "app/guide/(article)/layout.tsx";
const PAGE = "app/guide/(article)/[...slug]/page.tsx";

describe("guide section rail placement", () => {
  it("has an article layout to hold the rail", () => {
    expect(existsSync(LAYOUT), `${LAYOUT} is missing`).toBe(true);
  });

  it("renders the Sidebar from the layout", () => {
    const layout = readFileSync(LAYOUT, "utf8");
    expect(layout).toContain("Sidebar");
  });

  it("does not render the Sidebar from the page", () => {
    const page = readFileSync(PAGE, "utf8");
    expect(
      page.includes("Sidebar"),
      "The rail moved back into the page — it will lose its scroll position on every navigation."
    ).toBe(false);
  });

  it("owns the .shell grid in the layout, not the page", () => {
    expect(readFileSync(LAYOUT, "utf8")).toContain('className="shell"');
    expect(readFileSync(PAGE, "utf8")).not.toContain('className="shell"');
  });
});
