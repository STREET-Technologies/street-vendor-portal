import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GUIDE_BASE, getAllSlugs, getDoc } from "@/lib/content";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  return { title: doc?.title ?? "Not found" };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();

  const isDraft = doc.status === "draft";

  // The .shell grid and the section rail come from [...slug]/layout.tsx so the
  // rail survives navigation between articles and keeps its scroll position.
  return (
    <main className="main">
      <article className="content">
        <p className="crumbs">
          <Link href={GUIDE_BASE}>Guide</Link>
          <span>›</span>
          {doc.section.label}
        </p>

        <header className="doc-head">
          <h1>{doc.title}</h1>
          <div className="meta-row">
            {doc.updated && <span className="updated">Updated {doc.updated}</span>}
            {isDraft && <span className="pill-draft">Draft</span>}
          </div>
        </header>

        <div className="doc" dangerouslySetInnerHTML={{ __html: doc.html }} />
      </article>
    </main>
  );
}
