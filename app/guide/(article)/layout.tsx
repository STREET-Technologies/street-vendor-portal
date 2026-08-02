import { getNav } from "@/lib/content";
import { Sidebar } from "../_components/Sidebar";

// The section rail lives here, in a layout ABOVE the dynamic segment.
//
// Two things had to be true to stop the rail jumping back to the top on every
// click. First, it must be in a layout rather than a page: a page's subtree
// unmounts on every navigation, and a fresh DOM node starts at scrollTop 0.
// Second — and this is the part that is easy to get wrong — the layout must sit
// OUTSIDE the dynamic segment. A layout at [...slug]/layout.tsx is keyed by the
// param value, so it still remounts when the slug changes. The (article) route
// group gives us a parent layout with a static key, without adding a URL
// segment, so the same rail element survives between articles and keeps its
// scroll position with no scroll-restoration JS.
//
// The guide index at /guide sits outside this group and so has no rail, which
// is intended. getNav() also now runs once for the group rather than per article.
export default function ArticleLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nav = getNav();

  return (
    <div className="shell">
      <Sidebar nav={nav} />
      {children}
    </div>
  );
}
