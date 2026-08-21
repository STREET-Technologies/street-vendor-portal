"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavSection } from "@/lib/content";

function Chevron({ className }: { className: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function Sidebar({ nav }: { nav: NavSection[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const currentSection = nav.find((s) => s.items.some((i) => i.href === pathname));
  const current = currentSection?.items.find((i) => i.href === pathname);
  // Mobile-only: which section's article list is expanded. Desktop ignores
  // this entirely (CSS keeps every list visible and the buttons inert).
  const [openSection, setOpenSection] = useState<string | null>(
    currentSection?.label ?? null,
  );

  return (
    <div className="guidenav">
      {/* mobile-only disclosure toggle; hidden on desktop via CSS */}
      <button
        type="button"
        className="guidenav__summary"
        aria-expanded={open}
        onClick={() => {
          if (!open) setOpenSection(currentSection?.label ?? null);
          setOpen(!open);
        }}
      >
        <span>{current ? current.title : "Browse the guide"}</span>
        <Chevron className="guidenav__chev" />
      </button>

      <nav className="sidebar" data-open={open} aria-label="Guide sections">
        {nav.map((section) => {
          const expanded = openSection === section.label;
          return (
            <div className="sidebar__group" key={section.label} data-open={expanded}>
              <button
                type="button"
                className="sidebar__title"
                aria-expanded={expanded}
                onClick={() => setOpenSection(expanded ? null : section.label)}
              >
                {section.label}
                <Chevron className="sidebar__title-chev" />
              </button>
              <ul className="sidebar__list">
                {section.items.map((item) => {
                  const isCurrent = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="sidebar__link"
                        aria-current={isCurrent ? "page" : undefined}
                        onClick={() => {
                          setOpen(false);
                          setOpenSection(section.label);
                        }}
                      >
                        <span className="sidebar__dot" />
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
