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

// TT-286 pattern (see set-password/page.tsx): env-driven so staging can
// point at the staging PWA.
const RETAILER_APP_URL =
  process.env.NEXT_PUBLIC_RETAILER_APP_URL || "https://retailer.street.london/";

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
              <li>Set up your counter tablet: any spare Android tablet or iPad. Open the Partner app on it and log in with the email and password you just set.</li>
              <li>Set your STREET catalog from your Shopify admin. The STREET app there is the fastest way to bulk-toggle visibility on your products.</li>
              <li>Wait for your first STREET order. Accept it in the Partner app, pack the items, mark it ready for collection, and our rider takes it from there.</li>
            </ol>
          </div>

          {/* TT-365: teach the counter-tablet posture at the moment the
              retailer decides which device the Partner app lives on. */}
          <div className="next-card">
            <h2>Your order alarm</h2>
            <ol>
              <li>The open Partner app is your order alarm, the same way the takeaway platforms work. Keep the tablet by the till, plugged in, with the app open while your store is open on STREET.</li>
              <li>Install it like an app: on an iPad open it in Safari and tap Share, then Add to Home Screen. In Chrome tap the menu, then Add to Home screen. From then on, open it from the icon.</li>
              <li>Allow notifications when the app asks. It keeps the screen awake and updates itself, so there is nothing else to maintain.</li>
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
              href={RETAILER_APP_URL}
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
