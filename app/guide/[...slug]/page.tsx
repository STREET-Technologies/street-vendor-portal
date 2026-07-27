import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GUIDE_BASE, getAllSlugs, getDoc, getNav } from "@/lib/content";
import { Sidebar } from "../_components/Sidebar";

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

  const nav = getNav();
  const isDraft = doc.status === "draft";

  return (
    <div className="shell">
      <Sidebar nav={nav} />
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
    </div>
  );
}
