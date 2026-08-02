import Link from "next/link";
import { getSectionsForHome } from "@/lib/content";

export default function GuideIndex() {
  const sections = getSectionsForHome();
  return (
    <main>
      <section className="guide-hero">
        <div className="shell" style={{ display: "block" }}>
          <p className="guide-hero__eyebrow">Retailer guide</p>
          <h1>Everything you need to run your store on STREET.</h1>
          <p className="guide-hero__lede">
            Plain, practical help for getting set up, taking orders, handling returns and
            billing. Built for the way you actually work, not a manual you have to wade through.
          </p>
        </div>
      </section>

      <div className="shell" style={{ display: "block" }}>
        <div className="cards">
          {sections.map((section, i) => (
            <article className="card" key={section.label}>
              <p className="card__kicker">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="card__title">{section.label}</h2>
              <ul className="card__list">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
