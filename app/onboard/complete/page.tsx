"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import Nav from "../../_components/Nav";
import Footer from "../../_components/Footer";

// Build a deep link to the retailer's own Shopify admin from their store URL.
// `gymshark-10024.myshopify.com` → `https://admin.shopify.com/store/gymshark-10024`.
function buildShopifyAdminUrl(storeUrl: string | null): string {
  if (!storeUrl) return "https://admin.shopify.com/";
  const match = storeUrl.match(/^([\w-]+)\.myshopify\.com/i);
  return match ? `https://admin.shopify.com/store/${match[1]}` : "https://admin.shopify.com/";
}

function OnboardingCompleteContent() {
  const searchParams = useSearchParams();
  const shopifyAdminUrl = buildShopifyAdminUrl(searchParams.get("storeUrl"));

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
              href={shopifyAdminUrl}
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
              Open STREET Partner &rarr;
            </a>
          </div>

          <p className="help-line">
            Need help? <a href="mailto:support@street.london">support@street.london</a>
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default function OnboardingCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="full-center">
          <Loader2 className="animate-spin spinner" size={32} />
        </div>
      }
    >
      <OnboardingCompleteContent />
    </Suspense>
  );
}
