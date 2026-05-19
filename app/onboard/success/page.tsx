import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import Nav from "../../_components/Nav";
import Footer from "../../_components/Footer";

export default function OnboardingSuccessPage() {
  return (
    <>
      <Nav />
      <section className="center-section">
        <div className="container center-block">
          <div className="check"><CheckCircle2 size={32} strokeWidth={2.25} /></div>
          <h1>Welcome to STREET.</h1>
          <p className="lede">Your retailer account is set up. Here&apos;s what to do next.</p>

          <div className="next-card">
            <h2>What&apos;s next</h2>
            <ol>
              <li>Check your inbox for the Shopify app install link.</li>
              <li>Install the STREET app to sync your product catalogue.</li>
              <li>Open the STREET Partner app to manage incoming orders.</li>
              <li>Start receiving same-day orders from London shoppers.</li>
            </ol>
          </div>

          <div className="cta-row">
            <Link href="/" className="btn btn-secondary">Back to home</Link>
            <a
              href="https://retailer.street.london/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              Open STREET Partner →
            </a>
          </div>

          <p className="help-line">
            Need help getting started?{" "}
            <a href="mailto:support@street.london">support@street.london</a>
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
