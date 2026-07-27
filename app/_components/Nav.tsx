import Link from "next/link";

export default function Nav() {
  return (
    <nav className="nav">
      <div className="container nav-row">
        <div className="logo-block">
          <Link href="/" className="logo">STREET</Link>
          <span className="logo-sub">Onboarding</span>
        </div>
        <div className="nav-meta">
          <Link href="/guide">Guide</Link>
          <a href="https://street.london" target="_blank" rel="noopener noreferrer">street.london ↗</a>
        </div>
      </div>
    </nav>
  );
}
