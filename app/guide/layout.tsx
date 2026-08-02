import type { Metadata } from "next";
import Nav from "../_components/Nav";
import Footer from "../_components/Footer";
import "./guide.css";

export const metadata: Metadata = {
  title: "STREET · Retailer guide",
  description:
    "Practical help for getting set up, taking orders, handling returns and billing on STREET.",
};

export default function GuideLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Nav />
      {/* .guide scopes guide.css so it cannot reach the onboarding funnel */}
      <div className="guide">{children}</div>
      <Footer />
    </>
  );
}
