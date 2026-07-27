import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

// ── Model ────────────────────────────────────────────────────────────────
// Folders are the navigation. A two-digit prefix (00-, 01-) sets section order
// and is stripped from URLs and labels. Page order comes from frontmatter `order`.
// This mirrors the street-intel model, minus the wiki chrome.

const CONTENT_DIR = join(process.cwd(), "content");

// Every guide URL is built from this. The guide is mounted at /guide inside the
// onboarding site; nothing else may hardcode that prefix.
export const GUIDE_BASE = "/guide";

export type Doc = {
  slug: string[]; // url segments, e.g. ["getting-set-up","finishing-your-setup"]
  href: string; // "/guide/getting-set-up/finishing-your-setup"
  title: string;
  summary: string; // the "In short:" line, plain text
  section: { key: string; label: string; order: number };
  order: number;
  updated?: string;
  status?: string;
  body: string; // raw markdown (frontmatter stripped)
};

export type NavSection = {
  label: string;
  order: number;
  items: { title: string; href: string; status?: string }[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// YAML auto-parses `updated: 2026-06-24` into a Date; normalise to "24 Jun 2026".
function formatDate(v: unknown): string | undefined {
  if (!v) return undefined;
  const d = v instanceof Date ? v : new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const stripPrefix = (s: string) => s.replace(/^\d+-/, "");
const prefixNum = (s: string) => {
  const m = s.match(/^(\d+)-/);
  return m ? parseInt(m[1], 10) : 999;
};
const slugify = (s: string) =>
  stripPrefix(s)
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const labelFromName = (s: string) =>
  stripPrefix(s).replace(/\.md$/i, "").replace(/-/g, " ");
// normalized key for resolving [[wiki-links]] regardless of case/spacing/prefix
const normKey = (s: string) =>
  s.replace(/\.md$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith("_") || name.startsWith(".")) continue; // skip _Internal etc.
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".md")) out.push(full);
  }
  return out;
}

// ── Index (built once, memoised) ─────────────────────────────────────────
type Index = { docs: Doc[]; linkMap: Map<string, string> };
let _index: Index | null = null;

function buildIndex(): Index {
  const files = walk(CONTENT_DIR);
  const docs: Doc[] = [];

  for (const file of files) {
    const rel = file.slice(CONTENT_DIR.length + 1); // "01-Getting-Set-Up/Foo.md"
    const parts = rel.split("/");
    const sectionFolder = parts[0];
    const { data, content } = matter(readFileSync(file, "utf8"));

    const slug = parts.map(slugify);
    const summary = (content.match(/\*\*In short:\*\*\s*([^\n]+)/) || [])[1] || "";

    docs.push({
      slug,
      href: `${GUIDE_BASE}/` + slug.join("/"),
      title: data.title || labelFromName(parts[parts.length - 1]),
      summary: summary.replace(/\*\*/g, "").trim(),
      section: {
        key: sectionFolder,
        label: labelFromName(sectionFolder),
        order: prefixNum(sectionFolder),
      },
      order: typeof data.order === "number" ? data.order : 999,
      updated: formatDate(data.updated),
      status: data.status ? String(data.status) : undefined,
      body: content,
    });
  }

  // wiki-link resolution map: filename, title, and slug-tail all point at href
  const linkMap = new Map<string, string>();
  for (const d of docs) {
    const tail = d.slug[d.slug.length - 1];
    for (const key of [tail, d.title, d.slug.join("/")]) {
      linkMap.set(normKey(key), d.href);
    }
  }

  return { docs, linkMap };
}

function index(): Index {
  if (!_index) _index = buildIndex();
  return _index;
}

// ── Public API ───────────────────────────────────────────────────────────
export function getNav(): NavSection[] {
  const { docs } = index();
  const byKey = new Map<string, NavSection>();
  for (const d of docs) {
    let s = byKey.get(d.section.key);
    if (!s) {
      s = { label: d.section.label, order: d.section.order, items: [] };
      byKey.set(d.section.key, s);
    }
    s.items.push({ title: d.title, href: d.href, status: d.status });
  }
  const sections = [...byKey.values()].sort((a, b) => a.order - b.order);
  for (const s of sections) {
    // re-sort items by their doc.order
    s.items.sort((a, b) => docOrder(a.href) - docOrder(b.href));
  }
  return sections;
}

function docOrder(href: string): number {
  return index().docs.find((d) => d.href === href)?.order ?? 999;
}

export function getAllSlugs(): string[][] {
  return index().docs.map((d) => d.slug);
}

export function getDoc(slug: string[]): (Doc & { html: string }) | null {
  const { docs, linkMap } = index();
  const href = `${GUIDE_BASE}/` + slug.join("/");
  const doc = docs.find((d) => d.href === href);
  if (!doc) return null;
  return { ...doc, html: renderMarkdown(doc.body, linkMap) };
}

export function getSectionsForHome() {
  return getNav();
}

// ── Markdown rendering ───────────────────────────────────────────────────
marked.setOptions({ gfm: true, breaks: false });

function renderMarkdown(raw: string, linkMap: Map<string, string>): string {
  // drop the leading "# Title" — the page header already renders the title
  const body = raw.replace(/^\s*#\s+[^\n]*\n/, "");

  // resolve [[Target]] and [[Target|Label]] before markdown parsing
  const withLinks = body.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_m, target: string, label?: string) => {
      const text = (label || labelFromName(target.split("/").pop() || target)).trim();
      const href = linkMap.get(normKey(target));
      return href
        ? `<a class="wikilink" href="${href}">${text}</a>`
        : `<span class="wikilink wikilink--missing">${text}</span>`;
    }
  );

  let html = marked.parse(withLinks) as string;

  // "In short:" opener → lead paragraph
  html = html.replace(
    /<p><strong>In short:<\/strong>/g,
    '<p class="lead"><strong>In short:</strong>'
  );

  // "> Watch out:" blockquote → styled callout
  html = html.replace(
    /<blockquote>\s*<p>Watch out:\s*/g,
    '<blockquote class="callout callout--watch"><p><span class="callout__label">Watch out</span> '
  );

  return html;
}
