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
              <li>Log into the Partner app: use the email and password you just set in onboarding.</li>
              <li>Set your STREET catalog from your Shopify admin. The STREET app there is the fastest way to bulk-toggle visibility on your products.</li>
              <li>Wait for your first STREET order. Accept it in the Partner app, pack the items, mark it ready for collection, and our rider takes it from there.</li>
            </ol>
          </div>

          <div className="cta-row">
            <a
              href="https://admin.shopify.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              Open Shopify admin
            </a>
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
