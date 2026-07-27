import Link from "next/link";
import { GUIDE_BASE } from "@/lib/guide-base";

export default function Nav() {
  return (
    <nav className="nav">
      <div className="container nav-row">
        <div className="logo-block">
          <Link href="/" className="logo">STREET</Link>
          <span className="logo-sub">Onboarding</span>
        </div>
        <div className="nav-meta">
          <Link href={GUIDE_BASE}>Guide</Link>
          <a href="https://street.london" target="_blank" rel="noopener noreferrer">street.london ↗</a>
        </div>
      </div>
    </nav>
  );
}
