import { describe, expect, it } from "vitest";
import { GUIDE_BASE, getAllSlugs, getDoc, getNav } from "./content";

describe("GUIDE_BASE", () => {
  it("namespaces the guide under /guide", () => {
    expect(GUIDE_BASE).toBe("/guide");
  });
});

describe("getNav", () => {
  const nav = getNav();

  it("returns every content section", () => {
    expect(nav.length).toBeGreaterThan(0);
    expect(nav.map((s) => s.label)).toContain("Start Here");
  });

  it("orders sections by their two-digit folder prefix", () => {
    const orders = nav.map((s) => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("prefixes every nav href with GUIDE_BASE", () => {
    const hrefs = nav.flatMap((s) => s.items).map((i) => i.href);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href.startsWith(`${GUIDE_BASE}/`)).toBe(true);
    }
  });
});

describe("getAllSlugs", () => {
  it("returns slugs relative to the [...slug] route, without a guide segment", () => {
    const slugs = getAllSlugs();
    expect(slugs.length).toBe(24);
    for (const slug of slugs) {
      expect(slug[0]).not.toBe("guide");
    }
  });

  it("resolves every slug it advertises", () => {
    for (const slug of getAllSlugs()) {
      expect(getDoc(slug), slug.join("/")).not.toBeNull();
    }
  });
});

describe("getDoc", () => {
  it("returns null for an unknown slug", () => {
    expect(getDoc(["nope", "does-not-exist"])).toBeNull();
  });

  it("renders markdown to html", () => {
    const doc = getDoc(["start-here", "welcome"]);
    expect(doc).not.toBeNull();
    expect(doc!.html).toContain("<p");
  });

  it("resolves wiki-links to GUIDE_BASE-prefixed hrefs", () => {
    const withWikilinks = getAllSlugs()
      .map((s) => getDoc(s)!)
      .filter((d) => d.html.includes('class="wikilink"'));

    expect(withWikilinks.length).toBeGreaterThan(0);

    for (const doc of withWikilinks) {
      const hrefs = [...doc.html.matchAll(/<a class="wikilink" href="([^"]+)"/g)].map((m) => m[1]);
      for (const href of hrefs) {
        expect(href.startsWith(`${GUIDE_BASE}/`), `${doc.href} -> ${href}`).toBe(true);
      }
    }
  });

  it("promotes the 'In short:' opener to a lead paragraph", () => {
    const leads = getAllSlugs()
      .map((s) => getDoc(s)!)
      .filter((d) => d.html.includes('<p class="lead">'));
    expect(leads.length).toBeGreaterThan(0);
  });

  it("turns '> Watch out:' blockquotes into callouts", () => {
    const callouts = getAllSlugs()
      .map((s) => getDoc(s)!)
      .filter((d) => d.html.includes("callout--watch"));
    expect(callouts.length).toBeGreaterThan(0);
  });
});
